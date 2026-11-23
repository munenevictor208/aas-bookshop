import { getDb, type QueryClient } from "./db.ts";
import { validateImageUrl, deleteManagedUpload } from "./uploads.ts";
import type { Category, Product, ProductInput } from "./types.ts";

type ProductRow = {
  id: number | bigint;
  name: string;
  description: string;
  price: number | string;
  icon: string | null;
  category_id: number | bigint | null;
  category_name: string | null;
  image_url: string | null;
  sku: string | null;
  stock: number | string | null;
  is_active: number | boolean;
  featured?: number | boolean | null;
};

type CategoryRow = {
  id: number | bigint;
  name: string;
  icon: string;
  description: string | null;
  sort_order: number | bigint;
  product_count?: number | bigint | string | null;
};

type ListProductsOptions = {
  includeInactive?: boolean;
  category?: string;
  search?: string;
};

function toProduct(row: ProductRow): Product {
  return {
    id: Number(row.id),
    name: row.name,
    description: row.description,
    price: Number(row.price),
    icon: row.icon ?? "📦",
    category: row.category_name ?? "Uncategorised",
    categoryId: row.category_id == null ? null : Number(row.category_id),
    imageUrl: row.image_url ?? null,
    sku: row.sku ?? null,
    stock: row.stock == null ? null : Number(row.stock),
    isActive: Boolean(row.is_active),
    featured: Boolean(row.featured),
  };
}

function toCategory(row: CategoryRow): Category {
  return {
    id: Number(row.id),
    name: row.name,
    icon: row.icon || "📁",
    description: row.description ?? "",
    sortOrder: Number(row.sort_order),
    productCount:
      row.product_count == null ? undefined : Number(row.product_count),
  };
}

export function validateProductInput(input: ProductInput): void {
  if (!input.name.trim()) throw new Error("Product name is required.");
  if (!input.description.trim()) throw new Error("Description is required.");
  if (!Number.isFinite(input.price) || input.price < 0) {
    throw new Error("Price must be zero or greater.");
  }
  if (input.stock != null && (!Number.isInteger(input.stock) || input.stock < 0)) {
    throw new Error("Stock must be zero or greater.");
  }
  if (input.imageUrl) validateImageUrl(input.imageUrl);
}

const PRODUCT_SELECT = `
  SELECT p.id, p.name, p.description, p.price, p.icon, p.category_id,
         c.name AS category_name, p.image_url, p.sku, p.stock,
         p.is_active, p.featured
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
`;

export async function listCategories(options?: { withProductCount?: boolean }): Promise<Category[]> {
  const db = await getDb();
  const select = options?.withProductCount
    ? `SELECT c.id, c.name, c.icon, c.description, c.sort_order,
              (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id) AS product_count
       FROM categories c
       ORDER BY c.sort_order ASC, LOWER(c.name) ASC`
    : `SELECT id, name, icon, description, sort_order
       FROM categories
       ORDER BY sort_order ASC, LOWER(name) ASC`;
  const rows = await db.query<CategoryRow>(select);
  return rows.rows.map(toCategory);
}

