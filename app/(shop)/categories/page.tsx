import Link from "next/link";
import { listCategories } from "@/lib/catalog";

type CategoriesProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function CategoriesPage({ searchParams }: CategoriesProps) {
  const params = await searchParams;
  const rawCategory = params.category;
  const selected = Array.isArray(rawCategory) ? rawCategory[0] : rawCategory;
  const categories = await listCategories();

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="relative overflow-hidden rounded-[2rem] border border-cream-300 bg-cream-100 px-6 py-10 text-center sm:px-10">
        <div className="absolute -left-10 -bottom-12 h-44 w-44 rounded-full bg-gold-300/30 blur-2xl" />
        <div className="relative">
          <p className="brand-eyebrow">Browse the shop</p>
          <h1 className="mt-3 font-serif text-3xl font-bold text-brand-900 sm:text-4xl">
            Shop By Category
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-cocoa-700 sm:text-base">
            Find exactly what you need for school, study, reading or art — each
            section carefully stocked for everyday use.
          </p>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((category, index) => (
          <Link
            key={category.id}
            href={{ pathname: "/products", query: { category: category.name } }}
            className={`brand-card group relative overflow-hidden p-8 text-center transition hover:-translate-y-1 hover:border-gold-400 hover:shadow-lg ${
              selected === category.name ? "border-gold-500 ring-2 ring-gold-300" : ""
            }`}
          >
            <span className="absolute right-4 top-3 font-serif text-4xl text-cream-300">
              0{index + 1}
            </span>
            <div className="mb-4 text-5xl transition group-hover:scale-110">
              {category.icon}
            </div>
            <h2 className="font-serif text-xl font-bold text-brand-900">
              {category.name}
            </h2>
            <p className="mt-2 text-xs leading-6 text-cocoa-700">
              {category.description || "Explore this shelf."}
            </p>
            <p className="mt-4 inline-block rounded-full bg-gold-100 px-3 py-1 text-xs font-bold text-gold-600">
              {category.productCount} products
            </p>
            <p className="mt-3 text-xs font-bold text-brand-800">
              Browse shelf <span aria-hidden>→</span>
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}
