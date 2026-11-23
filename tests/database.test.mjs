import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";

process.env.AAS_DATABASE_PATH = join(
  tmpdir(),
  `aas-shop-test-${Date.now()}-${Math.floor(Math.random() * 10000)}.sqlite`
);
process.env.ADMIN_EMAIL = "owner@example.com";
process.env.ADMIN_PASSWORD_HASH = `${"a".repeat(32)}:${"b".repeat(128)}`;
process.env.AUTH_SECRET = "x".repeat(64);

const {
  createCategory,
  createProduct,
  deleteCategory,
  deleteProduct,
  getProductById,
  listCategories,
  listProducts,
  updateProduct,
} = await import("../lib/catalog.ts");
const {
  createOrder,
  getDashboardStats,
  getOrderByNumber,
  listCustomerOrders,
  listCustomers,
  listOrders,
  updateOrderStatus,
} = await import("../lib/orders.ts");
const {
  createSessionToken,
  getAuthConfig,
  verifySessionToken,
} = await import("../lib/session.ts");

const productInput = (overrides = {}) => ({
  name: "Test Notebook",
  description: "Temporary test item",
  price: 75,
  categoryId: null,
  icon: "📓",
  imageUrl: null,
  sku: "TEST-1",
  stock: 4,
  isActive: true,
  featured: false,
  ...overrides,
});

let createdProductId;
let createdCategoryId;
let createdOrderNumber;

test("database seeds only the original catalogue, with no invented inventory", async () => {
  const products = await listProducts();
  assert.equal(products.length, 8);
  assert.deepEqual(
    products.map((product) => product.price).sort((a, b) => a - b),
    [15, 20, 50, 80, 100, 150, 250, 1200]
  );
  assert.deepEqual(
    (await listCategories()).map((category) => category.name),
    ["Books", "Stationery", "School Bags", "School Supplies"]
  );
});

test("owner can add, edit and delete catalogue products", async () => {
  createdCategoryId = await createCategory("Test Category", "🧪", "Temporary shelf");
  createdProductId = await createProduct(
    productInput({ categoryId: createdCategoryId, imageUrl: "/uploads/test.png" })
  );

  let product = await getProductById(createdProductId);
  assert.equal(product.name, "Test Notebook");
  assert.equal(product.category, "Test Category");
  assert.equal(product.price, 75);
  assert.equal(product.stock, 4);
  assert.equal(product.imageUrl, "/uploads/test.png");

  assert.equal(
    await updateProduct(createdProductId, productInput({ price: 90, stock: 10, sku: "TEST-2" })),
    true
  );
  product = await getProductById(createdProductId);
  assert.equal(product.price, 90);
  assert.equal(product.stock, 10);
  assert.equal(product.sku, "TEST-2");

  assert.equal(await deleteCategory(createdCategoryId), true);
  assert.equal((await getProductById(createdProductId)).category, "Uncategorised");
});

test("orders are saved with server-calculated totals and tracked stock", async () => {
  const order = await createOrder({
    customer: {
      name: "Test Customer",
      phone: "0711111111",
      email: "test@example.com",
      address: "Nairobi, CBD",
    },
    payment: "Cash on Delivery",
    items: [
      { productId: 1, quantity: 2 },
      { productId: createdProductId, quantity: 3 },
    ],
  });

  createdOrderNumber = order.orderNumber;
  assert.match(order.orderNumber, /^AAS-\d{6}-\d{3}$/);
  assert.equal(order.status, "Pending");
  assert.equal(order.total, 370);
  assert.equal(order.items[0].unitPrice, 50);
  assert.equal(order.items[1].lineTotal, 270);
  assert.equal((await getProductById(createdProductId)).stock, 7);
  assert.equal((await listCustomers()).length, 1);
});

test("customers only see their own orders, and the owner can update status", async () => {
  assert.equal(
    (await listCustomerOrders([
      { orderNumber: createdOrderNumber, phone: "0711111111" },
    ])).length,
    1
  );
  assert.equal(
    (await listCustomerOrders([
      { orderNumber: createdOrderNumber, phone: "0799999999" },
    ])).length,
    0
  );

  assert.equal(await updateOrderStatus(createdOrderNumber, "Delivered"), true);
  assert.equal((await getOrderByNumber(createdOrderNumber)).status, "Delivered");
  assert.equal(await updateOrderStatus(createdOrderNumber, "Not a status"), false);
  assert.equal((await listOrders({ status: "Delivered" })).length, 1);

  const stats = await getDashboardStats();
  assert.equal(stats.orderCount, 1);
  assert.equal(stats.revenue, 370);
  assert.equal(stats.pendingCount, 0);
  assert.equal(stats.customerCount, 1);
  assert.ok(stats.topProducts.length > 0);
  assert.equal(stats.revenueByDay.length, 7);
});

test("deleted products keep their order history snapshot", async () => {
  assert.equal(await deleteProduct(createdProductId), true);
  assert.equal(await getProductById(createdProductId), null);
  const order = await getOrderByNumber(createdOrderNumber);
  assert.equal(order.items.length, 2);
  assert.equal(order.items[1].name, "Test Notebook");
});

test("owner session tokens are signed and expire", () => {
  const config = getAuthConfig();
  assert.equal(config.email, "owner@example.com");
  const token = createSessionToken(config.secret);
  assert.equal(verifySessionToken(token, config.secret).sub, "owner");
  assert.equal(verifySessionToken(token, "wrong-secret".repeat(6)), null);
  assert.equal(verifySessionToken(`${token}x`, config.secret), null);

  const expiredPayload = Buffer.from(
    JSON.stringify({ sub: "owner", exp: Math.floor(Date.now() / 1000) - 10 })
  ).toString("base64url");
  const signature = createHmac("sha256", config.secret)
    .update(expiredPayload)
    .digest("base64url");
  assert.equal(
    verifySessionToken(`${expiredPayload}.${signature}`, config.secret),
    null
  );
});
