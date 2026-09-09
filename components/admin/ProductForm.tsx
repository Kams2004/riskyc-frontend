"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminStore } from "@/lib/adminStore";
import { useAdminColors } from "@/lib/useAdminColors";
import { useCategories } from "@/lib/useCategories";
import * as productsApi from "@/lib/api/products";
import { API_BASE_URL as apiBaseUrl } from "@/lib/apiClient";
import { Product, ProductColor, Badge, MediaItem, BulkPriceTier } from "@/lib/types";
import ImageMarkupEditor from "@/components/admin/ImageMarkupEditor";
import AlertDialog from "@/components/admin/AlertDialog";
import { useTranslation } from "@/lib/i18n/useTranslation";
import {
  Plus,
  Trash2,
  ArrowLeft,
  Save,
  Image as ImageIcon,
  Layers,
  DollarSign,
  Palette,
  Info,
  Upload,
  Film,
  Eye,
  EyeOff,
  Pencil,
  ChevronLeft,
  ChevronRight,
  Lock,
} from "lucide-react";
import clsx from "clsx";

interface Props {
  initial?: Product;
  mode: "new" | "edit";
}

interface FormState {
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  categorySlug: string;
  subcategorySlug?: string;
  colors: ProductColor[];
  bulkPrices: BulkPriceTier[];
  sizes: string[];
  rating: number;
  reviews: number;
  badge?: Badge;
  tags: string[];
  hidden: boolean;
}

const emptyForm = (): FormState => ({
  name: "",
  description: "",
  price: 0,
  originalPrice: undefined,
  categorySlug: "",
  subcategorySlug: "",
  colors: [],
  bulkPrices: [],
  sizes: ["XS", "S", "M", "L", "XL"],
  rating: 4.5,
  reviews: 0,
  badge: undefined,
  tags: [],
  hidden: false,
});

// Cleans up freeform size entry — admins type things like "m.l.xl.xxl.xxxl"
// or "s/ m /l" instead of the expected "S, M, L" comma format. Splits on any
// run of common separators, not just commas, and normalizes case.
function normalizeSizes(raw: string): string[] {
  return Array.from(
    new Set(
      raw
        .split(/[,;/|.\s]+/)
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean)
    )
  );
}

interface PendingFile {
  file: File;
  previewUrl: string;
}

