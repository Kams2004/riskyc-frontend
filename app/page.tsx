"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { formatPrice } from "@/lib/data";
import { listProducts } from "@/lib/api/products";
import { useCategories } from "@/lib/useCategories";
import { Product } from "@/lib/types";
import ProductCard from "@/components/products/ProductCard";
import { FaIconPreview } from "@/components/admin/FaIconPicker";
import { SlidersHorizontal, X, ChevronDown, Search } from "@/components/icons/fa";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { localized } from "@/lib/i18n/localized";
import clsx from "clsx";

const sortOptions = [
  { value: "default", labelKey: "products.sort.featured" },
  { value: "price-asc", labelKey: "products.sort.priceAsc" },
  { value: "price-desc", labelKey: "products.sort.priceDesc" },
  { value: "rating", labelKey: "products.sort.rating" },
  { value: "newest", labelKey: "products.sort.newest" },
];

export default function ProductsPage() {
  return (
    <Suspense fallback={null}>
      <ProductsPageInner />
    </Suspense>
  );
}

function ProductsPageInner() {
  const { t, language } = useTranslation();
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const catParam = searchParams.get("cat") || "";

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { categories: allCategories } = useCategories();
  // A category with no storefront-visible products would just be a filter
  // option that always yields zero results — hide it here too.
  const categories = useMemo(() => allCategories.filter((c) => c.productCount > 0), [allCategories]);

  useEffect(() => {
    listProducts({ size: 200 })
      .then((page) => setProducts(page.content))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const [search, setSearch] = useState(query);
  const [selectedCat, setSelectedCat] = useState<string[]>(
    catParam ? [catParam] : []
  );
  const [selectedSub, setSelectedSub] = useState<string[]>([]);

  // Re-sync filters from the URL on every navigation to /products — without
  // this, clicking "All Products" while already on a filtered /products?cat=…
  // view leaves the stale filter in place (Next doesn't remount the page for
  // a query-only client-side navigation, so useState's initial value never re-runs).
  useEffect(() => {
    setSearch(query);
    setSelectedCat(catParam ? [catParam] : []);
    setSelectedSub([]);
  }, [query, catParam]);
  const [sort, setSort] = useState("default");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200000]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filtered = useMemo(() => {
    let list = [...products];

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description ?? "").toLowerCase().includes(q) ||
          p.tags.some((t) => t.includes(q))
      );
    }
    if (selectedCat.length) {
      list = list.filter((p) => selectedCat.includes(p.categorySlug));
    }
    if (selectedSub.length) {
      list = list.filter((p) => p.subcategorySlug && selectedSub.includes(p.subcategorySlug));
    }
    list = list.filter(
      (p) => p.price >= priceRange[0] && p.price <= priceRange[1]
    );

    switch (sort) {
      case "price-asc":
        list.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        list.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        list.sort((a, b) => b.rating - a.rating);
        break;
      case "newest":
        list = list.filter((p) => p.badge === "NEW").concat(list.filter((p) => p.badge !== "NEW"));
        break;
    }
    return list;
  }, [products, search, selectedCat, selectedSub, sort, priceRange]);

  const toggleCat = (id: string) =>
    setSelectedCat((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );

  const toggleSub = (id: string) =>
    setSelectedSub((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );

  const clearFilters = () => {
    setSelectedCat([]);
    setSelectedSub([]);
    setPriceRange([0, 200000]);
    setSearch("");
  };

  const hasFilters =
    selectedCat.length > 0 ||
    selectedSub.length > 0 ||
    search ||
    priceRange[0] > 0 ||
    priceRange[1] < 200000;

  // Flat list of all subcategories for the active categories (used in mobile pill row)
  const activeSubs = selectedCat.length
    ? categories.filter((c) => selectedCat.includes(c.slug)).flatMap((c) => c.subcategories).filter((s) => s.productCount > 0)
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="section-title">
            {search ? t("products.listing.searchResults", { query: search }) : t("products.listing.allProducts")}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {filtered.length === 1
              ? t("products.listing.productsFoundOne", { count: filtered.length })
              : t("products.listing.productsFoundOther", { count: filtered.length })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Sort */}
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2.5 pr-8 text-sm font-medium text-gray-700 cursor-pointer hover:border-brand-300 focus:outline-none focus:border-brand-400"
            >
              {sortOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {t(o.labelKey)}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-3.5 text-gray-400 pointer-events-none" />
          </div>

          {/* Filter toggle (mobile only) */}
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={clsx(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors lg:hidden",
              filtersOpen
                ? "bg-brand-500 text-white border-brand-500"
                : "bg-white text-gray-700 border-gray-200 hover:border-brand-300"
            )}
          >
            <SlidersHorizontal size={16} />
            {t("products.filters.title")}
            {hasFilters && (
              <span className="w-5 h-5 bg-white text-brand-600 rounded-full text-xs flex items-center justify-center font-bold">
                {selectedCat.length + selectedSub.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Mobile: horizontal scrollable category pills ── */}
      <div className="lg:hidden mb-4 space-y-2">
        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4">
          {/* "All" pill */}
          <button
            onClick={() => { setSelectedCat([]); setSelectedSub([]); }}
            className={clsx(
              "flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold border transition-all",
              selectedCat.length === 0
                ? "bg-brand-500 text-white border-brand-500 shadow-sm"
                : "bg-white text-gray-600 border-gray-200 hover:border-brand-300"
            )}
          >
            {t("products.filters.all")}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => toggleCat(cat.slug)}
              className={clsx(
                "flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold border transition-all whitespace-nowrap",
                selectedCat.includes(cat.slug)
                  ? "bg-brand-500 text-white border-brand-500 shadow-sm"
                  : "bg-white text-gray-600 border-gray-200 hover:border-brand-300"
              )}
            >
              <span className="flex items-center"><FaIconPreview value={cat.icon ?? "fa:solid:tag"} size={13} /></span>
              {localized(cat.name, cat.nameFr, language)}
            </button>
          ))}
        </div>

        {/* Subcategory pills — appear when a category is selected */}
        {activeSubs.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4">
            {activeSubs.map((sub) => (
              <button
                key={sub.slug}
                onClick={() => toggleSub(sub.slug)}
                className={clsx(
                  "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all whitespace-nowrap",
                  selectedSub.includes(sub.slug)
                    ? "bg-brand-100 text-brand-700 border-brand-400"
                    : "bg-gray-50 text-gray-500 border-gray-200 hover:border-brand-300 hover:text-brand-600"
                )}
              >
                {localized(sub.name, sub.nameFr, language)}
              </button>
            ))}
          </div>
        )}

        {/* Collapsible extra filters (search + price) on mobile */}
        {filtersOpen && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-4 mt-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm text-gray-900">{t("products.filters.moreFilters")}</span>
              {hasFilters && (
                <button onClick={clearFilters} className="text-xs text-brand-500 font-medium flex items-center gap-1">
                  <X size={12} /> {t("products.filters.clearAll")}
                </button>
              )}
            </div>
            {/* Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("products.filters.searchPlaceholder")}
                className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-brand-400"
              />
            </div>
            {/* Price range */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                {t("products.filters.priceRange")}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={priceRange[1]}
                  step={1000}
                  value={priceRange[0]}
                  onChange={(e) =>
                    setPriceRange([Math.min(Number(e.target.value) || 0, priceRange[1]), priceRange[1]])
                  }
                  placeholder={t("products.filters.min")}
                  className="w-full min-w-0 px-2.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-brand-400"
                />
                <span className="text-gray-400 text-sm flex-shrink-0">–</span>
                <input
                  type="number"
                  min={priceRange[0]}
                  max={200000}
                  step={1000}
                  value={priceRange[1]}
                  onChange={(e) =>
                    setPriceRange([priceRange[0], Math.max(Number(e.target.value) || 0, priceRange[0])])
                  }
                  placeholder={t("products.filters.max")}
                  className="w-full min-w-0 px-2.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-brand-400"
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{formatPrice(priceRange[0])}</span>
                <span>{formatPrice(priceRange[1])}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-6">
        {/* ── Desktop sidebar filters ── */}
        <aside className="w-64 flex-shrink-0 hidden lg:block">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-24">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">{t("products.filters.title")}</h3>
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-brand-500 hover:text-brand-600 font-medium flex items-center gap-1"
                >
                  <X size={12} /> {t("products.filters.clearAll")}
                </button>
              )}
            </div>

            {/* Search */}
            <div className="mb-5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                {t("products.filters.search")}
              </label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("products.filters.searchPlaceholder")}
                  className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-brand-400"
                />
              </div>
            </div>

            {/* Categories */}
            <div className="mb-5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block">
                {t("products.filters.category")}
              </label>
              <div className="space-y-2">
                {categories.map((cat) => (
                  <div key={cat.slug}>
                    <label className="flex items-center gap-2.5 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={selectedCat.includes(cat.slug)}
                        onChange={() => toggleCat(cat.slug)}
                        className="w-4 h-4 rounded accent-brand-500"
                      />
                      <span className="text-sm text-gray-700 group-hover:text-brand-600 font-medium flex items-center gap-1.5">
                        <FaIconPreview value={cat.icon ?? "fa:solid:tag"} size={13} /> {localized(cat.name, cat.nameFr, language)}
                      </span>
                    </label>
                    {selectedCat.includes(cat.slug) && (
                      <div className="ml-6 mt-1 space-y-1">
                        {cat.subcategories.filter((sub) => sub.productCount > 0).map((sub) => (
                          <label
                            key={sub.slug}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedSub.includes(sub.slug)}
                              onChange={() => toggleSub(sub.slug)}
                              className="w-3.5 h-3.5 rounded accent-brand-500"
                            />
                            <span className="text-xs text-gray-500 hover:text-brand-500">
                              {localized(sub.name, sub.nameFr, language)}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Price range */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block">
                {t("products.filters.priceRange")}
              </label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={priceRange[1]}
                    step={1000}
                    value={priceRange[0]}
                    onChange={(e) =>
                      setPriceRange([Math.min(Number(e.target.value) || 0, priceRange[1]), priceRange[1]])
                    }
                    placeholder={t("products.filters.min")}
                    className="w-full min-w-0 px-2.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-brand-400"
                  />
                  <span className="text-gray-400 text-sm flex-shrink-0">–</span>
                  <input
                    type="number"
                    min={priceRange[0]}
                    max={200000}
                    step={1000}
                    value={priceRange[1]}
                    onChange={(e) =>
                      setPriceRange([priceRange[0], Math.max(Number(e.target.value) || 0, priceRange[0])])
                    }
                    placeholder={t("products.filters.max")}
                    className="w-full min-w-0 px-2.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-brand-400"
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{formatPrice(priceRange[0])}</span>
                  <span>{formatPrice(priceRange[1])}</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Product grid — full width on mobile, flex-1 on desktop */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] rounded-2xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No products found
              </h3>
              <p className="text-gray-400 mb-6">
                Try adjusting your search or filters
              </p>
              <button onClick={clearFilters} className="btn-primary">
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-5">
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

