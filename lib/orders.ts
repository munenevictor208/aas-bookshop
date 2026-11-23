import { getDb, type QueryClient } from "./db.ts";
import { getProductById } from "./catalog.ts";
import {
  canTransitionOrderStatus,
  normalizePaymentPreference,
  ORDER_STATUSES,
  type CustomerRecord,
  type DashboardStats,
  type OrderItemRecord,
  type OrderRecord,
  type OrderStatus,
} from "./types.ts";

type OrderRow = {
  id: number | bigint;
  order_number: string;
  placed_at: string;
  updated_at: string;
  status: OrderStatus;
  total: number | string;
  payment: string;
  delivery_address: string;
  customer_id: number | bigint;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  customer_address: string;
};

type ItemRow = {
  product_id: number | bigint | null;
  product_name: string;
  quantity: number | bigint;
  unit_price: number | string;
  line_total: number | string;
};

const ORDER_SELECT = `
  SELECT o.id, o.order_number, o.placed_at, o.updated_at, o.status, o.total,
         o.payment, o.delivery_address, o.customer_id,
         c.name AS customer_name, c.phone AS customer_phone,
         c.email AS customer_email, c.address AS customer_address
  FROM orders o
  JOIN customers c ON c.id = o.customer_id
`;

function toOrder(row: OrderRow, items: OrderItemRecord[]): OrderRecord {
  return {
    orderNumber: row.order_number,
    placedAt: row.placed_at,
    updatedAt: row.updated_at,
    status: row.status,
    total: Number(row.total),
    payment: row.payment,
    deliveryAddress: row.delivery_address,
    customer: {
      id: Number(row.customer_id),
      name: row.customer_name,
      phone: row.customer_phone,
      email: row.customer_email,
      address: row.customer_address,
    },
    items,
  };
}

async function itemsForOrder(orderId: number): Promise<OrderItemRecord[]> {
  const db = await getDb();
  const rows = await db.query<ItemRow>(
    `SELECT product_id, product_name, quantity, unit_price, line_total
     FROM order_items WHERE order_id = ? ORDER BY id`,
    [orderId]
  );
  return rows.rows.map((row) => ({
    productId: row.product_id == null ? null : Number(row.product_id),
    name: row.product_name,
    quantity: Number(row.quantity),
    unitPrice: Number(row.unit_price),
    lineTotal: Number(row.line_total),
  }));
}

async function hydrateOrder(row: OrderRow): Promise<OrderRecord> {
  return toOrder(row, await itemsForOrder(Number(row.id)));
}

export type NewOrderInput = {
  customer: {
    name: string;
    phone: string;
    email: string;
    address: string;
  };
  payment: string;
  items: { productId: number; quantity: number }[];
};

function validateOrderInput(input: NewOrderInput) {
  const name = input.customer.name.trim();
  const phone = input.customer.phone.trim();
  const address = input.customer.address.trim();
  const email = input.customer.email.trim();

  if (!name || name.length > 120) throw new Error("Enter the customer's name.");
  if (!/^[0-9+\s-]{7,20}$/.test(phone)) {
    throw new Error("Enter a valid phone number.");
  }
  if (!address || address.length > 500) {
    throw new Error("Enter a delivery location.");
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Enter a valid email address or leave it blank.");
  }
  if (!Array.isArray(input.items) || input.items.length === 0) {
    throw new Error("Your cart is empty.");
  }
  for (const item of input.items) {
    if (
      !Number.isInteger(item.productId) ||
      !Number.isInteger(item.quantity) ||
      item.quantity <= 0
    ) {
      throw new Error("There is an invalid item in your cart.");
    }
    if (item.quantity > 100) throw new Error("The maximum quantity is 100 per item.");
  }

  return {
    name,
    phone,
    address,
    email,
    payment: normalizePaymentPreference(input.payment),
  };
}

function createOrderNumber(): string {
  const now = Date.now();
  const suffix = String(Math.floor(Math.random() * 1000)).padStart(3, "0");
  return `AAS-${now.toString().slice(-6)}-${suffix}`;
}