export default function ProductForm({ initial, mode }: Props) {
  const router = useRouter();
  const token = useAdminStore((s) => s.session?.token);
  const hasPermission = useAdminStore((s) => s.hasPermission);
  const { categories } = useCategories();
  const c = useAdminColors();
  const isDark = c.isDark;
  const { t } = useTranslation();

  // In create mode the whole form is already gated behind CREATE_PRODUCT at
  // the page level (see app/admin/products/new/page.tsx) — section locking
  // only applies to editing an existing product.
  const canUpdateInfo = mode === "new" || hasPermission("UPDATE_PRODUCT_INFO");
  const canUpdatePricing = mode === "new" || hasPermission("UPDATE_PRODUCT_PRICING");
  const canUpdateImages = mode === "new" || hasPermission("UPDATE_PRODUCT_IMAGES");
  const canUpdateColors = mode === "new" || hasPermission("UPDATE_PRODUCT_COLORS");
  const canUpdateStock = mode === "new" || hasPermission("UPDATE_PRODUCT_STOCK");
  const canUpdateDisplay = mode === "new" || hasPermission("UPDATE_PRODUCT_DISPLAY");
  const canUpdateVisibility = mode === "new" || hasPermission("UPDATE_PRODUCT_VISIBILITY");

  const [form, setForm] = useState<FormState>(
    initial
      ? {
          name: initial.name,
          description: initial.description ?? "",
          price: initial.price,
          originalPrice: initial.originalPrice ?? undefined,
          categorySlug: initial.categorySlug,
          subcategorySlug: initial.subcategorySlug ?? "",
          colors: initial.colors,
          bulkPrices: initial.bulkPrices ?? [],
          sizes: initial.sizes,
          rating: initial.rating,
          reviews: initial.reviews,
          badge: initial.badge ?? undefined,
          tags: initial.tags,
          hidden: initial.hidden,
        }
      : emptyForm()
  );
  const [existingMedia, setExistingMedia] = useState<MediaItem[]>(initial?.media ?? []);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [createdName, setCreatedName] = useState<string | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [markupTarget, setMarkupTarget] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Default to the first category/subcategory once categories load, for new products
  useEffect(() => {
    if (mode !== "new" || form.categorySlug || categories.length === 0) return;
    const first = categories[0];
    setForm((f) => ({ ...f, categorySlug: first.slug, subcategorySlug: first.subcategories[0]?.slug ?? "" }));
  }, [categories, mode, form.categorySlug]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = t("adminProducts.form.nameRequiredError");
    if (existingMedia.length === 0 && pendingFiles.length === 0) e.images = t("adminProducts.form.imagesRequiredError");
    if (form.colors.some((c) => !c.name.trim())) e.colors = t("adminProducts.form.colorsError");
    if (form.bulkPrices.some((tier) => tier.quantity <= 0 || tier.price <= 0)) e.bulkPrices = t("adminProducts.form.bulkPricesError");
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }
    if (!token) return;
    setSaving(true);
    setErrors({});
    try {
      if (mode === "new") {
        const input: productsApi.ProductInput = {
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          price: form.price,
          originalPrice: form.originalPrice,
          categorySlug: form.categorySlug,
          subcategorySlug: form.subcategorySlug || undefined,
          sizes: form.sizes,
          tags: form.tags,
          badge: form.badge,
          hidden: form.hidden,
          rating: form.rating,
          reviews: form.reviews,
          colors: form.colors,
          bulkPrices: [...form.bulkPrices].sort((a, b) => a.quantity - b.quantity),
        };
        const product = await productsApi.createProduct(input, token);
        for (const pf of pendingFiles) {
          await productsApi.uploadProductMedia(product.id, pf.file, token);
        }
        setSaving(false);
        setCreatedName(product.name);
        return;
      } else {
        // Edit mode only ever submits the sections this admin actually has
        // permission for (the rest are blurred/disabled, so their values in
        // `form` are already untouched — but the permission check here is
        // the real boundary, not the UI) — and only when that section is
        // actually dirty, to avoid spamming the audit log with no-op saves.
        const sorted = [...form.bulkPrices].sort((a, b) => a.quantity - b.quantity);
        const initialSorted = [...(initial!.bulkPrices ?? [])].sort((a, b) => a.quantity - b.quantity);
        const calls: Promise<unknown>[] = [];

        if (
          canUpdateInfo &&
          (form.name.trim() !== initial!.name ||
            form.description.trim() !== (initial!.description ?? "") ||
            form.categorySlug !== initial!.categorySlug ||
            (form.subcategorySlug || "") !== (initial!.subcategorySlug ?? ""))
        ) {
          calls.push(
            productsApi.updateProductInfo(
              initial!.id,
              {
                name: form.name.trim(),
                description: form.description.trim() || undefined,
                categorySlug: form.categorySlug,
                subcategorySlug: form.subcategorySlug || undefined,
              },
              token
            )
          );
        }

        if (
          canUpdatePricing &&
          (form.price !== initial!.price ||
            (form.originalPrice ?? null) !== (initial!.originalPrice ?? null) ||
            JSON.stringify(sorted) !== JSON.stringify(initialSorted))
        ) {
          calls.push(
            productsApi.updateProductPricing(
              initial!.id,
              { price: form.price, originalPrice: form.originalPrice, bulkPrices: sorted },
              token
            )
          );
        }

        const colorIdentity = (list: ProductColor[]) => JSON.stringify(list.map((cl) => ({ id: cl.id, name: cl.name, hex: cl.hex })));
        if (canUpdateColors && colorIdentity(form.colors) !== colorIdentity(initial!.colors)) {
          calls.push(productsApi.updateProductColors(initial!.id, form.colors, token));
        }

        const colorStock = (list: ProductColor[]) => JSON.stringify(list.filter((cl) => cl.id).map((cl) => ({ id: cl.id, stock: cl.stock ?? null })));
        if (canUpdateStock && colorStock(form.colors) !== colorStock(initial!.colors)) {
          calls.push(
            productsApi.updateProductStock(
              initial!.id,
              form.colors.filter((cl) => cl.id).map((cl) => ({ id: cl.id!, stock: cl.stock ?? null })),
              token
            )
          );
        }

        if (
          canUpdateDisplay &&
          (form.badge !== initial!.badge ||
            JSON.stringify(form.sizes) !== JSON.stringify(initial!.sizes) ||
            form.rating !== initial!.rating ||
            form.reviews !== initial!.reviews)
        ) {
          calls.push(
            productsApi.updateProductDisplay(
              initial!.id,
              { badge: form.badge, sizes: form.sizes, rating: form.rating, reviews: form.reviews },
              token
            )
          );
        }

        if (canUpdateVisibility && form.hidden !== initial!.hidden) {
          calls.push(productsApi.setProductVisibility(initial!.id, form.hidden, token));
        }

        await Promise.all(calls);

        if (canUpdateImages) {
          for (const pf of pendingFiles) {
            await productsApi.uploadProductMedia(initial!.id, pf.file, token);
          }
        }
      }

      setSaved(true);
      setTimeout(() => router.push("/admin/products"), 800);
    } catch (err) {
      setErrors({ save: err instanceof Error ? err.message : t("adminProducts.form.saveError") });
      setSaving(false);
    }
  };

  const updateColor = (i: number, patch: Partial<ProductColor>) =>
    setForm((f) => ({
      ...f,
      colors: f.colors.map((col, idx) =>
        idx === i ? { ...col, ...patch } : col
      ),
    }));

  const addColor = () =>
    setForm((f) => ({
      ...f,
      colors: [...f.colors, { name: "", hex: "#888888" }],
    }));

  const removeColor = (i: number) =>
    setForm((f) => ({
      ...f,
      colors: f.colors.filter((_, idx) => idx !== i),
    }));

  const addBulkTier = () =>
    setForm((f) => ({
      ...f,
      bulkPrices: [...f.bulkPrices, { quantity: 0, price: 0 }],
    }));

  const updateBulkTier = (i: number, patch: Partial<BulkPriceTier>) =>
    setForm((f) => ({
      ...f,
      bulkPrices: f.bulkPrices.map((t, idx) => (idx === i ? { ...t, ...patch } : t)),
    }));

  const removeBulkTier = (i: number) =>
    setForm((f) => ({
      ...f,
      bulkPrices: f.bulkPrices.filter((_, idx) => idx !== i),
    }));

  // ── Image / video file picker ───────────────────────────────────
  const handlePickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setPendingFiles((prev) => [
      ...prev,
      ...files.map((file) => ({ file, previewUrl: URL.createObjectURL(file) })),
    ]);
    e.target.value = "";
  };

  const removeExistingMedia = async (mediaId: string) => {
    if (!token) return;
    await productsApi.deleteMedia(mediaId, token);
    setExistingMedia((prev) => prev.filter((m) => m.id !== mediaId));
  };

  const removePendingFile = (previewUrl: string) => {
    setPendingFiles((prev) => prev.filter((pf) => pf.previewUrl !== previewUrl));
    URL.revokeObjectURL(previewUrl);
  };

  // Swaps one image for a hand-marked-up version — for an already-uploaded
  // image this replaces it on the server right away (same pattern as
  // removeExistingMedia); for a not-yet-uploaded pick it just swaps the
  // local File, no network call until the main Save.
  const handleMarkupSave = async (index: number, file: File) => {
    // existingMedia is only ever populated in edit mode (seeded from `initial`),
    // so reaching this branch implies `initial` is set.
    if (index < existingMedia.length) {
      if (!token) return;
      const old = existingMedia[index];
      const uploaded = await productsApi.uploadProductMedia(initial!.id, file, token);
      await productsApi.deleteMedia(old.id, token);
      setExistingMedia((prev) => prev.map((m, i) => (i === index ? uploaded : m)));
    } else {
      const j = index - existingMedia.length;
      setPendingFiles((prev) =>
        prev.map((pf, i) => {
          if (i !== j) return pf;
          URL.revokeObjectURL(pf.previewUrl);
          return { file, previewUrl: URL.createObjectURL(file) };
        })
      );
    }
  };

  // Removing a media item can shift every index after it — keep the
  // preview cursor pointing at the same image.
  const handleRemoveAt = (i: number) => {
    if (i < existingMedia.length) {
      removeExistingMedia(existingMedia[i].id);
    } else {
      removePendingFile(pendingFiles[i - existingMedia.length].previewUrl);
    }
    setPreviewIndex((p) => (p > i ? p - 1 : p));
  };

  type DisplayMedia = { key: string; url: string; isVideo: boolean };
  const displayMedia: DisplayMedia[] = [
    ...existingMedia.map((m) => ({
      key: m.id,
      url: m.presignedUrl,
      isVideo: m.type === "VIDEO",
    })),
    ...pendingFiles.map((pf) => ({
      key: pf.previewUrl,
      url: pf.previewUrl,
      isVideo: pf.file.type.startsWith("video/"),
    })),
  ];
  const clampedPreviewIndex = Math.min(previewIndex, Math.max(0, displayMedia.length - 1));

  const selectedCategory = categories.find((cat) => cat.slug === form.categorySlug);

  // ── Shared input style that respects theme ──────────────────────
  const inp = (err?: string) =>
    clsx(
      "w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors",
      isDark
        ? "bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-brand-500"
        : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-brand-400",
      err && "!border-red-400"
    );

  const inpSm = clsx(
    "border rounded-xl px-3 py-2 text-sm focus:outline-none transition-colors",
    isDark
      ? "bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-brand-500"
      : "bg-white border-gray-300 text-gray-900 focus:border-brand-400"
  );

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center gap-4 flex-wrap">
        <button
          onClick={() => router.back()}
          className={clsx(
            "flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors",
            isDark
              ? "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
          )}
        >
          <ArrowLeft size={16} />
          {t("adminProducts.common.back")}
        </button>
        <h1 className={clsx("text-2xl font-bold", c.textPrimary)}>
          {mode === "new" ? t("adminProducts.form.addTitle") : t("adminProducts.form.editTitle", { name: initial?.name ?? "" })}
        </h1>
      </div>

      {errors.save && (
        <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          ⚠ {errors.save}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left column ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* BASIC INFO */}
          <Locked granted={canUpdateInfo} isDark={isDark}>
          <Section title={t("adminProducts.form.basicInfoTitle")} icon={<Info size={15} />} isDark={isDark} c={c}>
            <div className="space-y-4">
              <Field label={t("adminProducts.form.productNameLabel")} error={errors.name} isDark={isDark} c={c}>
                <input
                  className={inp(errors.name)}
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder={t("adminProducts.form.productNamePlaceholder")}
                />
              </Field>

              <Field label={t("adminProducts.form.descriptionLabel")} isDark={isDark} c={c}>
                <textarea
                  className={clsx(inp(), "resize-none")}
                  rows={4}
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  placeholder={t("adminProducts.form.descriptionPlaceholder")}
                />
              </Field>
            </div>
          </Section>
          </Locked>

          {/* CATEGORIES CONFIG */}
          <Locked granted={canUpdateInfo} isDark={isDark}>
          <Section title={t("adminProducts.form.categoryConfigTitle")} icon={<Layers size={15} />} isDark={isDark} c={c}>
            <div className="space-y-3">
              <p className={clsx("text-xs", c.textSecondary)}>
                {t("adminProducts.form.categoryConfigHint")}
              </p>
              <div className="space-y-2">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className={clsx(
                      "rounded-xl border p-3",
                      isDark ? "bg-gray-900/40 border-gray-700" : "bg-gray-50 border-gray-200"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className={clsx("font-semibold text-sm", c.textPrimary)}>
                        {cat.name}
                      </span>
                      <span className={clsx("ml-auto text-xs px-2 py-0.5 rounded-full", isDark ? "bg-gray-700 text-gray-400" : "bg-gray-200 text-gray-500")}>
                        {t("adminProducts.form.subcategoriesCount", { count: cat.subcategories.length })}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {cat.subcategories.map((sub) => (
                        <button
                          key={sub.id}
                          onClick={() =>
                            setForm((f) => ({
                              ...f,
                              categorySlug: cat.slug,
                              subcategorySlug: sub.slug,
                            }))
                          }
                          className={clsx(
                            "text-xs px-2.5 py-1 rounded-full border transition-all",
                            form.categorySlug === cat.slug && form.subcategorySlug === sub.slug
                              ? "bg-brand-500 text-white border-brand-500"
                              : isDark
                              ? "bg-gray-800 text-gray-400 border-gray-700 hover:border-brand-500 hover:text-brand-400"
                              : "bg-white text-gray-600 border-gray-200 hover:border-brand-400 hover:text-brand-500"
                          )}
                        >
                          {sub.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <p className={clsx("text-xs italic", c.textMuted)}>
                {t("adminProducts.form.assignHint")}{" "}
                <span className="text-brand-500 font-medium not-italic">
                  {selectedCategory?.name} →{" "}
                  {selectedCategory?.subcategories.find((s) => s.slug === form.subcategorySlug)?.name}
                </span>
              </p>
            </div>
          </Section>
          </Locked>

          {/* PRICING */}
          <Locked granted={canUpdatePricing} isDark={isDark}>
          <Section title={t("adminProducts.form.pricingTitle")} icon={<DollarSign size={15} />} isDark={isDark} c={c}>
            <div className="grid grid-cols-2 gap-4">
              <Field label={t("adminProducts.form.priceLabel")} isDark={isDark} c={c}>
                <input
                  type="number"
                  className={inp()}
                  value={form.price || ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, price: Number(e.target.value) }))
                  }
                  placeholder={t("adminProducts.form.pricePlaceholder")}
                />
              </Field>
              <Field label={t("adminProducts.form.originalPriceLabel")} isDark={isDark} c={c}>
                <input
                  type="number"
                  className={inp()}
                  value={form.originalPrice || ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      originalPrice: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    }))
                  }
                  placeholder={t("adminProducts.form.originalPricePlaceholder")}
                />
              </Field>
            </div>
            {form.price > 0 && form.originalPrice && form.originalPrice > form.price && (
              <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-xs text-green-600 font-medium">
                {t("adminProducts.form.discountPreview", {
                  percent: Math.round(((form.originalPrice - form.price) / form.originalPrice) * 100),
                  amount: new Intl.NumberFormat("fr-CM", { style: "currency", currency: "XAF", minimumFractionDigits: 0 }).format(form.originalPrice - form.price),
                })}
              </div>
            )}

            {/* Bulk / grouped pricing — "buy N for this total", unrelated to the unit price above */}
            <div className={clsx("mt-5 pt-5 border-t", isDark ? "border-gray-700" : "border-gray-200")}>
              <div className="flex items-center justify-between mb-1">
                <label className={clsx("text-xs font-semibold uppercase tracking-wide", c.textMuted)}>
                  {t("adminProducts.form.bulkPricingLabel")}
                </label>
                <button
                  type="button"
                  onClick={addBulkTier}
                  className="flex items-center gap-1 text-xs text-brand-500 hover:text-brand-600 font-medium transition-colors"
                >
                  <Plus size={13} /> {t("adminProducts.form.addTierButton")}
                </button>
              </div>
              <p className={clsx("text-[11px] mb-3", c.textMuted)}>
                {t("adminProducts.form.bulkPricingHint")}
              </p>

              {form.bulkPrices.length > 0 && (
                <div className="space-y-2">
                  {form.bulkPrices.map((tier, i) => (
                    <div key={i} className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <input
                          type="number"
                          min={1}
                          className={clsx(inpSm, "w-16")}
                          value={tier.quantity || ""}
                          onChange={(e) => updateBulkTier(i, { quantity: Number(e.target.value) })}
                          placeholder={t("adminProducts.form.qtyPlaceholder")}
                        />
                        <span className={clsx("text-sm flex-shrink-0", c.textMuted)}>{t("adminProducts.form.unitsEquals")}</span>
                      </div>
                      <input
                        type="number"
                        min={1}
                        className={clsx(inpSm, "flex-1 min-w-[100px]")}
                        value={tier.price || ""}
                        onChange={(e) => updateBulkTier(i, { price: Number(e.target.value) })}
                        placeholder={t("adminProducts.form.totalPricePlaceholder")}
                      />
                      <span className={clsx("text-xs flex-shrink-0", c.textMuted)}>{t("adminProducts.form.xafLabel")}</span>
                      <button
                        type="button"
                        onClick={() => removeBulkTier(i)}
                        className="text-red-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0"
                        title={t("adminProducts.form.removeTierTitle")}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {errors.bulkPrices && (
                <p className="text-red-500 text-xs mt-2 flex items-center gap-1">⚠ {errors.bulkPrices}</p>
              )}

              {/* Live preview — exactly what the shopper will see under the price on the product page */}
              {form.bulkPrices.some((t) => t.quantity > 0 && t.price > 0) && (
                <div className={clsx("mt-3 p-3 rounded-xl border", isDark ? "bg-gray-900/50 border-gray-700" : "bg-gray-50 border-gray-200")}>
                  <p className={clsx("text-[10px] uppercase tracking-wide font-semibold mb-1.5", c.textMuted)}>
                    {t("adminProducts.form.bulkPreviewLabel")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {form.bulkPrices
                      .filter((t) => t.quantity > 0 && t.price > 0)
                      .sort((a, b) => a.quantity - b.quantity)
                      .map((t, i) => (
                        <span
                          key={i}
                          className={clsx(
                            "text-xs font-semibold px-2.5 py-1 rounded-full",
                            isDark ? "bg-gray-800 text-gray-200" : "bg-white text-gray-700 border border-gray-200"
                          )}
                        >
                          {t.quantity} = {new Intl.NumberFormat("fr-CM", { style: "currency", currency: "XAF", minimumFractionDigits: 0 }).format(t.price)}
                        </span>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </Section>
          </Locked>

          {/* IMAGES */}
          <Locked granted={canUpdateImages} isDark={isDark}>
          <Section title={t("adminProducts.form.imagesTitle")} icon={<ImageIcon size={15} />} error={errors.images} isDark={isDark} c={c}>
            <div className="space-y-3">
              {/* Hidden file input — accepts images and videos */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={handlePickFiles}
              />

              {/* Drop zone / picker button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={clsx(
                  "w-full flex flex-col items-center gap-2 py-8 rounded-2xl border-2 border-dashed transition-colors group",
                  isDark
                    ? "border-gray-700 hover:border-brand-500 bg-gray-900/30"
                    : "border-gray-200 hover:border-brand-400 bg-gray-50"
                )}
              >
                <div className={clsx(
                  "flex items-center gap-3 text-3xl",
                  isDark ? "text-gray-600 group-hover:text-brand-400" : "text-gray-300 group-hover:text-brand-400"
                )}>
                  <ImageIcon size={28} />
                  <Film size={28} />
                </div>
                <div className="text-center">
                  <p className={clsx("text-sm font-semibold", isDark ? "text-gray-400 group-hover:text-white" : "text-gray-500 group-hover:text-gray-800")}>
                    <Upload size={13} className="inline mr-1" />
                    {t("adminProducts.form.pickFilesLabel")}
                  </p>
                  <p className={clsx("text-xs mt-0.5", c.textMuted)}>
                    {t("adminProducts.form.pickFilesHint")}
                  </p>
                </div>
              </button>

              {/* Previews */}
              {displayMedia.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {displayMedia.map((m, i) => (
                    <div key={m.key} className="relative group aspect-square rounded-xl overflow-hidden border bg-gray-100">
                      {m.isVideo ? (
                        <video
                          src={m.url}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                        />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.url} alt="" className="w-full h-full object-cover" />
                      )}
                      {/* Hover overlay — draw / remove */}
                      <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!m.isVideo && (
                          <button
                            type="button"
                            onClick={() => setMarkupTarget(i)}
                            title={t("adminProducts.form.drawOnImageTitle")}
                            className="w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center text-gray-700"
                          >
                            <Pencil size={14} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveAt(i)}
                          title={t("adminProducts.form.removeTitle")}
                          className="w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center text-red-500"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      {/* Index badge */}
                      <span className="absolute top-1 left-1 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                        {i + 1}
                      </span>
                      {m.isVideo && (
                        <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                          <Film size={9} /> {t("adminProducts.form.videoLabel")}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Section>
          </Locked>

          {/* COLORS & STOCK — split per control, not the whole section: name/hex/add/remove
              need UPDATE_PRODUCT_COLORS, the stock number needs UPDATE_PRODUCT_STOCK. */}
          <Section title={t("adminProducts.form.colorsStockTitle")} icon={<Palette size={15} />} error={errors.colors} isDark={isDark} c={c}>
            <div className="space-y-3">
              {form.colors.map((color, i) => (
                <div
                  key={i}
                  className={clsx(
                    "flex flex-wrap gap-3 items-center p-3 rounded-xl border",
                    isDark
                      ? "bg-gray-900/50 border-gray-700"
                      : "bg-gray-50 border-gray-200"
                  )}
                >
                  <Locked granted={canUpdateColors} isDark={isDark}>
                  <div className="flex items-center gap-3 flex-1 min-w-[160px]">
                    {/* Color picker */}
                    <ColorPicker
                      value={color.hex}
                      onChange={(hex) => updateColor(i, { hex })}
                      isDark={isDark}
                    />
                    {/* Color name — typing a recognized color name/hex auto-updates
                        the swatch too, so picking the swatch is only needed when
                        the name doesn't map to a real color (e.g. a made-up name). */}
                    <input
                      className={clsx(inpSm, "flex-1 min-w-0")}
                      value={color.name}
                      onChange={(e) => {
                        const name = e.target.value;
                        const resolved = resolveCssColor(name);
                        updateColor(i, resolved ? { name, hex: resolved } : { name });
                      }}
                      placeholder={t("adminProducts.form.colorNamePlaceholder")}
                    />
                  </div>
                  </Locked>
                  {/* Stock (optional) — separately permissioned from the name/swatch above. */}
                  <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
                    <Locked granted={canUpdateStock} isDark={isDark}>
                    <input
                      type="number"
                      className={clsx(inpSm, "w-16 text-center")}
                      value={color.stock ?? ""}
                      onChange={(e) =>
                        updateColor(i, {
                          stock: e.target.value === "" ? undefined : Number(e.target.value),
                        })
                      }
                      min={0}
                      placeholder={t("adminProducts.form.stockQtyPlaceholder")}
                      title={t("adminProducts.form.stockQtyTitle")}
                    />
                    </Locked>
                    <span className={clsx("text-xs", c.textMuted)}>{t("adminProducts.form.unitsLabel")}</span>
                    {/* Remove — a colors action (add/remove), not a stock one. */}
                    <button
                      onClick={() => removeColor(i)}
                      disabled={!canUpdateColors}
                      className="text-red-400 hover:text-red-500 disabled:opacity-30 disabled:hover:text-red-400 disabled:cursor-not-allowed p-1.5 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0"
                      title={canUpdateColors ? t("adminProducts.form.removeColorTitle") : t("adminProducts.form.sectionLocked")}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}

              {/* Stock summary */}
              {form.colors.length > 0 && (
                <div className={clsx("flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium", isDark ? "bg-gray-800 text-gray-400" : "bg-gray-100 text-gray-500")}>
                  <span>{t("adminProducts.form.totalStockLabel")}</span>
                  <span className={clsx("font-bold", c.textPrimary)}>
                    {form.colors.reduce((s, col) => s + (col.stock ?? 0), 0)} {t("adminProducts.form.unitsLabel")}
                  </span>
                  <span className="ml-2">·</span>
                  <span>
                    {form.colors.length === 1
                      ? t("adminProducts.form.colorCountOne", { count: form.colors.length })
                      : t("adminProducts.form.colorCountOther", { count: form.colors.length })}
                  </span>
                </div>
              )}

              <button
                onClick={addColor}
                disabled={!canUpdateColors}
                className="flex items-center gap-2 text-xs text-brand-500 hover:text-brand-600 disabled:opacity-30 disabled:hover:text-brand-500 disabled:cursor-not-allowed font-medium transition-colors"
              >
                <Plus size={13} /> {t("adminProducts.form.addColorButton")}
              </button>
            </div>
          </Section>
        </div>

        {/* ── Right column ── */}
        <div className="space-y-5">
          {/* DISPLAY OPTIONS */}
          <Section title={t("adminProducts.form.displayTitle")} icon={<Info size={15} />} isDark={isDark} c={c}>
            <div className="space-y-4">
              <Locked granted={canUpdateVisibility} isDark={isDark}>
              <Field label={t("adminProducts.form.visibilityLabel")} isDark={isDark} c={c}>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, hidden: !f.hidden }))}
                  className={clsx(
                    "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-colors",
                    form.hidden
                      ? isDark
                        ? "bg-gray-800 border-gray-700 text-gray-400"
                        : "bg-gray-100 border-gray-200 text-gray-500"
                      : "bg-green-500/10 border-green-500/30 text-green-600"
                  )}
                >
                  {form.hidden ? <EyeOff size={16} /> : <Eye size={16} />}
                  {form.hidden ? t("adminProducts.form.hiddenFromStorefront") : t("adminProducts.form.visibleOnStorefront")}
                  <span className={clsx("ml-auto text-xs font-medium px-2 py-0.5 rounded-full", form.hidden ? (isDark ? "bg-gray-700 text-gray-400" : "bg-gray-200 text-gray-500") : "bg-green-500 text-white")}>
                    {form.hidden ? t("adminProducts.form.hiddenChip") : t("adminProducts.form.visibleChip")}
                  </span>
                </button>
              </Field>
              </Locked>

              <Locked granted={canUpdateDisplay} isDark={isDark}>
              <div className="space-y-4">
              <Field label={t("adminProducts.form.badgeLabel")} isDark={isDark} c={c}>
                <select
                  className={inp()}
                  value={form.badge || ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      badge:
                        (e.target.value as Badge) ||
                        undefined,
                    }))
                  }
                >
                  <option value="">{t("adminProducts.form.noBadgeOption")}</option>
                  <option value="NEW">{t("adminProducts.form.newBadgeOption")}</option>
                  <option value="SALE">{t("adminProducts.form.saleBadgeOption")}</option>
                  <option value="HOT">{t("adminProducts.form.hotBadgeOption")}</option>
                </select>
              </Field>

              <Field label={t("adminProducts.form.sizesLabel")} isDark={isDark} c={c}>
                <input
                  className={inp()}
                  value={(form.sizes || []).join(", ")}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      sizes: e.target.value
                        .split(",")
                        .map((s) => s.trim()),
                    }))
                  }
                  onBlur={() =>
                    setForm((f) => ({
                      ...f,
                      sizes: normalizeSizes(f.sizes.join(", ")),
                    }))
                  }
                  placeholder={t("adminProducts.form.sizesPlaceholder")}
                />
                <p className={clsx("text-[11px] mt-1", c.textMuted)}>
                  {t("adminProducts.form.sizesHint")}
                </p>
              </Field>

              {/* Size presets */}
              <div>
                <p className={clsx("text-xs mb-2", c.textMuted)}>{t("adminProducts.form.quickPresetsLabel")}</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: t("adminProducts.form.presetXsXl"), val: "XS, S, M, L, XL" },
                    { label: t("adminProducts.form.presetXs2Xl"), val: "XS, S, M, L, XL, 2XL" },
                    { label: t("adminProducts.form.presetOneSize"), val: "One Size" },
                  ].map((p) => (
                    <button
                      key={p.label}
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          sizes: p.val.split(", "),
                        }))
                      }
                      className={clsx(
                        "text-xs px-2.5 py-1 rounded-full border transition-all",
                        isDark
                          ? "bg-gray-800 text-gray-400 border-gray-700 hover:border-brand-500 hover:text-brand-400"
                          : "bg-gray-50 text-gray-600 border-gray-200 hover:border-brand-400 hover:text-brand-500"
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label={t("adminProducts.form.ratingLabel")} isDark={isDark} c={c}>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    className={inp()}
                    value={form.rating}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        rating: Number(e.target.value),
                      }))
                    }
                  />
                </Field>
                <Field label={t("adminProducts.form.reviewCountLabel")} isDark={isDark} c={c}>
                  <input
                    type="number"
                    min="0"
                    className={inp()}
                    value={form.reviews}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        reviews: Number(e.target.value),
                      }))
                    }
                  />
                </Field>
              </div>
              </div>
              </Locked>
            </div>
          </Section>

          {/* IMAGE / VIDEO PREVIEW */}
          {displayMedia.length > 0 && (
            <Section title={t("adminProducts.form.previewTitle")} isDark={isDark} c={c}>
              <div
                className={clsx(
                  "relative rounded-xl overflow-hidden aspect-[3/4] border",
                  isDark ? "bg-gray-900 border-gray-700" : "bg-gray-100 border-gray-200"
                )}
              >
                {displayMedia[clampedPreviewIndex].isVideo ? (
                  <video
                    src={displayMedia[clampedPreviewIndex].url}
                    className="w-full h-full object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={displayMedia[clampedPreviewIndex].url}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Switch which uploaded image is being previewed */}
                {displayMedia.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setPreviewIndex((p) => (p - 1 + displayMedia.length) % displayMedia.length)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center hover:bg-white transition-colors"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewIndex((p) => (p + 1) % displayMedia.length)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center hover:bg-white transition-colors"
                    >
                      <ChevronRight size={16} />
                    </button>
                    <span className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                      {clampedPreviewIndex + 1} / {displayMedia.length}
                    </span>
                  </>
                )}
              </div>

              <p className={clsx("text-xs text-center mt-2 font-medium", c.textSecondary)}>
                {form.name || t("adminProducts.form.productNameFallback")}
              </p>
              {form.badge && (
                <div className="flex justify-center mt-1">
                  <span className={clsx("text-xs font-bold px-2 py-0.5 rounded-full",
                    form.badge === "NEW" ? "bg-emerald-500 text-white"
                    : form.badge === "SALE" ? "bg-brand-500 text-white"
                    : "bg-orange-500 text-white"
                  )}>
                    {form.badge}
                  </span>
                </div>
              )}

              {!displayMedia[clampedPreviewIndex].isVideo && (
                <button
                  type="button"
                  onClick={() => setMarkupTarget(clampedPreviewIndex)}
                  className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-brand-500 hover:bg-brand-600 text-white transition-colors"
                >
                  <Pencil size={14} /> {t("adminProducts.form.drawOnImageTitle")}
                </button>
              )}
            </Section>
          )}

          {markupTarget !== null && (
            <ImageMarkupEditor
              // Pending picks are already same-origin blob: URLs. Already-uploaded
              // media live on MinIO (a different origin, no CORS there — see
              // MediaController) — route those through our own API instead, which
              // does allow our origin, so the canvas export isn't tainted.
              imageUrl={
                markupTarget < existingMedia.length
                  ? `${apiBaseUrl}/api/media/${existingMedia[markupTarget].id}/content`
                  : displayMedia[markupTarget].url
              }
              onCancel={() => setMarkupTarget(null)}
              onSave={async (file) => {
                const idx = markupTarget;
                setMarkupTarget(null);
                await handleMarkupSave(idx, file);
              }}
            />
          )}

          {/* SAVE BUTTON */}
          <button
            onClick={handleSave}
            disabled={saving || saved}
            className={clsx(
              "w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-base transition-all",
              saved
                ? "bg-green-500 text-white"
                : "bg-brand-500 hover:bg-brand-600 text-white shadow-xl shadow-brand-500/25 disabled:opacity-60 active:scale-[0.98]"
            )}
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : saved ? (
              t("adminProducts.form.savedSuccess")
            ) : (
              <>
                <Save size={18} />
                {mode === "new" ? t("adminProducts.form.createProductButton") : t("adminProducts.form.saveChangesButton")}
              </>
            )}
          </button>

          {/* Discard */}
          <button
            onClick={() => router.back()}
            className={clsx(
              "w-full py-2.5 rounded-xl text-sm font-medium transition-colors",
              isDark
                ? "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
            )}
          >
            {t("adminProducts.form.discardChanges")}
          </button>
        </div>
      </div>
      <AlertDialog
        title={t("adminProducts.form.productCreatedTitle")}
        message={createdName ? t("adminProducts.form.productCreatedMessage", { name: createdName }) : null}
        variant="success"
        onClose={() => router.push("/admin/products")}
      />
    </div>
  );
}

