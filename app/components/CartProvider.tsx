"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type CartItem = {
  /** Unique line id (e.g. `${slug}_${size}_${nonce}`) so the same product
   *  with different customisations are separate lines. */
  id: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  size?: string;
  /** Personalisation payload (mirrors the Laravel basketDataSave fields). */
  productId?: number;
  productType?: string;
  sizeId?: number;
  variation?: "one_side" | "both_sides";
  giftWrapping?: "yes" | "no";
  frontMessage?: string;
  backMessage?: string;
  frontImageUrl?: string;
  backImageUrl?: string;
};

export type AddCartItem = Omit<CartItem, "quantity"> & { quantity?: number };

type CartContextType = {
  items: CartItem[];
  count: number;
  total: number;
  addItem: (item: AddCartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextType | null>(null);
const STORAGE_KEY = "vishwakarma_cart_v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Load from localStorage once on the client
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CartItem[];
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch {
      /* ignore parse errors */
    }
    setHydrated(true);
  }, []);

  // Persist on every change (after hydration)
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore quota errors */
    }
  }, [items, hydrated]);

  const addItem = useCallback((item: AddCartItem) => {
    setItems((prev) => {
      const qty = item.quantity ?? 1;
      const existing = prev.find((p) => p.id === item.id);
      if (existing) {
        return prev.map((p) =>
          p.id === item.id ? { ...p, quantity: p.quantity + qty } : p,
        );
      }
      return [...prev, { ...item, quantity: qty }];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const updateQuantity = useCallback(
    (id: string, quantity: number) => {
      if (quantity < 1) {
        removeItem(id);
        return;
      }
      setItems((prev) =>
        prev.map((p) => (p.id === id ? { ...p, quantity } : p)),
      );
    },
    [removeItem],
  );

  const clearCart = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextType>(() => {
    const count = items.reduce((acc, i) => acc + i.quantity, 0);
    const total = items.reduce((acc, i) => acc + i.price * i.quantity, 0);
    return { items, count, total, addItem, removeItem, updateQuantity, clearCart };
  }, [items, addItem, removeItem, updateQuantity, clearCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextType {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used inside <CartProvider>");
  }
  return ctx;
}

export const formatINR = (n: number): string =>
  new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2 }).format(n);
