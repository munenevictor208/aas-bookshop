import Link from "next/link";
import { setOrderStatus } from "@/app/admin/actions/catalog";
import { formatPrice } from "@/app/data/products";
import { listOrders } from "@/lib/orders";
import { ORDER_STATUSES, ORDER_STATUS_TRANSITIONS } from "@/lib/types";

export const metadata = {
  title: "Manage Orders",
};

type OrdersAdminProps = {
  searchParams: Promise<{ status?: string | string[]; search?: string | string[] }>;
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminOrdersPage({ searchParams }: OrdersAdminProps) {
  const params = await searchParams;
  const status = first(params.status);
  const search = first(params.search)?.trim();
  const orders = await listOrders({ status, search });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-900 sm:text-3xl">Orders</h1>
        <p className="mt-2 text-cocoa-700">
          View customer orders and keep their status up to date.
        </p>
      </div>

      <form action="/admin/orders" className="flex flex-wrap gap-2">
        <input
          type="search"
          name="search"
          defaultValue={search}
          placeholder="Order number, name or phone…"
          aria-label="Search orders"
          className="min-w-[220px] flex-1 rounded-lg border border-brand-200 bg-white px-4 py-2 focus:border-brand-600 focus:outline-none"
        />
        <select
          name="status"
          defaultValue={status ?? ""}
          aria-label="Filter by status"
          className="rounded-lg border border-brand-200 bg-white px-4 py-2 focus:border-brand-600 focus:outline-none"
        >
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-brand-700 px-5 py-2 text-sm font-bold text-white hover:bg-brand-800"
        >
          Filter
        </button>
      </form>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-cream-300 bg-white p-10 text-center text-cocoa-700">
          No orders found.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-cream-300 bg-white shadow-sm">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="border-b border-brand-100 bg-cream-100 text-xs uppercase tracking-wide text-cocoa-500">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Items</th>
                <th>Total</th>
                <th>Update status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.orderNumber} className="border-b border-brand-50 last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/orders/${order.orderNumber}`}
                      className="font-semibold text-brand-700 hover:underline"
                    >
                      {order.orderNumber}
                    </Link>
                    <p className="mt-1 text-xs text-cocoa-500">{order.payment}</p>
                  </td>
                  <td>
                    <p className="font-medium">{order.customer.name}</p>
                    <p className="text-xs text-cocoa-500">{order.customer.phone}</p>
                  </td>
                  <td>{new Date(order.placedAt).toLocaleDateString()}</td>
                  <td>
                    {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
                  </td>
                  <td className="font-semibold">{formatPrice(order.total)}</td>
                  <td>
                    <form action={setOrderStatus} className="flex gap-2">
                      <input type="hidden" name="orderNumber" value={order.orderNumber} />
                      <select
                        name="status"
                        defaultValue={order.status}
                        className="rounded-lg border border-brand-200 px-2 py-1.5 text-sm"
                      >
                        {[order.status, ...ORDER_STATUS_TRANSITIONS[order.status]].map(
                          (item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          )
                        )}
                      </select>
                      <button
                        type="submit"
                        className="rounded-lg bg-brand-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-800"
                      >
                        Save
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
