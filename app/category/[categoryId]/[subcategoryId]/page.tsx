import type { Metadata } from "next";
import { listCategories } from "@/lib/api/categories";
import SubcategoryPageClient from "./SubcategoryPageClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ categoryId: string; subcategoryId: string }>;
}): Promise<Metadata> {
  const { categoryId, subcategoryId } = await params;
  try {
    const categories = await listCategories();
    const category = categories.find((c) => c.slug === categoryId);
    const subcategory = category?.subcategories.find((s) => s.slug === subcategoryId);
    if (!category || !subcategory) return { title: "Subcategory – Riskyc Fashion" };

    return {
      title: `${subcategory.name} – ${category.name} – Riskyc Fashion`,
      description: `Shop ${subcategory.name} in ${category.name} at Riskyc Fashion — quality, style, and elegance delivered to your door.`,
    };
  } catch {
    return { title: "Subcategory – Riskyc Fashion" };
  }
}

export default async function SubcategoryPage({
  params,
}: {
  params: Promise<{ categoryId: string; subcategoryId: string }>;
}) {
  const { categoryId, subcategoryId } = await params;
  return <SubcategoryPageClient categorySlug={categoryId} subcategorySlug={subcategoryId} />;
}
