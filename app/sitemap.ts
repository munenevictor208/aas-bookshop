import type { MetadataRoute } from "next";
import { listProducts } from "@/lib/catalog";

const siteUrl = "https://aas-bookshop.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await listProducts();

  const mainPages: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/products`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/categories`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  const productPages: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${siteUrl}/products/${product.id}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...mainPages, ...productPages];
}
