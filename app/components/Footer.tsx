import Link from "next/link";
import BrandLogo from "@/app/components/BrandLogo";

const shelves = [
  { label: "Books", href: "/products?category=Books" },
  { label: "Stationery", href: "/products?category=Stationery" },
  { label: "School Supplies", href: "/products?category=School%20Supplies" },
  { label: "School Bags", href: "/products?category=School%20Bags" },
];

export default function Footer() {
  return (
    <footer className="mt-20 border-t-4 border-gold-500 bg-brand-900 text-cream-100">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <BrandLogo inverse />
            <p className="mt-5 max-w-xs text-sm leading-7 text-cream-100/75">
              A welcoming bookshop for learners, readers and creators. Textbooks,
              revision books, reading books, stationery and art supplies — all in
              one place.
            </p>
            <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-gold-500/50 px-3 py-1 text-xs font-semibold text-gold-300">
              <span aria-hidden>📍</span> Your neighbourhood bookshop, online
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-gold-300">Our Shelves</h2>
            <ul className="mt-4 space-y-2.5 text-sm text-cream-100/75">
              {shelves.map((shelf) => (
                <li key={shelf.label}>
                  <Link className="transition hover:text-gold-300" href={shelf.href}>
                    {shelf.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-bold text-gold-300">Your Account</h2>
            <ul className="mt-4 space-y-2.5 text-sm text-cream-100/75">
              <li><Link className="transition hover:text-gold-300" href="/cart">Shopping cart</Link></li>
              <li><Link className="transition hover:text-gold-300" href="/checkout">Checkout</Link></li>
              <li><Link className="transition hover:text-gold-300" href="/orders">My orders</Link></li>
              <li><Link className="transition hover:text-gold-300" href="/login">Sign in</Link></li>
              <li><Link className="transition hover:text-gold-300" href="/admin/login">Owner sign in</Link></li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-bold text-gold-300">Good to Know</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-cream-100/75">
              <li>📚 Carefully chosen books and school supplies.</li>
              <li>✏️ Everything for class, study and art.</li>
              <li>🚚 Pay on delivery — no online payment is taken.</li>
            </ul>
            <Link
              href="/products"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gold-400 px-5 py-2.5 text-sm font-bold text-brand-950 transition hover:bg-gold-300"
            >
              Browse the shop <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-cream-100/15 bg-brand-950">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-center text-xs text-cream-100/60 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:text-left">
          <p>© {new Date().getFullYear()} A&amp;A&apos;s Bookshop Stationery. All rights reserved.</p>
          <p>Books · Textbooks · Revision Books · Reading Books · Stationery · Art Supplies</p>
        </div>
      </div>
    </footer>
  );
}
