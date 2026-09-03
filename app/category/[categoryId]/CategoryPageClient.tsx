"use client";

import { useEffect, useState } from "react";
import { useCategories } from "@/lib/useCategories";
import { listProducts } from "@/lib/api/products";
import { Product } from "@/lib/types";
import ProductCard from "@/components/products/ProductCard";
import { FaIconPreview } from "@/components/admin/FaIconPicker";
import Link from "next/link";
import { ArrowRight } from "@/components/icons/fa";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { localized } from "@/lib/i18n/localized";

export default function CategoryPageClient({ categorySlug }: { categorySlug: string }) {
  const { t, language } = useTranslation();
  const { categories, loading: categoriesLoading } = useCategories();
  const category = categories.find((c) => c.slug === categorySlug);
  const categoryName = category ? localized(category.name, category.nameFr, language) : "";

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    listProducts({ category: categorySlug, size: 200 })
      .then((page) => setProducts(page.content))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [categorySlug]);

  if (!categoriesLoading && !category) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="text-6xl">😕</div>
        <h2 className="text-2xl font-semibold">{t("products.category.notFound")}</h2>
        <Link href="/products" className="btn-primary">{t("products.category.browseAllProducts")}</Link>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center text-gray-400">{t("products.category.loading")}</div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-4">
          <Link href="/" className="hover:text-brand-500">{t("products.detail.home")}</Link>
          <span>/</span>
          <span className="text-gray-700 font-medium">{categoryName}</span>
        </nav>

        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl"><FaIconPreview value={category.icon ?? "fa:solid:tag"} size={32} /></span>
          <h1 className="section-title">{categoryName}</h1>
        </div>
        <p className="text-gray-500">
          {products.length === 1
            ? t("products.category.productsInOne", { count: products.length, category: categoryName })
            : t("products.category.productsInOther", { count: products.length, category: categoryName })}
        </p>
      </div>

      {/* Subcategory pills — horizontally scrollable on mobile */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap mb-8">
        <Link
          href={`/category/${categorySlug}`}
          className="flex-shrink-0 px-4 py-2 rounded-full bg-brand-500 text-white text-sm font-semibold whitespace-nowrap"
        >
          {t("products.category.allOf", { category: categoryName })}
        </Link>
        {category.subcategories.filter((sub) => sub.productCount > 0).map((sub) => (
          <Link
            key={sub.id}
            href={`/category/${categorySlug}/${sub.slug}`}
            className="flex-shrink-0 px-4 py-2 rounded-full bg-white border border-gray-200 text-gray-600 text-sm font-medium hover:border-brand-300 hover:text-brand-600 transition-colors flex items-center gap-1 whitespace-nowrap"
          >
            {localized(sub.name, sub.nameFr, language)}
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
          <h3 className="text-xl font-semibold text-gray-700 mb-2">{t("products.category.noProductsYet")}</h3>
          <p className="text-gray-400 mb-6">{t("products.category.checkBackSoon")}</p>
          <Link href="/products" className="btn-primary">{t("products.category.browseAllProducts")}</Link>
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
