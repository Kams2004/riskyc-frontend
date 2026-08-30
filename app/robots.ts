import type { MetadataRoute } from "next";

const SITE_URL = process.env.SITE_URL || "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Account/checkout pages carry no SEO value and shouldn't be indexed —
        // the admin panel especially should never show up in search results.
        disallow: ["/admin", "/cart", "/login", "/register", "/track"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
