import type { Metadata } from "next";
import { connection } from "next/server";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/app/components/CartProvider";
import { listProducts } from "@/lib/catalog";

export const dynamic = "force-dynamic";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "A&A's Bookshop Stationery | Books & Stationery",
    template: "%s | A&A's Bookshop Stationery",
  },
  description:
    "Books, textbooks, revision books, reading books, stationery and art supplies from A&A's Bookshop Stationery.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  await connection();
  const catalog = await listProducts();

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen antialiased`}
      >
        <CartProvider catalog={catalog}>{children}</CartProvider>
      </body>
    </html>
  );
}
