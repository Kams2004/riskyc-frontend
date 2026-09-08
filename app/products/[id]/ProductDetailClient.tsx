"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { formatPrice } from "@/lib/data";
import { computeLineTotal, computeLineBreakdown, allocateGroupedLineTotals } from "@/lib/pricing";
import { getProduct, listProducts } from "@/lib/api/products";
import { useCategories } from "@/lib/useCategories";
import { Product } from "@/lib/types";
import { useStore } from "@/lib/store";
import ProductCard from "@/components/products/ProductCard";
import CheckoutFlow from "@/components/cart/CheckoutFlow";
import { FaIconPreview } from "@/components/admin/FaIconPicker";
import ImageLightbox from "@/components/ui/ImageLightbox";
import {
  ShoppingCart,
  Zap,
  Star,
  ChevronLeft,
  ChevronRight,
  Share2,
  Check,
  Truck,
  Shield,
  RotateCcw,
  HelpCircle,
  X,
  MessageCircle,
  Trash2,
  Minus,
  Plus,
} from "@/components/icons/fa";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { localized } from "@/lib/i18n/localized";
import clsx from "clsx";
import Link from "next/link";

// WhatsApp phone number for the store
const WHATSAPP_NUMBER = "237693456789";

const HOW_TO_ORDER_STEPS = [
  { n: 1, titleKey: "step1Title", descKey: "step1Desc" },
  { n: 2, titleKey: "step2Title", descKey: "step2Desc" },
  { n: 3, titleKey: "step3Title", descKey: "step3Desc" },
  { n: 4, titleKey: "step4Title", descKey: "step4Desc" },
  { n: 5, titleKey: "step5Title", descKey: "step5Desc" },
  { n: 6, titleKey: "step6Title", descKey: "step6Desc" },
  { n: 7, titleKey: "step7Title", descKey: "step7Desc" },
] as const;

function HowToOrderModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[88vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <HelpCircle size={20} className="text-brand-500" />
            <h2 className="font-display font-bold text-lg text-gray-900">{t("products.howToOrder.title")}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Steps */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          <ol className="space-y-5">
            {HOW_TO_ORDER_STEPS.map((step) => (
              <li key={step.n} className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold text-sm">
                  {step.n}
                </div>
                <div className="pt-0.5">
                  <p className="font-semibold text-gray-900 text-sm">{t(`products.howToOrder.${step.titleKey}`)}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{t(`products.howToOrder.${step.descKey}`)}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full btn-primary py-3.5 rounded-2xl text-base"
          >
            {t("products.howToOrder.gotIt")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProductDetailClient({ productId }: { productId: string }) {
  const router = useRouter();
  const { t, language } = useTranslation();
  const { addToCart, setChatOpen, setChatDraft } = useStore();
  const { categories } = useCategories();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [similar, setSimilar] = useState<Product[]>([]);

  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [qty, setQty] = useState(1);
  const [imgIdx, setImgIdx] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);
  const [tab, setTab] = useState<"description" | "details" | "reviews">("description");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [howToOrderOpen, setHowToOrderOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  // Per-photo quantity, keyed by "imageIndex::size" — this map (not the plain
  // `qty` above) is what actually gets ordered whenever the product has
  // photos: there is deliberately only one way to configure quantity once
  // photos exist, so nothing here can drift out of sync with a separate
  // color/size/qty picker.
  const [photoQuantities, setPhotoQuantities] = useState<Record<string, { imageIndex: number; size: string; quantity: number }>>({});

  // Pressing the device/browser back button while the lightbox is open
  // should close it instead of navigating away from the product page.
  const openLightbox = () => {
    setLightboxOpen(true);
    window.history.pushState({ lightbox: true }, "");
  };
  const closeLightbox = () => {
    setLightboxOpen(false);
    if (window.history.state?.lightbox) window.history.back();
  };
  useEffect(() => {
    const onPopState = () => setLightboxOpen(false);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getProduct(productId)
      .then((p) => {
        if (cancelled) return;
        setProduct(p);
        setSelectedColor(p.colors[0]?.name || "");
        setSelectedSize(p.sizes?.[0] || "");
        listProducts({ category: p.categorySlug, size: 5 })
          .then((page) => {
            if (!cancelled) setSimilar(page.content.filter((x) => x.id !== p.id).slice(0, 4));
          })
          .catch(() => {});
      })
      .catch(() => {
        if (!cancelled) setProduct(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [productId]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="text-6xl">😕</div>
        <h2 className="text-2xl font-semibold">{t("products.detail.productNotFound")}</h2>
        <Link href="/products" className="btn-primary">{t("products.detail.browseProducts")}</Link>
      </div>
    );
  }

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;
  const priceUnset = product.price <= 0;
  const imageCount = product.media.filter((m) => m.type === "IMAGE").length;
  const categoryInfo = categories.find((c) => c.slug === product.categorySlug);
  const subcategoryInfo = categoryInfo?.subcategories.find((s) => s.slug === product.subcategorySlug);
  const name = localized(product.name, product.nameFr, language);
  const categoryName = categoryInfo ? localized(categoryInfo.name, categoryInfo.nameFr, language) : product.categorySlug;
  const subcategoryName = subcategoryInfo
    ? localized(subcategoryInfo.name, subcategoryInfo.nameFr, language)
    : (product.subcategorySlug ?? "").replace("-", " ");

  // ── Per-photo quantity — the only way to configure quantity once the
  // product has photos (see photoQuantities above). Keyed by image index +
  // size so the same photo can carry different quantities per size.
  const photoSelectionKey = (imageIndex: number, size: string) => `${imageIndex}::${size}`;
  const setPhotoQty = (imageIndex: number, size: string, quantity: number) => {
    setPhotoQuantities((prev) => {
      const key = photoSelectionKey(imageIndex, size);
      const next = { ...prev };
      if (quantity <= 0) delete next[key];
      else next[key] = { imageIndex, size, quantity };
      return next;
    });
  };
  const photoSelections = Object.values(photoQuantities).sort(
    (a, b) => a.imageIndex - b.imageIndex || a.size.localeCompare(b.size)
  );
  const photoTotalItems = photoSelections.reduce((s, x) => s + x.quantity, 0);
  // Bulk-tier pricing is pooled across every configured photo/size of this
  // product — 2 + 3 + 5 units spread across three photos still qualifies
  // for a 10-unit tier, matching exactly what checkout will charge.
  const photoLineTotals = allocateGroupedLineTotals(product.price, product.bulkPrices, photoSelections.map((x) => x.quantity));
  const photoTotalPrice = photoLineTotals.reduce((s, x) => s + x, 0);
  const activePhotoKey = photoSelectionKey(imgIdx, selectedSize);
  const activePhotoQty = photoQuantities[activePhotoKey]?.quantity ?? 0;
  // Nothing configured yet — the order buttons stay disabled until at least
  // one photo has a quantity set, even for someone who lands straight on
  // this page (e.g. from a shared link) without touching anything first.
  const nothingConfigured = imageCount > 0 && photoSelections.length === 0;

  const handleAddToCart = () => {
    if (priceUnset || nothingConfigured) return;
    if (imageCount > 0) {
      for (const sel of photoSelections) {
        addToCart({ product, quantity: sel.quantity, selectedColor, selectedSize: sel.size || undefined, selectedImageIndex: sel.imageIndex });
      }
    } else {
      addToCart({ product, quantity: qty, selectedColor, selectedSize });
    }
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleOrderNow = () => {
    if (priceUnset || nothingConfigured) return;
    if (imageCount > 0) {
      for (const sel of photoSelections) {
        addToCart({ product, quantity: sel.quantity, selectedColor, selectedSize: sel.size || undefined, selectedImageIndex: sel.imageIndex });
      }
    } else {
      addToCart({ product, quantity: qty, selectedColor, selectedSize });
    }
    setCheckoutOpen(true);
  };

  const handleWhatsApp = () => {
    const productUrl = typeof window !== "undefined" ? window.location.href : "";
    const imageUrl = product.media[imgIdx]?.presignedUrl || product.media[0]?.presignedUrl;
    const lines = [
      `Hi! I'm interested in ordering:`,
      `*${product.name}*`,
      `Color: ${selectedColor}`,
      selectedSize ? `Size: ${selectedSize}` : null,
      `Qty: ${qty}`,
      `Price: ${formatPrice(computeLineTotal(product.price, product.bulkPrices, qty))}`,
      imageUrl ? `\nPicture: ${imageUrl}` : null,
      productUrl ? `Product page: ${productUrl}` : null,
    ]
      .filter((l): l is string => Boolean(l))
      .join("\n");
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines)}`, "_blank");
  };

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: name, text: t("products.detail.shareText", { name }), url });
      } catch {
        // user cancelled the native share sheet — nothing to do
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      // clipboard unavailable — nothing we can do
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6 flex-wrap">
        <Link href="/" className="hover:text-brand-500">{t("products.detail.home")}</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-brand-500">{t("products.detail.products")}</Link>
        <span>/</span>
        {categoryInfo && (
          <>
            <Link href={`/category/${product.categorySlug}`} className="hover:text-brand-500">
              {categoryName}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-gray-700 font-medium truncate max-w-[200px]">{name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 xl:gap-16">
        {/* Images */}
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-3xl bg-gray-50 aspect-square group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.media[imgIdx]?.presignedUrl}
              alt={name}
              onClick={openLightbox}
              className="w-full h-full object-cover transition-opacity duration-300 cursor-zoom-in"
            />
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {product.badge === "NEW" && <span className="badge-new text-sm px-3 py-1">{t("products.card.badgeNew")}</span>}
              {product.badge === "SALE" && <span className="badge-sale text-sm px-3 py-1">{t("products.card.badgeSale")}</span>}
              {product.badge === "HOT" && <span className="badge-hot text-sm px-3 py-1">{t("products.card.badgeHot")}</span>}
              {discount && (
                <span className="bg-brand-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                  -{discount}%
                </span>
              )}
            </div>
            {product.media.length > 1 && (
              <>
                <button
                  onClick={() => setImgIdx((i) => Math.max(0, i - 1))}
                  className={clsx(
                    "absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow flex items-center justify-center hover:bg-white transition-all",
                    imgIdx === 0 && "opacity-40 pointer-events-none"
                  )}
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => setImgIdx((i) => Math.min(product.media.length - 1, i + 1))}
                  className={clsx(
                    "absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow flex items-center justify-center hover:bg-white transition-all",
                    imgIdx === product.media.length - 1 && "opacity-40 pointer-events-none"
                  )}
                >
                  <ChevronRight size={18} />
                </button>
              </>
            )}
            <button
              onClick={handleShare}
              title={t("products.detail.shareProduct")}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/90 shadow flex items-center justify-center hover:bg-white transition-colors"
            >
              {shareCopied ? <Check size={16} className="text-green-500" /> : <Share2 size={16} className="text-gray-600" />}
            </button>
          </div>
          {product.media.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {product.media.map((m, i) => (
                <button
                  key={m.id}
                  onClick={() => setImgIdx(i)}
                  className={clsx(
                    "w-20 h-20 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all",
                    imgIdx === i ? "border-brand-500 shadow-md" : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.presignedUrl} alt={t("products.detail.viewImage", { n: i + 1 })} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Fullscreen image lightbox */}
        {lightboxOpen && (
          <ImageLightbox
            src={product.media[imgIdx]?.presignedUrl}
            alt={name}
            onClose={closeLightbox}
            onPrev={product.media.length > 1 ? () => setImgIdx((i) => (i - 1 + product.media.length) % product.media.length) : undefined}
            onNext={product.media.length > 1 ? () => setImgIdx((i) => (i + 1) % product.media.length) : undefined}
            counterLabel={product.media.length > 1 ? `${imgIdx + 1} / ${product.media.length}` : undefined}
          />
        )}

        {/* Product Info */}
        <div className="animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-medium text-brand-600 bg-brand-50 px-3 py-1 rounded-full capitalize flex items-center gap-1.5">
              <FaIconPreview value={categoryInfo?.icon ?? "fa:solid:tag"} size={12} /> {subcategoryName}
            </span>
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-bold text-gray-900 mb-3 leading-tight">
            {name}
          </h1>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  className={clsx(
                    i < Math.floor(product.rating)
                      ? "text-gold-500 fill-gold-500"
                      : "text-gray-200 fill-gray-200"
                  )}
                />
              ))}
            </div>
            <span className="text-sm font-semibold text-gray-700">{product.rating}</span>
            <span className="text-sm text-gray-400">
              {product.reviews === 1
                ? t("products.detail.reviewsCountOne", { count: product.reviews })
                : t("products.detail.reviewsCountOther", { count: product.reviews })}
            </span>
          </div>

          <div className="mb-6 p-4 bg-gray-50 rounded-2xl">
            <div className="flex items-baseline gap-3">
              {priceUnset ? (
                <span className="text-2xl font-bold text-gray-500">{t("products.card.priceOnRequest")}</span>
              ) : (
                <>
                  <span className="text-3xl font-bold text-brand-600">{formatPrice(product.price)}</span>
                  {product.originalPrice && (
                    <>
                      <span className="text-lg text-gray-400 line-through">{formatPrice(product.originalPrice)}</span>
                      <span className="bg-green-100 text-green-700 text-sm font-semibold px-2 py-0.5 rounded-full">
                        {t("products.detail.save", { amount: formatPrice(product.originalPrice - product.price) })}
                      </span>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Bulk / grouped pricing — independent of the unit price above */}
            {product.bulkPrices.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-200">
                {product.bulkPrices.map((tier, i) => (
                  <span
                    key={i}
                    className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white text-gray-700 border border-gray-200"
                  >
                    {tier.quantity} = {formatPrice(tier.price)}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Color — independent of the per-photo configuration below, applied to every line it adds */}
          {product.colors.length > 0 && (
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">
                  {t("products.detail.colorLabel")} <span className="text-brand-600">{selectedColor}</span>
                </span>
              </div>
              <div className="flex flex-wrap gap-3">
                {product.colors.map((color) => (
                  <button
                    key={color.name}
                    title={color.name}
                    onClick={() => setSelectedColor(color.name)}
                    className={clsx(
                      "flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all",
                      selectedColor === color.name
                        ? "border-brand-500 bg-brand-50 text-brand-700"
                        : "border-gray-200 hover:border-brand-300 text-gray-700"
                    )}
                  >
                    <span className="w-5 h-5 rounded-full border border-gray-200 flex-shrink-0" style={{ backgroundColor: color.hex }} />
                    {color.name}
                    {selectedColor === color.name && <Check size={14} className="text-brand-500" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {imageCount > 0 ? (
            <>
              {/* Size — sets the size for whichever photo is currently shown large above */}
              {product.sizes && product.sizes.length > 0 && (
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">
                      {t("products.detail.sizeLabel")} <span className="text-brand-600">{selectedSize}</span>
                    </span>
                    <button className="text-xs text-brand-500 underline">{t("products.detail.sizeGuide")}</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={clsx(
                          "min-w-[44px] px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all",
                          selectedSize === size
                            ? "border-brand-500 bg-brand-500 text-white"
                            : "border-gray-200 hover:border-brand-300 text-gray-700"
                        )}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity for the active photo (+ size, if any) — this, not a
                  separate modal, is now the only way to set how many of this
                  product to order: switch photos using the gallery above,
                  the count below always tracks whichever one is showing. */}
              <div className="mb-5 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-700">
                    {t("products.picker.photo", { n: imgIdx + 1 })}
                    {selectedSize && <span className="text-gray-400"> · {selectedSize}</span>}
                  </span>
                  {activePhotoQty > 0 && (
                    <span className="bg-brand-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                      {t("products.picker.selected", { count: activePhotoQty })}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setPhotoQty(imgIdx, selectedSize, activePhotoQty - 1)}
                    disabled={activePhotoQty === 0}
                    className="w-11 h-11 rounded-xl border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:border-brand-300 hover:text-brand-600 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:text-gray-600 transition-colors bg-white"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-10 text-center text-2xl font-bold text-gray-900 tabular-nums">{activePhotoQty}</span>
                  <button
                    onClick={() => setPhotoQty(imgIdx, selectedSize, activePhotoQty + 1)}
                    className="w-11 h-11 rounded-xl border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:border-brand-300 hover:text-brand-600 transition-colors bg-white"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                {!priceUnset && activePhotoQty > 0 && (() => {
                  const { parts } = computeLineBreakdown(product.price, product.bulkPrices, activePhotoQty);
                  if (parts.length === 0 || (parts.length === 1 && parts[0].kind === "unit")) return null;
                  return (
                    <p className="text-[11px] text-gray-400 mt-2">
                      {parts
                        .map((p) =>
                          p.kind === "bulk"
                            ? `${p.count} × (${p.tierQuantity} = ${formatPrice(p.tierPrice ?? 0)})`
                            : `${p.count} × ${formatPrice(product.price)}`
                        )
                        .join(" + ")}
                    </p>
                  );
                })()}
                <p className="text-xs text-gray-400 mt-2">
                  {product.sizes && product.sizes.length > 0 ? t("products.picker.hintWithSize") : t("products.picker.hintNoSize")}
                </p>
              </div>

              {/* Recap of every photo configured so far — editable inline, no modal/cart trip needed */}
              {photoSelections.length > 0 && (
                <div className="mb-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                    {photoSelections.length === 1
                      ? t("products.picker.yourSelectionOne", { count: photoSelections.length })
                      : t("products.picker.yourSelectionOther", { count: photoSelections.length })}
                  </p>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {photoSelections.map((sel, i) => {
                      const media = product.media[sel.imageIndex];
                      const key = photoSelectionKey(sel.imageIndex, sel.size);
                      const lineTotal = photoLineTotals[i] ?? 0;
                      return (
                        <div key={key} className="flex items-center gap-3 bg-gray-50 rounded-xl p-2.5">
                          <button
                            onClick={() => {
                              setImgIdx(sel.imageIndex);
                              if (sel.size) setSelectedSize(sel.size);
                            }}
                            className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={media?.presignedUrl} alt="" className="w-full h-full object-cover" />
                          </button>
                          <span className="flex-1 min-w-0 text-sm text-gray-600 truncate">
                            {t("products.picker.photo", { n: sel.imageIndex + 1 })}
                            {sel.size && <span className="text-gray-400"> · {sel.size}</span>}
                            {!priceUnset && <span className="block text-xs font-semibold text-brand-600">{formatPrice(lineTotal)}</span>}
                          </span>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                              onClick={() => setPhotoQty(sel.imageIndex, sel.size, sel.quantity - 1)}
                              className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="w-6 text-center text-sm font-semibold tabular-nums">{sel.quantity}</span>
                            <button
                              onClick={() => setPhotoQty(sel.imageIndex, sel.size, sel.quantity + 1)}
                              className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                          <button
                            onClick={() => setPhotoQty(sel.imageIndex, sel.size, 0)}
                            title={t("products.picker.remove")}
                            className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  {!priceUnset && (
                    <p className="text-right text-sm mt-2">
                      {t("products.detail.total")}{" "}
                      <span className="text-brand-600 font-bold">{formatPrice(photoTotalPrice)}</span>
                    </p>
                  )}
                </div>
              )}

              {nothingConfigured && (
                <p className="mb-5 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
                  {t("products.detail.photoConfigureFirst")}
                </p>
              )}
            </>
          ) : (
            <>
              {/* Sizes — products with no photos fall back to one blanket size/quantity */}
              {product.sizes && (
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">
                      {t("products.detail.sizeLabel")} <span className="text-brand-600">{selectedSize}</span>
                    </span>
                    <button className="text-xs text-brand-500 underline">{t("products.detail.sizeGuide")}</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={clsx(
                          "min-w-[44px] px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all",
                          selectedSize === size
                            ? "border-brand-500 bg-brand-500 text-white"
                            : "border-gray-200 hover:border-brand-300 text-gray-700"
                        )}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="mb-6">
                <span className="text-sm font-semibold text-gray-700 block mb-2">{t("products.detail.quantity")}</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
                    <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-50 text-lg font-bold">−</button>
                    <span className="w-12 text-center font-semibold text-gray-900">{qty}</span>
                    <button onClick={() => setQty(qty + 1)} className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-50 text-lg font-bold">+</button>
                  </div>
                  <span className="text-sm text-gray-400">
                    {t("products.detail.total")}{" "}
                    <span className="text-brand-600 font-bold">
                      {priceUnset ? "—" : formatPrice(computeLineTotal(product.price, product.bulkPrices, qty))}
                    </span>
                  </span>
                </div>
              </div>
            </>
          )}

          {/* ── Action buttons ── */}
          <div className="flex gap-3 mb-3">
            {/* Add to Cart — usable even when out of stock (we'll follow up once restocked) */}
            <button
              onClick={handleAddToCart}
              disabled={priceUnset || nothingConfigured}
              title={priceUnset ? t("products.detail.contactForPricingTitle") : nothingConfigured ? t("products.detail.photoConfigureFirst") : undefined}
              className={clsx(
                "flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-base transition-all",
                priceUnset || nothingConfigured
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : addedToCart ? "bg-green-500 text-white" : "bg-gray-900 hover:bg-gray-800 text-white"
              )}
            >
              {addedToCart ? <><Check size={20} /> {t("products.card.added")}</> : <><ShoppingCart size={20} /> {t("products.card.addToCart")}</>}
            </button>

            {/* Order Now — adds the configured line(s) to cart, then opens checkout directly */}
            <button
              onClick={handleOrderNow}
              disabled={priceUnset || nothingConfigured}
              title={priceUnset ? t("products.detail.contactForPricingTitle") : nothingConfigured ? t("products.detail.photoConfigureFirst") : undefined}
              className={clsx(
                "flex-1 btn-primary py-3.5 rounded-2xl text-base",
                (priceUnset || nothingConfigured) && "opacity-50 cursor-not-allowed"
              )}
            >
              <Zap size={20} /> {t("products.detail.orderNow")}
            </button>

            {/* WhatsApp — icon on mobile, expands on hover on desktop */}
            {/*
            <button
              onClick={handleWhatsApp}
              title="Order via WhatsApp"
              className={clsx(
                "group flex items-center justify-center gap-0 overflow-hidden",
                "h-[52px] w-[52px] hover:w-auto px-0 hover:px-4",
                "rounded-2xl border-2 border-[#25D366] text-[#25D366]",
                "hover:bg-[#25D366] hover:text-white",
                "transition-all duration-300 ease-in-out flex-shrink-0",
                isOutOfStock && "opacity-50 cursor-not-allowed"
              )}
              disabled={isOutOfStock}
            >
              WhatsApp SVG icon
              <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0 fill-current" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <span className="max-w-0 group-hover:max-w-[160px] overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out text-sm font-semibold ml-0 group-hover:ml-2">
                Order via WhatsApp
              </span>
            </button>
            */}
          </div>

          {/* How to Order button */}
          <button
            onClick={() => setHowToOrderOpen(true)}
            className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-brand-600 border border-gray-200 hover:border-brand-300 rounded-xl px-4 py-2.5 transition-colors mb-6"
          >
            <HelpCircle size={15} />
            {t("products.detail.howToOrder")}
            <ChevronRight size={14} className="ml-auto" />
          </button>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: <Truck size={18} className="text-brand-500" />, text: t("products.detail.fastDelivery") },
              { icon: <Shield size={18} className="text-brand-500" />, text: t("products.detail.securePay") },
              { icon: <RotateCcw size={18} className="text-brand-500" />, text: t("products.detail.easyReturn") },
            ].map((b) => (
              <div key={b.text} className="flex flex-col items-center gap-1 p-3 bg-gray-50 rounded-xl text-center">
                {b.icon}
                <span className="text-xs text-gray-500 font-medium">{b.text}</span>
              </div>
            ))}
          </div>

          {/* Ask question */}
          <button
            onClick={() => {
              const firstImage = product.media[0]?.presignedUrl;
              setChatDraft({
                text: t("products.detail.askQuestionDraft", { name, price: formatPrice(product.price) }),
                imageUrl: firstImage,
              });
              setChatOpen(true);
            }}
            className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-gray-200 text-gray-500 hover:border-brand-300 hover:text-brand-500 transition-colors text-sm font-medium"
          >
            <MessageCircle size={18} />
            {t("products.detail.askQuestion")}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-12 border-t border-gray-100 pt-8">
        <div className="flex gap-1 border-b border-gray-100 mb-6">
          {(["description", "details", "reviews"] as const).map((tabKey) => (
            <button
              key={tabKey}
              onClick={() => setTab(tabKey)}
              className={clsx(
                "px-5 py-3 text-sm font-semibold capitalize transition-colors border-b-2 -mb-px",
                tab === tabKey ? "border-brand-500 text-brand-600" : "border-transparent text-gray-500 hover:text-gray-700"
              )}
            >
              {t(`products.detail.tab${tabKey.charAt(0).toUpperCase()}${tabKey.slice(1)}`)}
            </button>
          ))}
        </div>

        {tab === "description" && (
          <div className="prose prose-gray max-w-none animate-fade-in">
            <p className="text-gray-600 leading-relaxed text-base">
              {product.description
                ? localized(product.description, product.descriptionFr, language)
                : t("products.detail.noDescription")}
            </p>
          </div>
        )}

        {tab === "details" && (
          <div className="animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
              {[
                { label: t("products.detail.category"), value: categoryName },
                { label: t("products.detail.subcategory"), value: subcategoryName || "—" },
                { label: t("products.detail.availableColors"), value: product.colors.map((c) => c.name).join(", ") },
                { label: t("products.detail.availableSizes"), value: product.sizes?.join(", ") || t("products.detail.oneSize") },
                {
                  label: t("products.detail.totalStock"),
                  value: t("products.detail.unitsCount", { count: product.colors.reduce((s, c) => s + (c.stock ?? 0), 0) }),
                },
                { label: t("products.detail.sku"), value: `RC-${product.id.toUpperCase()}` },
              ].map((row) => (
                <div key={row.label} className="flex flex-col gap-0.5 p-3 bg-gray-50 rounded-xl">
                  <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">{row.label}</span>
                  <span className="text-sm text-gray-800 font-medium">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "reviews" && (
          <div className="animate-fade-in">
            <div className="flex items-center gap-6 mb-6 p-5 bg-gray-50 rounded-2xl">
              <div className="text-center">
                <div className="text-5xl font-display font-bold text-gray-900">{product.rating}</div>
                <div className="flex items-center gap-0.5 mt-1 justify-center">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={16} className={clsx(i < Math.floor(product.rating) ? "text-gold-500 fill-gold-500" : "text-gray-300 fill-gray-300")} />
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {product.reviews === 1
                    ? t("products.detail.reviewsPlainOne", { count: product.reviews })
                    : t("products.detail.reviewsPlainOther", { count: product.reviews })}
                </p>
              </div>
              <div className="flex-1 space-y-1.5">
                {[5, 4, 3, 2, 1].map((star) => {
                  const pct = star === 5 ? 65 : star === 4 ? 20 : star === 3 ? 10 : star === 2 ? 3 : 2;
                  return (
                    <div key={star} className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-3">{star}</span>
                      <Star size={10} className="text-gold-400 fill-gold-400" />
                      <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                        <div className="bg-gold-400 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-gray-400 w-7">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <p className="text-sm text-gray-500 text-center">{t("products.detail.reviewsComingSoon")}</p>
          </div>
        )}
      </div>

      {/* Similar products */}
      {similar.length > 0 && (
        <div className="mt-16">
          <h2 className="section-title mb-6">{t("products.detail.youMightAlsoLike")}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {similar.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}

      {/* Checkout modal — opened when Order Now is clicked */}
      {checkoutOpen && (
        <CheckoutFlow
          orderId={null}
          onClose={() => setCheckoutOpen(false)}
        />
      )}

      {/* How to Order modal */}
      {howToOrderOpen && (
        <HowToOrderModal onClose={() => setHowToOrderOpen(false)} />
      )}
    </div>
  );
}
