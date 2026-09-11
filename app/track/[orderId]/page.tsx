"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getOrder } from "@/lib/api/orders";
import { getConversationForOrder } from "@/lib/api/conversations";
import { useStore } from "@/lib/store";
import { Order, OrderStatus } from "@/lib/types";
import { formatPrice } from "@/lib/data";
import { usePushSubscription } from "@/lib/usePushSubscription";
import { StatusBadge } from "@/components/cart/OrdersList";
import DeliveryTeamCard from "@/components/shared/DeliveryTeamCard";
import ImageLightbox from "@/components/ui/ImageLightbox";
import {
  CheckCircle2,
  XCircle,
  Bell,
  Package,
  ShoppingBag,
  AlertCircle,
  RotateCcw,
  MessageCircle,
  Clock,
  UserPlus,
} from "@/components/icons/fa";
import clsx from "clsx";
import { useTranslation } from "@/lib/i18n/useTranslation";

const STEP_KEYS: { key: OrderStatus; labelKey: string }[] = [
  { key: "PENDING", labelKey: "account.track.steps.placed" },
  { key: "AWAITING_PAYMENT", labelKey: "account.track.steps.payment" },
  { key: "REVIEWING", labelKey: "account.track.steps.reviewing" },
  { key: "VALIDATED", labelKey: "account.track.steps.validated" },
  { key: "PACKAGING", labelKey: "account.track.steps.packaging" },
  { key: "PACKAGED", labelKey: "account.track.steps.packaged" },
];
const STEP_ORDER = STEP_KEYS.map((s) => s.key);

