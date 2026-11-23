import { existsSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import pg from "pg";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const connectionString = process.env.DIRECT_URL?.trim() || process.env.DATABASE_URL?.trim();
if (!connectionString) throw new Error("DIRECT_URL or DATABASE_URL is missing.");

const sqlitePath = process.env.AAS_DATABASE_PATH?.trim() || join(process.cwd(), "data", "shop.sqlite");
const sqlite = new DatabaseSync(sqlitePath, { readOnly: true });
const client = new pg.Client({ connectionString });
await client.connect();

const tables = [
  "meta",
  "categories",
  "products",
  "customers",
  "orders",
  "order_items",
  "login_attempts",
];

function normalize(value) {
  if (value == null) return null;
  if (typeof value === "boolean") return value ? 1 : 0;
  if (typeof value === "number") {
    return Number.isInteger(value) ? value : Number(value.toFixed(2));
  }
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string") {
    if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)) return `${value}Z`;
    return value;
  }
  return value;
}

const categoryColumns = ["id", "name", "icon", "description", "sort_order", "created_at"];
const productColumns = [
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
];

function pickColumns(row, columns) {
  if (!columns) return row;
  return Object.fromEntries(columns.map((column) => [column, row[column]]));
}

let failed = false;
for (const table of tables) {
  const orderColumn = table === "meta" ? "key" : table === "login_attempts" ? "key" : "id";
  const columns =
    table === "categories" ? categoryColumns : table === "products" ? productColumns : null;
  const local = sqlite
    .prepare(`SELECT * FROM ${table} ORDER BY ${orderColumn}`)
    .all()
    .map((row) =>
      Object.fromEntries(
        Object.entries(pickColumns(row, columns)).map(([key, value]) => [key, normalize(value)])
      )
    );
  const remoteResult = await client.query(`SELECT * FROM ${table} ORDER BY ${orderColumn}`);
  const remote = remoteResult.rows
    .map((row) => pickColumns(row, columns))
    .map((row) =>
      Object.fromEntries(Object.entries(row).map(([key, value]) => [key, normalize(value)]))
    );

  const countsMatch = local.length === remote.length;
  const rowsMatch = JSON.stringify(local) === JSON.stringify(remote);
  console.log(`${table}: local=${local.length} neon=${remote.length} ${countsMatch && rowsMatch ? "OK" : "MISMATCH"}`);
  if (!countsMatch || !rowsMatch) {
    failed = true;
    console.log("  local sample:", JSON.stringify(local.slice(0, 1)));
    console.log("  neon sample: ", JSON.stringify(remote.slice(0, 1)));
  }
}

await client.end();
sqlite.close();

if (failed) process.exitCode = 1;
