"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { listOrdersForCustomer, getOrder } from "@/lib/api/orders";
import { getLocalOrderIds } from "@/lib/localOrders";
import { formatPrice } from "@/lib/data";
import { Order, OrderStatus } from "@/lib/types";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Package,
  CreditCard,
  Search,
} from "@/components/icons/fa";
import { useTranslation } from "@/lib/i18n/useTranslation";
import clsx from "clsx";
import Link from "next/link";

interface Props {
  onOpenOrder: (orderId: string) => void;
}

const statusIconAndColor: Record<
  OrderStatus,
  { color: string; bg: string; icon: React.ReactNode }
> = {
  PENDING: { color: "text-gray-600", bg: "bg-gray-100", icon: <Clock size={14} /> },
  AWAITING_PAYMENT: { color: "text-orange-600", bg: "bg-orange-100", icon: <CreditCard size={14} /> },
  REVIEWING: { color: "text-blue-600", bg: "bg-blue-100", icon: <Search size={14} /> },
  VALIDATED: { color: "text-green-700", bg: "bg-green-100", icon: <CheckCircle2 size={14} /> },
  PACKAGING: { color: "text-purple-700", bg: "bg-purple-100", icon: <Package size={14} /> },
  PACKAGED: { color: "text-teal-700", bg: "bg-teal-100", icon: <CheckCircle2 size={14} /> },
  CANCELLED: { color: "text-red-600", bg: "bg-red-100", icon: <XCircle size={14} /> },
};

const statusLabelKey: Record<OrderStatus, string> = {
  PENDING: "cart.orders.status.pending",
  AWAITING_PAYMENT: "cart.orders.status.awaitingPayment",
  REVIEWING: "cart.orders.status.reviewing",
  VALIDATED: "cart.orders.status.validated",
  PACKAGING: "cart.orders.status.packaging",
  PACKAGED: "cart.orders.status.packaged",
  CANCELLED: "cart.orders.status.cancelled",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const { t } = useTranslation();
  const cfg = statusIconAndColor[status];
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold",
        cfg.color,
        cfg.bg
      )}
    >
      {cfg.icon}
      {t(statusLabelKey[status])}
    </span>
  );
}

function OrderTimeline({ status }: { status: OrderStatus }) {
  const { t } = useTranslation();
  const steps: { key: OrderStatus; label: string }[] = [
    { key: "PENDING", label: t("cart.orders.timeline.orderPlaced") },
    { key: "AWAITING_PAYMENT", label: t("cart.orders.timeline.payment") },
    { key: "REVIEWING", label: t("cart.orders.timeline.reviewing") },
    { key: "VALIDATED", label: t("cart.orders.timeline.validated") },
  ];

  const stepOrder = ["PENDING", "AWAITING_PAYMENT", "REVIEWING", "VALIDATED"];
  const currentIdx = stepOrder.indexOf(status);

  return (
    <div className="flex items-center gap-0 mt-3">
      {steps.map((step, i) => {
        const done = i <= currentIdx && status !== "CANCELLED";
        const active = i === currentIdx && status !== "CANCELLED";
        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div
                className={clsx(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all",
                  done && !active
                    ? "bg-green-500 border-green-500 text-white"
                    : active
                    ? "bg-brand-500 border-brand-500 text-white"
                    : "bg-white border-gray-200 text-gray-300"
                )}
              >
                {done && !active ? "✓" : i + 1}
              </div>
              <span
                className={clsx(
                  "text-[10px] text-center leading-tight max-w-[56px]",
                  active
                    ? "text-brand-600 font-semibold"
                    : done
                    ? "text-green-600"
                    : "text-gray-300"
                )}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={clsx(
                  "flex-1 h-0.5 mx-1 mb-4",
                  i < currentIdx && status !== "CANCELLED"
                    ? "bg-green-400"
                    : "bg-gray-200"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function OrdersList({ onOpenOrder }: Props) {
  const { customer } = useStore();
  const { t } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    if (!customer) {
      // A guest has no server-side order list to fetch — fall back to
      // whatever orders this browser recorded locally at checkout, same
      // pattern the mobile app already uses for the same reason.
      const ids = getLocalOrderIds();
      Promise.all(ids.map((id) => getOrder(id).catch(() => null)))
        .then((results) => setOrders(results.filter((o): o is Order => o != null)))
        .catch(() => setOrders([]))
        .finally(() => setLoading(false));
      return;
    }
    listOrdersForCustomer(customer.id)
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [customer]);

  if (loading) {
    return (
      <div className="space-y-5 max-w-3xl">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card border border-gray-100 p-5 h-32 bg-gray-50 animate-pulse" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center">
          <Package size={40} className="text-gray-300" />
        </div>
        <h3 className="text-xl font-semibold text-gray-600">{t("cart.orders.emptyTitle")}</h3>
        <p className="text-gray-400 text-sm">
          {t("cart.orders.emptySubtitle")}
        </p>
        <Link href="/products" className="btn-primary mt-2">
          {t("cart.common.startShopping")}
        </Link>
      </div>
    );
  }

  const sorted = [...orders].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="space-y-5 max-w-3xl">
      {sorted.map((order) => (
        <div
          key={order.id}
          className="card border border-gray-100 p-5 animate-fade-in"
        >
          {/* Order header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900 font-mono text-sm">
                  {order.id}
                </span>
                <StatusBadge status={order.status} />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Placed on{" "}
                {new Date(order.createdAt).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-bold text-brand-600 text-lg">
                {formatPrice(order.total)}
              </span>
              <button
                onClick={() => onOpenOrder(order.id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-50 text-brand-600 hover:bg-brand-100 text-sm font-medium transition-colors"
              >
                <Eye size={15} />
                {order.status === "VALIDATED" ? "View" : "Manage"}
              </button>
            </div>
          </div>

          {/* Progress timeline */}
          {order.status !== "CANCELLED" && (
            <OrderTimeline status={order.status} />
          )}

          {/* Items preview */}
          <div className="mt-4 flex items-center gap-3">
            <div className="flex -space-x-2">
              {order.items.slice(0, 3).map((item, i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-lg overflow-hidden border-2 border-white shadow-sm"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.productThumbnailUrl ?? undefined}
                    alt={item.productName}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
              {order.items.length > 3 && (
                <div className="w-10 h-10 rounded-lg bg-gray-100 border-2 border-white flex items-center justify-center text-xs font-semibold text-gray-500 shadow-sm">
                  +{order.items.length - 3}
                </div>
              )}
            </div>
            <span className="text-sm text-gray-500">
              {order.items.reduce((s, i) => s + i.quantity, 0)} item
              {order.items.reduce((s, i) => s + i.quantity, 0) !== 1 ? "s" : ""}
            </span>
            {order.paymentMethod && (
              <span className="ml-auto text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full capitalize">
                {order.paymentMethod === "ORANGE_MONEY"
                  ? "🟠 Orange Money"
                  : "🟡 MTN MoMo"}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
