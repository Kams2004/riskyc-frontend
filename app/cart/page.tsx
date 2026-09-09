"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { useStore } from "@/lib/store";
import CartItems from "@/components/cart/CartItems";
import OrdersList from "@/components/cart/OrdersList";
import CheckoutFlow from "@/components/cart/CheckoutFlow";
import { ShoppingCart, Package } from "@/components/icons/fa";
import { useTranslation } from "@/lib/i18n/useTranslation";
import clsx from "clsx";

export default function CartPage() {
  return (
    <Suspense fallback={null}>
      <CartPageInner />
    </Suspense>
  );
}

function CartPageInner() {
  const searchParams = useSearchParams();
  const startCheckout = searchParams.get("checkout") === "1";
  const { items, refreshCart } = useStore();
  const { t } = useTranslation();

  const [tab, setTab] = useState<"cart" | "orders">(
    searchParams.get("tab") === "orders" ? "orders" : "cart"
  );
  const [checkoutOpen, setCheckoutOpen] = useState(startCheckout);
  const [checkoutOrderId, setCheckoutOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (startCheckout && items.length > 0) {
      setCheckoutOpen(true);
    }
  }, [startCheckout, items.length]);

  // A cart line can go stale while just sitting in localStorage between
  // visits — refresh against the live catalogue as soon as the cart is
  // actually looked at, not only once checkout is opened.
  useEffect(() => {
    refreshCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStartCheckout = () => {
    setCheckoutOpen(true);
    setCheckoutOrderId(null);
  };

  const handleOpenOrder = (orderId: string) => {
    setCheckoutOrderId(orderId);
    setCheckoutOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 min-h-[70vh]">
      <h1 className="section-title mb-6">{t("cart.page.title")}</h1>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-8">
        <button
          onClick={() => setTab("cart")}
          className={clsx(
            "flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 -mb-px transition-colors",
            tab === "cart"
              ? "border-brand-500 text-brand-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          )}
        >
          <ShoppingCart size={16} />
          {t("cart.page.cartTab")}
          {items.length > 0 && (
            <span className="bg-brand-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
              {items.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setTab("orders")}
          className={clsx(
            "flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 -mb-px transition-colors",
            tab === "orders"
              ? "border-brand-500 text-brand-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          )}
        >
          <Package size={16} />
          {t("cart.page.ordersTab")}
        </button>
      </div>

      {tab === "cart" && (
        <CartItems onCheckout={handleStartCheckout} />
      )}

      {tab === "orders" && (
        <OrdersList onOpenOrder={handleOpenOrder} />
      )}

      {/* Checkout modal */}
      {checkoutOpen && (
        <CheckoutFlow
          orderId={checkoutOrderId}
          onClose={() => {
            setCheckoutOpen(false);
            setCheckoutOrderId(null);
            setTab("orders");
          }}
        />
      )}
    </div>
  );
}
