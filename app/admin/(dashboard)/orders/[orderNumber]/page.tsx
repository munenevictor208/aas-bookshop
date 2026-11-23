import Link from "next/link";
import { notFound } from "next/navigation";
import { setOrderStatus } from "@/app/admin/actions/catalog";
import { formatPrice } from "@/app/data/products";
import { getOrderByNumber } from "@/lib/orders";
import { ORDER_STATUS_TRANSITIONS } from "@/lib/types";

type OrderDetailProps = {
  params: Promise<{ orderNumber: string }>;
};

export async function generateMetadata({ params }: OrderDetailProps) {
  const { orderNumber } = await params;
  return { title: `Order ${orderNumber}` };
}

export default async function AdminOrderDetailPage({ params }: OrderDetailProps) {
  const { orderNumber } = await params;
  const order = await getOrderByNumber(orderNumber);
  if (!order) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/admin/orders" className="text-sm font-semibold text-brand-700 hover:underline">
            ← All orders
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-brand-900 sm:text-3xl">
            {order.orderNumber}
          </h1>
          <p className="mt-2 text-cocoa-700">
            Placed {new Date(order.placedAt).toLocaleString()}
          </p>
        </div>
        <form action={setOrderStatus} className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="orderNumber" value={order.orderNumber} />
          <label className="text-sm font-semibold text-brand-900">
            Status
            <select
              name="status"
              defaultValue={order.status}
              className="mt-1 block rounded-lg border border-brand-200 px-4 py-2"
            >
              {[order.status, ...ORDER_STATUS_TRANSITIONS[order.status]].map(
                (status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                )
              )}
            </select>
          </label>
          <button
            type="submit"
            className="brand-button px-5 py-2.5"
          >
            Update
          </button>
        </form>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-cream-300 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-bold text-brand-900">Items</h2>
          <div className="mt-4 space-y-3">
            {order.items.map((item, index) => (
              <div
                key={`${item.productId}-${index}`}
                className="flex justify-between gap-4 border-b border-brand-50 pb-3 last:border-0"
              >
                <div>
                  <p className="font-semibold text-brand-900">{item.name}</p>
                  <p className="text-sm text-cocoa-500">
                    {item.quantity} × {formatPrice(item.unitPrice)}
                  </p>
                </div>
                <p className="font-bold text-brand-700">
                  {formatPrice(item.lineTotal)}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-5 flex justify-between border-t border-brand-200 pt-4 text-xl font-bold text-brand-900">
            <span>Total</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </section>

        <section className="rounded-2xl border border-cream-300 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-bold text-brand-900">Customer & delivery</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-cocoa-500">Name</dt>
              <dd className="font-semibold text-brand-900">{order.customer.name}</dd>
            </div>
            <div>
              <dt className="text-cocoa-500">Phone</dt>
              <dd className="font-semibold">{order.customer.phone}</dd>
            </div>
            <div>
              <dt className="text-cocoa-500">Email</dt>
              <dd className="font-semibold">{order.customer.email || "Not provided"}</dd>
            </div>
            <div>
              <dt className="text-cocoa-500">Delivery location</dt>
              <dd className="font-semibold">{order.deliveryAddress}</dd>
            </div>
            <div>
              <dt className="text-cocoa-500">Preferred payment</dt>
              <dd className="font-semibold">{order.payment}</dd>
            </div>
            <div>
              <dt className="text-cocoa-500">Current status</dt>
              <dd className="font-semibold text-brand-700">{order.status}</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}
