"use server";

import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/auth";
import {
  createCategory,
  createProduct,
  deleteCategory,
  deleteProduct,
  moveCategory,
  updateCategory,
  updateProduct,
} from "@/lib/catalog";
import { getOrderByNumber, updateOrderStatus } from "@/lib/orders";
import type { ProductInput } from "@/lib/types";

export type AdminFormState = {
  message: string;
  ok: boolean;
};

function revalidateCatalogue() {
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/categories");
  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath("/admin/categories");
}

function optionalNumber(value: FormDataEntryValue | null): number | null {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const number = Number(text);
  return Number.isFinite(number) ? number : null;
}

export async function saveProduct(
  _previous: AdminFormState,
  formData: FormData
): Promise<AdminFormState> {
  await requireOwner();

  const id = optionalNumber(formData.get("id"));
  const categoryId = optionalNumber(formData.get("categoryId"));
  const input: ProductInput = {
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
    price: Number(formData.get("price")),
    categoryId,
    icon: String(formData.get("icon") ?? "📦"),
    imageUrl: String(formData.get("imageUrl") ?? "") || null,
    sku: String(formData.get("sku") ?? "") || null,
    stock: optionalNumber(formData.get("stock")),
    isActive: formData.get("isActive") === "on",
    featured: formData.get("featured") === "on",
  };

  try {
    if (id && id > 0) {
      await updateProduct(id, input);
    } else {
      await createProduct(input);
    }
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : "Could not save product.",
      ok: false,
    };
  }

  revalidateCatalogue();
  revalidatePath(`/products/${id ?? ""}`);
  return {
    message: id ? "Product updated successfully." : "Product added successfully.",
    ok: true,
  };
}

export async function deleteProductAction(id: number): Promise<void> {
  await requireOwner();
  await deleteProduct(id);
  revalidateCatalogue();
}

export async function saveCategory(
  _previous: AdminFormState,
  formData: FormData
): Promise<AdminFormState> {
  await requireOwner();
  const id = optionalNumber(formData.get("id"));
  const name = String(formData.get("name") ?? "");
  const icon = String(formData.get("icon") ?? "📁");
  const description = String(formData.get("description") ?? "");
  try {
    if (id && id > 0) {
      await updateCategory(id, name, icon, description);
    } else {
      await createCategory(name, icon, description);
    }
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : "Could not save category.",
      ok: false,
    };
  }
  revalidateCatalogue();
  return {
    message: id ? "Category updated successfully." : "Category added successfully.",
    ok: true,
  };
}

export async function reorderCategoryAction(
  id: number,
  direction: "up" | "down"
): Promise<void> {
  await requireOwner();
  await moveCategory(id, direction);
  revalidateCatalogue();
}

export async function deleteCategoryAction(id: number): Promise<void> {
  await requireOwner();
  await deleteCategory(id);
  revalidateCatalogue();
}

export async function setOrderStatus(formData: FormData): Promise<void> {
  await requireOwner();
  const orderNumber = String(formData.get("orderNumber") ?? "");
  const status = String(formData.get("status") ?? "");
  const before = await getOrderByNumber(orderNumber);
  if (await updateOrderStatus(orderNumber, status)) {
    revalidatePath("/admin");
    revalidatePath("/admin/orders");
    revalidatePath("/admin/customers");
    revalidatePath(`/admin/orders/${encodeURIComponent(orderNumber)}`);
    if (before) revalidatePath(`/admin/customers/${before.customer.id}`);
  }
}
