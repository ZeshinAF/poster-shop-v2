import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { fetchProducts, FREE_SHIPPING_THRESHOLD, MAX_QTY_PER_LINE, SHIPPING_COST, type Product } from './api';

type Cart = Record<string, number>;

const CART_KEY = 'tirazh-v2:cart';

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// localStorage is user-editable; accept only slug keys with sane integer quantities.
function readCart(): Cart {
  try {
    const raw = localStorage.getItem(CART_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const cart: Cart = {};
    for (const [id, qty] of Object.entries(parsed as Record<string, unknown>)) {
      if (SLUG.test(id) && Number.isInteger(qty) && (qty as number) > 0) {
        cart[id] = Math.min(qty as number, MAX_QTY_PER_LINE);
      }
    }
    return cart;
  } catch {
    return {};
  }
}

/** Largest quantity of a product the cart may hold. */
const capFor = (p: Product | undefined) => (p ? Math.min(p.stock, MAX_QTY_PER_LINE) : 0);

export interface CartLine {
  product: Product;
  qty: number;
  lineTotal: number;
}

interface StoreValue {
  products: Product[];
  loading: boolean;
  lines: CartLine[];
  count: number;
  subtotal: number;
  shipping: number;
  total: number;
  drawerOpen: boolean;
  bump: number;
  openDrawer: () => void;
  closeDrawer: () => void;
  add: (id: string) => void;
  inc: (id: string) => void;
  dec: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
  /** Re-fetch the catalog (e.g. after a stock conflict) and re-clamp the cart to it. */
  refresh: () => Promise<void>;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<Cart>(readCart);
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Increments on every add, so the nav badge can replay its pop animation.
  const [bump, setBump] = useState(0);

  useEffect(() => {
    fetchProducts().then((p) => {
      setProducts(p);
      setLoading(false);
    });
  }, []);

  // Keep the cart consistent with live stock: drop sold-out or vanished
  // products and cap quantities, so checkout doesn't fail with a 409 later.
  useEffect(() => {
    if (loading) return;
    setCart((c) => {
      let changed = false;
      const next: Cart = {};
      for (const [id, qty] of Object.entries(c)) {
        const cap = capFor(products.find((p) => p.id === id));
        const q = Math.min(qty, cap);
        if (q !== qty) changed = true;
        if (q > 0) next[id] = q;
      }
      return changed ? next : c;
    });
  }, [products, loading]);

  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch {
      /* storage unavailable (private mode) — cart just won't persist */
    }
  }, [cart]);

  const add = useCallback(
    (id: string) => {
      const cap = capFor(products.find((p) => p.id === id));
      setCart((c) => ((c[id] ?? 0) >= cap ? c : { ...c, [id]: (c[id] ?? 0) + 1 }));
      setBump((b) => b + 1);
    },
    [products]
  );
  const inc = useCallback(
    (id: string) => {
      const cap = capFor(products.find((p) => p.id === id));
      setCart((c) => ((c[id] ?? 0) >= cap ? c : { ...c, [id]: (c[id] ?? 0) + 1 }));
    },
    [products]
  );
  const dec = useCallback(
    (id: string) =>
      setCart((c) => {
        const next = { ...c };
        const q = (next[id] ?? 0) - 1;
        if (q <= 0) delete next[id];
        else next[id] = q;
        return next;
      }),
    []
  );
  const remove = useCallback(
    (id: string) =>
      setCart((c) => {
        const next = { ...c };
        delete next[id];
        return next;
      }),
    []
  );
  const clear = useCallback(() => setCart({}), []);
  const refresh = useCallback(async () => {
    setProducts(await fetchProducts(true));
  }, []);

  const value = useMemo<StoreValue>(() => {
    const lines: CartLine[] = Object.entries(cart)
      .map(([id, qty]) => {
        const product = products.find((p) => p.id === id);
        return product ? { product, qty, lineTotal: product.price * qty } : null;
      })
      .filter((l): l is CartLine => l !== null);
    const subtotal = lines.reduce((a, l) => a + l.lineTotal, 0);
    const count = lines.reduce((a, l) => a + l.qty, 0);
    const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
    return {
      products,
      loading,
      lines,
      count,
      subtotal,
      shipping,
      total: subtotal + shipping,
      drawerOpen,
      bump,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
      add,
      inc,
      dec,
      remove,
      clear,
      refresh,
    };
  }, [cart, products, loading, drawerOpen, bump, add, inc, dec, remove, clear, refresh]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
