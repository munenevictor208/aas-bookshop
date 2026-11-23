import Link from "next/link";
import BrandLogo from "@/app/components/BrandLogo";

export default function LoginPage() {
  return (
    <main className="relative mx-auto flex max-w-7xl items-center justify-center px-4 py-20 sm:px-6">
      <div className="absolute left-1/2 top-10 h-64 w-64 -translate-x-1/2 rounded-full bg-gold-300/25 blur-3xl" />
      <div className="brand-card relative w-full max-w-md overflow-hidden p-8 text-center sm:p-10">
        <div className="h-1.5 bg-gold-400" />
        <div className="flex justify-center">
          <BrandLogo />
        </div>
        <h1 className="mt-6 font-serif text-2xl font-bold text-brand-900">
          Customer Accounts
        </h1>
        <p className="mt-3 text-sm leading-7 text-cocoa-700">
          Customer accounts are coming soon. For now, you can browse the shelves
          and place an order without signing in.
        </p>
        <Link href="/products" className="brand-button-gold mt-6">
          Shop products
        </Link>
        <p className="mt-7 border-t border-cream-300 pt-5 text-sm text-cocoa-500">
          Shop owner?{" "}
          <Link
            href="/admin/login"
            className="font-bold text-brand-800 underline decoration-gold-400 decoration-2 underline-offset-4 hover:text-gold-600"
          >
            Admin sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
