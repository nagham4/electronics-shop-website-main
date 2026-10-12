import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export interface CartItem {
  key: string;
  productId: string;
  variantId?: string | undefined;
  slug: string;
  name: string;
  variantLabel?: string | undefined;
  image: string;
  unitPrice: number;
  maxStock: number;
  quantity: number;
}

interface CartCtx {
  items: CartItem[];
  count: number;
  subtotal: number;
  add: (item: Omit<CartItem, "key" | "quantity">, qty?: number) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
}

const Ctx = createContext<CartCtx | null>(null);
const STORAGE = "store-cart-v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE);
      if (raw) setItems(JSON.parse(raw));
    } catch { /* ignore */ }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE, JSON.stringify(items));
  }, [items, loaded]);

  const value = useMemo<CartCtx>(() => ({
    items,
    count: items.reduce((s, i) => s + i.quantity, 0),
    subtotal: items.reduce((s, i) => s + i.quantity * i.unitPrice, 0),
    add: (item, qty = 1) =>
      setItems((prev) => {
        const key = `${item.productId}:${item.variantId ?? ""}`;
        const found = prev.find((i) => i.key === key);
        if (found) return prev.map((i) => (i.key === key ? { ...i, quantity: Math.min(i.maxStock, i.quantity + qty) } : i));
        return [...prev, { ...item, key, quantity: Math.min(item.maxStock, qty) }];
      }),
    setQty: (key, qty) =>
      setItems((prev) => prev.map((i) => (i.key === key ? { ...i, quantity: Math.max(1, Math.min(i.maxStock, qty)) } : i))),
    remove: (key) => setItems((prev) => prev.filter((i) => i.key !== key)),
    clear: () => setItems([]),
  }), [items]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart outside CartProvider");
  return c;
}

export const formatPrice = (n: number) => `${n.toLocaleString("en-US")} ₪`;
