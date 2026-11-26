"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useCart } from "@/app/components/CartProvider";
import { formatPrice } from "@/app/data/products";
import {
  buildOrder,
  saveOrder,
  saveOrderReference,
} from "@/app/data/orders";
import type { OrderRecord } from "@/lib/types";

const inputClass = "brand-input mt-1";
const labelClass = "block text-sm font-bold text-brand-900";

export default function CheckoutPage() {
  const { details, itemCount, subtotal, clearCart } = useCart();
  const [placedOrder, setPlacedOrder] = useState<OrderRecord | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (details.length === 0 || submitting) return;
    setSubmitting(true);
    setError("");

    const form = new FormData(event.currentTarget);
    const customer = {
      name: String(form.get("name") ?? "").trim(),
      phone: String(form.get("phone") ?? "").trim(),
      email: String(form.get("email") ?? "").trim(),
      address: String(form.get("address") ?? "").trim(),
    };
    const payment = String(form.get("payment") ?? "Cash on Delivery");
    const notificationMethod = String(form.get("notificationMethod") ?? "SMS");

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer,
          payment,
          notificationMethod,
          items: details.map(({ product, quantity }) => ({
            productId: product.id,
            quantity,
          })),
        }),
      });
      const payload = (await response.json()) as {
        order?: OrderRecord;
        message?: string;
      };
      if (!response.ok || !payload.order) {
        setError(payload.message ?? "We could not place your order. Please try again.");
        setSubmitting(false);
        return;
      }

      const order = payload.order;
      saveOrderReference(order.orderNumber, order.customer.phone);
      const legacyOrder = buildOrder({
        customer: {
          ...customer,
          payment: order.payment,
        },
        items: order.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          lineTotal: item.lineTotal,
        })),
        total: order.total,
        now: Date.parse(order.placedAt),
      });
      saveOrder(legacyOrder);

      setPlacedOrder(order);
      clearCart();
    } catch {
      setError("We could not reach the server. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (placedOrder) {
    return (
      <main className="mx-auto flex max-w-7xl items-center justify-center px-4 py-14 sm:px-6">
        <div className="brand-card w-full max-w-2xl overflow-hidden p-6 sm:p-10">
          <div className="h-1.5 bg-gold-400" />
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-3xl text-brand-800">
              âœ“
            </div>
            <h1 className="font-serif text-3xl font-bold text-brand-900">
              Order Confirmed!
            </h1>
            <p className="mt-2 text-sm text-cocoa-700 sm:text-base">
              Thank you, {placedOrder.customer.name}. We have received your
              order.
            </p>
            <span className="mt-4 inline-block rounded-full bg-gold-100 px-4 py-1 text-sm font-bold text-gold-600">
              Status: {placedOrder.status}
            </span>
          </div>

          <div className="brand-panel mt-8 p-5">
            <div className="flex justify-between text-sm">
              <span className="text-cocoa-700">Order number</span>
              <span className="font-bold text-brand-900">
                {placedOrder.orderNumber}
              </span>
            </div>
            <div className="mt-1 flex justify-between text-sm">
              <span className="text-cocoa-700">Placed on</span>
              <span>{new Date(placedOrder.placedAt).toLocaleString()}</span>
            </div>

            <div className="mt-4 space-y-2 border-t border-cream-300 pt-4">
              {placedOrder.items.map((item, index) => (
                <div
                  key={`${item.productId}-${index}`}
                  className="flex justify-between gap-4 text-cocoa-700"
                >
                  <span>
                    {item.name} Ã— {item.quantity}
                  </span>
                  <span>{formatPrice(item.lineTotal)}</span>
                </div>
              ))}
            </div>

            <div className="mt-3 flex justify-between border-t border-gold-300 pt-3">
              <span className="font-serif text-lg font-bold text-brand-900">
                Total
              </span>
              <span className="font-serif text-xl font-bold text-gold-600">
                {formatPrice(placedOrder.total)}
              </span>
            </div>
          </div>

          <div className="mt-6 space-y-1 text-sm text-cocoa-700">
            <p>
              <strong className="text-brand-900">Delivery location:</strong>{" "}
              {placedOrder.deliveryAddress}
            </p>
            <p>
              <strong className="text-brand-900">Phone:</strong>{" "}
              {placedOrder.customer.phone}
            </p>
            <p>
              <strong className="text-brand-900">Payment on delivery:</strong>{" "}
              {placedOrder.payment}
            </p>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/orders" className="brand-button-gold">
              View my orders
            </Link>
            <Link href="/products" className="brand-button-outline">
              Continue shopping
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (details.length === 0) {
    return (
      <main className="mx-auto flex max-w-7xl items-center justify-center px-4 py-20 sm:px-6">
        <div className="brand-card max-w-md p-10 text-center">
          <h1 className="font-serif text-2xl font-bold text-brand-900">
            Nothing to check out
          </h1>
          <p className="mt-2 text-sm leading-7 text-cocoa-700">
            Add some books or stationery to your cart before placing an order.
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
      <p className="brand-eyebrow">One last step</p>
      <h1 className="mt-3 font-serif text-3xl font-bold text-brand-900 sm:text-4xl">
        Checkout
      </h1>
      <p className="mt-2 text-sm text-cocoa-700 sm:text-base">
        Share your delivery details and we will prepare your order.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <form
          onSubmit={handleSubmit}
          className="brand-card space-y-4 p-6 sm:p-7"
        >
          <div className="border-b border-cream-300 pb-4">
            <h2 className="font-serif text-xl font-bold text-brand-900">
              Delivery Details
            </h2>
            <p className="mt-1 text-xs text-cocoa-500">
              We will use these details to confirm your order.
            </p>
          </div>

          <label className="block">
            <span className={labelClass}>Customer name</span>
            <input name="name" required className={inputClass} />
          </label>

          <label className="block">
            <span className={labelClass}>Phone number</span>
            <input name="phone" type="tel" required className={inputClass} />
          </label>

          <label className="block">
            <span className={labelClass}>Email address (optional)</span>
            <input name="email" type="email" className={inputClass} />
          </label>

          <label className="block">
            <span className={labelClass}>Delivery location</span>
            <textarea
              name="address"
              required
              rows={3}
              placeholder="Town, estate or nearest landmark"
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className={labelClass}>Preferred payment on delivery</span>
            <select name="payment" className={inputClass}>
              <option>Cash on Delivery</option>
              <option>M-Pesa on Delivery</option>
              <option>Bank Transfer on Delivery</option>
            </select>
            <div className="mt-4">
              <span className={labelClass}>Preferred order updates</span>
              <div className="mt-2 flex flex-col gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" name="notificationMethod" value="SMS" defaultChecked required />
                  SMS
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" name="notificationMethod" value="WhatsApp" required />
                  WhatsApp
                </label>
              </div>
            </div>
          </label>

          {error && (
            <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="brand-button-gold w-full disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Placing orderâ€¦" : "Place order"}
          </button>
          <p className="text-center text-xs text-cocoa-500">
            No online payment is taken. Pay when your order is delivered.
          </p>
        </form>

        <aside className="brand-card h-fit overflow-hidden">
          <div className="h-1 bg-gold-400" />
          <div className="p-6 sm:p-7">
            <h2 className="font-serif text-xl font-bold text-brand-900">
              Order Summary
            </h2>

            <div className="mt-5 space-y-3">
              {details.map(({ product, quantity, lineTotal }) => (
                <div key={product.id} className="flex justify-between gap-4">
                  <span className="text-sm text-cocoa-700">
                    {product.name} Ã— {quantity}
                  </span>
                  <span className="whitespace-nowrap text-sm font-bold text-brand-900">
                    {formatPrice(lineTotal)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5 flex justify-between border-t border-cream-300 pt-4 text-sm text-cocoa-700">
              <span>Items ({itemCount})</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="mt-3 flex justify-between border-t border-gold-300 pt-4">
              <span className="font-serif text-lg font-bold text-brand-900">
                Total
              </span>
              <span className="font-serif text-2xl font-bold text-gold-600">
                {formatPrice(subtotal)}
              </span>
            </div>

            <div className="brand-panel mt-6 p-4 text-xs leading-6 text-cocoa-700">
              Prices are confirmed when the order is saved. You can follow your
              order status in My Orders.
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
