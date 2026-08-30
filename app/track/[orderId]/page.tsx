"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getOrder } from "@/lib/api/orders";
import { Order, OrderStatus } from "@/lib/types";
import { formatPrice } from "@/lib/data";
import { usePushSubscription } from "@/lib/usePushSubscription";
import { StatusBadge } from "@/components/cart/OrdersList";
import {
  CheckCircle2,
  XCircle,
  Bell,
  Package,
  ShoppingBag,
  AlertCircle,
} from "@/components/icons/fa";
import clsx from "clsx";

const STEPS: { key: OrderStatus; label: string }[] = [
  { key: "PENDING", label: "Placed" },
  { key: "AWAITING_PAYMENT", label: "Payment" },
  { key: "REVIEWING", label: "Reviewing" },
  { key: "VALIDATED", label: "Validated" },
  { key: "PACKAGING", label: "Packaging" },
  { key: "PACKAGED", label: "Packaged" },
];
const STEP_ORDER = STEPS.map((s) => s.key);

export default function TrackOrderPage() {
  const params = useParams<{ orderId: string }>();
  const orderId = params.orderId;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { status: pushStatus, subscribe } = usePushSubscription(orderId);

  useEffect(() => {
    if (!orderId) return;
    getOrder(orderId)
      .then(setOrder)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 flex justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto px-4 sm:px-6 py-20 text-center">
        <AlertCircle size={40} className="mx-auto mb-4 text-gray-300" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">Order not found</h1>
        <p className="text-gray-500 text-sm mb-6">
          This tracking link doesn&apos;t match any order. Double-check the link, or contact us if you think this is a mistake.
        </p>
        <Link href="/" className="btn-primary inline-flex">Back to shop</Link>
      </div>
    );
  }

  const cancelled = order.status === "CANCELLED";
  const currentIdx = cancelled ? -1 : STEP_ORDER.indexOf(order.status);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <div className="text-center mb-8">
        <h1 className="font-display font-bold text-2xl text-gray-900">Track Your Order</h1>
        <p className="text-gray-400 text-xs font-mono mt-1">{order.id}</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
        <div className="flex items-center justify-between mb-6">
          <span className="text-sm font-semibold text-gray-500">Status</span>
          <StatusBadge status={order.status} />
        </div>

        {cancelled ? (
          <div className="bg-red-50 border border-red-100 rounded-xl p-4">
            <div className="flex items-center gap-2 text-red-600 font-semibold text-sm mb-1">
              <XCircle size={16} /> Order Rejected
            </div>
            <p className="text-sm text-red-700 leading-relaxed">
              {order.rejectionReason || "This order was rejected. Contact us for details."}
            </p>
          </div>
        ) : (
          <div className="flex items-center">
            {STEPS.map((step, i) => {
              const done = i <= currentIdx;
              const active = i === currentIdx;
              return (
                <div key={step.key} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center gap-1.5">
                    <div
                      className={clsx(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all flex-shrink-0",
                        done && !active
                          ? "bg-green-500 border-green-500 text-white"
                          : active
                          ? "bg-brand-500 border-brand-500 text-white"
                          : "bg-gray-100 border-gray-200 text-gray-400"
                      )}
                    >
                      {done && !active ? <CheckCircle2 size={14} /> : i + 1}
                    </div>
                    <span
                      className={clsx(
                        "text-[10px] font-medium text-center max-w-[60px] leading-tight",
                        active ? "text-brand-600" : done ? "text-green-600" : "text-gray-400"
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={clsx("flex-1 h-0.5 mx-1 mb-4", i < currentIdx ? "bg-green-400" : "bg-gray-200")} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Order items */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Package size={15} className="text-brand-500" /> Order Summary
        </h2>
        <div className="space-y-2 mb-4">
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-gray-600">
                {item.productName}
                {item.selectedColor ? ` · ${item.selectedColor}` : ""}
                {item.selectedSize ? ` · ${item.selectedSize}` : ""}
                {item.selectedImageIndex != null ? ` · Photo ${item.selectedImageIndex + 1}` : ""}
                <span className="text-gray-400"> ×{item.quantity}</span>
              </span>
              <span className="font-medium text-gray-800 flex-shrink-0 ml-3">{formatPrice(item.unitPrice * item.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-base font-bold text-gray-900 pt-3 border-t border-gray-100">
          <span>Total</span>
          <span className="text-brand-600">{formatPrice(order.total)}</span>
        </div>
      </div>

      {/* Push notification opt-in */}
      {pushStatus !== "unsupported" && !cancelled && (
        <div className="bg-brand-50 border border-brand-100 rounded-2xl p-5 mb-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center flex-shrink-0">
              <Bell size={16} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900 mb-0.5">Get notified</p>
              {pushStatus === "subscribed" ? (
                <p className="text-xs text-green-700">You&apos;ll be notified here when your order is validated or rejected.</p>
              ) : pushStatus === "denied" ? (
                <p className="text-xs text-gray-500">Notifications are blocked in your browser settings — enable them to get updates here.</p>
              ) : (
                <>
                  <p className="text-xs text-gray-500 mb-2.5">We&apos;ll send a notification the moment your payment is reviewed.</p>
                  <button
                    onClick={subscribe}
                    disabled={pushStatus === "subscribing" || pushStatus === "checking"}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white text-xs font-semibold transition-colors"
                  >
                    {pushStatus === "subscribing" ? (
                      <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Bell size={12} />
                    )}
                    {pushStatus === "subscribing" ? "Enabling…" : "Enable notifications"}
                  </button>
                  {pushStatus === "error" && (
                    <p className="text-[11px] text-red-500 mt-1.5">Couldn&apos;t enable notifications — try again.</p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <Link href="/" className="w-full btn-primary py-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm">
        <ShoppingBag size={16} /> Continue Shopping
      </Link>
    </div>
  );
}
