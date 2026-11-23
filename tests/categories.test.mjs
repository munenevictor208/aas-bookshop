import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { tmpdir } from "node:os";
import { join } from "node:path";

const databasePath = join(
  tmpdir(),
  `aas-categories-test-${Date.now()}-${Math.floor(Math.random() * 10000)}.sqlite`
);
process.env.AAS_DATABASE_PATH = databasePath;

const legacy = new DatabaseSync(databasePath);
legacy.exec(`
  CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
  INSERT INTO meta (key, value) VALUES
    ('schema_version', '2'),
    ('seeded_at', '2026-01-01T00:00:00.000Z');
  CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE COLLATE NOCASE,
    icon TEXT NOT NULL DEFAULT '📁',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  INSERT INTO categories (name, icon, sort_order) VALUES ('Books', '📚', 0);
`);
legacy.close();

const { getDb, SCHEMA_VERSION } = await import("../lib/db.ts");
const {
  createCategory,
  createProduct,
  deleteCategory,
  listCategories,
  listProducts,
  updateCategory,
  updateProduct,
} = await import("../lib/catalog.ts");

const productInput = (categoryId) => ({
  name: "Category Test Book",
  description: "A book used to test category reassignment.",
  price: 50,
  categoryId,
  icon: "📖",
  imageUrl: null,
  sku: "CAT-TEST",
  stock: 2,
  isActive: true,
  featured: false,
});

test("an existing v2 database migrates to category descriptions", async () => {
  const db = await getDb();
  const columns = (await db.query("PRAGMA table_info(categories)")).rows;
  const hasDescription = columns.some((column) => column.name === "description");
  assert.equal(hasDescription, true);

  const version = await db.queryOne("SELECT value FROM meta WHERE key = 'schema_version'");
  assert.equal(Number(version.value), SCHEMA_VERSION);
  assert.equal(SCHEMA_VERSION, 3);

  const books = (await listCategories()).find((category) => category.name === "Books");
  assert.equal(
    books.description,
    "Exercise books, reading books and textbooks for every learner."
  );
});

test("category descriptions are stored permanently on create and edit", async () => {
  const id = await createCategory(
    "Revision Guides",
    "📘",
    "Exam preparation for every level."
  );
  let category = (await listCategories()).find((item) => item.id === id);
  assert.equal(category.description, "Exam preparation for every level.");

  assert.equal(
    await updateCategory(
      id,
      "Revision Books",
      "📗",
      "Updated revision shelf description.",
      99
    ),
    true
  );
  category = (await listCategories()).find((item) => item.id === id);
  assert.equal(category.name, "Revision Books");
  assert.equal(category.description, "Updated revision shelf description.");
});

test("a category with products cannot be deleted until they are reassigned", async () => {
  const sourceId = (await listCategories()).find(
    (category) => category.name === "Revision Books"
  ).id;
  const productId = await createProduct(productInput(sourceId));

  await assert.rejects(() => deleteCategory(sourceId), /Reassign the 1 product/);
  assert.equal((await listProducts({ category: "Revision Books" })).length, 1);

  const targetId = await createCategory("General Books", "📚", "General reading.");
  assert.equal(await updateProduct(productId, productInput(targetId)), true);
  assert.equal((await listProducts({ category: "Revision Books" })).length, 0);
  assert.equal((await listProducts({ category: "General Books" })).length, 1);

  assert.equal(await deleteCategory(sourceId), true);
  assert.equal(await deleteCategory(sourceId), false);
});