/* ── Shared sub-components ── */
function Section({
  title,
  icon,
  children,
  error,
  isDark,
  c,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  error?: string;
  isDark: boolean;
  c: ReturnType<typeof useAdminColors>;
}) {
  return (
    <div
      className={clsx(
        "rounded-2xl border p-5 transition-colors",
        isDark
          ? "bg-gray-800/50 border-gray-700/60"
          : "bg-white border-gray-200 shadow-sm"
      )}
    >
      <div className="flex items-center gap-2 mb-4">
        {icon && (
          <span className={clsx("opacity-60", c.textPrimary)}>{icon}</span>
        )}
        <h2
          className={clsx(
            "font-semibold text-xs uppercase tracking-wider",
            c.textSecondary
          )}
        >
          {title}
        </h2>
      </div>
      {error && (
        <div className="flex items-center gap-2 text-red-500 text-xs mb-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          ⚠ {error}
        </div>
      )}
      {children}
    </div>
  );
}

/**
 * Wraps a section (or just part of one, e.g. one field within it) that the
 * current admin lacks the specific permission for — the real permission
 * boundary is server-side (see the UPDATE_PRODUCT_* section endpoints),
 * this is purely so a limited admin can see the section exists without
 * being able to touch it, instead of the section just vanishing.
 */
