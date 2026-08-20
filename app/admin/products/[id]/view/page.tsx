"use client";

import AdminShell from "@/components/admin/AdminShell";
import { useAdminStore } from "@/lib/adminStore";
import { useAdminColors } from "@/lib/useAdminColors";
import * as productsApi from "@/lib/api/products";
import { Product } from "@/lib/types";
import { formatPrice } from "@/lib/data";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import ConfirmDialog, { ConfirmState } from "@/components/admin/ConfirmDialog";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Star,
  Package,
  Tag,
  Layers,
  BarChart2,
  ImageIcon,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Eye,
  EyeOff,
} from "lucide-react";
import clsx from "clsx";

export default function AdminProductViewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const token = useAdminStore((s) => s.session?.token);
  const c = useAdminColors();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgIdx, setImgIdx] = useState(0);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);

  useEffect(() => {
    if (!id) return;
    productsApi
      .getProduct(id)
      .then(setProduct)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <AdminShell>
        <div className="p-8 text-center text-sm text-gray-400">Loading…</div>
      </AdminShell>
    );
  }

  if (!product) {
    return (
      <AdminShell>
        <div className="p-8 text-center space-y-3">
          <Package size={40} className={clsx("mx-auto opacity-30", c.textMuted)} />
          <p className={clsx("text-sm", c.textMuted)}>Product not found.</p>
          <Link href="/admin/products" className="text-brand-500 underline text-sm">
            ← Back to products
          </Link>
        </div>
      </AdminShell>
    );
  }

  const totalStock = product.colors.reduce((s, col) => s + (col.stock ?? 0), 0);
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  const setHidden = async (hidden: boolean) => {
    if (!token) return;
    const updated = await productsApi.setProductVisibility(product.id, hidden, token);
    setProduct(updated);
  };

  const handleDelete = () => {
    setConfirm({
      title: "Delete product?",
      message: `This will permanently delete "${product.name}". This cannot be undone.`,
      confirmLabel: "Delete",
      onConfirm: async () => {
        if (token) {
          await productsApi.deleteProduct(product.id, token);
        }
        router.push("/admin/products");
      },
    });
  };

  return (
    <AdminShell>
      <div className="p-6 lg:p-8 space-y-6">

        {/* ── Header ── */}
        <div className="flex items-center gap-4 flex-wrap">
          <button
            onClick={() => router.back()}
            className={clsx("flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors", c.isDark ? "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900")}
          >
            <ArrowLeft size={16} /> Back
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className={clsx("text-xl font-bold truncate", c.textPrimary)}>{product.name}</h1>
              {product.hidden && (
                <span className={clsx("flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap", c.isDark ? "bg-gray-700 text-gray-400" : "bg-gray-200 text-gray-500")}>
                  <EyeOff size={11} /> HIDDEN
                </span>
              )}
            </div>
            <p className={clsx("text-xs mt-0.5 font-mono", c.textMuted)}>ID: {product.id}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setHidden(!product.hidden)}
              className={clsx("flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors",
                product.hidden
                  ? c.isDark ? "bg-gray-700 hover:bg-gray-600 text-gray-300" : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                  : c.isDark ? "bg-green-500/15 hover:bg-green-500/25 text-green-400" : "bg-green-50 hover:bg-green-100 text-green-600")}
            >
              {product.hidden ? <EyeOff size={13} /> : <Eye size={13} />}
              {product.hidden ? "Unhide" : "Visible"}
            </button>
            <Link
              href={`/products/${product.id}`}
              target="_blank"
              className={clsx("flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors", c.isDark ? "bg-gray-700 hover:bg-gray-600 text-gray-300" : "bg-gray-100 hover:bg-gray-200 text-gray-600")}
            >
              <ExternalLink size={13} /> Storefront
            </Link>
            <Link
              href={`/admin/products/${product.id}/edit`}
              className={clsx("flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors", c.btnGhost)}
            >
              <Pencil size={13} /> Edit
            </Link>
            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all bg-red-500/10 text-red-500 hover:bg-red-500/20"
            >
              <Trash2 size={13} />
              Delete
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── Left: Images ── */}
          <div className="space-y-3">
            {/* Main image */}
            <div className={clsx("relative rounded-2xl overflow-hidden border aspect-[4/3]", c.card)}>
              {product.media.length > 0 ? (
                <>
                  {product.media[imgIdx]?.type === "VIDEO" ? (
                    <video
                      src={product.media[imgIdx]?.presignedUrl}
                      className="w-full h-full object-cover"
                      controls
                      muted
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.media[imgIdx]?.presignedUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                  {/* Badge overlay */}
                  {product.badge && (
                    <div className="absolute top-3 left-3">
                      <span className={clsx(
                        "text-sm font-bold px-3 py-1 rounded-full",
                        product.badge === "NEW" ? "bg-emerald-500 text-white"
                        : product.badge === "SALE" ? "bg-brand-500 text-white"
                        : "bg-orange-500 text-white"
                      )}>
                        {product.badge}
                      </span>
                    </div>
                  )}
                  {discount && (
                    <div className="absolute top-3 right-3">
                      <span className="bg-green-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                        -{discount}%
                      </span>
                    </div>
                  )}
                  {/* Nav arrows */}
                  {product.media.length > 1 && (
                    <>
                      <button
                        onClick={() => setImgIdx((i) => Math.max(0, i - 1))}
                        disabled={imgIdx === 0}
                        className={clsx(
                          "absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center transition-all shadow",
                          c.isDark ? "bg-gray-800/90 text-white hover:bg-gray-700" : "bg-white/90 text-gray-700 hover:bg-white",
                          imgIdx === 0 && "opacity-30 cursor-not-allowed"
                        )}
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <button
                        onClick={() => setImgIdx((i) => Math.min(product.media.length - 1, i + 1))}
                        disabled={imgIdx === product.media.length - 1}
                        className={clsx(
                          "absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center transition-all shadow",
                          c.isDark ? "bg-gray-800/90 text-white hover:bg-gray-700" : "bg-white/90 text-gray-700 hover:bg-white",
                          imgIdx === product.media.length - 1 && "opacity-30 cursor-not-allowed"
                        )}
                      >
                        <ChevronRight size={18} />
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                  <ImageIcon size={40} className={clsx("opacity-30", c.textMuted)} />
                  <span className={clsx("text-sm", c.textMuted)}>No images</span>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {product.media.length > 1 && (
              <div className="flex gap-2">
                {product.media.map((m, i) => (
                  <button
                    key={m.id}
                    onClick={() => setImgIdx(i)}
                    className={clsx(
                      "w-20 h-20 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0",
                      imgIdx === i
                        ? "border-brand-500 shadow-md"
                        : c.isDark ? "border-gray-700 hover:border-gray-500" : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.presignedUrl} alt={`View ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Right: Info ── */}
          <div className="space-y-5">

            {/* Pricing */}
            <div className={clsx("rounded-2xl border p-5", c.card)}>
              <h2 className={clsx("text-xs font-semibold uppercase tracking-wider mb-4", c.textMuted)}>Pricing</h2>
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-3xl font-bold text-brand-500">{formatPrice(product.price)}</span>
                {product.originalPrice && (
                  <>
                    <span className={clsx("text-lg line-through", c.textMuted)}>{formatPrice(product.originalPrice)}</span>
                    <span className="bg-green-100 text-green-700 text-sm font-semibold px-2 py-0.5 rounded-full">
                      Save {formatPrice(product.originalPrice - product.price)} ({discount}%)
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Classification */}
            <div className={clsx("rounded-2xl border p-5", c.card)}>
              <h2 className={clsx("text-xs font-semibold uppercase tracking-wider mb-4", c.textMuted)}>Classification</h2>
              <div className="grid grid-cols-2 gap-3">
                <InfoRow icon={<Layers size={14} />} label="Category" value={product.categorySlug} />
                <InfoRow icon={<Tag size={14} />} label="Subcategory" value={product.subcategorySlug || "—"} />
                <InfoRow icon={<Star size={14} />} label="Rating" value={`${product.rating} / 5 (${product.reviews} reviews)`} />
                <InfoRow icon={<Package size={14} />} label="SKU" value={`RC-${product.id.toUpperCase()}`} />
              </div>
            </div>

            {/* Colors & Stock */}
            <div className={clsx("rounded-2xl border p-5", c.card)}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={clsx("text-xs font-semibold uppercase tracking-wider", c.textMuted)}>Colors & Stock</h2>
                <span className={clsx(
                  "text-xs font-semibold px-2.5 py-1 rounded-full",
                  totalStock === 0 ? "bg-red-100 text-red-600"
                  : totalStock <= 10 ? "bg-orange-100 text-orange-600"
                  : "bg-green-100 text-green-700"
                )}>
                  {totalStock} total units
                </span>
              </div>
              <div className="space-y-2">
                {product.colors.map((col) => {
                  const stock = col.stock;
                  const maxStock = Math.max(...product.colors.map((c) => c.stock ?? 0), 1);
                  return (
                    <div key={col.name} className={clsx("flex items-center gap-3 p-3 rounded-xl", c.isDark ? "bg-gray-900/40" : "bg-gray-50")}>
                      <div
                        className="w-7 h-7 rounded-full border-2 flex-shrink-0"
                        style={{ backgroundColor: col.hex, borderColor: c.isDark ? "#4b5563" : "#d1d5db" }}
                      />
                      <span className={clsx("flex-1 text-sm font-medium", c.textPrimary)}>{col.name}</span>
                      <span className={clsx("font-mono text-xs", c.textSecondary)}>{col.hex}</span>
                      <span className={clsx(
                        "text-xs font-semibold px-2 py-0.5 rounded-full",
                        stock == null ? c.isDark ? "bg-gray-700 text-gray-400" : "bg-gray-100 text-gray-500"
                        : stock === 0 ? "bg-red-100 text-red-600"
                        : stock <= 3 ? "bg-orange-100 text-orange-600"
                        : "bg-green-100 text-green-700"
                      )}>
                        {stock == null ? "No stock set" : stock === 0 ? "Out of stock" : `${stock} in stock`}
                      </span>
                      {/* Mini stock bar */}
                      <div className={clsx("w-20 h-1.5 rounded-full overflow-hidden", c.isDark ? "bg-gray-700" : "bg-gray-200")}>
                        <div
                          className={clsx("h-full rounded-full", stock == null ? "bg-transparent" : stock === 0 ? "bg-red-400" : stock <= 3 ? "bg-orange-400" : "bg-green-500")}
                          style={{ width: `${Math.min(100, ((stock ?? 0) / maxStock) * 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sizes */}
            {product.sizes && product.sizes.length > 0 && (
              <div className={clsx("rounded-2xl border p-5", c.card)}>
                <h2 className={clsx("text-xs font-semibold uppercase tracking-wider mb-4", c.textMuted)}>Available Sizes</h2>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <span
                      key={size}
                      className={clsx(
                        "px-3 py-1.5 rounded-xl text-sm font-semibold border",
                        c.isDark ? "bg-gray-700 border-gray-600 text-gray-200" : "bg-white border-gray-200 text-gray-700"
                      )}
                    >
                      {size}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Description ── */}
        <div className={clsx("rounded-2xl border p-5", c.card)}>
          <h2 className={clsx("text-xs font-semibold uppercase tracking-wider mb-3", c.textMuted)}>Description</h2>
          <p className={clsx("text-sm leading-relaxed", c.textSecondary)}>
            {product.description || <span className={c.textMuted}>No description provided.</span>}
          </p>
        </div>

        {/* ── Stock Overview bar chart ── */}
        <div className={clsx("rounded-2xl border p-5", c.card)}>
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={16} className="text-brand-500" />
            <h2 className={clsx("text-xs font-semibold uppercase tracking-wider", c.textMuted)}>Stock Overview</h2>
          </div>
          <div className="space-y-3">
            {product.colors.map((col) => {
              const stock = col.stock;
              const maxStock = Math.max(...product.colors.map((c) => c.stock ?? 0), 1);
              const pct = Math.round(((stock ?? 0) / maxStock) * 100);
              return (
                <div key={col.name} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: col.hex }} />
                  <span className={clsx("text-xs w-24 truncate flex-shrink-0", c.textSecondary)}>{col.name}</span>
                  <div className={clsx("flex-1 h-2 rounded-full overflow-hidden", c.isDark ? "bg-gray-700" : "bg-gray-100")}>
                    <div
                      className={clsx("h-full rounded-full transition-all", stock == null ? "bg-transparent" : stock === 0 ? "bg-red-400" : stock <= 3 ? "bg-orange-400" : "bg-brand-500")}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className={clsx("text-xs font-mono w-8 text-right flex-shrink-0", c.textMuted)}>{stock ?? "—"}</span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      <ConfirmDialog state={confirm} onCancel={() => setConfirm(null)} />
    </AdminShell>
  );
}

// ── Small helper ──────────────────────────────────────────────────────────────
function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  const c = useAdminColors();
  return (
    <div className={clsx("flex flex-col gap-1 p-3 rounded-xl", c.isDark ? "bg-gray-900/40" : "bg-gray-50")}>
      <div className={clsx("flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide", c.textMuted)}>
        {icon} {label}
      </div>
      <span className={clsx("text-sm font-semibold capitalize", c.textPrimary)}>{value}</span>
    </div>
  );
}
