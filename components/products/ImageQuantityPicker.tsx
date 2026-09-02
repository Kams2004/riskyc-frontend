"use client";

import { useState } from "react";
import { Product } from "@/lib/types";
import { formatPrice } from "@/lib/data";
import { computeLineTotal, computeLineBreakdown } from "@/lib/pricing";
import { X, Plus, Minus, CreditCard, Trash2, ImageIcon, ChevronDown } from "@/components/icons/fa";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { localized } from "@/lib/i18n/localized";
import clsx from "clsx";

export interface ImageQuantitySelection {
  imageIndex: number;
  quantity: number;
  size?: string;
}

interface Props {
  product: Product;
  onClose: () => void;
  onConfirm: (selections: ImageQuantitySelection[]) => void;
}

const NO_SIZE = "";

function selectionKey(imageIndex: number, size: string): string {
  return `${imageIndex}::${size}`;
}

/** Renders "1 × (10 = 20 000 FCFA) + 2 × 1 000 FCFA" so the customer sees exactly how a bulk-discounted total was reached. */
function BreakdownLine({ unitPrice, bulkPrices, quantity }: { unitPrice: number; bulkPrices: Product["bulkPrices"]; quantity: number }) {
  const { parts } = computeLineBreakdown(unitPrice, bulkPrices, quantity);
  if (parts.length === 0) return null;
  // Only worth spelling out when more than one part contributes, or the single part is a bulk tier.
  if (parts.length === 1 && parts[0].kind === "unit") return null;
  return (
    <p className="text-[11px] text-gray-400 text-center mt-1.5">
      {parts
        .map((p) =>
          p.kind === "bulk"
            ? `${p.count} × (${p.tierQuantity} = ${formatPrice(p.tierPrice ?? 0)})`
            : `${p.count} × ${formatPrice(unitPrice)}`
        )
        .join(" + ")}
    </p>
  );
}

/**
 * Lets a customer pick a different quantity — and optionally a different
 * size — per product photo, instead of a single blanket quantity/color/size.
 * Works for any product with photos, colored or not: color selection itself
 * still isn't offered here (the picker is about photos), but size is, since
 * a photo can represent a fit/print that only some sizes carry.
 */
