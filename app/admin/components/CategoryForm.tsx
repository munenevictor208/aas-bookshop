"use client";

import { useActionState } from "react";
import {
  saveCategory,
  type AdminFormState,
} from "@/app/admin/actions/catalog";
import type { Category } from "@/lib/types";

const initialState: AdminFormState = { message: "", ok: false };

type CategoryFormProps = {
  category?: Category;
};

export default function CategoryForm({ category }: CategoryFormProps) {
  const [state, formAction, pending] = useActionState(saveCategory, initialState);

  return (
    <form action={formAction} className="space-y-3">
      {category && (
        <>
          <input type="hidden" name="id" value={category.id} />
          <input type="hidden" name="sortOrder" value={category.sortOrder} />
        </>
      )}
      <div>
        <label className="sr-only" htmlFor={`category-name-${category?.id ?? "new"}`}>
          Category name
        </label>
        <input
          id={`category-name-${category?.id ?? "new"}`}
          name="name"
          required
          maxLength={60}
          defaultValue={category?.name}
          placeholder="Category name"
          className="brand-input"
        />
      </div>
      <div>
        <label className="sr-only" htmlFor={`category-icon-${category?.id ?? "new"}`}>
          Category icon
        </label>
        <input
          id={`category-icon-${category?.id ?? "new"}`}
          name="icon"
          maxLength={8}
          defaultValue={category?.icon}
          placeholder="Icon (e.g. 📘)"
          className="brand-input"
        />
      </div>
      <div>
        <label className="sr-only" htmlFor={`category-description-${category?.id ?? "new"}`}>
          Category description
        </label>
        <textarea
          id={`category-description-${category?.id ?? "new"}`}
          name="description"
          rows={2}
          maxLength={240}
          defaultValue={category?.description}
          placeholder="Short description shown to customers"
          className="brand-input"
        />
      </div>
      {state.message && (
        <p
          role="status"
          className={`text-sm ${
            state.ok ? "text-brand-700" : "text-red-600"
          }`}
        >
          {state.message}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="brand-button w-full px-4 py-2.5 disabled:opacity-60"
      >
        {pending
          ? "Saving…"
          : category
            ? "Save changes"
            : "Add category"}
      </button>
    </form>
  );
}