function Locked({
  granted,
  isDark,
  children,
}: {
  granted: boolean;
  isDark: boolean;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  if (granted) return <>{children}</>;
  return (
    <div className="relative">
      <div className="pointer-events-none select-none opacity-50 blur-[2px]" aria-hidden="true">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center rounded-xl">
        <span
          className={clsx(
            "flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-sm",
            isDark ? "bg-gray-950/90 text-gray-200" : "bg-gray-900/85 text-white"
          )}
          title={t("adminProducts.form.sectionLocked")}
        >
          <Lock size={11} /> {t("adminProducts.form.sectionLocked")}
        </span>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  error,
  isDark,
  c,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
  isDark: boolean;
  c: ReturnType<typeof useAdminColors>;
}) {
  return (
    <div>
      <label
        className={clsx(
          "text-xs font-semibold uppercase tracking-wide block mb-1.5",
          c.textMuted
        )}
      >
        {label}
      </label>
      {children}
      {error && (
        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
          ⚠ {error}
        </p>
      )}
    </div>
  );
}

/**
 * Resolves any CSS <color> the browser understands — a name ("navy"), a hex
 * code, rgb()/hsl(), etc — to a normalized "#rrggbb" string, or null if the
 * browser rejects it. Uses the CSSOM's own color parser (no dictionary to
 * maintain, no library): assigning an invalid value to `style.color` is a
 * silent no-op (empty string back), which flags it as unrecognized. A plain
 * inline style keeps whatever literal was assigned ("navy" stays "navy"
 * instead of becoming rgb(0,0,128)), so the element has to actually be in
 * the document for `getComputedStyle` to resolve it to rgb().
 */
function resolveCssColor(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const el = document.createElement("div");
  el.style.color = trimmed;
  if (!el.style.color) return null;
  el.style.position = "absolute";
  el.style.visibility = "hidden";
  el.style.pointerEvents = "none";
  document.body.appendChild(el);
  const rgb = getComputedStyle(el).color;
  document.body.removeChild(el);
  const nums = rgb.match(/[\d.]+/g);
  if (!nums || nums.length < 3) return null;
  const [r, g, b] = nums.map(Number);
  return (
    "#" +
    [r, g, b]
      .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0"))
      .join("")
  );
}

const COLOR_SUGGESTIONS: { name: string; hex: string }[] = [
  { name: "Black", hex: "#1a1a1a" },
  { name: "White", hex: "#ffffff" },
  { name: "Gray", hex: "#9ca3af" },
  { name: "Navy", hex: "#1e3a5f" },
  { name: "Red", hex: "#dc2626" },
  { name: "Pink", hex: "#ec4899" },
  { name: "Rose", hex: "#f43f5e" },
  { name: "Blue", hex: "#3b82f6" },
  { name: "Sky Blue", hex: "#0ea5e9" },
  { name: "Green", hex: "#16a34a" },
  { name: "Olive", hex: "#65784b" },
  { name: "Yellow", hex: "#eab308" },
  { name: "Orange", hex: "#f97316" },
  { name: "Purple", hex: "#9333ea" },
  { name: "Brown", hex: "#78350f" },
  { name: "Beige", hex: "#e8dcc8" },
  { name: "Cream", hex: "#fdf6e3" },
  { name: "Gold", hex: "#d4af37" },
];

/**
 * Swatch button that opens a small popover for picking a color — type a
 * name or hex and see it previewed live, tap a suggestion, or fall back to
 * the system color picker. Replaces a bare `<input type="color">`, whose
 * native OS picker was hard to use and, on some mobile browsers, threw off
 * the page's scroll/viewport when it opened.
 */
function ColorPicker({
  value,
  onChange,
  isDark,
}: {
  value: string;
  onChange: (hex: string) => void;
  isDark: boolean;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) setText(value);
  }, [open, value]);

  useEffect(() => {
    if (!open) return;
    const onOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  const resolved = resolveCssColor(text);
  const commit = (hex: string) => {
    onChange(hex);
    setOpen(false);
  };

  return (
    <div className="relative flex-shrink-0" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="block w-10 h-10 rounded-full border-2 border-white shadow-md ring-2 ring-gray-200 hover:ring-brand-400 transition-all"
        style={{ backgroundColor: value }}
        title={t("adminProducts.form.pickColorTitle", { color: value })}
      />

      {open && (
        <div
          className={clsx(
            "absolute z-20 top-full left-0 mt-2 w-64 max-w-[80vw] rounded-2xl border shadow-xl p-3",
            isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          )}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <div
              className="w-9 h-9 rounded-lg border flex-shrink-0"
              style={{ backgroundColor: resolved ?? value, borderColor: isDark ? "#4b5563" : "#e5e7eb" }}
            />
            <input
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && resolved) commit(resolved);
                if (e.key === "Escape") setOpen(false);
              }}
              placeholder={t("adminProducts.form.colorNameOrHexPlaceholder")}
              className={clsx(
                "flex-1 min-w-0 border rounded-lg px-2.5 py-2 text-sm outline-none",
                isDark ? "bg-gray-900 border-gray-600 text-white" : "bg-gray-50 border-gray-200 text-gray-900"
              )}
            />
          </div>

          {text.trim() && !resolved ? (
            <p className="text-[11px] text-red-500 mb-2">
              {t("adminProducts.form.notRecognizedColor")}
            </p>
          ) : resolved ? (
            <button
              type="button"
              onClick={() => commit(resolved)}
              className="w-full mb-3 text-xs font-semibold py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white transition-colors"
            >
              {t("adminProducts.form.useThisColor")}
            </button>
          ) : (
            <div className="mb-2" />
          )}

          <p className={clsx("text-[10px] uppercase tracking-wide font-semibold mb-1.5", isDark ? "text-gray-500" : "text-gray-400")}>
            {t("adminProducts.form.suggestionsLabel")}
          </p>
          <div className="grid grid-cols-6 gap-1.5 mb-1">
            {COLOR_SUGGESTIONS.map((p) => (
              <button
                key={p.hex}
                type="button"
                title={p.name}
                onClick={() => commit(p.hex)}
                className={clsx(
                  "w-7 h-7 rounded-full border-2 transition-all",
                  value.toLowerCase() === p.hex
                    ? "border-brand-500 ring-2 ring-brand-200"
                    : "border-white ring-1 ring-gray-200 hover:ring-brand-300"
                )}
                style={{ backgroundColor: p.hex }}
              />
            ))}
          </div>

          <label
            className={clsx(
              "mt-2 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-lg cursor-pointer border transition-colors",
              isDark
                ? "text-gray-300 border-gray-700 hover:bg-gray-700"
                : "text-gray-600 border-gray-300 hover:bg-gray-100"
            )}
          >
            <Palette size={12} /> {t("adminProducts.form.customizeLabel")}
            <input
              type="color"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="sr-only"
            />
          </label>
        </div>
      )}
    </div>
  );
}
