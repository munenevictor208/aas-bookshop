import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath, pathToFileURL } from "node:url";
import pg from "pg";
import { attachDatabasePool } from "@vercel/functions";

import { categories as seedCategoryNames, products as seedProducts } from "../app/data/products.ts";
import { ORDER_STATUSES } from "./types.ts";

export const SCHEMA_VERSION = 4;

export type DbRow = Record<string, unknown>;

export type QueryResult<T extends DbRow = DbRow> = {
  rows: T[];
  rowCount: number;
};

export interface QueryClient {
  query<T extends DbRow = DbRow>(sql: string, params?: readonly unknown[]): Promise<QueryResult<T>>;
  queryOne<T extends DbRow = DbRow>(sql: string, params?: readonly unknown[]): Promise<T | null>;
  execute(sql: string, params?: readonly unknown[]): Promise<number>;
}

export interface Database extends QueryClient {
  kind: "sqlite" | "postgres";
  transaction<T>(fn: (client: QueryClient) => Promise<T>): Promise<T>;
}

type SqliteParam = string | number | bigint | null | Uint8Array;

function normalizeSqliteParam(value: unknown): SqliteParam {
  if (value == null) return null;
  if (typeof value === "boolean") return value ? 1 : 0;
  if (typeof value === "string" || typeof value === "number" || typeof value === "bigint") {
    return value;
  }
  if (value instanceof Uint8Array) return value;
  return String(value);
}

function normalizePostgresParam(value: unknown): unknown {
  return value === undefined ? null : value;
}

function toPostgresSql(sql: string): string {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
}

class SqliteQueryClient implements QueryClient {
  protected readonly db: DatabaseSync;

  protected constructor(db: DatabaseSync) {
    this.db = db;
  }

  async query<T extends DbRow = DbRow>(sql: string, params: readonly unknown[] = []): Promise<QueryResult<T>> {
    const rows = this.db.prepare(sql).all(...params.map(normalizeSqliteParam)) as T[];
    return { rows, rowCount: rows.length };
  }

  async queryOne<T extends DbRow = DbRow>(sql: string, params: readonly unknown[] = []): Promise<T | null> {
    return (this.db.prepare(sql).get(...params.map(normalizeSqliteParam)) as T | undefined) ?? null;
  }

  async execute(sql: string, params: readonly unknown[] = []): Promise<number> {
    return Number(this.db.prepare(sql).run(...params.map(normalizeSqliteParam)).changes);
  }
}

class SqliteDatabase extends SqliteQueryClient implements Database {
  readonly kind = "sqlite" as const;

  constructor(db: DatabaseSync) {
    super(db);
  }

  async transaction<T>(fn: (client: QueryClient) => Promise<T>): Promise<T> {
    this.db.exec("BEGIN");
    try {
      const result = await fn(this);
      this.db.exec("COMMIT");
      return result;
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }
}

class PostgresQueryClient implements QueryClient {
  protected readonly client: pg.Pool | pg.PoolClient;

  protected constructor(client: pg.Pool | pg.PoolClient) {
    this.client = client;
  }

  async query<T extends DbRow = DbRow>(sql: string, params: readonly unknown[] = []): Promise<QueryResult<T>> {
    const result = await this.client.query(toPostgresSql(sql), params.map(normalizePostgresParam));
    return { rows: result.rows as T[], rowCount: result.rowCount ?? result.rows.length };
  }

  async queryOne<T extends DbRow = DbRow>(sql: string, params: readonly unknown[] = []): Promise<T | null> {
    const result = await this.client.query(toPostgresSql(sql), params.map(normalizePostgresParam));
    return (result.rows[0] as T | undefined) ?? null;
  }

  async execute(sql: string, params: readonly unknown[] = []): Promise<number> {
    const result = await this.client.query(toPostgresSql(sql), params.map(normalizePostgresParam));
    return result.rowCount ?? 0;
  }
}

class PostgresDatabase extends PostgresQueryClient implements Database {
  readonly kind = "postgres" as const;
  private readonly pool: pg.Pool;

