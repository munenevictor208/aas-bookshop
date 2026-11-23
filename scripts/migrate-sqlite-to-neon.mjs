import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import pg from "pg";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const connectionString = process.env.DIRECT_URL?.trim() || process.env.DATABASE_URL?.trim();
if (!connectionString) {
  throw new Error("Add DIRECT_URL and DATABASE_URL to .env.local before migrating.");
}

const sqlitePath = process.env.AAS_DATABASE_PATH?.trim() || join(process.cwd(), "data", "shop.sqlite");
const sqlite = new DatabaseSync(sqlitePath, { readOnly: true });
const client = new pg.Client({ connectionString });
await client.connect();

const schema = readFileSync(join(process.cwd(), "scripts", "postgres-schema.sql"), "utf8");
await client.query(schema);

const tables = [
  "meta",
  "categories",
  "products",
  "customers",
  "orders",
  "order_items",
  "login_attempts",
];

const targetCounts = {};
for (const table of tables) {
  const result = await client.query(`SELECT COUNT(*)::int AS count FROM ${table}`);
  targetCounts[table] = Number(result.rows[0].count);
}

const occupied = tables.filter((table) => targetCounts[table] > 0);
if (occupied.length > 0) {
  await client.end();
  sqlite.close();
  throw new Error(
    `Refusing to migrate: target tables already contain rows (${occupied.join(", ")}). ` +
      "Use a fresh empty Neon database; no data was deleted."
  );
}

const source = {};
for (const table of tables) {
  source[table] = sqlite.prepare(`SELECT * FROM ${table}`).all();
}

async function insertRows(table, columns, rows) {
  if (rows.length === 0) return;
  const placeholders = columns.map((_, index) => `$${index + 1}`).join(", ");
  const sql = `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})`;
  for (const row of rows) {
    await client.query(sql, columns.map((column) => row[column] ?? null));
  }
}

async function syncSequence(table) {
  await client.query(
    `SELECT setval(pg_get_serial_sequence($1, 'id'), COALESCE((SELECT MAX(id) FROM ${table}), 1), (SELECT COUNT(*) FROM ${table}) > 0)`,
    [table]
  );
}

try {
  await client.query("BEGIN");

  await insertRows("meta", ["key", "value"], source.meta);
  await insertRows(
    "categories",
    ["id", "name", "icon", "description", "sort_order", "created_at"],
    source.categories
  );
  await insertRows(
    "products",
    [
      "id",
      "name",
      "description",
      "price",
      "icon",
      "category_id",
      "image_url",
      "sku",
      "stock",
      "is_active",
      "featured",
      "created_at",
      "updated_at",
    ],
    source.products
  );
  await insertRows(
    "customers",
    ["id", "name", "phone", "email", "address", "created_at", "updated_at"],
    source.customers
  );
  await insertRows(
    "orders",
    [
      "id",
      "order_number",
      "customer_id",
      "placed_at",
      "updated_at",
      "status",
      "total",
      "payment",
      "delivery_address",
    ],
    source.orders
  );
  await insertRows(
    "order_items",
    [
      "id",
      "order_id",
      "product_id",
      "product_name",
      "quantity",
      "unit_price",
      "line_total",
    ],
    source.order_items
  );
  await insertRows("login_attempts", ["key", "count", "reset_at"], source.login_attempts);

  for (const table of ["categories", "products", "customers", "orders", "order_items"]) {
    await syncSequence(table);
  }

  await client.query("COMMIT");
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
}

const summary = {};
for (const table of tables) {
  const result = await client.query(`SELECT COUNT(*)::int AS count FROM ${table}`);
  summary[table] = Number(result.rows[0].count);
}

console.log("Migration complete. Row counts:");
console.log(JSON.stringify(summary, null, 2));

await client.end();
sqlite.close();
