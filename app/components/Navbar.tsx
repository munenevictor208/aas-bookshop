"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import BrandLogo from "@/app/components/BrandLogo";
import { useCart } from "@/app/components/CartProvider";

const links = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Shop" },
  { href: "/categories", label: "Categories" },
  { href: "/orders", label: "My Orders" },
];

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export default function Navbar() {
  const { itemCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50">
      <div className="bg-gold-400 text-brand-950">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 py-1.5 text-center text-[10px] font-bold uppercase tracking-[0.18em] sm:text-xs">
          <span>Books</span>
          <span className="text-gold-600">•</span>
          <span>Textbooks</span>
          <span className="hidden text-gold-600 sm:inline">•</span>
          <span className="hidden sm:inline">Revision Books</span>
          <span className="text-gold-600">•</span>
          <span>Stationery</span>
          <span className="hidden text-gold-600 sm:inline">•</span>
          <span className="hidden sm:inline">Art Supplies</span>
        </div>
      </div>

      <div className="border-b-2 border-gold-500 bg-brand-900 text-cream-50 shadow-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link
            href="/"
            onClick={() => setMenuOpen(false)}
            aria-label="A&A's Bookshop Stationery home"
          >
            <BrandLogo inverse />
          </Link>

          <nav aria-label="Main navigation" className="hidden md:block">
            <ul className="flex items-center gap-1 text-sm font-semibold">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`block rounded-lg px-3 py-2 transition hover:bg-brand-800 hover:text-gold-300 ${
                      isActive(pathname, link.href) ? "text-gold-300" : ""
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/cart"
                  className={`ml-1 inline-flex items-center rounded-xl border border-gold-400 px-3 py-2 transition hover:bg-gold-400 hover:text-brand-950 ${
                    isActive(pathname, "/cart") ? "bg-gold-400 text-brand-950" : ""
                  }`}
                >
                  <span aria-hidden className="mr-2 text-base">🛒</span>
                  Cart
                  <span className="ml-2 rounded-full bg-cream-50 px-2 py-0.5 text-xs font-bold text-brand-900">
                    {itemCount}
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="ml-1 rounded-lg border border-cream-50/40 px-3 py-2 text-xs font-bold uppercase tracking-wide transition hover:border-gold-400 hover:text-gold-300"
                >
                  Sign In
                </Link>
              </li>
            </ul>
          </nav>

          <div className="flex items-center gap-2 md:hidden">
            <Link
              href="/cart"
              aria-label={`Cart, ${itemCount} items`}
              className="relative rounded-lg border border-gold-400 px-3 py-2 text-sm font-bold"
            >
              🛒
              <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold-400 px-1 text-[10px] font-bold text-brand-950">
                {itemCount}
              </span>
            </Link>
            <button
              type="button"
              className="rounded-lg border border-cream-50/40 px-3 py-2 text-xl transition hover:bg-brand-800"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav aria-label="Mobile navigation" className="border-t border-gold-500/40 bg-brand-950 md:hidden">
            <ul className="space-y-1 px-4 py-3 text-sm font-semibold sm:px-6">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className={`block rounded-lg px-3 py-2.5 transition hover:bg-brand-800 hover:text-gold-300 ${
                      isActive(pathname, link.href) ? "text-gold-300" : ""
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-lg border border-gold-400/70 px-3 py-2.5 text-center font-bold text-gold-300"
                >
                  Sign In
                </Link>
              </li>
            </ul>
          </nav>
        )}
      </div>
    </header>
  );
}
