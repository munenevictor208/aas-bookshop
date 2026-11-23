import { existsSync, mkdirSync, unlinkSync, writeFileSync } from "node:fs";
import { join, resolve, sep } from "node:path";
import { del, put } from "@vercel/blob";

export const UPLOAD_DIRECTORY = join(process.cwd(), "public", "uploads");
export const BLOB_PATH_PREFIX = "aas-bookshop/";

const LEGACY_UPLOAD = /^\/uploads\/([A-Za-z0-9_-]+\.(?:jpg|jpeg|png|gif|webp|avif))$/i;
const BLOB_HOST = /^(?:[a-z0-9-]+\.)?public\.blob\.vercel-storage\.com$/i;

function isLocalUploadUrl(value: string): boolean {
  return LEGACY_UPLOAD.test(value);
}

function isBlobUploadUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      BLOB_HOST.test(url.hostname) &&
      url.pathname.startsWith(`/${BLOB_PATH_PREFIX}`)
    );
  } catch {
    return false;
  }
}

export function isLegacyUploadUrl(value: string | null | undefined): boolean {
  return typeof value === "string" && isLocalUploadUrl(value.trim());
}

export function isManagedUploadUrl(value: string | null | undefined): boolean {
  if (typeof value !== "string") return false;
  const clean = value.trim();
  return isLocalUploadUrl(clean) || isBlobUploadUrl(clean);
}

export function validateImageUrl(value: string | null | undefined): string | null {
  const clean = value?.trim() ?? "";
  if (!clean) return null;
  if (!isManagedUploadUrl(clean)) {
    throw new Error("Upload the image through the admin uploader.");
  }
  return clean;
}

export async function storeUpload(
  filename: string,
  bytes: Uint8Array,
  contentType: string
): Promise<string> {
  if (process.env.BLOB_READ_WRITE_TOKEN?.trim()) {
    const { url } = await put(`${BLOB_PATH_PREFIX}${filename}`, Buffer.from(bytes), {
      access: "public",
      contentType,
      addRandomSuffix: true,
    });
    return url;
  }

  if (process.env.VERCEL) {
    throw new Error("BLOB_READ_WRITE_TOKEN is missing.");
  }

  mkdirSync(UPLOAD_DIRECTORY, { recursive: true });
  const target = resolve(UPLOAD_DIRECTORY, filename);
  if (!target.startsWith(`${UPLOAD_DIRECTORY}${sep}`)) {
    throw new Error("Invalid upload filename.");
  }
  writeFileSync(target, bytes);
  return `/uploads/${filename}`;
}

export async function deleteManagedUpload(
  value: string | null | undefined,
  replacement?: string | null
): Promise<void> {
  if (!value || value === replacement || !isManagedUploadUrl(value)) return;
  const clean = value.trim();

  if (isBlobUploadUrl(clean)) {
    await del(clean);
    return;
  }

  const filename = clean.split("/").pop();
  if (!filename) return;
  const target = resolve(UPLOAD_DIRECTORY, filename);
  if (!target.startsWith(`${UPLOAD_DIRECTORY}${sep}`)) return;
  if (existsSync(target)) unlinkSync(target);
}
