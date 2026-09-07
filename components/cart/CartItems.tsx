"use client";

import { useStore } from "@/lib/store";
import { formatPrice } from "@/lib/data";
import { Trash2, ShoppingBag, Plus, Minus, ArrowRight } from "@/components/icons/fa";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { localized } from "@/lib/i18n/localized";
import Link from "next/link";

interface Props {
  onCheckout: () => void;
}

export default function CartItems({ onCheckout }: Props) {
  const { items, removeFromCart, updateQuantity, getCartTotal, getLineTotal, clearCart } =
    useStore();
  const { t, language } = useTranslation();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center">
          <ShoppingBag size={40} className="text-gray-300" />
        </div>
        <h3 className="text-xl font-semibold text-gray-600">
          {t("cart.items.emptyTitle")}
        </h3>
        <p className="text-gray-400 text-sm">
          {t("cart.items.emptySubtitle")}
        </p>
        <Link href="/products" className="btn-primary mt-2">
          {t("cart.common.startShopping")}
        </Link>
      </div>
    );
  }

  const total = getCartTotal();
  const bulkSavings = items.reduce((sum, item) => {
    const actual = getLineTotal(item);
    const undiscounted = item.product.price * item.quantity;
    return sum + Math.max(0, undiscounted - actual);
  }, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Items list */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-gray-700">
            {t(items.length !== 1 ? "cart.items.countOther" : "cart.items.countOne", { count: items.length })}
          </h2>
          <button
            onClick={clearCart}
            className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1 transition-colors"
          >
            <Trash2 size={13} /> {t("cart.items.clearAll")}
          </button>
        </div>

        {items.map((item) => {
          const lineTotal = getLineTotal(item);
          return (
          <div
            key={`${item.product.id}-${item.selectedColor}-${item.selectedSize}-${item.selectedImageIndex ?? ""}`}
            className="card p-4 flex gap-4 border border-gray-100 animate-fade-in"
          >
            {/* Image */}
            <Link
              href={`/products/${item.product.id}`}
              className="flex-shrink-0 w-24 h-28 sm:w-28 sm:h-32 rounded-xl overflow-hidden bg-gray-50"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  (item.selectedImageIndex != null
                    ? item.product.media[item.selectedImageIndex]?.presignedUrl
                    : undefined) ?? item.product.media[0]?.presignedUrl
                }
                alt={localized(item.product.name, item.product.nameFr, language)}
                className="w-full h-full object-cover hover:scale-105 transition-transform"
              />
            </Link>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <Link
                href={`/products/${item.product.id}`}
                className="font-semibold text-gray-900 text-sm sm:text-base hover:text-brand-600 transition-colors line-clamp-2"
              >
                {localized(item.product.name, item.product.nameFr, language)}
              </Link>

              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                {/* Color badge */}
                {item.selectedColor && (
                  <span className="flex items-center gap-1.5 text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600">
                    <span
                      className="w-3 h-3 rounded-full border border-gray-200"
                      style={{
                        backgroundColor:
                          item.product.colors.find(
                            (c) => c.name === item.selectedColor
                          )?.hex || "#ccc",
                      }}
                    />
                    {item.selectedColor}
                  </span>
                )}
                {/* Size badge */}
                {item.selectedSize && (
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600">
                    {t("cart.items.sizeLabel", { size: item.selectedSize })}
                  </span>
                )}
                {/* Photo badge — shown for items picked via "quantity by photo" */}
                {item.selectedImageIndex != null && (
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600">
                    {t("cart.items.photoLabel", { index: item.selectedImageIndex + 1 })}
                  </span>
                )}
              </div>

              <div className="mt-3 flex items-center justify-between flex-wrap gap-3">
                {/* Qty controls */}
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() =>
                      updateQuantity(
                        item.product.id,
                        item.selectedColor,
                        item.quantity - 1,
                        item.selectedImageIndex
                      )
                    }
                    className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 text-gray-600 transition-colors"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-9 text-center text-sm font-semibold">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() =>
                      updateQuantity(
                        item.product.id,
                        item.selectedColor,
                        item.quantity + 1,
                        item.selectedImageIndex
                      )
                    }
                    className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 text-gray-600 transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* Price */}
                <div className="text-right">
                  <div className="font-bold text-brand-600 text-base">
                    {formatPrice(lineTotal)}
                  </div>
                  {item.quantity > 1 && (
                    <div className="text-xs text-gray-400">
                      {formatPrice(lineTotal / item.quantity)} {t("cart.items.each")}
                    </div>
                  )}
                </div>

                {/* Remove */}
                <button
                  onClick={() =>
                    removeFromCart(item.product.id, item.selectedColor, item.selectedImageIndex)
                  }
                  className="text-gray-300 hover:text-red-500 transition-colors"
                  title={t("cart.items.removeItem")}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
          );
        })}

        {/* Add more articles */}
        <Link
          href="/products"
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl border-2 border-dashed border-gray-200 hover:border-brand-300 hover:bg-brand-50/50 text-sm font-semibold text-gray-500 hover:text-brand-600 transition-all"
        >
          <Plus size={16} /> {t("cart.items.addMore")}
        </Link>
      </div>

      {/* Order summary */}
      <div className="lg:col-span-1">
        <div className="card border border-gray-100 p-6 sticky top-24">
          <h3 className="font-display font-bold text-lg text-gray-900 mb-5">
            {t("cart.summary.title")}
          </h3>

          <div className="space-y-3 mb-5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{t("cart.summary.subtotal")}</span>
              <span className="font-medium">{formatPrice(total + bulkSavings)}</span>
            </div>
            {bulkSavings > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t("cart.summary.bulkSavings")}</span>
                <span className="text-green-600 font-medium">−{formatPrice(bulkSavings)}</span>
              </div>
            )}
            <div className="border-t border-gray-100 pt-3 flex justify-between">
              <span className="font-semibold text-gray-900">{t("cart.summary.total")}</span>
              <span className="font-bold text-xl text-brand-600">
                {formatPrice(total)}
              </span>
            </div>
          </div>

          {/* Payment methods note */}
          <div className="flex gap-2 mb-5">
            <div className="flex-1 flex items-center justify-center gap-1 bg-orange-50 border border-orange-100 rounded-xl p-2">
              <span className="text-orange-500 font-bold text-xs">{t("cart.summary.orangeMoney")}</span>
            </div>
            <div className="flex-1 flex items-center justify-center gap-1 bg-yellow-50 border border-yellow-100 rounded-xl p-2">
              <span className="text-yellow-600 font-bold text-xs">{t("cart.summary.momo")}</span>
            </div>
          </div>

          <button
            onClick={onCheckout}
            className="w-full btn-primary py-4 text-base rounded-2xl"
          >
            {t("cart.checkout.payNow")}
            <ArrowRight size={18} />
          </button>

          <Link
            href="/products"
            className="block text-center text-sm text-gray-400 hover:text-brand-500 mt-3 transition-colors"
          >
            {t("cart.summary.continueShopping")}
          </Link>
        </div>
      </div>
    </div>
  );
}
