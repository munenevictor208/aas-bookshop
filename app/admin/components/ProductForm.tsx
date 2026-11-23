"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useState, type ChangeEvent } from "react";
import {
  saveProduct,
  type AdminFormState,
} from "@/app/admin/actions/catalog";
import type { Category, Product } from "@/lib/types";

const initialState: AdminFormState = { message: "", ok: false };

const inputClass = "brand-input";
const labelClass = "block text-sm font-semibold text-brand-900";

export default function ProductForm({
  product,
  categories,
}: {
  product?: Product;
  categories: Category[];
}) {
  const [state, formAction, pending] = useActionState(saveProduct, initialState);
  const [imageUrl, setImageUrl] = useState(product?.imageUrl ?? "");
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");
    const body = new FormData();
    body.append("image", file);
    try {
      const response = await fetch("/api/admin/uploads", {
        method: "POST",
        body,
      });
      const payload = (await response.json()) as { url?: string; message?: string };
      if (!response.ok || !payload.url) {
        setUploadError(payload.message ?? "Upload failed.");
      } else {
        setImageUrl(payload.url);
      }
    } catch {
      setUploadError("Upload failed. Check your connection and try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form action={formAction} className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <input type="hidden" name="id" value={product?.id ?? ""} />
      <input type="hidden" name="imageUrl" value={imageUrl} />

      <div className="space-y-5 brand-card p-5 sm:p-6">
        <label className="block">
          <span className={labelClass}>Product name</span>
          <input
            name="name"
            required
            maxLength={150}
            defaultValue={product?.name}
            className={`mt-1 ${inputClass}`}
          />
        </label>

        <label className="block">
          <span className={labelClass}>Description</span>
          <textarea
            name="description"
            rows={4}
            maxLength={1000}
            defaultValue={product?.description}
            className={`mt-1 ${inputClass}`}
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={labelClass}>Price (KSh)</span>
            <input
              name="price"
              type="number"
              min="0"
              step="0.01"
              required
              defaultValue={product?.price ?? ""}
              className={`mt-1 ${inputClass}`}
            />
          </label>

          <label className="block">
            <span className={labelClass}>Category</span>
            <select
              name="categoryId"
              defaultValue={product?.categoryId ?? ""}
              className={`mt-1 ${inputClass}`}
            >
              <option value="">Uncategorised</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-cocoa-500">
              Need a new shelf?{" "}
              <Link href="/admin/categories" className="font-semibold text-brand-700 hover:underline">
                Manage categories
              </Link>
              .
            </p>
          </label>

          <label className="block">
            <span className={labelClass}>Icon (fallback)</span>
            <input
              name="icon"
              maxLength={8}
              defaultValue={product?.icon ?? "📦"}
              className={`mt-1 ${inputClass}`}
            />
          </label>

          <label className="block">
            <span className={labelClass}>SKU (optional)</span>
            <input
              name="sku"
              maxLength={60}
              defaultValue={product?.sku ?? ""}
              className={`mt-1 ${inputClass}`}
            />
          </label>

          <label className="block">
            <span className={labelClass}>Stock (blank = not tracked)</span>
            <input
              name="stock"
              type="number"
              min="0"
              step="1"
              defaultValue={product?.stock ?? ""}
              className={`mt-1 ${inputClass}`}
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm font-medium text-brand-900">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={product?.isActive !== false}
              className="h-4 w-4 accent-brand-700"
            />
            Visible in shop
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-brand-900">
            <input
              type="checkbox"
              name="featured"
              defaultChecked={product?.featured === true}
              className="h-4 w-4 accent-brand-700"
            />
            Featured product
          </label>
        </div>

        {state.message && (
          <p
            role="status"
            className={`rounded-lg px-4 py-3 text-sm ${
              state.ok
                ? "bg-cream-100 text-brand-800"
                : "bg-red-50 text-red-700"
            }`}
          >
            {state.message}
          </p>
        )}
      </div>

      <aside className="h-fit space-y-5 brand-card p-5 sm:p-6">
        <div>
          <h2 className="text-lg font-bold text-brand-900">Product image</h2>
          <p className="mt-1 text-sm text-cocoa-500">
            JPG, PNG, WebP, GIF or AVIF, up to 5 MB.
          </p>
        </div>

        <div className="flex h-48 items-center justify-center overflow-hidden rounded-xl bg-cream-100 text-6xl">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt="Product preview"
              width={400}
              height={300}
              unoptimized
              className="h-full w-full object-cover"
            />
          ) : (
            <span aria-hidden>{product?.icon ?? "📦"}</span>
          )}
        </div>

        <label className="block">
          <span className={labelClass}>Upload image</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
            onChange={handleUpload}
            className="mt-2 w-full text-sm text-cocoa-700 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-100 file:px-4 file:py-2 file:font-semibold file:text-brand-800"
          />
        </label>

        {uploading && <p className="text-sm text-cocoa-500">Uploading…</p>}
        {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}
        {imageUrl && (
          <button
            type="button"
            onClick={() => setImageUrl("")}
            className="text-sm font-semibold text-red-600 hover:underline"
          >
            Remove image
          </button>
        )}

        <div className="flex flex-col gap-3 border-t border-brand-100 pt-5">
          <button
            type="submit"
            disabled={pending || uploading}
            className="brand-button-gold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Saving…" : product ? "Save changes" : "Add product"}
          </button>
          <Link
            href="/admin/products"
            className="brand-button-outline"
          >
            Back to products
          </Link>
        </div>
      </aside>
    </form>
  );
}
