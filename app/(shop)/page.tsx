import Link from "next/link";
import AddToCartButton from "@/app/components/AddToCartButton";
import ProductImage from "@/app/components/ProductImage";
import { formatPrice } from "@/app/data/products";
import { listCategories, listProducts } from "@/lib/catalog";

const departments = [
  { label: "Books", icon: "📚", href: "/products?category=Books" },
  { label: "Textbooks", icon: "📖", href: "/products" },
  { label: "Revision Books", icon: "📝", href: "/products" },
  { label: "Reading Books", icon: "📕", href: "/products" },
  { label: "Stationery", icon: "🖊️", href: "/products?category=Stationery" },
  { label: "Art Supplies", icon: "🎨", href: "/products?category=Stationery" },
];

const spines = [
  { height: 128, color: "#183d2b", label: "READ" },
  { height: 158, color: "#d6a62f", label: "LEARN" },
  { height: 112, color: "#8a5c3a", label: "WRITE" },
  { height: 176, color: "#275d40", label: "EXPLORE" },
  { height: 138, color: "#f5edd9", label: "CREATE" },
];

export default async function Home() {
  const products = await listProducts();
  const categories = await listCategories();

  return (
    <main>
      <section className="relative overflow-hidden border-b border-cream-300 bg-cream-100">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-gold-300/25 blur-3xl" />
        <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-brand-800/10 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-20">
          <div>
            <p className="brand-eyebrow">Books · Textbooks · Stationery · Art</p>
            <h1 className="mt-4 font-serif text-4xl font-bold leading-[1.12] tracking-tight text-brand-900 sm:text-5xl lg:text-6xl">
              Your neighbourhood bookshop,{" "}
              <span className="text-gold-600">now online.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-cocoa-700 sm:text-lg">
              From first readers to final exams and everyday creativity. Discover
              textbooks, revision books, reading books, notebooks, pens and art
              supplies — chosen with care and ready when you are.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/products" className="brand-button-gold">
                Shop the shelves <span aria-hidden>→</span>
              </Link>
              <Link href="/categories" className="brand-button-outline">
                Browse categories
              </Link>
            </div>
            <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-bold uppercase tracking-wide text-cocoa-500">
              <span>✓ School-ready essentials</span>
              <span>✓ Pay on delivery</span>
              <span>✓ Hand-picked shelves</span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -right-4 -top-4 h-28 w-28 rounded-full bg-gold-300/60 blur-2xl" />
            <div className="relative rounded-[2rem] border-4 border-gold-400 bg-brand-900 p-6 shadow-xl sm:p-8">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold-300">
                  On our shelves
                </p>
                <span className="rounded-full bg-gold-400 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-brand-950">
                  New term
                </span>
              </div>

              <div className="mt-8 flex h-52 items-end justify-center gap-2 sm:gap-3">
                {spines.map((spine) => (
                  <div
                    key={spine.label}
                    className="relative flex w-10 items-center justify-center rounded-t-md border border-black/10 shadow-md sm:w-12"
                    style={{ height: spine.height, backgroundColor: spine.color }}
                  >
                    <span
                      className="text-[9px] font-bold tracking-[0.2em] text-cream-50/90 sm:text-[10px]"
                      style={{
                        writingMode: "vertical-rl",
                        color: spine.color === "#f5edd9" ? "#183d2b" : undefined,
                      }}
                    >
                      {spine.label}
                    </span>
                    <span className="absolute bottom-3 left-1 right-1 h-px bg-gold-300/70" />
                    <span className="absolute bottom-6 left-1 right-1 h-px bg-gold-300/50" />
                  </div>
                ))}
              </div>
              <div className="mt-5 border-t border-gold-400/30 pt-5">
                <p className="font-serif text-2xl text-cream-50 sm:text-3xl">
                  Read · Learn · Create
                </p>
                <p className="mt-1 text-xs text-gold-200 sm:text-sm">
                  Books and supplies for every term and every reader.
                </p>
              </div>
            </div>
            <div className="absolute -bottom-5 -left-3 hidden rounded-2xl border border-cream-300 bg-white p-4 shadow-lg sm:block">
              <p className="text-[11px] font-bold uppercase tracking-wide text-gold-600">
                Favourite shelf
              </p>
              <p className="mt-1 font-serif text-lg text-brand-900">
                Revision &amp; reading
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="text-center">
          <p className="brand-eyebrow">Explore the shelves</p>
          <h2 className="mt-3 font-serif text-2xl font-bold text-brand-900 sm:text-3xl">
            What are you looking for?
          </h2>
          <p className="mt-2 text-sm text-cocoa-700 sm:text-base">
            The little things and the big essentials, all in one friendly shop.
          </p>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-6">
          {departments.map((department) => (
            <Link
              key={department.label}
              href={department.href}
              className="brand-card group flex flex-col items-center px-3 py-5 text-center transition hover:-translate-y-1 hover:border-gold-400 hover:shadow-md"
            >
              <span className="text-3xl transition group-hover:scale-110 sm:text-4xl">
                {department.icon}
              </span>
              <span className="mt-3 text-sm font-bold text-brand-900">
                {department.label}
              </span>
              <span className="mt-2 h-0.5 w-8 bg-gold-400 transition group-hover:w-12" />
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-cream-300 bg-cream-100 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="brand-eyebrow">Find your section</p>
              <h2 className="mt-3 font-serif text-2xl font-bold text-brand-900 sm:text-3xl">
                Shop By Category
              </h2>
              <p className="mt-2 text-sm text-cocoa-700 sm:text-base">
                Straight to what you need, without the browsing fatigue.
              </p>
            </div>
            <Link
              href="/categories"
              className="text-sm font-bold text-brand-800 underline decoration-gold-400 decoration-2 underline-offset-4 hover:text-gold-600"
            >
              View all categories →
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
            {categories.map((category, index) => (
              <Link
                key={category.id}
                href={{ pathname: "/products", query: { category: category.name } }}
                className="brand-card group relative overflow-hidden p-6 text-center transition hover:-translate-y-1 hover:border-gold-400 hover:shadow-lg sm:p-7"
              >
                <span className="absolute right-4 top-3 font-serif text-4xl text-cream-300">
                  0{index + 1}
                </span>
                <div className="mb-3 text-4xl transition group-hover:scale-110 sm:text-5xl">
                  {category.icon}
                </div>
                <h3 className="font-serif text-lg font-bold text-brand-900">
                  {category.name}
                </h3>
                <p className="mt-2 line-clamp-2 text-xs leading-5 text-cocoa-700">
                  {category.description || "Explore this shelf."}
                </p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-cocoa-500">
                  {category.productCount} products
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="brand-eyebrow">From the shelves</p>
            <h2 className="mt-3 font-serif text-2xl font-bold text-brand-900 sm:text-3xl">
              Favourite Finds
            </h2>
            <p className="mt-2 text-sm text-cocoa-700 sm:text-base">
              Everyday essentials for learners, readers and creators.
            </p>
          </div>
          <Link
            href="/products"
            className="text-sm font-bold text-brand-800 underline decoration-gold-400 decoration-2 underline-offset-4 hover:text-gold-600"
          >
            See every product →
          </Link>
        </div>

        {products.length === 0 ? (
          <p className="brand-card mt-8 p-10 text-center text-cocoa-700">
            No products are on sale yet.
          </p>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {products.slice(0, 8).map((product) => (
              <article
                key={product.id}
                className="brand-card group relative flex flex-col overflow-hidden transition hover:-translate-y-1 hover:border-gold-400 hover:shadow-lg"
              >
                <span className="absolute inset-x-0 top-0 h-1 bg-gold-400" />
                <Link
                  href={`/products/${product.id}`}
                  className="relative mt-1 flex h-36 items-center justify-center overflow-hidden bg-cream-100 text-5xl sm:h-40 sm:text-6xl"
                >
                  <span className="absolute bottom-3 left-3 right-3 border-b-2 border-cocoa-300/40" />
                  <ProductImage
                    name={product.name}
                    imageUrl={product.imageUrl}
                    icon={product.icon}
                  />
                </Link>
                <div className="flex flex-1 flex-col p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-cocoa-500">
                      {product.category}
                    </p>
                    {product.featured && (
                      <span className="rounded-full bg-gold-100 px-2 py-0.5 text-[10px] font-bold text-gold-600">
                        Featured
                      </span>
                    )}
                  </div>
                  <h3 className="mt-1 line-clamp-2 font-serif text-base font-bold text-brand-900 sm:text-lg">
                    {product.name}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-xs text-cocoa-700 sm:text-sm">
                    {product.description}
                  </p>
                  <p className="mt-3 inline-flex w-fit rounded-lg bg-gold-100 px-3 py-1 font-serif text-lg font-bold text-brand-900">
                    {formatPrice(product.price)}
                  </p>
                  <div className="mt-auto space-y-2 pt-4">
                    <Link
                      href={`/products/${product.id}`}
                      className="brand-button-outline w-full"
                    >
                      View details
                    </Link>
                    <AddToCartButton
                      productId={product.id}
                      disabled={product.stock === 0}
                      className="brand-button-gold w-full disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="border-y border-cream-300 bg-cream-100 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center">
            <p className="brand-eyebrow">Why shop with us</p>
            <h2 className="mt-3 font-serif text-2xl font-bold text-brand-900 sm:text-3xl">
              A proper bookshop feel, with online convenience
            </h2>
          </div>
          <div className="mt-9 grid gap-5 md:grid-cols-3">
            {[
              {
                icon: "📖",
                title: "Curated shelves",
                text: "Books, revision guides, readers and supplies chosen with learners in mind.",
              },
              {
                icon: "✏️",
                title: "School & art ready",
                text: "Notebooks, pens, geometry sets and art supplies for every term.",
              },
              {
                icon: "🚚",
                title: "Simple pay on delivery",
                text: "Browse, order and choose how you would like to pay when it arrives.",
              },
            ].map((item) => (
              <div key={item.title} className="brand-card p-6 text-center sm:p-7">
                <span className="text-4xl">{item.icon}</span>
                <h3 className="mt-4 font-serif text-xl font-bold text-brand-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-7 text-cocoa-700">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="relative overflow-hidden rounded-[2rem] border-4 border-gold-400 bg-brand-900 px-6 py-12 text-center text-cream-50 sm:px-12">
          <div className="absolute -right-10 -top-16 h-56 w-56 rounded-full bg-gold-400/10" />
          <div className="relative">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold-300">
              Ready when you are
            </p>
            <h2 className="mt-3 font-serif text-2xl font-bold sm:text-4xl">
              Let&apos;s fill your bookshelf.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-cream-100/80 sm:text-base">
              Add your favourites to the cart, share your delivery details and we
              will take it from there. No online payment needed.
            </p>
            <Link href="/cart" className="brand-button-gold mt-7">
              Go to cart <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
