import Link from "next/link";
import AddToCartButton from "@/app/components/AddToCartButton";
import ProductImage from "@/app/components/ProductImage";
import { formatPrice } from "@/app/data/products";
import { listCategories, listProducts } from "@/lib/catalog";

type ProductsProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function Products({ searchParams }: ProductsProps) {
  const params = await searchParams;
  const category = firstValue(params.category);
  const search = firstValue(params.search)?.trim();
  const categories = await listCategories();
  const selectedCategory = categories.find((item) => item.name === category);
  const visibleProducts = await listProducts({ category, search });

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="relative overflow-hidden rounded-[2rem] border border-cream-300 bg-cream-100 px-6 py-10 text-center sm:px-10">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gold-300/30 blur-2xl" />
        <div className="relative">
          <p className="brand-eyebrow">Our catalogue</p>
          <h1 className="mt-3 font-serif text-3xl font-bold text-brand-900 sm:text-4xl">
            The Shelves at A&amp;A&apos;s
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-cocoa-700 sm:text-base">
            Books, textbooks, reading books, stationery and art supplies — browse
            by section or search for exactly what you need.
          </p>
        </div>
      </div>

      <form action="/products" className="mx-auto mt-8 flex max-w-xl gap-2">
        <input
          type="search"
          name="search"
          defaultValue={search}
          placeholder="Search books, pens, bags…"
          aria-label="Search products"
          className="brand-input min-w-0 flex-1"
        />
        {category && <input type="hidden" name="category" value={category} />}
        <button type="submit" className="brand-button-gold shrink-0 px-5">
          Search
        </button>
      </form>

      <div className="mt-6 flex flex-wrap justify-center gap-2 sm:gap-3">
        <Link
          href={search ? `/products?search=${encodeURIComponent(search)}` : "/products"}
          className={`rounded-full px-4 py-2 text-sm font-bold transition ${
            !category
              ? "bg-brand-800 text-cream-50 shadow"
              : "border border-cream-300 bg-white text-brand-800 hover:border-gold-400 hover:text-gold-600"
          }`}
        >
          All shelves
        </Link>
        {categories.map((item) => (
          <Link
            key={item.id}
            href={{
              pathname: "/products",
              query: { category: item.name, ...(search ? { search } : {}) },
            }}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${
              category === item.name
                ? "bg-brand-800 text-cream-50 shadow"
                : "border border-cream-300 bg-white text-brand-800 hover:border-gold-400 hover:text-gold-600"
            }`}
          >
            {item.name}
          </Link>
        ))}
      </div>

      {(category || search) && (
        <div className="mt-5 text-center">
          <p className="text-sm text-cocoa-700">
            Showing {visibleProducts.length} product
            {visibleProducts.length === 1 ? "" : "s"}
            {category ? ` in ${category}` : ""}
            {search ? ` for “${search}”` : ""}
          </p>
          {selectedCategory?.description && (
            <p className="mx-auto mt-2 max-w-2xl text-sm text-cocoa-700">
              {selectedCategory.description}
            </p>
          )}
        </div>
      )}

      {visibleProducts.length === 0 ? (
        <div className="brand-card mx-auto mt-10 max-w-md p-10 text-center">
          <div className="mb-3 text-5xl">🔎</div>
          <p className="font-serif text-lg font-bold text-brand-900">
            No products found.
          </p>
          <p className="mt-1 text-sm text-cocoa-700">
            Try another shelf or a different search term.
          </p>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {visibleProducts.map((product) => (
            <article
              key={product.id}
              className="brand-card group flex flex-col overflow-hidden transition hover:-translate-y-1 hover:border-gold-400 hover:shadow-lg"
            >
              <Link
                href={`/products/${product.id}`}
                className="relative flex h-36 items-center justify-center overflow-hidden bg-cream-100 text-6xl sm:h-40"
              >
                <span className="absolute bottom-3 left-3 right-3 border-b-2 border-cocoa-300/40" />
                <ProductImage
                  name={product.name}
                  imageUrl={product.imageUrl}
                  icon={product.icon}
                />
              </Link>
              <div className="flex flex-1 flex-col p-4 sm:p-5">
                <p className="text-[11px] font-bold uppercase tracking-wide text-cocoa-500">
                  {product.category}
                </p>
                <h2 className="mt-1 font-serif text-base font-bold text-brand-900 sm:text-lg">
                  {product.name}
                </h2>
                <p className="mt-1 flex-1 text-xs leading-6 text-cocoa-700 sm:text-sm">
                  {product.description}
                </p>
                {product.stock !== null && product.stock !== undefined && (
                  <p
                    className={`mt-2 text-xs font-bold ${
                      product.stock === 0 ? "text-red-600" : "text-brand-700"
                    }`}
                  >
                    {product.stock === 0
                      ? "Out of stock"
                      : product.stock <= 5
                        ? `Only ${product.stock} left`
                        : "In stock"}
                  </p>
                )}
                <p className="mt-3 inline-flex w-fit rounded-lg bg-gold-100 px-3 py-1 font-serif text-lg font-bold text-brand-900">
                  {formatPrice(product.price)}
                </p>
                <AddToCartButton
                  productId={product.id}
                  disabled={product.stock === 0}
                  className="brand-button-gold mt-4 w-full disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
                />
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
