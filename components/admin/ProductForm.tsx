"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminStore } from "@/lib/adminStore";
import { useAdminColors } from "@/lib/useAdminColors";
import { useCategories } from "@/lib/useCategories";
import * as productsApi from "@/lib/api/products";
import { Product, ProductColor, Badge, MediaItem } from "@/lib/types";
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
  X,
  Eye,
  EyeOff,
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
  colors: [{ name: "Black", hex: "#1a1a1a" }],
  sizes: ["XS", "S", "M", "L", "XL"],
  rating: 4.5,
  reviews: 0,
  badge: undefined,
  tags: [],
  hidden: false,
});

interface PendingFile {
  file: File;
  previewUrl: string;
}

export default function ProductForm({ initial, mode }: Props) {
  const router = useRouter();
  const token = useAdminStore((s) => s.session?.token);
  const { categories } = useCategories();
  const c = useAdminColors();
  const isDark = c.isDark;

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Default to the first category/subcategory once categories load, for new products
  useEffect(() => {
    if (mode !== "new" || form.categorySlug || categories.length === 0) return;
    const first = categories[0];
    setForm((f) => ({ ...f, categorySlug: first.slug, subcategorySlug: first.subcategories[0]?.slug ?? "" }));
  }, [categories, mode, form.categorySlug]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (form.price <= 0) e.price = "Price must be greater than 0";
    if (existingMedia.length === 0 && pendingFiles.length === 0) e.images = "At least one image is required";
    if (form.colors.length === 0) e.colors = "At least one color required";
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
      };

      const product =
        mode === "new"
          ? await productsApi.createProduct(input, token)
          : await productsApi.updateProduct(initial!.id, input, token);

      for (const pf of pendingFiles) {
        await productsApi.uploadProductMedia(product.id, pf.file, token);
      }

      setSaved(true);
      setTimeout(() => router.push("/admin/products"), 800);
    } catch (err) {
      setErrors({ save: err instanceof Error ? err.message : "Failed to save product" });
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
      colors: [...f.colors, { name: "New Color", hex: "#888888" }],
    }));

  const removeColor = (i: number) =>
    setForm((f) => ({
      ...f,
      colors: f.colors.filter((_, idx) => idx !== i),
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

  type DisplayMedia = { key: string; url: string; isVideo: boolean; onRemove: () => void };
  const displayMedia: DisplayMedia[] = [
    ...existingMedia.map((m) => ({
      key: m.id,
      url: m.presignedUrl,
      isVideo: m.type === "VIDEO",
      onRemove: () => removeExistingMedia(m.id),
    })),
    ...pendingFiles.map((pf) => ({
      key: pf.previewUrl,
      url: pf.previewUrl,
      isVideo: pf.file.type.startsWith("video/"),
      onRemove: () => removePendingFile(pf.previewUrl),
    })),
  ];

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
          Back
        </button>
        <h1 className={clsx("text-2xl font-bold", c.textPrimary)}>
          {mode === "new" ? "Add New Product" : `Edit: ${initial?.name}`}
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
          <Section title="Basic Information" icon={<Info size={15} />} isDark={isDark} c={c}>
            <div className="space-y-4">
              <Field label="Product Name" error={errors.name} isDark={isDark} c={c}>
                <input
                  className={inp(errors.name)}
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Elegant Rose Evening Gown"
                />
              </Field>

              <Field label="Description (optional)" isDark={isDark} c={c}>
                <textarea
                  className={clsx(inp(), "resize-none")}
                  rows={4}
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  placeholder="Describe the product in detail…"
                />
              </Field>
            </div>
          </Section>

          {/* CATEGORIES CONFIG */}
          <Section title="Category Configuration" icon={<Layers size={15} />} isDark={isDark} c={c}>
            <div className="space-y-3">
              <p className={clsx("text-xs", c.textSecondary)}>
                Available categories and their subcategories in the store.
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
                        {cat.subcategories.length} subcategories
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
                Click a subcategory above to quickly assign it to this product.
                Currently assigned:{" "}
                <span className="text-brand-500 font-medium not-italic">
                  {selectedCategory?.name} →{" "}
                  {selectedCategory?.subcategories.find((s) => s.slug === form.subcategorySlug)?.name}
                </span>
              </p>
            </div>
          </Section>

          {/* PRICING */}
          <Section title="Pricing" icon={<DollarSign size={15} />} isDark={isDark} c={c}>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Price (XAF)" error={errors.price} isDark={isDark} c={c}>
                <input
                  type="number"
                  className={inp(errors.price)}
                  value={form.price || ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, price: Number(e.target.value) }))
                  }
                  placeholder="e.g. 35000"
                />
              </Field>
              <Field label="Original Price — for discount" isDark={isDark} c={c}>
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
                  placeholder="Leave empty if no sale"
                />
              </Field>
            </div>
            {form.price > 0 && form.originalPrice && form.originalPrice > form.price && (
              <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-xs text-green-600 font-medium">
                💸 Discount: {Math.round(((form.originalPrice - form.price) / form.originalPrice) * 100)}% off
                ({new Intl.NumberFormat("fr-CM", { style: "currency", currency: "XAF", minimumFractionDigits: 0 }).format(form.originalPrice - form.price)} saved)
              </div>
            )}
          </Section>

          {/* IMAGES */}
          <Section title="Images & Videos" icon={<ImageIcon size={15} />} error={errors.images} isDark={isDark} c={c}>
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
                    Click to pick images or videos
                  </p>
                  <p className={clsx("text-xs mt-0.5", c.textMuted)}>
                    JPG, PNG, WebP, MP4, WebM — multiple files supported
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
                      {/* Remove overlay */}
                      <button
                        type="button"
                        onClick={m.onRemove}
                        className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={20} className="text-white" />
                      </button>
                      {/* Index badge */}
                      <span className="absolute top-1 left-1 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                        {i + 1}
                      </span>
                      {m.isVideo && (
                        <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                          <Film size={9} /> video
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Section>

          {/* COLORS & STOCK */}
          <Section title="Colors & Stock" icon={<Palette size={15} />} error={errors.colors} isDark={isDark} c={c}>
            <div className="space-y-3">
              {form.colors.map((color, i) => (
                <div
                  key={i}
                  className={clsx(
                    "flex gap-3 items-center p-3 rounded-xl border",
                    isDark
                      ? "bg-gray-900/50 border-gray-700"
                      : "bg-gray-50 border-gray-200"
                  )}
                >
                  {/* Color picker */}
                  <div className="relative flex-shrink-0">
                    <input
                      type="color"
                      value={color.hex}
                      onChange={(e) => updateColor(i, { hex: e.target.value })}
                      className="sr-only"
                      id={`color-picker-${i}`}
                      title="Pick color"
                    />
                    <label
                      htmlFor={`color-picker-${i}`}
                      className="block w-10 h-10 rounded-full border-2 border-white shadow-md cursor-pointer ring-2 ring-gray-200 hover:ring-brand-400 transition-all"
                      style={{ backgroundColor: color.hex }}
                      title={`Pick color (current: ${color.hex})`}
                    />
                  </div>
                  {/* Color name */}
                  <input
                    className={clsx(inpSm, "flex-1")}
                    value={color.name}
                    onChange={(e) => updateColor(i, { name: e.target.value })}
                    placeholder="Color name"
                  />
                  {/* Stock (optional) */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <input
                      type="number"
                      className={clsx(inpSm, "w-20 text-center")}
                      value={color.stock ?? ""}
                      onChange={(e) =>
                        updateColor(i, {
                          stock: e.target.value === "" ? undefined : Number(e.target.value),
                        })
                      }
                      min={0}
                      placeholder="—"
                      title="Stock quantity (optional)"
                    />
                    <span className={clsx("text-xs", c.textMuted)}>units</span>
                  </div>
                  {/* Remove */}
                  <button
                    onClick={() => removeColor(i)}
                    className="text-red-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0"
                    title="Remove color"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}

              {/* Stock summary */}
              {form.colors.length > 0 && (
                <div className={clsx("flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium", isDark ? "bg-gray-800 text-gray-400" : "bg-gray-100 text-gray-500")}>
                  <span>Total stock:</span>
                  <span className={clsx("font-bold", c.textPrimary)}>
                    {form.colors.reduce((s, col) => s + (col.stock ?? 0), 0)} units
                  </span>
                  <span className="ml-2">·</span>
                  <span>{form.colors.length} color{form.colors.length !== 1 ? "s" : ""}</span>
                </div>
              )}

              <button
                onClick={addColor}
                className="flex items-center gap-2 text-xs text-brand-500 hover:text-brand-600 font-medium transition-colors"
              >
                <Plus size={13} /> Add color
              </button>
            </div>
          </Section>
        </div>

        {/* ── Right column ── */}
        <div className="space-y-5">
          {/* DISPLAY OPTIONS */}
          <Section title="Display" icon={<Info size={15} />} isDark={isDark} c={c}>
            <div className="space-y-4">
              <Field label="Visibility" isDark={isDark} c={c}>
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
                  {form.hidden ? "Hidden from storefront" : "Visible on storefront"}
                  <span className={clsx("ml-auto text-xs font-medium px-2 py-0.5 rounded-full", form.hidden ? (isDark ? "bg-gray-700 text-gray-400" : "bg-gray-200 text-gray-500") : "bg-green-500 text-white")}>
                    {form.hidden ? "Hidden" : "Visible"}
                  </span>
                </button>
              </Field>

              <Field label="Badge" isDark={isDark} c={c}>
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
                  <option value="">No badge</option>
                  <option value="NEW">🟢 New</option>
                  <option value="SALE">🔴 Sale</option>
                  <option value="HOT">🔥 Hot</option>
                </select>
              </Field>

              <Field label="Sizes (comma-separated)" isDark={isDark} c={c}>
                <input
                  className={inp()}
                  value={(form.sizes || []).join(", ")}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      sizes: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    }))
                  }
                  placeholder="XS, S, M, L, XL"
                />
              </Field>

              {/* Size presets */}
              <div>
                <p className={clsx("text-xs mb-2", c.textMuted)}>Quick presets:</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "XS–XL", val: "XS, S, M, L, XL" },
                    { label: "XS–2XL", val: "XS, S, M, L, XL, 2XL" },
                    { label: "Shoes 36–41", val: "36, 37, 38, 39, 40, 41" },
                    { label: "One Size", val: "One Size" },
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
                <Field label="Rating (1–5)" isDark={isDark} c={c}>
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
                <Field label="Review count" isDark={isDark} c={c}>
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
          </Section>

          {/* IMAGE / VIDEO PREVIEW */}
          {displayMedia.length > 0 && (
            <Section title="Preview" isDark={isDark} c={c}>
              <div
                className={clsx(
                  "rounded-xl overflow-hidden aspect-[3/4] border",
                  isDark ? "bg-gray-900 border-gray-700" : "bg-gray-100 border-gray-200"
                )}
              >
                {displayMedia[0].isVideo ? (
                  <video
                    src={displayMedia[0].url}
                    className="w-full h-full object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={displayMedia[0].url}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <p className={clsx("text-xs text-center mt-2 font-medium", c.textSecondary)}>
                {form.name || "Product name"}
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
            </Section>
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
              "✓ Saved successfully!"
            ) : (
              <>
                <Save size={18} />
                {mode === "new" ? "Create Product" : "Save Changes"}
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
            Discard changes
          </button>
        </div>
      </div>
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