export default function TrackOrderPage() {
  const params = useParams<{ orderId: string }>();
  const orderId = params.orderId;
  const { t } = useTranslation();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);
  const { status: pushStatus, subscribe } = usePushSubscription(orderId);
  const { conversationId, setConversationId, customer } = useStore();

  const fetchOrder = () => {
    if (!orderId) return Promise.resolve();
    return getOrder(orderId)
      .then((o) => {
        setOrder(o);
        setError(false);
      })
      .catch(() => setError(true));
  };

  useEffect(() => {
    fetchOrder().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  // A guest (no account) may be on the same device as the chat widget — this
  // lets that widget find and adopt an admin-initiated thread for this order
  // (e.g. the packaging-confirmation message), even without a customerId.
  useEffect(() => {
    if (!orderId || conversationId) return;
    getConversationForOrder(orderId)
      .then((c) => {
        if (c) setConversationId(c.id);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, conversationId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrder();
    setRefreshing(false);
  };

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
        <h1 className="text-xl font-bold text-gray-900 mb-2">{t("account.track.notFoundTitle")}</h1>
        <p className="text-gray-500 text-sm mb-6">
          {t("account.track.notFoundDescription")}
        </p>
        <Link href="/" className="btn-primary inline-flex">{t("account.track.backToShop")}</Link>
      </div>
    );
  }

  const cancelled = order.status === "CANCELLED";
  const currentIdx = cancelled ? -1 : STEP_ORDER.indexOf(order.status);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <div className="relative text-center mb-8">
        <h1 className="font-display font-bold text-2xl text-gray-900">{t("account.track.title")}</h1>
        <p className="text-gray-400 text-xs font-mono mt-1">{order.id}</p>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          title={t("account.track.refresh")}
          className="absolute right-0 top-0 w-9 h-9 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-400 hover:text-brand-600 hover:border-brand-300 transition-colors disabled:opacity-60"
        >
          <RotateCcw size={15} className={refreshing ? "animate-spin" : undefined} />
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
        <div className="flex items-center justify-between mb-6">
          <span className="text-sm font-semibold text-gray-500">{t("account.track.status")}</span>
          <StatusBadge status={order.status} />
        </div>

        {cancelled ? (
          <div className="bg-red-50 border border-red-100 rounded-xl p-4">
            <div className="flex items-center gap-2 text-red-600 font-semibold text-sm mb-1">
              <XCircle size={16} /> {t("account.track.orderRejected")}
            </div>
            <p className="text-sm text-red-700 leading-relaxed mb-3">
              {order.rejectionReason || t("account.track.rejectionFallback")}
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 hover:text-red-800 bg-white border border-red-200 rounded-xl px-3 py-2 transition-colors"
            >
              <MessageCircle size={13} /> {t("account.track.contactUsForHelp")}
            </Link>
          </div>
        ) : (
          <div className="flex items-center">
            {STEP_KEYS.map((step, i) => {
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
                      {t(step.labelKey)}
                    </span>
                  </div>
                  {i < STEP_KEYS.length - 1 && (
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
                {item.selectedImageIndex != null ? ` · Picture ${item.selectedImageIndex + 1}` : ""}
                <span className="text-gray-400"> ×{item.quantity}</span>
              </span>
              <span className="font-medium text-gray-800 flex-shrink-0 ml-3">{formatPrice(item.unitPrice * item.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-base font-bold text-gray-900 pt-3 border-t border-gray-100">
          <span>{t("account.track.total")}</span>
          <span className="text-brand-600">{formatPrice(order.total)}</span>
        </div>
      </div>

      {!customer && (
        <div className="bg-brand-50 border border-brand-100 rounded-2xl p-4 mb-5 text-left space-y-3">
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-1">{t("cart.checkout.createAccountPromptTitle")}</p>
            <p className="text-xs text-gray-500 leading-relaxed">{t("cart.checkout.createAccountPromptBody")}</p>
          </div>
          <Link
            href={`/register?attachOrder=${order.id}`}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors"
          >
            <UserPlus size={16} /> {t("cart.checkout.createAccountPromptSignUp")}
          </Link>
          <Link
            href={`/login?attachOrder=${order.id}`}
            className="block text-center text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors"
          >
            {t("cart.checkout.createAccountPromptLogIn")}
          </Link>
        </div>
      )}

      {/* Packaged, but the admin hasn't sent the photo confirmation yet — a
          distinct waiting state so the customer isn't left staring at a
          "Packaged" step with nothing else on the page. */}
      {order.status === "PACKAGED" && !order.packagingConfirmation && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 mb-5">
          <div className="flex items-center gap-2 text-amber-700 font-semibold text-sm mb-1">
            <Clock size={16} /> {t("account.track.awaitingPackagingConfirmationHeading")}
          </div>
          <p className="text-sm text-amber-800/80 leading-relaxed">
            {t("account.track.awaitingPackagingConfirmationBody")}
          </p>
        </div>
      )}

      {/* Packaging confirmation — sent by the admin once the order is sealed, with delivery team contacts attached */}
      {order.packagingConfirmation && (
        <div className="bg-teal-50 border border-teal-100 rounded-2xl p-5 mb-5">
          <div className="flex items-center gap-2 text-teal-700 font-semibold text-sm mb-2">
            <CheckCircle2 size={16} /> {t("account.track.packagingConfirmedHeading")}
          </div>
          {order.packagingConfirmation.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={order.packagingConfirmation.imageUrl}
              alt={t("account.track.packagingConfirmedPhotoAlt")}
              onClick={() => setZoomedImageUrl(order.packagingConfirmation!.imageUrl!)}
              className="rounded-xl max-h-56 w-full object-cover mb-3 border border-teal-100 cursor-zoom-in"
            />
          )}
          {order.packagingConfirmation.text && (
            <p className="text-sm text-teal-900 leading-relaxed whitespace-pre-line mb-3">{order.packagingConfirmation.text}</p>
          )}
          <DeliveryTeamCard contacts={order.packagingConfirmation.deliveryContacts} />
        </div>
      )}

      {/* Push notification opt-in */}
      {pushStatus !== "unsupported" && !cancelled && (
        <div className="bg-brand-50 border border-brand-100 rounded-2xl p-5 mb-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center flex-shrink-0">
              <Bell size={16} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900 mb-0.5">{t("account.track.getNotified")}</p>
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

      {zoomedImageUrl && (
        <ImageLightbox src={zoomedImageUrl} alt={t("account.track.packagingConfirmedPhotoAlt")} onClose={() => setZoomedImageUrl(null)} />
      )}
    </div>
  );
}
