import type { MetadataRoute } from "next";
import { listCategories } from "@/lib/api/categories";
import { listProducts } from "@/lib/api/products";

const SITE_URL = process.env.SITE_URL || "http://localhost:3000";

// Regenerate at most once an hour rather than on every single crawl request —
// the catalog doesn't change fast enough to need a fresh fetch every time.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    // The product listing is the landing page now — /products permanently
    // redirects here, so it isn't listed separately (would be duplicate content).
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/home`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/help`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE_URL}/contact`, changeFrequency: "monthly", priority: 0.3 },
  ];

  const [categories, productsPage] = await Promise.all([
    listCategories().catch(() => []),
    listProducts({ size: 200 }).catch(() => ({ content: [] as { id: string; updatedAt?: string }[] })),
  ]);

  const categoryRoutes: MetadataRoute.Sitemap = categories.flatMap((cat) => [
    { url: `${SITE_URL}/category/${cat.slug}`, changeFrequency: "weekly" as const, priority: 0.7 },
    ...cat.subcategories.map((sub) => ({
      url: `${SITE_URL}/category/${cat.slug}/${sub.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ]);

  const productRoutes: MetadataRoute.Sitemap = productsPage.content.map((p) => ({
    url: `${SITE_URL}/products/${p.id}`,
    lastModified: p.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
