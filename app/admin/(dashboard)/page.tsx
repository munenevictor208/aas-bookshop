import Link from "next/link";
import { formatPrice } from "@/app/data/products";
import { getDashboardStats } from "@/lib/orders";

export const metadata = {
  title: "Admin Overview",
};

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

export default async function AdminHomePage() {
  const stats = await getDashboardStats();
  const maxRevenue = Math.max(...stats.revenueByDay.map((day) => day.revenue), 1);

  const cards = [
    { label: "Total revenue", value: formatPrice(stats.revenue), icon: "💰" },
    { label: "Orders", value: String(stats.orderCount), icon: "🧾" },
    { label: "Orders today", value: String(stats.ordersToday), icon: "📅" },
    { label: "Pending orders", value: String(stats.pendingCount), icon: "⏳" },
    { label: "Customers", value: String(stats.customerCount), icon: "👥" },
    { label: "Products", value: String(stats.productCount), icon: "📦" },
    { label: "Categories", value: String(stats.categoryCount), icon: "🗂️" },
    { label: "Low / out of stock", value: String(stats.lowStockCount + stats.outOfStockCount), icon: "⚠️" },
    { label: "Out of stock", value: String(stats.outOfStockCount), icon: "🚫" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-brand-900 sm:text-3xl">Overview</h1>
          <p className="mt-2 text-cocoa-700">
            A snapshot of your shop today, {new Date().toLocaleDateString()}.
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="brand-button-gold px-5 py-2.5"
        >
          + Add product
        </Link>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className="brand-card border-t-4 border-t-gold-400 p-4 sm:p-5"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-cocoa-500 sm:text-sm">
                {card.label}
              </p>
              <span className="text-xl">{card.icon}</span>
            </div>
            <p className="mt-3 text-xl font-bold text-brand-900 sm:text-2xl">
              {card.value}
            </p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-brand-900">Revenue this week</h2>
            <span className="text-sm font-semibold text-brand-700">
              Today: {formatPrice(stats.revenueToday)}
            </span>
          </div>
          <div className="mt-6 flex h-52 items-end gap-2 sm:gap-4">
            {stats.revenueByDay.map((day) => (
              <div key={day.day} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                <span className="text-[10px] font-semibold text-cocoa-500 sm:text-xs">
                  {day.revenue > 0 ? Math.round(day.revenue) : ""}
                </span>
                <div
                  className="w-full max-w-12 rounded-t-lg bg-gold-400 transition hover:bg-gold-500"
                  style={{ height: `${Math.max((day.revenue / maxRevenue) * 100, 3)}%` }}
                  title={`${day.day}: ${formatPrice(day.revenue)} (${day.orders} orders)`}
                />
                <span className="text-[10px] text-cocoa-500 sm:text-xs">
                  {day.day.slice(5)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="brand-card p-5">
          <h2 className="text-lg font-bold text-brand-900">Top products</h2>
          {stats.topProducts.length === 0 ? (
            <p className="mt-4 text-sm text-cocoa-500">No sales recorded yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {stats.topProducts.map((product) => (
                <li key={product.name} className="flex justify-between gap-3 text-sm">
                  <span className="font-medium text-brand-900">{product.name}</span>
                  <span className="whitespace-nowrap text-cocoa-500">
                    {product.quantity} sold · {formatPrice(product.revenue)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="brand-card p-5">
        <h2 className="text-lg font-bold text-brand-900">Order status breakdown</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {stats.statusCounts.map((item) => (
            <div
              key={item.status}
              className="rounded-xl border border-cream-300 bg-cream-50 p-3 text-center"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-cocoa-500">
                {item.status}
              </p>
              <p className="mt-1 text-xl font-bold text-brand-900">{item.count}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="brand-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-brand-900">Recent orders</h2>
          <Link href="/admin/orders" className="text-sm font-semibold text-brand-700 hover:underline">
            View all →
          </Link>
        </div>
        {stats.recentOrders.length === 0 ? (
          <p className="mt-4 text-sm text-cocoa-500">No orders yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b border-brand-100 text-xs uppercase tracking-wide text-cocoa-500">
                <tr>
                  <th className="py-2">Order</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map((order) => (
                  <tr key={order.orderNumber} className="border-b border-brand-50 last:border-0">
                    <td className="py-3 font-semibold text-brand-800">
                      <Link href={`/admin/orders/${order.orderNumber}`} className="hover:underline">
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td>{order.customer.name}</td>
                    <td>{formatDate(order.placedAt)}</td>
                    <td>{order.status}</td>
                    <td className="text-right font-semibold">{formatPrice(order.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
