"use client";

import { useState } from "react";
import { Product } from "@/lib/types";
import { formatPrice } from "@/lib/data";
import { computeLineTotal } from "@/lib/pricing";
import { X, Plus, Minus, ShoppingCart, Trash2, ImageIcon } from "@/components/icons/fa";
import clsx from "clsx";

export interface ImageQuantitySelection {
  imageIndex: number;
  quantity: number;
}

interface Props {
  product: Product;
  onClose: () => void;
  onConfirm: (selections: ImageQuantitySelection[]) => void;
}

/**
 * Lets a customer pick different quantities per product photo instead of a
 * single blanket quantity — for colorless products where the photos
 * themselves are the "variant" (e.g. different styling/prints only shown in
 * pictures). Indices always refer to the product's full media array (not a
 * filtered display list) so they line up with what the backend/receipt use.
 */
export default function ImageQuantityPicker({ product, onClose, onConfirm }: Props) {
  // Only stills make sense to order "a quantity of" — but indices stay relative
  // to the full media array so they match product.media[i] everywhere else.
  const imageEntries = product.media
    .map((m, i) => ({ media: m, index: i }))
    .filter((e) => e.media.type === "IMAGE");

  const [activeIndex, setActiveIndex] = useState(imageEntries[0]?.index ?? 0);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const priceUnset = product.price <= 0;

  const setQty = (idx: number, qty: number) => {
    setQuantities((prev) => {
      const next = { ...prev };
      if (qty <= 0) delete next[idx];
      else next[idx] = qty;
      return next;
    });
  };

  const selections: ImageQuantitySelection[] = Object.entries(quantities)
    .map(([idx, quantity]) => ({ imageIndex: Number(idx), quantity }))
    .sort((a, b) => a.imageIndex - b.imageIndex);
  const totalItems = selections.reduce((s, x) => s + x.quantity, 0);
  const totalPrice = selections.reduce(
    (s, x) => s + computeLineTotal(product.price, product.bulkPrices, x.quantity),
    0
  );

  const activeMedia = product.media[activeIndex];
  const activeQty = quantities[activeIndex] ?? 0;

  const handleDone = () => {
    if (selections.length === 0) return;
    onConfirm(selections);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full sm:max-w-2xl sm:mx-4 h-[92vh] sm:h-auto sm:max-h-[90vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="min-w-0">
            <h2 className="font-display font-bold text-base sm:text-lg text-gray-900 truncate">
              Choose quantity by photo
            </h2>
            <p className="text-xs text-gray-400 truncate">{product.name}</p>
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
                  {activeQty} selected
                </span>
              )}
            </div>

            {/* Quantity stepper for the active photo */}
            <div className="flex items-center justify-center gap-4 mt-4">
              <button
                onClick={() => setQty(activeIndex, activeQty - 1)}
                disabled={activeQty === 0}
                className="w-11 h-11 rounded-xl border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:border-brand-300 hover:text-brand-600 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:text-gray-600 transition-colors"
              >
                <Minus size={16} />
              </button>
              <span className="w-14 text-center text-2xl font-bold text-gray-900 tabular-nums">{activeQty}</span>
              <button
                onClick={() => setQty(activeIndex, activeQty + 1)}
                className="w-11 h-11 rounded-xl border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:border-brand-300 hover:text-brand-600 transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
            <p className="text-center text-xs text-gray-400 mt-2">
              Quantity for the photo shown above — tap another photo below to switch
            </p>
          </div>

          {/* Thumbnail strip — scrolls horizontally, so any number of photos stays usable */}
          {imageEntries.length > 1 && (
            <div className="px-5 pb-4">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {imageEntries.map(({ media, index }) => {
                  const qty = quantities[index] ?? 0;
                  return (
                    <button
                      key={media.id}
                      onClick={() => setActiveIndex(index)}
                      className={clsx(
                        "relative flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all",
                        index === activeIndex
                          ? "border-brand-500 ring-2 ring-brand-100"
                          : qty > 0
                          ? "border-green-400"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={media.presignedUrl} alt="" className="w-full h-full object-cover" />
                      {qty > 0 && (
                        <span className="absolute -top-1 -right-1 bg-brand-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                          {qty}
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
                  Your selection ({selections.length} photo{selections.length !== 1 ? "s" : ""})
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selections.map((sel) => {
                    const media = product.media[sel.imageIndex];
                    return (
                      <div key={sel.imageIndex} className="flex items-center gap-3 bg-gray-50 rounded-xl p-2.5">
                        <button
                          onClick={() => setActiveIndex(sel.imageIndex)}
                          className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={media?.presignedUrl} alt="" className="w-full h-full object-cover" />
                        </button>
                        <span className="flex-1 min-w-0 text-sm text-gray-600 truncate">
                          Photo {sel.imageIndex + 1}
                        </span>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => setQty(sel.imageIndex, sel.quantity - 1)}
                            className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-6 text-center text-sm font-semibold tabular-nums">{sel.quantity}</span>
                          <button
                            onClick={() => setQty(sel.imageIndex, sel.quantity + 1)}
                            className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        <button
                          onClick={() => setQty(sel.imageIndex, 0)}
                          title="Remove"
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
              {totalItems} item{totalItems !== 1 ? "s" : ""} selected
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
            <ShoppingCart size={16} /> Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
