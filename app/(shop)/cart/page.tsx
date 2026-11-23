"use client";

import Link from "next/link";
import { useCart } from "@/app/components/CartProvider";
import ProductImage from "@/app/components/ProductImage";
import { formatPrice } from "@/app/data/products";

export default function CartPage() {
  const { details, itemCount, subtotal, updateQuantity, removeItem, clearCart } =
    useCart();

  if (details.length === 0) {
    return (
      <main className="mx-auto flex max-w-7xl items-center justify-center px-4 py-20 sm:px-6">
        <div className="brand-card w-full max-w-md p-10 text-center">
          <div className="mb-4 text-6xl">🛒</div>
          <h1 className="font-serif text-2xl font-bold text-brand-900">
            Your cart is empty
          </h1>
          <p className="mt-2 text-sm leading-7 text-cocoa-700">
            Browse our books, stationery and art supplies and add something you
            like.
          </p>
          <Link href="/products" className="brand-button-gold mt-6">
            Shop the shelves
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="brand-eyebrow">Almost there</p>
      <h1 className="mt-3 font-serif text-3xl font-bold text-brand-900 sm:text-4xl">
        Shopping Cart
      </h1>
      <p className="mt-2 text-sm text-cocoa-700 sm:text-base">
        {itemCount} {itemCount === 1 ? "item" : "items"} ready for checkout.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          {details.map(({ product, quantity, lineTotal }) => (
            <article
              key={product.id}
              className="brand-card flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5"
            >
              <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-cream-300 bg-cream-100 text-4xl">
                <ProductImage
                  name={product.name}
                  imageUrl={product.imageUrl}
                  icon={product.icon}
                />
              </div>

              <div className="flex-1">
                <h2 className="font-serif text-lg font-bold text-brand-900">
                  {product.name}
                </h2>
                <p className="mt-1 text-sm text-cocoa-500">
                  {formatPrice(product.price)} each
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => updateQuantity(product.id, quantity - 1)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-cream-300 text-lg font-bold text-brand-800 transition hover:border-gold-400 hover:bg-gold-100"
                  aria-label={`Decrease quantity of ${product.name}`}
                >
                  −
                </button>
                <span className="w-8 text-center font-bold text-brand-900">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => updateQuantity(product.id, quantity + 1)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-cream-300 text-lg font-bold text-brand-800 transition hover:border-gold-400 hover:bg-gold-100"
                  aria-label={`Increase quantity of ${product.name}`}
                >
                  +
                </button>
              </div>

              <p className="w-full font-serif text-lg font-bold text-brand-900 sm:w-28 sm:text-right">
                {formatPrice(lineTotal)}
              </p>

              <button
                type="button"
                onClick={() => removeItem(product.id)}
                className="text-sm font-semibold text-cocoa-500 underline decoration-gold-400 underline-offset-4 transition hover:text-red-600"
              >
                Remove
              </button>
            </article>
          ))}
        </div>

        <aside className="brand-card h-fit overflow-hidden lg:sticky lg:top-32">
          <div className="h-1 bg-gold-400" />
          <div className="p-6">
            <h2 className="font-serif text-xl font-bold text-brand-900">
              Order Summary
            </h2>
            <div className="mt-5 flex justify-between text-sm text-cocoa-700">
              <span>Items</span>
              <span>{itemCount}</span>
            </div>
            <div className="mt-3 flex justify-between border-t border-cream-300 pt-4">
              <span className="font-serif text-lg font-bold text-brand-900">
                Subtotal
              </span>
              <span className="font-serif text-xl font-bold text-gold-600">
                {formatPrice(subtotal)}
              </span>
            </div>
            <div className="mt-6 space-y-3">
              <Link href="/checkout" className="brand-button-gold w-full">
                Proceed to checkout
              </Link>
              <Link href="/products" className="brand-button-outline w-full">
                Continue shopping
              </Link>
              <button
                type="button"
                onClick={clearCart}
                className="w-full py-1 text-sm font-semibold text-cocoa-500 underline decoration-gold-400 underline-offset-4 transition hover:text-red-600"
              >
                Clear cart
              </button>
            </div>
            <p className="mt-5 text-xs leading-5 text-cocoa-500">
              No online payment is taken. You will pay when your order is
              delivered.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