  constructor(pool: pg.Pool) {
    super(pool);
    this.pool = pool;
  }

  async transaction<T>(fn: (client: QueryClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    const tx = new PostgresQueryClient(client);
    try {
      await client.query("BEGIN");
      const result = await fn(tx);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}

const globalForDb = globalThis as typeof globalThis & {
  aasDbPromise?: Promise<Database>;
  aasPgPool?: pg.Pool;
};

export function getDatabasePath(): string {
  const configured = process.env.AAS_DATABASE_PATH?.trim();
  if (!configured) return join(process.cwd(), "data", "shop.sqlite");
  if (/^[A-Za-z]:[\\/]/.test(configured) || configured.startsWith("/")) {
    return configured.replace(/\\/g, "/");
  }
  return fileURLToPath(new URL(configured, pathToFileURL(`${process.cwd()}/`).href));
}

function getMeta(db: DatabaseSync, key: string): string | undefined {
  const row = db.prepare("SELECT value FROM meta WHERE key = ?").get(key) as
    | { value: string }
    | undefined;
  return row?.value;
}

function setMeta(db: DatabaseSync, key: string, value: string): void {
  db.prepare(
    "INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
  ).run(key, value);
}

function createFinalSchema(db: DatabaseSync): void {
  db.exec(
    `CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE COLLATE NOCASE,
      icon TEXT NOT NULL DEFAULT 'Ã°Å¸â€œÂ',
      description TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`
  );
  db.exec(
    `CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      price NUMERIC NOT NULL CHECK (price >= 0),
      icon TEXT NOT NULL DEFAULT 'Ã°Å¸â€œÂ¦',
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      image_url TEXT,
      sku TEXT,
      stock INTEGER CHECK (stock IS NULL OR stock >= 0),
      is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
      featured INTEGER NOT NULL DEFAULT 0 CHECK (featured IN (0, 1)),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`
  );
  db.exec(
    `CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL DEFAULT '',
      address TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`
  );
  db.exec(
    `CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT NOT NULL UNIQUE,
      customer_id INTEGER NOT NULL REFERENCES customers(id),
      placed_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending'
        CHECK (status IN (${ORDER_STATUSES.map((status) => `'${status}'`).join(", ")})),
      total NUMERIC NOT NULL CHECK (total >= 0),
      payment TEXT NOT NULL DEFAULT 'Cash on Delivery',
      delivery_address TEXT NOT NULL DEFAULT ''
    )`
  );
  db.exec(
    `CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
      product_name TEXT NOT NULL,
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      unit_price NUMERIC NOT NULL CHECK (unit_price >= 0),
      line_total NUMERIC NOT NULL CHECK (line_total >= 0)
    )`
  );
  db.exec(
    `CREATE TABLE IF NOT EXISTS login_attempts (
      key TEXT PRIMARY KEY,
      count INTEGER NOT NULL,
      reset_at INTEGER NOT NULL
    )`
  );
  db.exec("CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id)");
  db.exec("CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)");
  db.exec("CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id)");
  db.exec("CREATE INDEX IF NOT EXISTS idx_orders_placed_at ON orders(placed_at)");
  db.exec("CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id)");
}

const CATEGORY_DETAILS: Record<string, { icon: string; description: string }> = {
  Books: {
    icon: "Ã°Å¸â€œÅ¡",
    description: "Exercise books, reading books and textbooks for every learner.",
  },
  Stationery: {
    icon: "Ã¢Å“ÂÃ¯Â¸Â",
    description: "Pens, pencils, markers and everyday writing essentials.",
  },
  "School Bags": {
    icon: "Ã°Å¸Å½â€™",
    description: "Durable bags made to carry a full school day.",
  },
  "School Supplies": {
    icon: "Ã°Å¸â€œÂ",
    description: "Geometry sets, rulers and tools for every lesson.",
  },
};

function runMigrations(db: DatabaseSync): void {
  const currentVersion = Number(getMeta(db, "schema_version") ?? 0);
  createFinalSchema(db);

  const orderColumns = db.prepare("PRAGMA table_info(orders)").all() as { name: string }[];
  if (!orderColumns.some((column) => column.name === "notification_method")) {
    db.exec("ALTER TABLE orders ADD COLUMN notification_method TEXT NOT NULL DEFAULT 'SMS'");
  }

  if (currentVersion < 3) {
    const columns = db.prepare("PRAGMA table_info(categories)").all() as { name: string }[];
    if (!columns.some((column) => column.name === "description")) {
      db.exec("ALTER TABLE categories ADD COLUMN description TEXT NOT NULL DEFAULT ''");
    }
    for (const [name, detail] of Object.entries(CATEGORY_DETAILS)) {
      db.prepare(
        "UPDATE categories SET icon = ?, description = ? WHERE LOWER(name) = LOWER(?) AND description = ''"
      ).run(detail.icon, detail.description, name);
    }
  }

  setMeta(db, "schema_version", String(SCHEMA_VERSION));
}

function seed(db: DatabaseSync): void {
  const productCount = Number(
    (db.prepare("SELECT COUNT(*) AS count FROM products").get() as { count: number }).count
  );
  const categoryCount = Number(
    (db.prepare("SELECT COUNT(*) AS count FROM categories").get() as { count: number }).count
  );

  if (productCount > 0 && categoryCount > 0) {
    if (!getMeta(db, "seeded_at")) setMeta(db, "seeded_at", new Date().toISOString());
    return;
  }

  const categoryIds = new Map<string, number>();
  if (categoryCount === 0) {
    const insertCategory = db.prepare(
      "INSERT INTO categories (name, icon, description, sort_order) VALUES (?, ?, ?, ?)"
    );
    seedCategoryNames.forEach((name, index) => {
      const detail = CATEGORY_DETAILS[name] ?? { icon: "Ã°Å¸â€œÂ", description: "" };
      const result = insertCategory.run(name, detail.icon, detail.description, index);
      categoryIds.set(name, Number(result.lastInsertRowid));
    });
  } else {
    const rows = db.prepare("SELECT id, name FROM categories").all() as { id: number; name: string }[];
    for (const row of rows) categoryIds.set(row.name, row.id);
  }

  if (productCount === 0) {
    const insertProduct = db.prepare(
      `INSERT INTO products
        (name, description, price, icon, category_id, image_url, sku, stock, is_active, featured)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const product of seedProducts) {
      insertProduct.run(
        product.name,
        product.description,
        product.price,
        product.icon,
        categoryIds.get(product.category) ?? null,
        product.imageUrl ?? null,
        product.sku ?? null,
        product.stock ?? null,
        product.isActive === false ? 0 : 1,
        product.featured ? 1 : 0
      );
    }
  }

  if (!getMeta(db, "seeded_at")) setMeta(db, "seeded_at", new Date().toISOString());
}

function createSqliteDatabase(): Database {
  const fileName = getDatabasePath();
  mkdirSync(dirname(fileName), { recursive: true });
  const db = new DatabaseSync(fileName);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");
  db.exec("CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)");
  runMigrations(db);
  seed(db);
  return new SqliteDatabase(db);
}

async function initializePostgresDatabase(db: Database): Promise<void> {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      icon TEXT NOT NULL DEFAULT 'Ã°Å¸â€œÂ',
      description TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP::text
    )
  `);

  await db.execute(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_name_lower
    ON categories (LOWER(name))
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      price NUMERIC NOT NULL CHECK (price >= 0),
      icon TEXT NOT NULL DEFAULT 'Ã°Å¸â€œÂ¦',
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      image_url TEXT,
      sku TEXT,
      stock INTEGER CHECK (stock IS NULL OR stock >= 0),
      is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
      featured INTEGER NOT NULL DEFAULT 0 CHECK (featured IN (0, 1)),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP::text,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP::text
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS customers (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL DEFAULT '',
      address TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP::text,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP::text
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      order_number TEXT NOT NULL UNIQUE,
      customer_id INTEGER NOT NULL REFERENCES customers(id),
      placed_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending'
        CHECK (status IN (${ORDER_STATUSES.map((status) => `'${status}'`).join(", ")})),
      total NUMERIC NOT NULL CHECK (total >= 0),
      payment TEXT NOT NULL DEFAULT 'Cash on Delivery',
      delivery_address TEXT NOT NULL DEFAULT ''
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
      product_name TEXT NOT NULL,
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      unit_price NUMERIC NOT NULL CHECK (unit_price >= 0),
      line_total NUMERIC NOT NULL CHECK (line_total >= 0)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS login_attempts (
      key TEXT PRIMARY KEY,
      count INTEGER NOT NULL,
      reset_at BIGINT NOT NULL
    )
  `);

  // Safely upgrade existing PostgreSQL databases without deleting records.
  await db.execute("ALTER TABLE login_attempts ALTER COLUMN reset_at TYPE BIGINT");
  await db.execute("ALTER TABLE orders ADD COLUMN IF NOT EXISTS notification_method TEXT NOT NULL DEFAULT 'SMS'");

  await db.execute("CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id)");
  await db.execute("CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)");
  await db.execute("CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id)");
  await db.execute("CREATE INDEX IF NOT EXISTS idx_orders_placed_at ON orders(placed_at)");
  await db.execute("CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id)");

  for (const [name, detail] of Object.entries(CATEGORY_DETAILS)) {
    await db.execute(
      `UPDATE categories
       SET icon = ?, description = ?
       WHERE LOWER(name) = LOWER(?) AND description = ''`,
      [detail.icon, detail.description, name]
    );
  }

  for (let index = 0; index < seedCategoryNames.length; index++) {
    const name = seedCategoryNames[index];
    const detail = CATEGORY_DETAILS[name] ?? { icon: "Ã°Å¸â€œÂ", description: "" };

    await db.execute(
      `INSERT INTO categories (name, icon, description, sort_order)
       VALUES (?, ?, ?, ?)
       ON CONFLICT (name) DO NOTHING`,
      [name, detail.icon, detail.description, index]
    );
  }

  const productCount = await db.queryOne<{ count: string | number }>(
    "SELECT COUNT(*) AS count FROM products"
  );

  if (Number(productCount?.count ?? 0) === 0) {
    for (const product of seedProducts) {
      const category = await db.queryOne<{ id: number }>(
        "SELECT id FROM categories WHERE LOWER(name) = LOWER(?)",
        [product.category]
      );

      await db.execute(
        `INSERT INTO products
          (name, description, price, icon, category_id, image_url, sku, stock, is_active, featured)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          product.name,
          product.description,
          product.price,
          product.icon,
          category?.id ?? null,
          product.imageUrl ?? null,
          product.sku ?? null,
          product.stock ?? null,
          product.isActive === false ? 0 : 1,
          product.featured ? 1 : 0
        ]
      );
    }
  }

  await db.execute(
    `INSERT INTO meta (key, value)
     VALUES ('schema_version', ?)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    [String(SCHEMA_VERSION)]
  );

  await db.execute(
    `INSERT INTO meta (key, value)
     VALUES ('seeded_at', ?)
     ON CONFLICT (key) DO NOTHING`,
    [new Date().toISOString()]
  );
}




async function createPostgresDatabase(): Promise<Database> {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is missing");
  }

  const pool = new pg.Pool({
    connectionString,
    max: 5,
    idleTimeoutMillis: 5_000,
    connectionTimeoutMillis: 10_000,
  });

  if (process.env.VERCEL) {
    attachDatabasePool(pool);
  }

  globalForDb.aasPgPool = pool;

  const database = new PostgresDatabase(pool);

  await initializePostgresDatabase(database);

  return database;
}


export function usesPostgres(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export async function getDb(): Promise<Database> {
  if (!globalForDb.aasDbPromise) {
    globalForDb.aasDbPromise = usesPostgres()
      ? createPostgresDatabase()
      : Promise.resolve(createSqliteDatabase());
  }

  return globalForDb.aasDbPromise;
}
