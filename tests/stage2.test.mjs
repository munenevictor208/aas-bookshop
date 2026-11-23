import test from "node:test";
import assert from "node:assert/strict";
import { tmpdir } from "node:os";
import { join } from "node:path";

process.env.AAS_DATABASE_PATH = join(
  tmpdir(),
  `aas-stage2-test-${Date.now()}-${Math.floor(Math.random() * 10000)}.sqlite`
);
process.env.ADMIN_EMAIL = "owner@example.com";
process.env.ADMIN_PASSWORD_HASH = `${"a".repeat(32)}:${"b".repeat(128)}`;
process.env.AUTH_SECRET = "x".repeat(64);

const { getDb, SCHEMA_VERSION } = await import("../lib/db.ts");
const {
  createProduct,
  deleteProduct,
  getProductById,
  listCategories,
  listProducts,
  moveCategory,
  updateCategory,
} = await import("../lib/catalog.ts");
const {
  createOrder,
  getCustomerById,
  getOrderByNumber,
  listOrdersForCustomer,
  updateOrderStatus,
} = await import("../lib/orders.ts");
const { isManagedUploadUrl, validateImageUrl } = await import("../lib/uploads.ts");
const { isSameOriginRequest } = await import("../lib/security.ts");
const {
  clearAttempts,
  getAttemptCount,
  LOGIN_MAX_ATTEMPTS,
  recordAttempt,
} = await import("../lib/rate-limit.ts");

const productInput = (overrides = {}) => ({
  name: "Stage Two Notebook",
  description: "Permanent database test item",
  price: 10,
  categoryId: null,
  icon: "📓",
  imageUrl: null,
  sku: "STAGE-2",
  stock: 5,
  isActive: true,
  featured: false,
  ...overrides,
});

test("schema version and seed marker are stored in the permanent database", async () => {
  const { rows } = await (await getDb()).query(
    "SELECT key, value FROM meta WHERE key IN ('schema_version', 'seeded_at')"
  );
  const meta = Object.fromEntries(rows.map((entry) => [entry.key, entry.value]));
  assert.equal(Number(meta.schema_version), SCHEMA_VERSION);
  assert.ok(meta.seeded_at);
  assert.equal((await listProducts()).length, 8);
});

test("categories can be renamed, de-duplicated and reordered", async () => {
  const before = await listCategories();
  const first = before[0];
  const second = before[1];

  assert.equal(
    await updateCategory(first.id, "Books & Guides", "📗", "Guides for every subject.", first.sortOrder),
    true
  );
  const renamed = (await listCategories()).find((category) => category.id === first.id);
  assert.equal(renamed?.name, "Books & Guides");
  assert.equal(renamed?.description, "Guides for every subject.");
  await assert.rejects(
    () => updateCategory(second.id, "books & guides", "📁", "", second.sortOrder),
    /already exists/
  );

  assert.equal(await moveCategory(second.id, "up"), true);
  assert.equal((await listCategories())[0].id, second.id);

  assert.equal(await moveCategory(first.id, "up"), true);
  assert.equal((await listCategories())[0].id, first.id);
  assert.equal(await moveCategory(first.id, "down"), true);
  assert.equal((await listCategories())[1].id, first.id);
});

test("payment preferences are validated, customer history works and cancelling restocks", async () => {
  const productId = await createProduct(productInput());
  const orderInput = (payment) => ({
    customer: {
      name: "Stage Two Customer",
      phone: "0722222222",
      email: "stage2@example.com",
      address: "Nairobi, Westlands",
    },
    payment,
    items: [{ productId, quantity: 2 }],
  });

  await assert.rejects(() => createOrder(orderInput("Bank Transfer")), /valid payment/);

  const order = await createOrder(orderInput("M-Pesa on Delivery"));
  assert.equal(order.payment, "M-Pesa on Delivery");
  assert.equal((await getProductById(productId)).stock, 3);

  const customer = await getCustomerById(order.customer.id);
  assert.equal(customer.name, "Stage Two Customer");
  assert.equal(customer.orderCount, 1);
  assert.equal((await listOrdersForCustomer(customer.id)).length, 1);

  assert.equal(await updateOrderStatus(order.orderNumber, "Cancelled"), true);
  assert.equal((await getProductById(productId)).stock, 5);
  assert.equal((await getOrderByNumber(order.orderNumber)).status, "Cancelled");
  assert.equal(await updateOrderStatus(order.orderNumber, "Delivered"), false);
});

test("upload URLs and request origins are strictly validated", () => {
  assert.equal(isManagedUploadUrl("/uploads/abc123.png"), true);
  assert.equal(isManagedUploadUrl("/uploads/../../etc/passwd"), false);
  assert.equal(isManagedUploadUrl("https://example.com/image.png"), false);
  assert.throws(
    () => validateImageUrl("https://example.com/image.png"),
    /admin uploader/
  );

  const url = "http://localhost:3000/api/orders";
  assert.equal(
    isSameOriginRequest(
      new Request(url, { method: "POST", headers: { origin: "http://localhost:3000" } })
    ),
    true
  );
  assert.equal(isSameOriginRequest(new Request(url, { method: "POST" })), false);
  assert.equal(
    isSameOriginRequest(
      new Request(url, { method: "POST", headers: { origin: "https://evil.example" } })
    ),
    false
  );
});

test("rate-limit counters survive a database reconnect", async () => {
  const key = `test:${Date.now()}`;
  assert.equal(await getAttemptCount(key), 0);
  assert.equal(await recordAttempt(key, LOGIN_MAX_ATTEMPTS), true);
  assert.equal(await recordAttempt(key, LOGIN_MAX_ATTEMPTS), true);

  globalThis.aasDb = undefined;
  assert.equal(await getAttemptCount(key), 2);
  await clearAttempts(key);
  assert.equal(await getAttemptCount(key), 0);
});

test("an intentionally empty catalogue is not re-seeded", async () => {
  for (const product of await listProducts()) {
    assert.equal(await deleteProduct(product.id), true);
  }
  assert.equal((await listProducts()).length, 0);

  globalThis.aasDb = undefined;
  assert.equal((await listProducts()).length, 0);
});
