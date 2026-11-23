import Link from "next/link";
import type { ReactNode } from "react";
import BrandLogo from "@/app/components/BrandLogo";
import { signOutOwner } from "@/app/admin/actions/auth";
import { requireOwner } from "@/lib/auth";

export const dynamic = "force-dynamic";

const navigation = [
  { href: "/admin", label: "Overview", icon: "📊" },
  { href: "/admin/products", label: "Products", icon: "📦" },
  { href: "/admin/categories", label: "Categories", icon: "🗂️" },
  { href: "/admin/orders", label: "Orders", icon: "🧾" },
  { href: "/admin/customers", label: "Customers", icon: "👥" },
];

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireOwner();

  return (
    <div className="min-h-screen bg-cream-100 md:flex">
      <aside className="border-b-4 border-gold-500 bg-brand-900 text-cream-50 md:min-h-screen md:w-64 md:shrink-0 md:border-b-0 md:border-r-4">
        <div className="px-5 py-5">
          <Link href="/" aria-label="A&A's Bookshop Stationery home">
            <BrandLogo inverse compact />
          </Link>
          <p className="mt-2 pl-[3.5rem] text-[10px] font-bold uppercase tracking-[0.24em] text-gold-300">
            Owner dashboard
          </p>
        </div>

        <nav aria-label="Admin navigation">
          <ul className="flex gap-1 overflow-x-auto px-3 pb-3 md:block md:space-y-1 md:overflow-visible md:px-3 md:pb-0">
            {navigation.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-cream-100/80 transition hover:bg-brand-800 hover:text-gold-300 md:shrink"
                >
                  <span aria-hidden>{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden px-5 py-6 md:block">
          <form action={signOutOwner}>
            <button
              type="submit"
              className="w-full rounded-lg border border-gold-400/70 px-3 py-2 text-sm font-bold text-gold-300 transition hover:bg-gold-400 hover:text-brand-950"
            >
              Sign out
            </button>
          </form>
          <Link
            href="/"
            className="mt-3 block px-3 text-xs text-cream-100/60 transition hover:text-gold-300"
          >
            View storefront
          </Link>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-8 sm:px-8">
        <div className="mb-5 flex items-center justify-between rounded-xl border border-cream-300 bg-white px-4 py-2.5 md:hidden">
          <span className="text-sm font-bold text-brand-900">Manage shop</span>
          <form action={signOutOwner}>
            <button
              type="submit"
              className="rounded-lg border border-gold-400 px-3 py-1.5 text-sm font-bold text-brand-800"
            >
              Sign out
            </button>
          </form>
        </div>
        {children}
      </main>
    </div>
  );
}
