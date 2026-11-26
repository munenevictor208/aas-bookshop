export type Product = {
  id: number;
  name: string;
  price: number;
  icon: string;
  category: string;
  categoryId?: number | null;
  description: string;
  imageUrl?: string | null;
  sku?: string | null;
  stock?: number | null;
  isActive?: boolean;
  featured?: boolean;
};

export type Category = {
  id: number;
  name: string;
  icon: string;
  description: string;
  sortOrder: number;
  productCount?: number;
};

export type ProductInput = {
  name: string;
  description: string;
  price: number;
  categoryId: number | null;
  icon: string;
  imageUrl: string | null;
  sku: string | null;
  stock: number | null;
  isActive: boolean;
  featured: boolean;
};

export const ORDER_STATUSES = [
  "Pending",
  "Processing",
  "Ready for Pickup",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_PREFERENCES = [
  "Cash on Delivery",
  "M-Pesa on Delivery",
] as const;

export type PaymentPreference = (typeof PAYMENT_PREFERENCES)[number];

export function normalizePaymentPreference(value: string): PaymentPreference {
  const clean = value.trim();
  if (!clean) return "Cash on Delivery";
  const match = PAYMENT_PREFERENCES.find(
    (preference) => preference.toLowerCase() === clean.toLowerCase()
  );
  if (!match) throw new Error("Choose a valid payment preference.");
  return match;
}

export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  Pending: ["Processing", "Ready for Pickup", "Out for Delivery", "Delivered", "Cancelled"],
  Processing: ["Ready for Pickup", "Out for Delivery", "Delivered", "Cancelled"],
  "Ready for Pickup": ["Out for Delivery", "Delivered", "Cancelled"],
  "Out for Delivery": ["Delivered", "Cancelled"],
  Delivered: [],
  Cancelled: [],
};

export function canTransitionOrderStatus(
  from: OrderStatus,
  to: OrderStatus
): boolean {
  return from === to || ORDER_STATUS_TRANSITIONS[from].includes(to);
}

export type OrderItemRecord = {
  productId: number | null;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type OrderRecord = {
  orderNumber: string;
  placedAt: string;
  updatedAt: string;
  status: OrderStatus;
  total: number;
  payment: string;
  notificationMethod: "SMS" | "WhatsApp";
  deliveryAddress: string;
  customer: {
    id: number;
    name: string;
    phone: string;
    email: string;
    address: string;
  };
  items: OrderItemRecord[];
};

export type CustomerRecord = {
  id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  createdAt: string;
  orderCount: number;
  totalSpent: number;
};

export type DashboardStats = {
  productCount: number;
  categoryCount: number;
  customerCount: number;
  orderCount: number;
  pendingCount: number;
  ordersToday: number;
  revenue: number;
  revenueToday: number;
  lowStockCount: number;
  outOfStockCount: number;
  statusCounts: { status: OrderStatus; count: number }[];
  topProducts: { name: string; quantity: number; revenue: number }[];
  recentOrders: OrderRecord[];
  revenueByDay: { day: string; revenue: number; orders: number }[];
};