export async function listProducts(options?: ListProductsOptions): Promise<Product[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (!options?.includeInactive) conditions.push("p.is_active = 1");
  if (options?.category) {
    conditions.push("LOWER(c.name) = LOWER(?)");
    params.push(options.category);
  }
  if (options?.search) {
    conditions.push("(LOWER(p.name) LIKE LOWER(?) OR LOWER(p.description) LIKE LOWER(?))");
    const search = `%${options.search}%`;
    params.push(search, search);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const db = await getDb();
  const rows = await db.query<ProductRow>(
    `${PRODUCT_SELECT} ${where} ORDER BY LOWER(p.name) ASC`,
    params
  );
  return rows.rows.map(toProduct);
}

export async function getProductById(id: number): Promise<Product | null> {
  if (!Number.isInteger(id) || id <= 0) return null;
  const db = await getDb();
  const row = await db.queryOne<ProductRow>(`${PRODUCT_SELECT} WHERE p.id = ?`, [id]);
  return row ? toProduct(row) : null;
}

async function resolveCategory(client: QueryClient, categoryId: number | null): Promise<void> {
  if (categoryId == null) return;
  const row = await client.queryOne<{ id: number }>(
    "SELECT id FROM categories WHERE id = ?",
    [categoryId]
  );
  if (!row) throw new Error("Choose a valid category.");
}

export async function createProduct(input: ProductInput): Promise<number> {
  validateProductInput(input);
  const db = await getDb();
  await resolveCategory(db, input.categoryId);
  const now = new Date().toISOString();
  const result = await db.query<{ id: number | bigint }>(
    `INSERT INTO products
      (name, description, price, icon, category_id, image_url, sku, stock, is_active, featured, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     RETURNING id`,
    [
      input.name.trim(),
      input.description.trim(),
      input.price,
      input.icon || "📦",
      input.categoryId,
      input.imageUrl || null,
      input.sku || null,
      input.stock ?? null,
      input.isActive ? 1 : 0,
      input.featured ? 1 : 0,
      now,
      now,
    ]
  );
  return Number(result.rows[0]?.id);
}

export async function updateProduct(id: number, input: ProductInput): Promise<boolean> {
  validateProductInput(input);
  const db = await getDb();
  const existing = await db.queryOne<{ image_url: string | null }>(
    "SELECT image_url FROM products WHERE id = ?",
    [id]
  );
  if (!existing) return false;
  await resolveCategory(db, input.categoryId);
  const result = await db.execute(
    `UPDATE products
     SET name = ?, description = ?, price = ?, icon = ?, category_id = ?,
         image_url = ?, sku = ?, stock = ?, is_active = ?, featured = ?, updated_at = ?
     WHERE id = ?`,
    [
      input.name.trim(),
      input.description.trim(),
      input.price,
      input.icon || "📦",
      input.categoryId,
      input.imageUrl || null,
      input.sku || null,
      input.stock ?? null,
      input.isActive ? 1 : 0,
      input.featured ? 1 : 0,
      new Date().toISOString(),
      id,
    ]
  );
  if (result > 0) await deleteManagedUpload(existing.image_url, input.imageUrl);
  return result > 0;
}

export async function deleteProduct(id: number): Promise<boolean> {
  const db = await getDb();
  const existing = await db.queryOne<{ image_url: string | null }>(
    "SELECT image_url FROM products WHERE id = ?",
    [id]
  );
  if (!existing) return false;
  const result = await db.execute("DELETE FROM products WHERE id = ?", [id]);
  if (result > 0) await deleteManagedUpload(existing.image_url);
  return result > 0;
}

export async function createCategory(
  name: string,
  icon: string,
  description = ""
): Promise<number> {
  const cleanName = name.trim();
  if (!cleanName) throw new Error("Category name is required.");
  const db = await getDb();
  const existing = await db.queryOne<{ id: number }>(
    "SELECT id FROM categories WHERE LOWER(name) = LOWER(?)",
    [cleanName]
  );
  if (existing) throw new Error("A category with that name already exists.");

  const next = await db.queryOne<{ next_order: number | bigint | string | null }>(
    "SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_order FROM categories"
  );
  const result = await db.query<{ id: number | bigint }>(
    `INSERT INTO categories (name, icon, description, sort_order)
     VALUES (?, ?, ?, ?)
     RETURNING id`,
    [cleanName, icon.trim() || "📁", description.trim(), Number(next?.next_order ?? 1)]
  );
  return Number(result.rows[0]?.id);
}

export async function updateCategory(
  id: number,
  name: string,
  icon: string,
  description = "",
  sortOrder?: number
): Promise<boolean> {
  const cleanName = name.trim();
  if (!cleanName) throw new Error("Category name is required.");
  const db = await getDb();
  const current = await db.queryOne<{ name: string }>(
    "SELECT name FROM categories WHERE id = ?",
    [id]
  );
  if (!current) return false;

  const duplicate = await db.queryOne<{ id: number }>(
    "SELECT id FROM categories WHERE LOWER(name) = LOWER(?) AND id <> ?",
    [cleanName, id]
  );
  if (duplicate) throw new Error("A category with that name already exists.");

  const result = await db.execute(
    `UPDATE categories
     SET name = ?, icon = ?, description = ?, sort_order = COALESCE(?, sort_order)
     WHERE id = ?`,
    [cleanName, icon.trim() || "📁", description.trim(), sortOrder ?? null, id]
  );
  return result > 0;
}

export async function moveCategory(id: number, direction: "up" | "down"): Promise<boolean> {
  const db = await getDb();
  return db.transaction(async (client) => {
    const current = await client.queryOne<{
      id: number | bigint;
      sort_order: number | bigint;
    }>("SELECT id, sort_order FROM categories WHERE id = ?", [id]);
    if (!current) return false;

    const neighbor =
      direction === "up"
        ? await client.queryOne<{ id: number | bigint; sort_order: number | bigint }>(
            "SELECT id, sort_order FROM categories WHERE sort_order < ? ORDER BY sort_order DESC LIMIT 1",
            [current.sort_order]
          )
        : await client.queryOne<{ id: number | bigint; sort_order: number | bigint }>(
            "SELECT id, sort_order FROM categories WHERE sort_order > ? ORDER BY sort_order ASC LIMIT 1",
            [current.sort_order]
          );
    if (!neighbor) return false;

    await client.execute("UPDATE categories SET sort_order = ? WHERE id = ?", [
      neighbor.sort_order,
      current.id,
    ]);
    await client.execute("UPDATE categories SET sort_order = ? WHERE id = ?", [
      current.sort_order,
      neighbor.id,
    ]);
    return true;
  });
}

export async function categoryProductCount(id: number): Promise<number> {
  const db = await getDb();
  const count = await db.queryOne<{ count: number | bigint | string }>(
    "SELECT COUNT(*) AS count FROM products WHERE category_id = ?",
    [id]
  );
  return Number(count?.count ?? 0);
}

export async function deleteCategory(id: number): Promise<boolean> {
  const db = await getDb();
  const category = await db.queryOne<{ name: string }>(
    "SELECT name FROM categories WHERE id = ?",
    [id]
  );
  if (!category) return false;

  const assigned = await categoryProductCount(id);
  if (assigned > 0) {
    throw new Error(
      `Reassign the ${assigned} product${assigned === 1 ? "" : "s"} in ${category.name} before deleting it.`
    );
  }

  const result = await db.execute("DELETE FROM categories WHERE id = ?", [id]);
  return result > 0;
}
