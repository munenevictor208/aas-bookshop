import type { ReactNode } from "react";
import Footer from "@/app/components/Footer";
import Navbar from "@/app/components/Navbar";

export default function ShopLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
