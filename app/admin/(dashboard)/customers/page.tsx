import Link from "next/link";
import { formatPrice } from "@/app/data/products";
import { listCustomers } from "@/lib/orders";

export const metadata = {
  title: "Customers",
};

export default async function AdminCustomersPage() {
  const customers = await listCustomers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-900 sm:text-3xl">Customers</h1>
        <p className="mt-2 text-cocoa-700">
          People who have placed orders with the shop.
        </p>
      </div>

      {customers.length === 0 ? (
        <div className="rounded-2xl border border-cream-300 bg-white p-10 text-center text-cocoa-700">
          No customers yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-cream-300 bg-white shadow-sm">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="border-b border-brand-100 bg-cream-100 text-xs uppercase tracking-wide text-cocoa-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Location</th>
                <th>Orders</th>
                <th className="text-right">Total spent</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="border-b border-brand-50 last:border-0">
                  <td className="px-4 py-3 font-semibold text-brand-900">
                    <Link href={`/admin/customers/${customer.id}`} className="hover:underline">
                      {customer.name}
                    </Link>
                  </td>
                  <td>{customer.phone}</td>
                  <td>{customer.email || "—"}</td>
                  <td>{customer.address}</td>
                  <td>{customer.orderCount}</td>
                  <td className="text-right font-semibold text-brand-700">
                    {formatPrice(customer.totalSpent)}
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
