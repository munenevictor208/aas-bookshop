"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  getOrderReferencesServerSnapshot,
  getOrderReferencesSnapshot,
  getOrdersServerSnapshot,
  getOrdersSnapshot,
  parseOrderReferences,
  parseOrders,
  subscribeToOrders,
} from "@/app/data/orders";
import { formatPrice } from "@/app/data/products";
import type { OrderRecord } from "@/lib/types";

type DisplayOrder = {
  orderNumber: string;
  placedAt: string;
  total: number;
  status: string;
  items: { name: string; quantity: number; lineTotal: number }[];
  address: string;
  phone: string;
  payment: string;
};

function statusClass(status: string): string {
  if (status === "Delivered") return "bg-brand-100 text-brand-900";
  if (status === "Cancelled") return "bg-red-100 text-red-700";
  if (status === "Pending") return "bg-gold-100 text-gold-600";
  return "bg-cream-200 text-cocoa-700";
}

export default function OrdersPage() {
  const ordersSnapshot = useSyncExternalStore(
    subscribeToOrders,
    getOrdersSnapshot,
    getOrdersServerSnapshot
  );
  const referencesSnapshot = useSyncExternalStore(
    subscribeToOrders,
    getOrderReferencesSnapshot,
    getOrderReferencesServerSnapshot
  );
  const references = useMemo(
    () => parseOrderReferences(referencesSnapshot),
    [referencesSnapshot]
  );
  const [serverOrders, setServerOrders] = useState<OrderRecord[]>([]);
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    if (references.length === 0) return;
    let active = true;
    fetch("/api/orders/mine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ references }),
    })
      .then((response) => response.json())
      .then((payload: { orders?: OrderRecord[] }) => {
        if (!active) return;
        setServerOrders(payload.orders ?? []);
        setResolved(true);
      })
      .catch(() => {
        if (active) setResolved(true);
      });
    return () => {
      active = false;
    };
  }, [references]);

  const displayOrders: DisplayOrder[] = useMemo(() => {
    const fromServer = serverOrders.map((order) => ({
      orderNumber: order.orderNumber,
      placedAt: new Date(order.placedAt).toLocaleString() || order.placedAt,
      total: order.total,
      status: order.status,
      items: order.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        lineTotal: item.lineTotal,
      })),
      address: order.deliveryAddress,
      phone: order.customer.phone,
      payment: order.payment,
    }));

    const known = new Set(fromServer.map((order) => order.orderNumber));
    const legacy = parseOrders(ordersSnapshot)
      .filter((order) => !known.has(order.orderNumber))
      .map((order) => ({
        orderNumber: order.orderNumber,
        placedAt: order.placedAt,
        total: order.total,
        status: "Pending",
        items: order.items,
        address: order.customer.address,
        phone: order.customer.phone,
        payment: order.customer.payment,
      }));

    return [...fromServer, ...legacy].sort((a, b) =>
      b.orderNumber.localeCompare(a.orderNumber)
    );
  }, [serverOrders, ordersSnapshot]);

  const loading = references.length > 0 && !resolved;

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="brand-eyebrow">Your purchases</p>
      <h1 className="mt-3 font-serif text-3xl font-bold text-brand-900 sm:text-4xl">
        My Orders
      </h1>
      <p className="mt-2 text-sm text-cocoa-700 sm:text-base">
        Orders placed from this device, with their latest status.
      </p>

      {loading && (
        <p className="mt-6 text-sm font-semibold text-cocoa-500">
          Checking your orders…
        </p>
      )}

      {!loading && displayOrders.length === 0 ? (
        <div className="brand-card mt-8 p-10 text-center">
          <div className="mb-4 text-6xl">📦</div>
          <p className="text-cocoa-700">You have not placed any orders yet.</p>
          <Link href="/products" className="brand-button-gold mt-6">
            Shop the shelves
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {displayOrders.map((order) => (
            <article key={order.orderNumber} className="brand-card overflow-hidden">
              <div className="h-1 bg-gold-400" />
              <div className="p-5 sm:p-6">
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <h2 className="font-serif text-lg font-bold text-brand-900 sm:text-xl">
                      {order.orderNumber}
                    </h2>
                    <p className="mt-1 text-sm text-cocoa-500">{order.placedAt}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-serif text-xl font-bold text-gold-600">
                      {formatPrice(order.total)}
                    </p>
                    <span
                      className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-bold ${statusClass(order.status)}`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>

                <div className="mt-5 space-y-2 border-t border-cream-300 pt-4">
                  {order.items.map((item, index) => (
                    <div
                      key={`${item.name}-${index}`}
                      className="flex justify-between gap-4 text-sm text-cocoa-700"
                    >
                      <span>
                        {item.name} × {item.quantity}
                      </span>
                      <span>{formatPrice(item.lineTotal)}</span>
                    </div>
                  ))}
                </div>

                <p className="mt-4 text-sm leading-6 text-cocoa-500">
                  Delivery to: {order.address} · {order.phone}
                  <br />
                  Payment: {order.payment}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
