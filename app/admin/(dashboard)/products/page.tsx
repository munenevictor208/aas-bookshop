import Link from "next/link";
import DeleteButton from "@/app/admin/components/DeleteButton";
import { deleteProductAction } from "@/app/admin/actions/catalog";
import ProductImage from "@/app/components/ProductImage";
import { formatPrice } from "@/app/data/products";
import { listCategories, listProducts } from "@/lib/catalog";

export const metadata = {
  title: "Manage Products",
};

type ProductsAdminProps = {
  searchParams: Promise<{
    search?: string | string[];
    category?: string | string[];
  }>;
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminProductsPage({ searchParams }: ProductsAdminProps) {
  const params = await searchParams;
  const search = first(params.search)?.trim();
  const category = first(params.category)?.trim();
  const categories = await listCategories();
  const products = await listProducts({ includeInactive: true, category, search });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-900 sm:text-3xl">Products</h1>
          <p className="mt-2 text-cocoa-700">
            Add, edit and remove items from your catalogue.
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="brand-button-gold px-5 py-2.5"
        >
          + Add product
        </Link>
      </div>

      <form action="/admin/products" className="flex max-w-2xl flex-wrap gap-2">
        <input
          type="search"
          name="search"
          defaultValue={search}
          placeholder="Search products or SKU…"
          aria-label="Search products"
          className="min-w-[200px] flex-1 rounded-lg border border-brand-200 bg-white px-4 py-2 focus:border-brand-600 focus:outline-none"
        />
        <select
          name="category"
          defaultValue={category ?? ""}
          aria-label="Filter by category"
          className="rounded-lg border border-brand-200 bg-white px-4 py-2 focus:border-brand-600 focus:outline-none"
        >
          <option value="">All categories</option>
          {categories.map((item) => (
            <option key={item.id} value={item.name}>
              {item.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="brand-button px-4 py-2"
        >
          Filter
        </button>
      </form>

      {(category || search) && (
        <p className="text-sm text-cocoa-700">
          Showing {products.length} product{products.length === 1 ? "" : "s"}
          {category ? ` in ${category}` : ""}
          {search ? ` for “${search}”` : ""}.{" "}
          <Link href="/admin/products" className="font-semibold text-brand-700 hover:underline">
            Clear filters
          </Link>
        </p>
      )}

      {products.length === 0 ? (
        <div className="rounded-2xl border border-cream-300 bg-white p-10 text-center text-cocoa-700">
          No products found.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-cream-300 bg-white shadow-sm">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-brand-100 bg-cream-100 text-xs uppercase tracking-wide text-cocoa-500">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-brand-50 last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-cream-100 text-2xl">
                        <ProductImage
                          name={product.name}
                          imageUrl={product.imageUrl}
                          icon={product.icon}
                        />
                      </div>
                      <div>
                        <p className="font-semibold text-brand-900">{product.name}</p>
                        <p className="text-xs text-cocoa-500">
                          {product.sku ? `SKU: ${product.sku}` : `ID: ${product.id}`}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td>{product.category}</td>
                  <td className="font-semibold">{formatPrice(product.price)}</td>
                  <td>
                    {product.stock === null || product.stock === undefined ? (
                      <span className="text-cocoa-500">Not tracked</span>
                    ) : (
                      <span
                        className={
                          product.stock === 0
                            ? "font-bold text-red-600"
                            : product.stock <= 5
                              ? "font-bold text-amber-600"
                              : "text-brand-800"
                        }
                      >
                        {product.stock}
                      </span>
                    )}
                  </td>
                  <td>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-bold ${
                        product.isActive === false
                          ? "bg-slate-100 text-cocoa-700"
                          : "bg-brand-100 text-brand-800"
                      }`}
                    >
                      {product.isActive === false ? "Hidden" : "Visible"}
                    </span>
                  </td>
                  <td>
                    <div className="flex justify-end gap-3 text-right">
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="font-semibold text-brand-700 hover:underline"
                      >
                        Edit
                      </Link>
                      <DeleteButton
                        action={deleteProductAction.bind(null, product.id)}
                        label={`Delete ${product.name}`}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
