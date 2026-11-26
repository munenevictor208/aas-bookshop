import type { MetadataRoute } from "next";

const siteUrl = "https://aas-bookshop.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/api/",
        "/cart/",
        "/checkout/",
        "/login/",
        "/orders/",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
