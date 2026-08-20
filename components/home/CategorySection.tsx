"use client";

import Link from "next/link";
import { useCategories } from "@/lib/useCategories";
import { FaIconPreview } from "@/components/admin/FaIconPicker";
import { ArrowRight, Image as ImageIcon } from "lucide-react";

const categoryBadges: Record<string, { label: string; cls: string }> = {
  dresses: { label: "New", cls: "badge-new" },
  jerseys: { label: "Hot", cls: "badge-hot" },
  fashion: { label: "Sale", cls: "badge-sale" },
};

export default function CategorySection() {
  const { categories } = useCategories();

  if (categories.length === 0) return null;

  return (
    <section className="py-16 px-4 sm:px-6 max-w-7xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="section-title mb-2">Shop by Category</h2>
        <p className="text-gray-500">Find exactly what you&apos;re looking for</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6">
        {categories.map((cat) => {
          const badge = categoryBadges[cat.slug];
          return (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="group relative overflow-hidden rounded-2xl aspect-[3/4] bg-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              {/* Background image */}
              {cat.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={cat.imageUrl}
                  alt={cat.name}
                  className="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand-100 to-brand-50">
                  <ImageIcon size={40} className="text-brand-300" />
                </div>
              )}

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <div className="text-4xl mb-2 text-white drop-shadow">
                  <FaIconPreview value={cat.icon ?? "fa:solid:tag"} size={32} />
                </div>
                <h3 className="text-white font-display font-bold text-xl leading-tight">
                  {cat.name}
                </h3>
                <p className="text-gray-300 text-sm mt-1">
                  {cat.subcategories.length} subcategories
                </p>
                <div className="mt-2 flex items-center gap-1 text-brand-300 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  Shop Now <ArrowRight size={14} />
                </div>
              </div>

              {/* Badge */}
              {badge && (
                <div className={`absolute top-3 right-3 ${badge.cls}`}>
                  {badge.label}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
