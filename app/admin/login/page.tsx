import Link from "next/link";
import { redirect } from "next/navigation";
import BrandLogo from "@/app/components/BrandLogo";
import OwnerLoginForm from "./OwnerLoginForm";
import { isConfigurationMissing, isOwnerAuthenticated } from "@/lib/auth";

export const metadata = {
  title: "Owner Sign In",
};

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (await isOwnerAuthenticated()) {
    redirect("/admin");
  }

  const needsSetup = isConfigurationMissing();

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-cream-100 px-4 py-12">
      <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-gold-300/30 blur-3xl" />
      <div className="brand-card relative w-full max-w-md overflow-hidden p-8 shadow-xl sm:p-10">
        <div className="h-1.5 bg-gold-400" />
        <div className="mb-7 text-center">
          <div className="flex justify-center">
            <BrandLogo />
          </div>
          <h1 className="mt-5 font-serif text-2xl font-bold text-brand-900">
            Owner Sign In
          </h1>
          <p className="mt-2 text-sm text-cocoa-700">
            Private dashboard for the A&amp;A&apos;s Bookshop Stationery owner.
          </p>
        </div>

        {needsSetup ? (
          <div className="rounded-xl border border-gold-300 bg-gold-100 p-4 text-sm leading-6 text-cocoa-700">
            Owner access is not configured. On the server, run{" "}
            <code className="font-mono font-bold">npm run setup:admin -- &lt;email&gt; &lt;password&gt;</code>{" "}
            and restart the app. There is no public registration.
          </div>
        ) : (
          <OwnerLoginForm />
        )}

        <p className="mt-8 text-center text-sm text-cocoa-500">
          <Link
            href="/"
            className="font-bold text-brand-800 underline decoration-gold-400 decoration-2 underline-offset-4 hover:text-gold-600"
          >
            ← Back to the shop
          </Link>
        </p>
      </div>
    </main>
  );
}
