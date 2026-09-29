import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { fetchProducts, FREE_SHIPPING_THRESHOLD, SHIPPING_COST, type Product } from './api';

type Cart = Record<string, number>;

const CART_KEY = 'tirazh-v2:cart';

function readCart(): Cart {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? (JSON.parse(raw) as Cart) : {};
  } catch {
    return {};
  }
}

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

  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch {
      /* storage unavailable (private mode) — cart just won't persist */
    }
  }, [cart]);

  const add = useCallback((id: string) => {
    setCart((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 }));
    setBump((b) => b + 1);
  }, []);
  const inc = useCallback((id: string) => setCart((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 })), []);
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
    };
  }, [cart, products, loading, drawerOpen, bump, add, inc, dec, remove, clear]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
