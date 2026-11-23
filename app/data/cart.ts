import { products, type Product } from "./products.ts";

export type CartItem = {
  productId: number;
  quantity: number;
};

export type CartDetail = {
  product: Product;
  quantity: number;
  lineTotal: number;
};

export type CartTotals = {
  itemCount: number;
  subtotal: number;
};

export type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export const CART_STORAGE_KEY = "aas-bookshop-cart";
export const CART_CHANGE_EVENT = "aas-cart-change";
export const EMPTY_CART_SNAPSHOT = "[]";

export function parseCart(
  raw: string | null,
  catalog: Product[] = products
): CartItem[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is CartItem => {
      if (typeof item !== "object" || item === null) return false;
      const candidate = item as CartItem;
      return (
        typeof candidate.productId === "number" &&
        Number.isInteger(candidate.quantity) &&
        candidate.quantity > 0 &&
        catalog.some((product) => product.id === candidate.productId)
      );
    });
  } catch {
    return [];
  }
}

export function loadCart(
  storage: StorageLike,
  catalog: Product[] = products
): CartItem[] {
  try {
    return parseCart(storage.getItem(CART_STORAGE_KEY), catalog);
  } catch {
    return [];
  }
}

export function persistCart(
  storage: StorageLike,
  items: CartItem[]
): boolean {
  try {
    storage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    return true;
  } catch {
    return false;
  }
}

export function addToCart(
  items: CartItem[],
  productId: number,
  quantity = 1,
  catalog: Product[] = products
): CartItem[] {
  const product = catalog.find((entry) => entry.id === productId);
  if (!product || !Number.isInteger(quantity) || quantity <= 0) return items;
  const existing = items.find((item) => item.productId === productId);
  if (existing) {
    return items.map((item) =>
      item.productId === productId
        ? { ...item, quantity: item.quantity + quantity }
        : item
    );
  }
  return [...items, { productId, quantity }];
}

export function removeFromCart(items: CartItem[], productId: number): CartItem[] {
  return items.filter((item) => item.productId !== productId);
}

export function updateCartQuantity(
  items: CartItem[],
  productId: number,
  quantity: number
): CartItem[] {
  if (quantity <= 0) return removeFromCart(items, productId);
  return items.map((item) =>
    item.productId === productId ? { ...item, quantity } : item
  );
}

export function getCartDetails(
  items: CartItem[],
  catalog: Product[] = products
): CartDetail[] {
  return items.flatMap((item) => {
    const product = catalog.find((entry) => entry.id === item.productId);
    if (!product) return [];
    return [
      {
        product,
        quantity: item.quantity,
        lineTotal: product.price * item.quantity,
      },
    ];
  });
}

export function getCartTotals(details: CartDetail[]): CartTotals {
  return {
    itemCount: details.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: details.reduce((sum, item) => sum + item.lineTotal, 0),
  };
}

export function subscribeToCart(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CART_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CART_CHANGE_EVENT, onChange);
  };
}

export function getCartSnapshot(): string {
  try {
    return window.localStorage.getItem(CART_STORAGE_KEY) ?? EMPTY_CART_SNAPSHOT;
  } catch {
    return EMPTY_CART_SNAPSHOT;
  }
}

export function getCartServerSnapshot(): string {
  return EMPTY_CART_SNAPSHOT;
}
