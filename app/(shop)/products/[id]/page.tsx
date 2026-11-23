import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AddToCartButton from "@/app/components/AddToCartButton";
import ProductImage from "@/app/components/ProductImage";
import { formatPrice } from "@/app/data/products";
import { getProductById, listProducts } from "@/lib/catalog";

type ProductPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductById(Number(id));
  return {
    title: product?.name ?? "Product not found",
    description: product?.description,
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = await getProductById(Number(id));
  if (!product || product.isActive === false) notFound();

  const related = (await listProducts({ category: product.category }))
    .filter((item) => item.id !== product.id)
    .slice(0, 4);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm font-semibold text-cocoa-500">
        <Link href="/" className="transition hover:text-gold-600">Home</Link>
        <span className="mx-2 text-gold-400">/</span>
        <Link href="/products" className="transition hover:text-gold-600">Products</Link>
        <span className="mx-2 text-gold-400">/</span>
        <span className="text-brand-800">{product.name}</span>
      </nav>

      <div className="brand-card grid gap-8 overflow-hidden p-5 sm:p-8 md:grid-cols-2">
        <div className="relative flex h-72 items-center justify-center overflow-hidden rounded-2xl border border-cream-300 bg-cream-100 text-8xl sm:h-96">
          <span className="absolute bottom-6 left-6 right-6 border-b-2 border-cocoa-300/40" />
          <ProductImage
            name={product.name}
            imageUrl={product.imageUrl}
            icon={product.icon}
          />
        </div>

        <div className="flex flex-col">
          <p className="brand-eyebrow">{product.category}</p>
          <h1 className="mt-3 font-serif text-3xl font-bold text-brand-900 sm:text-4xl">
            {product.name}
          </h1>
          {product.sku && (
            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-cocoa-500">
              SKU: {product.sku}
            </p>
          )}
          <p className="mt-5 leading-8 text-cocoa-700">
            {product.description || "No description has been added yet."}
          </p>
          <p className="mt-6 inline-flex w-fit rounded-xl border border-gold-400 bg-gold-100 px-5 py-2 font-serif text-3xl font-bold text-brand-900">
            {formatPrice(product.price)}
          </p>
          {product.stock !== null && product.stock !== undefined && (
            <p
              className={`mt-3 text-sm font-bold ${
                product.stock === 0 ? "text-red-600" : "text-brand-700"
              }`}
            >
              {product.stock === 0
                ? "Currently out of stock"
                : `${product.stock} in stock`}
            </p>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <AddToCartButton
              productId={product.id}
              disabled={product.stock === 0}
              className="brand-button-gold disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
            />
            <Link href="/cart" className="brand-button-outline">
              View cart
            </Link>
          </div>
          <p className="mt-6 border-t border-cream-300 pt-5 text-sm leading-7 text-cocoa-700">
            Pay on delivery. Order from this page and we will confirm the price
            when your order is saved.
          </p>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-12">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-serif text-2xl font-bold text-brand-900">
              More in {product.category}
            </h2>
            <Link
              href={{ pathname: "/products", query: { category: product.category } }}
              className="text-sm font-bold text-brand-800 underline decoration-gold-400 decoration-2 underline-offset-4 hover:text-gold-600"
            >
              View shelf →
            </Link>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {related.map((item) => (
              <Link
                key={item.id}
                href={`/products/${item.id}`}
                className="brand-card p-4 text-center transition hover:-translate-y-1 hover:border-gold-400 hover:shadow-md"
              >
                <div className="relative mx-auto mb-3 flex h-28 items-center justify-center overflow-hidden rounded-xl border border-cream-300 bg-cream-100 text-5xl">
                  <span className="absolute bottom-2 left-3 right-3 border-b-2 border-cocoa-300/40" />
                  <ProductImage
                    name={item.name}
                    imageUrl={item.imageUrl}
                    icon={item.icon}
                  />
                </div>
                <p className="line-clamp-1 font-serif text-sm font-bold text-brand-900">
                  {item.name}
                </p>
                <p className="mt-1 text-sm font-bold text-gold-600">
                  {formatPrice(item.price)}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
