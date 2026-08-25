"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart, Zap, Heart, Star, Check } from "@/components/icons/fa";
import { Product } from "@/lib/types";
import { formatPrice } from "@/lib/data";
import { useStore } from "@/lib/store";
import { useState } from "react";
import clsx from "clsx";
import PromoLabel from "./PromoLabel";

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const router = useRouter();
  const { addToCart } = useStore();
  const [wishlisted, setWishlisted] = useState(false);
  const [added, setAdded] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);

  const firstColor = product.colors[0];
  const firstSize  = product.sizes?.[0];
  // undefined stock = admin didn't track quantity for that color → treat as available
  const anyUntracked = product.colors.some((c) => c.stock === undefined);
  const totalStock = product.colors.reduce((s, c) => s + (c.stock ?? 0), 0);
  const outOfStock = !anyUntracked && totalStock === 0;

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart({ product, quantity: 1, selectedColor: firstColor.name, selectedSize: firstSize });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  const handleOrderNow = (e: React.MouseEvent) => {
    e.preventDefault();
    if (outOfStock) return;
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
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
        />

        {product.media[imgIdx]?.promoLabel && (
          <PromoLabel text={product.media[imgIdx].promoLabel!} />
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {outOfStock && (
            <span className="bg-gray-800 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
              Out of Stock
            </span>
          )}
          {!outOfStock && product.badge === "NEW"  && <span className="badge-new">NEW</span>}
          {!outOfStock && product.badge === "SALE" && <span className="badge-sale">SALE</span>}
          {!outOfStock && product.badge === "HOT"  && <span className="badge-hot">HOT 🔥</span>}
          {!outOfStock && discount && (
            <span className="bg-brand-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              -{discount}%
            </span>
          )}
        </div>

        {/* Low-stock warning */}
        {totalStock <= 5 && totalStock > 0 && (
          <div className="absolute top-2 right-10 bg-orange-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
            Only {totalStock} left
          </div>
        )}

        {/* Dark hover overlay (desktop only enhancement) */}
        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Wishlist button */}
        <button
          onClick={(e) => { e.preventDefault(); setWishlisted(!wishlisted); }}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center shadow-sm hover:bg-white transition-colors"
          title={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
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
          {product.name}
        </h3>

        <div className="flex items-center gap-1 mb-2">
          <Star size={12} className="text-gold-500 fill-gold-500" />
          <span className="text-xs text-gray-700 font-semibold">{product.rating}</span>
          <span className="text-xs text-gray-400">({product.reviews})</span>
        </div>

        {/* Price */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <span className="font-bold text-brand-600 text-base">{formatPrice(product.price)}</span>
          {product.originalPrice && (
            <span className="text-xs text-gray-400 line-through">{formatPrice(product.originalPrice)}</span>
          )}
        </div>

        {/* ── Action buttons ── */}
        <div className="flex gap-2" onClick={(e) => e.preventDefault()}>
          {/* Add to Cart — usable even when out of stock; icon only on mobile, full label on sm+ */}
          <button
            onClick={handleAddToCart}
            className={clsx(
              "flex-1 min-w-0 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap",
              added ? "bg-green-500 text-white" : "bg-gray-900 hover:bg-brand-500 text-white"
            )}
            title="Add to cart"
          >
            {added ? <Check size={13} /> : <ShoppingCart size={13} />}
            <span className="hidden sm:inline">{added ? "Added!" : "Add to Cart"}</span>
          </button>

          {/* Order Now — full label always */}
          <button
            onClick={handleOrderNow}
            disabled={outOfStock}
            className={clsx(
              "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-all",
              outOfStock
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-brand-500 hover:bg-brand-600 text-white"
            )}
          >
            <Zap size={13} />
            Order
          </button>
        </div>
      </div>
    </Link>
  );
}
