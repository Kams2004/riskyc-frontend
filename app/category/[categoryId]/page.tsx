"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useCategories } from "@/lib/useCategories";
import { listProducts } from "@/lib/api/products";
import { Product } from "@/lib/types";
import ProductCard from "@/components/products/ProductCard";
import { FaIconPreview } from "@/components/admin/FaIconPicker";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function CategoryPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const { categories, loading: categoriesLoading } = useCategories();
  const category = categories.find((c) => c.slug === categoryId);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    listProducts({ category: categoryId, size: 200 })
      .then((page) => setProducts(page.content))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [categoryId]);

  if (!categoriesLoading && !category) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="text-6xl">😕</div>
        <h2 className="text-2xl font-semibold">Category not found</h2>
        <Link href="/products" className="btn-primary">Browse All Products</Link>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center text-gray-400">Loading...</div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-4">
          <Link href="/" className="hover:text-brand-500">Home</Link>
          <span>/</span>
          <span className="text-gray-700 font-medium">{category.name}</span>
        </nav>

        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl"><FaIconPreview value={category.icon ?? "fa:solid:tag"} size={32} /></span>
          <h1 className="section-title">{category.name}</h1>
        </div>
        <p className="text-gray-500">
          {products.length} products in {category.name}
        </p>
      </div>

      {/* Subcategory pills — horizontally scrollable on mobile */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap mb-8">
        <Link
          href={`/category/${categoryId}`}
          className="flex-shrink-0 px-4 py-2 rounded-full bg-brand-500 text-white text-sm font-semibold whitespace-nowrap"
        >
          All {category.name}
        </Link>
        {category.subcategories.map((sub) => (
          <Link
            key={sub.id}
            href={`/category/${categoryId}/${sub.slug}`}
            className="flex-shrink-0 px-4 py-2 rounded-full bg-white border border-gray-200 text-gray-600 text-sm font-medium hover:border-brand-300 hover:text-brand-600 transition-colors flex items-center gap-1 whitespace-nowrap"
          >
            {sub.name}
            <ArrowRight size={12} />
          </Link>
        ))}
      </div>

      {/* Products */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📦</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No products yet</h3>
          <p className="text-gray-400 mb-6">Check back soon for new arrivals!</p>
          <Link href="/products" className="btn-primary">Browse All Products</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
