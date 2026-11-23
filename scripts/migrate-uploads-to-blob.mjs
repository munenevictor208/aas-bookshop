import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { put } from "@vercel/blob";
import pg from "pg";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

if (!process.env.BLOB_READ_WRITE_TOKEN?.trim()) {
  throw new Error("BLOB_READ_WRITE_TOKEN is missing from .env.local.");
}
const connectionString = process.env.DIRECT_URL?.trim() || process.env.DATABASE_URL?.trim();
if (!connectionString) throw new Error("DIRECT_URL or DATABASE_URL is missing.");

const client = new pg.Client({ connectionString });
await client.connect();

const result = await client.query(
  "SELECT id, image_url FROM products WHERE image_url LIKE '/uploads/%' ORDER BY id"
);
let uploaded = 0;
let skipped = 0;

for (const product of result.rows) {
  const filename = String(product.image_url).split("/").pop();
  if (!filename || !/^[A-Za-z0-9_-]+\.(jpg|jpeg|png|gif|webp|avif)$/i.test(filename)) {
    console.log(`Skipping product ${product.id}: invalid local filename.`);
    skipped += 1;
    continue;
  }
  const localPath = join(process.cwd(), "public", "uploads", filename);
  if (!existsSync(localPath)) {
    console.log(`Skipping product ${product.id}: ${filename} is missing locally.`);
    skipped += 1;
    continue;
  }

  const bytes = readFileSync(localPath);
  const extension = filename.split(".").pop()?.toLowerCase();
  const types = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    avif: "image/avif",
  };
  const { url } = await put(`aas-bookshop/${filename}`, bytes, {
    access: "public",
    contentType: types[extension] ?? "application/octet-stream",
    addRandomSuffix: true,
  });
  await client.query("UPDATE products SET image_url = $1 WHERE id = $2", [url, product.id]);
  uploaded += 1;
  console.log(`Product ${product.id}: ${filename} uploaded to Blob.`);
}

console.log(`Image migration complete: ${uploaded} uploaded, ${skipped} skipped.`);
await client.end();
