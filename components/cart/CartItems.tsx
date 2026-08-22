"use client";

import { useStore } from "@/lib/store";
import { formatPrice } from "@/lib/data";
import { Trash2, ShoppingBag, Plus, Minus, ArrowRight } from "@/components/icons/fa";
import Link from "next/link";

interface Props {
  onCheckout: () => void;
}

export default function CartItems({ onCheckout }: Props) {
  const { items, removeFromCart, updateQuantity, getCartTotal, clearCart } =
    useStore();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center">
          <ShoppingBag size={40} className="text-gray-300" />
        </div>
        <h3 className="text-xl font-semibold text-gray-600">
          Your cart is empty
        </h3>
        <p className="text-gray-400 text-sm">
          Add some products to get started
        </p>
        <Link href="/products" className="btn-primary mt-2">
          Start Shopping
        </Link>
      </div>
    );
  }

  const total = getCartTotal();
  const shipping = total >= 50000 ? 0 : 2500;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Items list */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-gray-700">
            {items.length} item{items.length !== 1 ? "s" : ""} in cart
          </h2>
          <button
            onClick={clearCart}
            className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1 transition-colors"
          >
            <Trash2 size={13} /> Clear all
          </button>
        </div>

        {items.map((item) => (
          <div
            key={`${item.product.id}-${item.selectedColor}-${item.selectedSize}`}
            className="card p-4 flex gap-4 border border-gray-100 animate-fade-in"
          >
            {/* Image */}
            <Link
              href={`/products/${item.product.id}`}
              className="flex-shrink-0 w-24 h-28 sm:w-28 sm:h-32 rounded-xl overflow-hidden bg-gray-50"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.product.media[0]?.presignedUrl}
                alt={item.product.name}
                className="w-full h-full object-cover hover:scale-105 transition-transform"
              />
            </Link>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <Link
                href={`/products/${item.product.id}`}
                className="font-semibold text-gray-900 text-sm sm:text-base hover:text-brand-600 transition-colors line-clamp-2"
              >
                {item.product.name}
              </Link>

              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                {/* Color badge */}
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
                {/* Size badge */}
                {item.selectedSize && (
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600">
                    Size: {item.selectedSize}
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
                        item.quantity - 1
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
                        item.quantity + 1
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
                    {formatPrice(item.product.price * item.quantity)}
                  </div>
                  {item.quantity > 1 && (
                    <div className="text-xs text-gray-400">
                      {formatPrice(item.product.price)} each
                    </div>
                  )}
                </div>

                {/* Remove */}
                <button
                  onClick={() =>
                    removeFromCart(item.product.id, item.selectedColor)
                  }
                  className="text-gray-300 hover:text-red-500 transition-colors"
                  title="Remove item"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Order summary */}
      <div className="lg:col-span-1">
        <div className="card border border-gray-100 p-6 sticky top-24">
          <h3 className="font-display font-bold text-lg text-gray-900 mb-5">
            Order Summary
          </h3>

          <div className="space-y-3 mb-5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-medium">{formatPrice(total)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Shipping</span>
              <span
                className={
                  shipping === 0 ? "text-green-600 font-medium" : "font-medium"
                }
              >
                {shipping === 0 ? "Free 🎉" : formatPrice(shipping)}
              </span>
            </div>
            {shipping > 0 && (
              <p className="text-xs text-gray-400 bg-gray-50 p-2 rounded-lg">
                Add {formatPrice(50000 - total)} more for free shipping
              </p>
            )}
            <div className="border-t border-gray-100 pt-3 flex justify-between">
              <span className="font-semibold text-gray-900">Total</span>
              <span className="font-bold text-xl text-brand-600">
                {formatPrice(total + shipping)}
              </span>
            </div>
          </div>

          {/* Payment methods note */}
          <div className="flex gap-2 mb-5">
            <div className="flex-1 flex items-center justify-center gap-1 bg-orange-50 border border-orange-100 rounded-xl p-2">
              <span className="text-orange-500 font-bold text-xs">🟠 Orange Money</span>
            </div>
            <div className="flex-1 flex items-center justify-center gap-1 bg-yellow-50 border border-yellow-100 rounded-xl p-2">
              <span className="text-yellow-600 font-bold text-xs">🟡 MoMo</span>
            </div>
          </div>

          <button
            onClick={onCheckout}
            className="w-full btn-primary py-4 text-base rounded-2xl"
          >
            Proceed to Checkout
            <ArrowRight size={18} />
          </button>

          <Link
            href="/products"
            className="block text-center text-sm text-gray-400 hover:text-brand-500 mt-3 transition-colors"
          >
            ← Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
