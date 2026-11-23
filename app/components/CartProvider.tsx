"use client";

import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  addToCart,
  CART_CHANGE_EVENT,
  getCartDetails,
  getCartServerSnapshot,
  getCartSnapshot,
  getCartTotals,
  loadCart,
  parseCart,
  persistCart,
  removeFromCart,
  subscribeToCart,
  updateCartQuantity,
  type CartDetail,
  type CartItem,
} from "@/app/data/cart";
import { products as defaultCatalog, type Product } from "@/app/data/products";

type CartContextValue = {
  items: CartItem[];
  details: CartDetail[];
  itemCount: number;
  subtotal: number;
  catalog: Product[];
  addItem: (productId: number, quantity?: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function currentItems(catalog: Product[]): CartItem[] {
  if (typeof window === "undefined") return [];
  return loadCart(window.localStorage, catalog);
}

function writeItems(items: CartItem[]) {
  const saved = persistCart(window.localStorage, items);
  if (saved) window.dispatchEvent(new Event(CART_CHANGE_EVENT));
}

export function CartProvider({
  children,
  catalog = defaultCatalog,
}: {
  children: ReactNode;
  catalog?: Product[];
}) {
  const snapshot = useSyncExternalStore(
    subscribeToCart,
    getCartSnapshot,
    getCartServerSnapshot
  );
  const items = useMemo(() => parseCart(snapshot, catalog), [snapshot, catalog]);
  const details = useMemo(() => getCartDetails(items, catalog), [items, catalog]);
  const { itemCount, subtotal } = useMemo(
    () => getCartTotals(details),
    [details]
  );

  function addItem(productId: number, quantity = 1) {
    writeItems(addToCart(currentItems(catalog), productId, quantity, catalog));
  }

  function removeItem(productId: number) {
    writeItems(removeFromCart(currentItems(catalog), productId));
  }

  function updateQuantity(productId: number, quantity: number) {
    writeItems(
      updateCartQuantity(currentItems(catalog), productId, quantity)
    );
  }

  function clearCart() {
    writeItems([]);
  }

  return (
    <CartContext.Provider
      value={{
        items,
        details,
        itemCount,
        subtotal,
        catalog,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }
  return context;
}