export default function ImageQuantityPicker({ product, onClose, onConfirm }: Props) {
  const { t, language } = useTranslation();
  const name = localized(product.name, product.nameFr, language);
  const imageEntries = product.media
    .map((m, i) => ({ media: m, index: i }))
    .filter((e) => e.media.type === "IMAGE");
  const hasSizes = product.sizes && product.sizes.length > 0;

  const [activeIndex, setActiveIndex] = useState(imageEntries[0]?.index ?? 0);
  const [activeSize, setActiveSize] = useState(hasSizes ? product.sizes[0] : NO_SIZE);
  const [sizeMenuOpen, setSizeMenuOpen] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, { imageIndex: number; size: string; quantity: number }>>({});
  const priceUnset = product.price <= 0;

  const setQty = (imageIndex: number, size: string, qty: number) => {
    setQuantities((prev) => {
      const key = selectionKey(imageIndex, size);
      const next = { ...prev };
      if (qty <= 0) delete next[key];
      else next[key] = { imageIndex, size, quantity: qty };
      return next;
    });
  };

  const selections = Object.values(quantities).sort((a, b) => a.imageIndex - b.imageIndex || a.size.localeCompare(b.size));
  const totalItems = selections.reduce((s, x) => s + x.quantity, 0);
  const totalPrice = selections.reduce((s, x) => s + computeLineTotal(product.price, product.bulkPrices, x.quantity), 0);

  const activeMedia = product.media[activeIndex];
  const activeKey = selectionKey(activeIndex, activeSize);
  const activeQty = quantities[activeKey]?.quantity ?? 0;

  const handleDone = () => {
    if (selections.length === 0) return;
    onConfirm(selections.map((s) => ({ imageIndex: s.imageIndex, quantity: s.quantity, size: s.size || undefined })));
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full sm:max-w-2xl sm:mx-4 h-[92vh] sm:h-auto sm:max-h-[90vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="min-w-0">
            <h2 className="font-display font-bold text-base sm:text-lg text-gray-900 truncate">
              {t("products.picker.title")}
            </h2>
            <p className="text-xs text-gray-400 truncate">{name}</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors flex-shrink-0 ml-3"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          {/* Main preview */}
          <div className="p-5 pb-3">
            {/* Bulk price tiers — scrolls horizontally when there are many */}
            {product.bulkPrices.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1 mb-3 -mx-0.5 px-0.5">
                {product.bulkPrices.map((tier, i) => (
                  <span
                    key={i}
                    className="flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full bg-brand-50 text-brand-700 border border-brand-100 whitespace-nowrap"
                  >
                    {tier.quantity} = {formatPrice(tier.price)}
                  </span>
                ))}
              </div>
            )}
            <div className="relative aspect-square sm:aspect-[4/3] rounded-2xl overflow-hidden bg-gray-50 border border-gray-100">
              {activeMedia ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={activeMedia.presignedUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <ImageIcon size={40} />
                </div>
              )}
              {activeQty > 0 && (
                <span className="absolute top-3 right-3 bg-brand-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
                  {t("products.picker.selected", { count: activeQty })}
                </span>
              )}
            </div>

            {/* Size (optional) + quantity stepper for the active photo */}
            <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
              {hasSizes && (
                <div className="relative">
                  <button
                    onClick={() => setSizeMenuOpen((o) => !o)}
                    className="flex items-center gap-1.5 px-3.5 h-11 rounded-xl border-2 border-gray-200 hover:border-brand-300 text-sm font-semibold text-gray-700 transition-colors"
                  >
                    {t("products.detail.sizeLabel")} <span className="text-brand-600">{activeSize}</span>
                    <ChevronDown size={14} className={clsx("transition-transform", sizeMenuOpen && "rotate-180")} />
                  </button>
                  {sizeMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setSizeMenuOpen(false)} />
                      <div className="absolute z-20 top-full left-0 mt-1.5 w-32 max-h-48 overflow-y-auto bg-white rounded-xl shadow-xl border border-gray-100 py-1.5">
                        {product.sizes.map((sz) => (
                          <button
                            key={sz}
                            onClick={() => {
                              setActiveSize(sz);
                              setSizeMenuOpen(false);
                            }}
                            className={clsx(
                              "w-full text-left px-3.5 py-2 text-sm transition-colors",
                              sz === activeSize ? "text-brand-600 font-semibold bg-brand-50" : "text-gray-600 hover:bg-gray-50"
                            )}
                          >
                            {sz}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQty(activeIndex, activeSize, activeQty - 1)}
                  disabled={activeQty === 0}
                  className="w-11 h-11 rounded-xl border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:border-brand-300 hover:text-brand-600 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:text-gray-600 transition-colors"
                >
                  <Minus size={16} />
                </button>
                <span className="w-10 text-center text-2xl font-bold text-gray-900 tabular-nums">{activeQty}</span>
                <button
                  onClick={() => setQty(activeIndex, activeSize, activeQty + 1)}
                  className="w-11 h-11 rounded-xl border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:border-brand-300 hover:text-brand-600 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {!priceUnset && activeQty > 0 && (
              <BreakdownLine unitPrice={product.price} bulkPrices={product.bulkPrices} quantity={activeQty} />
            )}
            <p className="text-center text-xs text-gray-400 mt-2">
              {hasSizes ? t("products.picker.hintWithSize") : t("products.picker.hintNoSize")}
            </p>
          </div>

          {/* Thumbnail strip — scrolls horizontally, so any number of photos stays usable */}
          {imageEntries.length > 1 && (
            <div className="px-5 pb-4">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {imageEntries.map(({ media, index }) => {
                  const qtyForThisPhoto = Object.values(quantities)
                    .filter((s) => s.imageIndex === index)
                    .reduce((s, x) => s + x.quantity, 0);
                  return (
                    <button
                      key={media.id}
                      onClick={() => setActiveIndex(index)}
                      className={clsx(
                        "relative flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all",
                        index === activeIndex
                          ? "border-brand-500 ring-2 ring-brand-100"
                          : qtyForThisPhoto > 0
                          ? "border-green-400"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={media.presignedUrl} alt="" className="w-full h-full object-cover" />
                      {qtyForThisPhoto > 0 && (
                        <span className="absolute -top-1 -right-1 bg-brand-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                          {qtyForThisPhoto}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recap of everything selected so far — editable inline */}
          {selections.length > 0 && (
            <div className="px-5 pb-5">
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                  {selections.length === 1
                    ? t("products.picker.yourSelectionOne", { count: selections.length })
                    : t("products.picker.yourSelectionOther", { count: selections.length })}
                </p>
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {selections.map((sel) => {
                    const media = product.media[sel.imageIndex];
                    const key = selectionKey(sel.imageIndex, sel.size);
                    const lineTotal = computeLineTotal(product.price, product.bulkPrices, sel.quantity);
                    return (
                      <div key={key} className="flex items-center gap-3 bg-gray-50 rounded-xl p-2.5">
                        <button
                          onClick={() => {
                            setActiveIndex(sel.imageIndex);
                            if (sel.size) setActiveSize(sel.size);
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
                            onClick={() => setQty(sel.imageIndex, sel.size, sel.quantity - 1)}
                            className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-6 text-center text-sm font-semibold tabular-nums">{sel.quantity}</span>
                          <button
                            onClick={() => setQty(sel.imageIndex, sel.size, sel.quantity + 1)}
                            className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        <button
                          onClick={() => setQty(sel.imageIndex, sel.size, 0)}
                          title={t("products.picker.remove")}
                          className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-5 py-4 flex items-center justify-between gap-4 flex-shrink-0 bg-white">
          <div className="min-w-0">
            <p className="text-xs text-gray-400">
              {totalItems === 1
                ? t("products.picker.itemsSelectedOne", { count: totalItems })
                : t("products.picker.itemsSelectedOther", { count: totalItems })}
            </p>
            {!priceUnset && totalItems > 0 && (
              <p className="font-bold text-brand-600 text-lg leading-tight">{formatPrice(totalPrice)}</p>
            )}
          </div>
          <button
            onClick={handleDone}
            disabled={selections.length === 0}
            className={clsx(
              "flex items-center gap-2 px-5 sm:px-6 py-3 rounded-2xl font-semibold text-sm transition-all flex-shrink-0",
              selections.length === 0
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-brand-500 hover:bg-brand-600 text-white shadow-lg shadow-brand-500/20"
            )}
          >
            <CreditCard size={16} /> {t("products.picker.checkout")}
          </button>
        </div>
      </div>
    </div>
  );
}
