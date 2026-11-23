import type { StorageLike } from "./cart.ts";

export type Order = {
  orderNumber: string;
  placedAt: string;
  customer: {
    name: string;
    phone: string;
    email: string;
    address: string;
    payment: string;
  };
  items: {
    name: string;
    quantity: number;
    lineTotal: number;
  }[];
  total: number;
};

export type OrderDraft = {
  customer: Order["customer"];
  items: Order["items"];
  total: number;
  now?: number;
};

const ORDERS_KEY = "aas-bookshop-orders";
export const ORDER_REFERENCES_KEY = "aas-bookshop-order-refs";
const CHANGE_EVENT = "aas-orders-change";
const EMPTY_SNAPSHOT = "[]";

export type OrderReference = {
  orderNumber: string;
  phone: string;
};

export function buildOrder(draft: OrderDraft): Order {
  const now = draft.now ?? Date.now();
  const suffix = String(Math.floor(Math.random() * 1000)).padStart(3, "0");
  return {
    orderNumber: `AAS-${now.toString().slice(-6)}-${suffix}`,
    placedAt: new Date(now).toLocaleString(),
    customer: draft.customer,
    items: draft.items,
    total: draft.total,
  };
}

export function parseOrders(raw: string): Order[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((order): order is Order => {
      return (
        typeof order === "object" &&
        order !== null &&
        typeof order.orderNumber === "string" &&
        typeof order.total === "number"
      );
    });
  } catch {
    return [];
  }
}

function resolveStorage(storage?: StorageLike): StorageLike | undefined {
  if (storage) return storage;
  if (typeof window !== "undefined") return window.localStorage;
  return undefined;
}

export function subscribeToOrders(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

export function getOrdersSnapshot() {
  try {
    return window.localStorage.getItem(ORDERS_KEY) ?? EMPTY_SNAPSHOT;
  } catch {
    return EMPTY_SNAPSHOT;
  }
}

export function getOrdersServerSnapshot() {
  return EMPTY_SNAPSHOT;
}

export function readOrders(storage?: StorageLike): Order[] {
  const target = resolveStorage(storage);
  if (!target) return [];
  try {
    return parseOrders(target.getItem(ORDERS_KEY) ?? EMPTY_SNAPSHOT);
  } catch {
    return [];
  }
}

export function parseOrderReferences(raw: string | null): OrderReference[] {
  try {
    const parsed: unknown = JSON.parse(raw ?? EMPTY_SNAPSHOT);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((ref): ref is OrderReference => {
      return (
        typeof ref === "object" &&
        ref !== null &&
        typeof ref.orderNumber === "string" &&
        typeof ref.phone === "string"
      );
    });
  } catch {
    return [];
  }
}

export function getOrderReferencesSnapshot(): string {
  try {
    return window.localStorage.getItem(ORDER_REFERENCES_KEY) ?? EMPTY_SNAPSHOT;
  } catch {
    return EMPTY_SNAPSHOT;
  }
}

export function getOrderReferencesServerSnapshot(): string {
  return EMPTY_SNAPSHOT;
}

export function loadOrderReferences(storage?: StorageLike): OrderReference[] {
  const target = resolveStorage(storage);
  if (!target) return [];
  return parseOrderReferences(target.getItem(ORDER_REFERENCES_KEY));
}

export function saveOrderReference(
  orderNumber: string,
  phone: string,
  storage?: StorageLike
): boolean {
  const target = resolveStorage(storage);
  if (!target) return false;
  try {
    const existing = loadOrderReferences(target);
    if (existing.some((ref) => ref.orderNumber === orderNumber)) return true;
    target.setItem(
      ORDER_REFERENCES_KEY,
      JSON.stringify([{ orderNumber, phone }, ...existing].slice(0, 50))
    );
    return true;
  } catch {
    return false;
  }
}

export function saveOrder(order: Order, storage?: StorageLike): boolean {
  const target = resolveStorage(storage);
  if (!target) return false;
  try {
    const orders = readOrders(target);
    target.setItem(ORDERS_KEY, JSON.stringify([order, ...orders]));
  } catch {
    return false;
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }
  return true;
}
