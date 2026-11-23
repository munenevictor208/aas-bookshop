import Link from "next/link";
import DeleteButton from "@/app/admin/components/DeleteButton";
import CategoryForm from "@/app/admin/components/CategoryForm";
import {
  deleteCategoryAction,
  reorderCategoryAction,
} from "@/app/admin/actions/catalog";
import { listCategories } from "@/lib/catalog";

export const metadata = {
  title: "Manage Categories",
};

export default async function AdminCategoriesPage() {
  const categories = await listCategories();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-900 sm:text-3xl">
          Categories
        </h1>
        <p className="mt-2 text-cocoa-700">
          Create, rename and reorder the shelves customers browse. A category
          can only be deleted after its products are reassigned.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="overflow-x-auto rounded-2xl border border-cream-300 bg-white shadow-sm">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-brand-100 bg-cream-100 text-xs uppercase tracking-wide text-cocoa-500">
              <tr>
                <th className="px-4 py-3">Category</th>
                <th>Products</th>
                <th>Position</th>
                <th>Edit</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category, index) => (
                <tr key={category.id} className="border-b border-brand-50 align-top last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-brand-900">
                      <span className="mr-2 text-xl">{category.icon}</span>
                      {category.name}
                    </p>
                    <p className="mt-1 max-w-[240px] text-xs leading-5 text-cocoa-700">
                      {category.description || "No description yet."}
                    </p>
                  </td>
                  <td className="py-3">{category.productCount}</td>
                  <td className="py-3">
                    <div className="flex gap-1">
                      <form action={reorderCategoryAction.bind(null, category.id, "up")}>
                        <button
                          type="submit"
                          disabled={index === 0}
                          aria-label={`Move ${category.name} up`}
                          className="rounded border border-brand-200 px-2 py-1 text-xs text-brand-800 disabled:opacity-30"
                        >
                          ↑
                        </button>
                      </form>
                      <form action={reorderCategoryAction.bind(null, category.id, "down")}>
                        <button
                          type="submit"
                          disabled={index === categories.length - 1}
                          aria-label={`Move ${category.name} down`}
                          className="rounded border border-brand-200 px-2 py-1 text-xs text-brand-800 disabled:opacity-30"
                        >
                          ↓
                        </button>
                      </form>
                    </div>
                  </td>
                  <td className="min-w-[240px] py-3 pr-4">
                    <CategoryForm category={category} />
                  </td>
                  <td className="py-3 pr-4 text-right">
                    {(category.productCount ?? 0) > 0 ? (
                      <div className="space-y-1 text-xs">
                        <Link
                          href={`/admin/products?category=${encodeURIComponent(category.name)}`}
                          className="font-semibold text-brand-700 hover:underline"
                        >
                          Reassign {category.productCount}
                        </Link>
                        <p className="text-cocoa-500">Delete after reassignment</p>
                      </div>
                    ) : (
                      <DeleteButton
                        action={deleteCategoryAction.bind(null, category.id)}
                        label={`Delete category ${category.name}`}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="space-y-4">
          <div className="brand-card p-5">
            <h2 className="mb-4 text-lg font-bold text-brand-900">New category</h2>
            <CategoryForm />
          </div>
          <div className="rounded-2xl border border-gold-300 bg-gold-100/60 p-5 text-sm leading-6 text-cocoa-700">
            <p className="font-bold text-brand-900">Before deleting</p>
            <p className="mt-1">
              Move products to another shelf using <strong>Reassign</strong>, then
              the delete option will appear.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
