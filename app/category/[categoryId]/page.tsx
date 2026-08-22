import type { Metadata } from "next";
import { listCategories } from "@/lib/api/categories";
import CategoryPageClient from "./CategoryPageClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}): Promise<Metadata> {
  const { categoryId } = await params;
  try {
    const categories = await listCategories();
    const category = categories.find((c) => c.slug === categoryId);
    if (!category) return { title: "Category – Riskyc Fashion" };

    return {
      title: `${category.name} – Riskyc Fashion`,
      description: `Shop ${category.name} at Riskyc Fashion — quality, style, and elegance delivered to your door.`,
      openGraph: {
        title: `${category.name} – Riskyc Fashion`,
        images: category.imageUrl ? [{ url: category.imageUrl }] : undefined,
      },
    };
  } catch {
    return { title: "Category – Riskyc Fashion" };
  }
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}) {
  const { categoryId } = await params;
  return <CategoryPageClient categorySlug={categoryId} />;
}