export async function createOrder(input: NewOrderInput): Promise<OrderRecord> {
  const customer = validateOrderInput(input);
  const db = await getDb();

  const resolved: {
    productId: number;
    name: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }[] = [];
  for (const item of input.items) {
    const product = await getProductById(item.productId);
    if (!product || product.isActive === false) {
      throw new Error("One of the products in your cart is no longer available.");
    }
    if (product.stock != null && product.stock < item.quantity) {
      throw new Error(`Only ${product.stock} of ${product.name} remain in stock.`);
    }
    const unitPrice = Math.round(product.price * 100) / 100;
    resolved.push({
      productId: product.id,
      name: product.name,
      quantity: item.quantity,
      unitPrice,
      lineTotal: Math.round(unitPrice * item.quantity * 100) / 100,
    });
  }

  const total = Math.round(resolved.reduce((sum, item) => sum + item.lineTotal, 0) * 100) / 100;
  const now = new Date().toISOString();

  return db.transaction(async (tx) => {
    let orderNumber = createOrderNumber();
    while (await tx.queryOne("SELECT 1 FROM orders WHERE order_number = ?", [orderNumber])) {
      orderNumber = createOrderNumber();
    }

    const existingCustomer = await tx.queryOne<{ id: number | bigint }>(
      "SELECT id FROM customers WHERE phone = ?",
      [customer.phone]
    );

    let customerId: number;
    if (existingCustomer) {
      customerId = Number(existingCustomer.id);
      await tx.execute(
        "UPDATE customers SET name = ?, email = ?, address = ?, updated_at = ? WHERE id = ?",
        [customer.name, customer.email, customer.address, now, customerId]
      );
    } else {
      const result = await tx.query<{ id: number | bigint }>(
        `INSERT INTO customers (name, phone, email, address, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)
         RETURNING id`,
        [customer.name, customer.phone, customer.email, customer.address, now, now]
      );
      customerId = Number(result.rows[0]?.id);
    }

    const orderResult = await tx.query<{ id: number | bigint }>(
      `INSERT INTO orders
        (order_number, customer_id, placed_at, updated_at, status, total, payment, delivery_address)
       VALUES (?, ?, ?, ?, 'Pending', ?, ?, ?)
       RETURNING id`,
      [orderNumber, customerId, now, now, total, customer.payment, customer.address]
    );
    const orderId = Number(orderResult.rows[0]?.id);

    for (const item of resolved) {
      await tx.execute(
        `INSERT INTO order_items
          (order_id, product_id, product_name, quantity, unit_price, line_total)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [orderId, item.productId, item.name, item.quantity, item.unitPrice, item.lineTotal]
      );
      await tx.execute(
        "UPDATE products SET stock = stock - ?, updated_at = ? WHERE id = ? AND stock IS NOT NULL",
        [item.quantity, now, item.productId]
      );
    }

    return {
      orderNumber,
      placedAt: now,
      updatedAt: now,
      status: "Pending" as const,
      total,
      payment: customer.payment,
      deliveryAddress: customer.address,
      customer: {
        id: customerId,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
      },
      items: resolved.map((item) => ({ ...item })),
    };
  });
}

export async function listOrders(
  filters: { status?: string; search?: string; limit?: number } = {}
): Promise<OrderRecord[]> {
  const clauses: string[] = [];
  const params: unknown[] = [];

  if (filters.status && ORDER_STATUSES.includes(filters.status as OrderStatus)) {
    clauses.push("o.status = ?");
    params.push(filters.status);
  }
  if (filters.search?.trim()) {
    clauses.push(
      "(LOWER(o.order_number) LIKE LOWER(?) OR LOWER(c.name) LIKE LOWER(?) OR LOWER(c.phone) LIKE LOWER(?))"
    );
    const term = `%${filters.search.trim()}%`;
    params.push(term, term, term);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const limit = Math.min(Math.max(filters.limit ?? 200, 1), 500);
  const db = await getDb();
  const rows = await db.query<OrderRow>(
    `${ORDER_SELECT} ${where} ORDER BY o.placed_at DESC, o.id DESC LIMIT ?`,
    [...params, limit]
  );
  return Promise.all(rows.rows.map(hydrateOrder));
}

export async function getOrderByNumber(orderNumber: string): Promise<OrderRecord | null> {
  const db = await getDb();
  const row = await db.queryOne<OrderRow>(`${ORDER_SELECT} WHERE o.order_number = ?`, [
    orderNumber,
  ]);
  return row ? hydrateOrder(row) : null;
}

export async function updateOrderStatus(
  orderNumber: string,
  status: string
): Promise<boolean> {
  if (!ORDER_STATUSES.includes(status as OrderStatus)) return false;
  const next = status as OrderStatus;
  const db = await getDb();

  return db.transaction(async (tx: QueryClient) => {
    const order = await tx.queryOne<{ id: number | bigint; status: OrderStatus }>(
      "SELECT id, status FROM orders WHERE order_number = ?",
      [orderNumber]
    );
    if (!order) return false;
    if (!canTransitionOrderStatus(order.status, next)) return false;
    if (order.status === next) return true;

    const orderId = Number(order.id);
    const now = new Date().toISOString();
    if (next === "Cancelled") {
      const items = await tx.query<{ product_id: number | bigint | null; quantity: number | bigint }>(
        "SELECT product_id, quantity FROM order_items WHERE order_id = ?",
        [orderId]
      );
      for (const item of items.rows) {
        if (item.product_id != null) {
          await tx.execute(
            `UPDATE products
             SET stock = CASE WHEN stock IS NULL THEN NULL ELSE stock + ? END,
                 updated_at = ?
             WHERE id = ?`,
            [Number(item.quantity), now, Number(item.product_id)]
          );
        }
      }
    }

    await tx.execute("UPDATE orders SET status = ?, updated_at = ? WHERE id = ?", [
      next,
      now,
      orderId,
    ]);
    return true;
  });
}

export async function listCustomerOrders(
  references: { orderNumber: string; phone: string }[]
): Promise<OrderRecord[]> {
  const valid = references
    .filter(
      (ref) =>
        typeof ref.orderNumber === "string" &&
        /^AAS-[\d-]+$/.test(ref.orderNumber) &&
        typeof ref.phone === "string"
    )
    .slice(0, 50);
  if (valid.length === 0) return [];

  const db = await getDb();
  const orders: OrderRecord[] = [];
  for (const ref of valid) {
    const row = await db.queryOne<OrderRow>(
      `${ORDER_SELECT} WHERE o.order_number = ? AND c.phone = ?`,
      [ref.orderNumber, ref.phone]
    );
    if (row) orders.push(await hydrateOrder(row));
  }
  return orders.sort((a, b) => b.placedAt.localeCompare(a.placedAt));
}

type CustomerRow = {
  id: number | bigint;
  name: string;
  phone: string;
  email: string;
  address: string;
  created_at: string;
  order_count: number | bigint | string;
  total_spent: number | bigint | string;
};

const CUSTOMER_SELECT = `
  SELECT c.id, c.name, c.phone, c.email, c.address, c.created_at,
         COUNT(o.id) AS order_count,
         COALESCE(SUM(CASE WHEN o.status = 'Cancelled' THEN 0 ELSE o.total END), 0) AS total_spent
  FROM customers c
  LEFT JOIN orders o ON o.customer_id = c.id
`;

function toCustomer(row: CustomerRow): CustomerRecord {
  return {
    id: Number(row.id),
    name: row.name,
    phone: row.phone,
    email: row.email,
    address: row.address,
    createdAt: row.created_at,
    orderCount: Number(row.order_count),
    totalSpent: Number(row.total_spent),
  };
}

export async function listCustomers(): Promise<CustomerRecord[]> {
  const db = await getDb();
  const rows = await db.query<CustomerRow>(
    `${CUSTOMER_SELECT} GROUP BY c.id ORDER BY c.created_at DESC, c.id DESC`
  );
  return rows.rows.map(toCustomer);
}

export async function getCustomerById(id: number): Promise<CustomerRecord | null> {
  if (!Number.isInteger(id) || id <= 0) return null;
  const db = await getDb();
  const row = await db.queryOne<CustomerRow>(
    `${CUSTOMER_SELECT} WHERE c.id = ? GROUP BY c.id`,
    [id]
  );
  return row ? toCustomer(row) : null;
}

export async function listOrdersForCustomer(customerId: number): Promise<OrderRecord[]> {
  if (!Number.isInteger(customerId) || customerId <= 0) return [];
  const db = await getDb();
  const rows = await db.query<OrderRow>(
    `${ORDER_SELECT} WHERE o.customer_id = ? ORDER BY o.placed_at DESC, o.id DESC`,
    [customerId]
  );
  return Promise.all(rows.rows.map(hydrateOrder));
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const db = await getDb();
  const count = async (sql: string, params: unknown[] = []): Promise<number> => {
    const row = await db.queryOne<{ value: number | bigint | string }>(sql, params);
    return Number(row?.value ?? 0);
  };

  const statusCounts = [];
  for (const status of ORDER_STATUSES) {
    statusCounts.push({
      status,
      count: await count("SELECT COUNT(*) AS value FROM orders WHERE status = ?", [status]),
    });
  }

  const topRows = await db.query<{
    name: string;
    quantity: number | bigint | string;
    revenue: number | bigint | string;
  }>(`
    SELECT oi.product_name AS name, SUM(oi.quantity) AS quantity,
           SUM(oi.line_total) AS revenue
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE o.status != 'Cancelled'
    GROUP BY oi.product_name
    ORDER BY revenue DESC
    LIMIT 5
  `);

  const today = new Date().toISOString().slice(0, 10);
  const weekStart = new Date();
  weekStart.setUTCDate(weekStart.getUTCDate() - 6);
  const weekStartDay = weekStart.toISOString().slice(0, 10);

  const dayRows = await db.query<{
    day: string;
    revenue: number | bigint | string;
    orders: number | bigint | string;
  }>(
    `SELECT substr(placed_at, 1, 10) AS day, SUM(total) AS revenue, COUNT(*) AS orders
     FROM orders
     WHERE substr(placed_at, 1, 10) >= ? AND status != 'Cancelled'
     GROUP BY day ORDER BY day`,
    [weekStartDay]
  );
  const byDay = new Map(dayRows.rows.map((row) => [row.day, row]));
  const revenueByDay = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - (6 - index));
    const day = date.toISOString().slice(0, 10);
    const found = byDay.get(day);
    return {
      day,
      revenue: Number(found?.revenue ?? 0),
      orders: Number(found?.orders ?? 0),
    };
  });

  return {
    productCount: await count("SELECT COUNT(*) AS value FROM products"),
    categoryCount: await count("SELECT COUNT(*) AS value FROM categories"),
    customerCount: await count("SELECT COUNT(*) AS value FROM customers"),
    orderCount: await count("SELECT COUNT(*) AS value FROM orders"),
    pendingCount: await count("SELECT COUNT(*) AS value FROM orders WHERE status = 'Pending'"),
    ordersToday: await count(
      "SELECT COUNT(*) AS value FROM orders WHERE substr(placed_at, 1, 10) = ?",
      [today]
    ),
    revenue: await count(
      "SELECT COALESCE(SUM(total), 0) AS value FROM orders WHERE status != 'Cancelled'"
    ),
    revenueToday: await count(
      "SELECT COALESCE(SUM(total), 0) AS value FROM orders WHERE substr(placed_at, 1, 10) = ? AND status != 'Cancelled'",
      [today]
    ),
    lowStockCount: await count(
      "SELECT COUNT(*) AS value FROM products WHERE stock IS NOT NULL AND stock > 0 AND stock <= 5"
    ),
    outOfStockCount: await count("SELECT COUNT(*) AS value FROM products WHERE stock = 0"),
    statusCounts,
    topProducts: topRows.rows.map((row) => ({
      name: row.name,
      quantity: Number(row.quantity),
      revenue: Number(row.revenue),
    })),
    recentOrders: await listOrders({ limit: 5 }),
    revenueByDay,
  };
}
