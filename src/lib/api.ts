import snapshot from '../data/catalog-snapshot.json';

export type Kind = 'film' | 'band';

export interface Product {
  id: string;
  titleBg: string;
  titleEn: string;
  kind: Kind;
  year: number;
  desc: string;
  image: string | null;
  reg: string;
  edition: string;
  price: number;
  stock: number;
  variantId: number;
}

interface ApiVariant {
  id: string;
  size: string;
  frame: string;
  price: string;
  stock: number;
}

interface ApiProduct {
  slug: string;
  title_bg: string;
  title_en: string;
  kind: Kind;
  year: number;
  description: string;
  image_url: string | null;
  reg_code: string;
  edition: string;
  variants: ApiVariant[];
}

// Empty in the GitHub Pages test build (no deployed backend yet) — the site
// then runs off the bundled snapshot and checkout goes into demo mode.
// Trailing slashes trimmed: "https://api.example/" would otherwise produce
// "//api/products", which the backend 404s.
export const API_URL: string = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '');
export const isDemo = !API_URL;

// Poster URLs come from admin input; only ever render http(s) images.
function safeImage(url: string | null): string | null {
  if (!url) return null;
  try {
    const { protocol } = new URL(url);
    return protocol === 'https:' || protocol === 'http:' ? url : null;
  } catch {
    return null;
  }
}

function toProduct(row: ApiProduct): Product | null {
  const v = row.variants?.[0];
  if (!v || (row.kind !== 'film' && row.kind !== 'band')) return null;
  return {
    id: row.slug,
    titleBg: row.title_bg,
    titleEn: row.title_en,
    kind: row.kind,
    year: row.year,
    desc: row.description,
    image: safeImage(row.image_url),
    reg: row.reg_code,
    edition: row.edition,
    price: Number(v.price),
    stock: Math.max(0, Math.floor(Number(v.stock) || 0)),
    variantId: Number(v.id),
  };
}

const fromSnapshot = (snapshot as ApiProduct[]).map(toProduct).filter((p): p is Product => p !== null);

let cache: Promise<Product[]> | null = null;

export function fetchProducts(force = false): Promise<Product[]> {
  if (cache && !force) return cache;
  cache = (async () => {
    if (isDemo) return fromSnapshot;
    try {
      const res = await fetch(`${API_URL}/api/products`);
      if (!res.ok) throw new Error(String(res.status));
      const rows: ApiProduct[] = await res.json();
      return rows.map(toProduct).filter((p): p is Product => p !== null);
    } catch {
      return fromSnapshot;
    }
  })();
  return cache;
}

export const SHIPPING_COST = 6;
export const FREE_SHIPPING_THRESHOLD = 80;

export interface PlaceOrderInput {
  email: string;
  name: string;
  address: string;
  city: string;
  postcode: string;
  paymentMethod: 'CARD' | 'COD';
  lines: { variantId: number; qty: number }[];
}

export interface OrderResult {
  orderNumber: string;
  total: number;
  demo: boolean;
}

export class OrderError extends Error {
  status: number;
  constructor(message: string, status = 0) {
    super(message);
    this.status = status;
  }
}

/** Backend caps quantity per line at 50 (see poster-shop-backend schemas/order.ts). */
export const MAX_QTY_PER_LINE = 50;

export async function placeOrder(input: PlaceOrderInput, localTotal: number): Promise<OrderResult> {
  if (isDemo) {
    await new Promise((r) => setTimeout(r, 1100));
    return { orderNumber: `DEMO-${Math.floor(1000 + Math.random() * 9000)}`, total: localTotal, demo: true };
  }
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
  } catch {
    throw new OrderError('Няма връзка със сървъра. Опитай отново.');
  }
  if (res.status === 409) throw new OrderError('Наличността се промени — провери коша.', 409);
  if (res.status === 429) throw new OrderError('Твърде много опити. Изчакай минута и опитай пак.', 429);
  if (res.status === 400) throw new OrderError('Провери данните за доставка — нещо не е наред.', 400);
  if (!res.ok) throw new OrderError('Нещо се обърка при поръчката. Опитай отново.', res.status);
  const data = await res.json();
  return { orderNumber: data.order_number, total: Number(data.total), demo: false };
}

export const money = (n: number) => `${n.toFixed(2)} €`;
export const kindLabel = (k: Kind) => (k === 'film' ? 'Филм' : 'Музика');
export const typeLabel = (k: Kind) => (k === 'film' ? 'ПЛАКАТ' : 'ПЛОЧА');
