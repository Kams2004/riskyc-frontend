"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart, Zap, Heart, Star, Check } from "@/components/icons/fa";
import { Product } from "@/lib/types";
import { formatPrice } from "@/lib/data";
import { useStore } from "@/lib/store";
import { useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { localized } from "@/lib/i18n/localized";
import clsx from "clsx";

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const router = useRouter();
  const { t, language } = useTranslation();
  const { addToCart } = useStore();
  const [wishlisted, setWishlisted] = useState(false);
  const [added, setAdded] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);

  const firstColor = product.colors[0];
  const firstSize  = product.sizes?.[0];

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;
  const priceUnset = product.price <= 0;
  const name = localized(product.name, product.nameFr, language);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (priceUnset) return;
    addToCart({ product, quantity: 1, selectedColor: firstColor?.name ?? "", selectedSize: firstSize });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  const handleOrderNow = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(`/products/${product.id}`);
  };

  return (
    <Link
      href={`/products/${product.id}`}
      className="group card block overflow-hidden border border-gray-100 hover:border-brand-100"
    >
      {/* ── Image area ── */}
      <div
        className="relative overflow-hidden bg-gray-50 aspect-[3/4]"
        onMouseEnter={() => product.media[1] && setImgIdx(1)}
        onMouseLeave={() => setImgIdx(0)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.media[imgIdx]?.presignedUrl || product.media[0]?.presignedUrl}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
        />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.badge === "NEW"  && <span className="badge-new">{t("products.card.badgeNew")}</span>}
          {product.badge === "SALE" && <span className="badge-sale">{t("products.card.badgeSale")}</span>}
          {product.badge === "HOT"  && <span className="badge-hot">{t("products.card.badgeHot")}</span>}
          {discount && (
            <span className="bg-brand-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              -{discount}%
            </span>
          )}
        </div>

        {/* Dark hover overlay (desktop only enhancement) */}
        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Wishlist button */}
        <button
          onClick={(e) => { e.preventDefault(); setWishlisted(!wishlisted); }}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center shadow-sm hover:bg-white transition-colors"
          title={wishlisted ? t("products.card.removeFromWishlist") : t("products.card.addToWishlist")}
        >
          <Heart
            size={14}
            className={clsx("transition-colors", wishlisted ? "fill-brand-500 text-brand-500" : "text-gray-400")}
          />
        </button>
      </div>

      {/* ── Info area ── */}
      <div className="p-3 sm:p-4">
        {/* Color swatches */}
        <div className="flex items-center gap-1 mb-2">
          {product.colors.slice(0, 5).map((c) => (
            <div key={c.name} title={c.name}
              className="w-4 h-4 rounded-full border border-gray-200 flex-shrink-0 shadow-sm"
              style={{ backgroundColor: c.hex }} />
          ))}
          {product.colors.length > 5 && (
            <span className="text-xs text-gray-400">+{product.colors.length - 5}</span>
          )}
        </div>

        <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2 mb-1.5">
          {name}
        </h3>

        <div className="flex items-center gap-1 mb-2">
          <Star size={12} className="text-gold-500 fill-gold-500" />
          <span className="text-xs text-gray-700 font-semibold">{product.rating}</span>
          <span className="text-xs text-gray-400">({product.reviews})</span>
        </div>

        {/* Price */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          {priceUnset ? (
            <span className="font-bold text-gray-500 text-sm">{t("products.card.priceOnRequest")}</span>
          ) : (
            <>
              <span className="font-bold text-brand-600 text-base">{formatPrice(product.price)}</span>
              {product.originalPrice && (
                <span className="text-xs text-gray-400 line-through">{formatPrice(product.originalPrice)}</span>
              )}
            </>
          )}
        </div>

        {/* ── Action buttons ── */}
        <div className="flex gap-2" onClick={(e) => e.preventDefault()}>
          {/* Add to Cart — usable even when out of stock; icon only on mobile, full label on sm+ */}
          <button
            onClick={handleAddToCart}
            disabled={priceUnset}
            className={clsx(
              "flex-1 min-w-0 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap",
              priceUnset
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : added ? "bg-green-500 text-white" : "bg-gray-900 hover:bg-brand-500 text-white"
            )}
            title={priceUnset ? t("products.card.contactForPricing") : t("products.card.addToCart")}
          >
            {added ? <Check size={13} /> : <ShoppingCart size={13} />}
            <span className="hidden sm:inline">{added ? t("products.card.added") : t("products.card.addToCart")}</span>
          </button>

          {/* Order Now — full label always */}
          <button
            onClick={handleOrderNow}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-all bg-brand-500 hover:bg-brand-600 text-white"
          >
            <Zap size={13} />
            {priceUnset ? t("products.card.askPrice") : t("products.card.order")}
          </button>
        </div>
      </div>
    </Link>
  );
}
