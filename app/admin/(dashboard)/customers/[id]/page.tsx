import Link from "next/link";
import { notFound } from "next/navigation";
import { formatPrice } from "@/app/data/products";
import { getCustomerById, listOrdersForCustomer } from "@/lib/orders";

type CustomerDetailProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: CustomerDetailProps) {
  const { id } = await params;
  return { title: `Customer ${id}` };
}

export default async function AdminCustomerDetailPage({ params }: CustomerDetailProps) {
  const { id } = await params;
  const customerId = Number(id);
  const customer = await getCustomerById(customerId);
  if (!customer) notFound();

  const orders = await listOrdersForCustomer(customerId);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/customers" className="text-sm font-semibold text-brand-700 hover:underline">
          ← All customers
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-brand-900 sm:text-3xl">
          {customer.name}
        </h1>
        <p className="mt-2 text-cocoa-700">
          Customer since {new Date(customer.createdAt).toLocaleDateString()}.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="brand-card border-t-4 border-t-gold-400 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-cocoa-500">Orders</p>
          <p className="mt-2 text-2xl font-bold text-brand-900">{customer.orderCount}</p>
        </div>
        <div className="brand-card border-t-4 border-t-gold-400 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-cocoa-500">Total spent</p>
          <p className="mt-2 text-2xl font-bold text-brand-900">
            {formatPrice(customer.totalSpent)}
          </p>
        </div>
        <div className="brand-card border-t-4 border-t-gold-400 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-cocoa-500">Phone</p>
          <p className="mt-2 font-semibold text-brand-900">{customer.phone}</p>
        </div>
      </section>

      <section className="brand-card p-5">
        <h2 className="text-lg font-bold text-brand-900">Contact & delivery</h2>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-cocoa-500">Email</dt>
            <dd className="font-semibold text-brand-900">{customer.email || "Not provided"}</dd>
          </div>
          <div>
            <dt className="text-cocoa-500">Address</dt>
            <dd className="font-semibold text-brand-900">{customer.address || "Not provided"}</dd>
          </div>
        </dl>
      </section>

      <section className="brand-card p-5">
        <h2 className="text-lg font-bold text-brand-900">Order history</h2>
        {orders.length === 0 ? (
          <p className="mt-4 text-sm text-cocoa-500">No orders recorded yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="border-b border-brand-100 text-xs uppercase tracking-wide text-cocoa-500">
                <tr>
                  <th className="py-2">Order</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.orderNumber} className="border-b border-brand-50 last:border-0">
                    <td className="py-3 font-semibold text-brand-800">
                      <Link href={`/admin/orders/${order.orderNumber}`} className="hover:underline">
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td>{new Date(order.placedAt).toLocaleDateString()}</td>
                    <td>{order.status}</td>
                    <td>{order.payment}</td>
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
