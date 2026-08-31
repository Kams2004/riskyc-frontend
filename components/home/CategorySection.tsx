"use client";

import Link from "next/link";
import { useCategories } from "@/lib/useCategories";
import { FaIconPreview } from "@/components/admin/FaIconPicker";
import { ArrowRight } from "@/components/icons/fa";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { localized } from "@/lib/i18n/localized";

export default function CategorySection() {
  const { categories } = useCategories();
  const categoriesWithImage = categories.filter((cat) => cat.imageUrl && cat.productCount > 0);
  const { t, language } = useTranslation();

  const categoryBadges: Record<string, { label: string; cls: string }> = {
    dresses: { label: t("home.categories.badges.new"), cls: "badge-new" },
    jerseys: { label: t("home.categories.badges.hot"), cls: "badge-hot" },
    fashion: { label: t("home.categories.badges.sale"), cls: "badge-sale" },
  };

  if (categoriesWithImage.length === 0) return null;

  return (
    <section className="py-16 px-4 sm:px-6 max-w-7xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="section-title mb-2">{t("home.categories.sectionTitle")}</h2>
        <p className="text-gray-500">{t("home.categories.sectionSubtitle")}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6">
        {categoriesWithImage.map((cat) => {
          const badge = categoryBadges[cat.slug];
          return (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="group relative overflow-hidden rounded-2xl aspect-[3/4] bg-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              {/* Background image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cat.imageUrl ?? undefined}
                alt={localized(cat.name, cat.nameFr, language)}
                className="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
              />

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <div className="text-4xl mb-2 text-white drop-shadow">
                  <FaIconPreview value={cat.icon ?? "fa:solid:tag"} size={32} />
                </div>
                <h3 className="text-white font-display font-bold text-xl leading-tight">
                  {localized(cat.name, cat.nameFr, language)}
                </h3>
                <p className="text-gray-300 text-sm mt-1">
                  {t("home.categories.subcategoriesCount", { count: cat.subcategories.length })}
                </p>
                <div className="mt-2 flex items-center gap-1 text-brand-300 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {t("home.categories.shopNow")} <ArrowRight size={14} />
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
