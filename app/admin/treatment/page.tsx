"use client";

import AdminShell from "@/components/admin/AdminShell";
import { useAdminStore } from "@/lib/adminStore";
import * as ordersApi from "@/lib/api/orders";
import { useOrdersSocket } from "@/lib/chatSocket";
import { useAdminColors } from "@/lib/useAdminColors";
import { formatPrice } from "@/lib/data";
import { ApiError } from "@/lib/apiClient";
import { Order } from "@/lib/types";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import {
  PackageSearch,
  PackageCheck,
  Package,
  Play,
  Check,
  User,
  Eye,
  AlertCircle,
  Truck,
} from "lucide-react";
import clsx from "clsx";
import { useTranslation } from "@/lib/i18n/useTranslation";
import DeliveryContactsPanel from "@/components/admin/DeliveryContactsPanel";

type Tab = "waiting" | "in_progress" | "done";

export default function AdminTreatmentPage() {
  const token = useAdminStore((s) => s.session?.token);
  const canManage = useAdminStore((s) => s.hasPermission("MANAGE_TREATMENT"));
  const canSendPackagingMessage = useAdminStore((s) => s.hasPermission("SEND_PACKAGING_MESSAGE"));
  const adminId = useAdminStore((s) => s.session?.id);
  const isSuperAdmin = useAdminStore((s) => s.isSuperAdmin());
  const c = useAdminColors();
  const { t } = useTranslation();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("waiting");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [contactsOpen, setContactsOpen] = useState(false);

  useEffect(() => {
    if (!token) return;
    ordersApi.listOrders(token).then(setOrders).catch(() => {}).finally(() => setLoading(false));
  }, [token]);

  const handleOrderUpdate = useCallback((updated: Order) => {
    setOrders((prev) => {
      const exists = prev.some((o) => o.id === updated.id);
      return exists ? prev.map((o) => (o.id === updated.id ? updated : o)) : [updated, ...prev];
    });
  }, []);
  useOrdersSocket(handleOrderUpdate);

  // Whether *this* admin is allowed to finish packing / send the packaging
  // confirmation for `order` — the person who started it, a super admin, or
  // anyone separately granted SEND_PACKAGING_MESSAGE (they're trusted to
  // speak for the shop on packaging regardless of who packed it). Unlike the
  // In Progress/Done split below, this one IS the actual security boundary:
  // it gates the Mark Done button itself, not just which tab an order sits in.
  const canFinishPackaging = useCallback(
    (order: Order) => isSuperAdmin || order.packagingStartedById === adminId || canSendPackagingMessage,
    [isSuperAdmin, adminId, canSendPackagingMessage]
  );

  // In Progress/Packaged are personalized per admin — mostly a UX declutter
  // (this same order data is visible elsewhere, via Orders list/detail, to
  // anyone with VIEW_ORDERS) — but also needs to surface an order to anyone
  // who canFinishPackaging() it, or they'd have permission to act with
  // nowhere in this UI to do it from.
  const waiting = orders.filter((o) => o.status === "VALIDATED");
  const inProgress = orders.filter((o) => o.status === "PACKAGING" && (isSuperAdmin || canFinishPackaging(o)));
  const done = orders.filter(
    (o) => o.status === "PACKAGED" && (isSuperAdmin || o.packagingCompletedById === adminId)
  );

  const list = tab === "waiting" ? waiting : tab === "in_progress" ? inProgress : done;

  const handleStart = async (orderId: string) => {
    if (!token) return;
    setBusyId(orderId);
    setError(null);
    try {
      const updated = await ordersApi.startPackaging(orderId, token);
      handleOrderUpdate(updated);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("adminOrders.treatment.errorStart"));
    } finally {
      setBusyId(null);
    }
  };

  const handleComplete = async (orderId: string) => {
    if (!token) return;
    setBusyId(orderId);
    setError(null);
    try {
      const updated = await ordersApi.completePackaging(orderId, token);
      handleOrderUpdate(updated);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("adminOrders.treatment.errorComplete"));
    } finally {
      setBusyId(null);
    }
  };

  const fmtTime = (iso?: string | null) =>
    iso
      ? new Date(iso).toLocaleString("en-GB", {
          day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
        })
      : "";

  const tabs: { key: Tab; label: string; icon: React.ReactNode; count: number }[] = [
    { key: "waiting", label: t("adminOrders.treatment.tabWaiting"), icon: <Package size={13} />, count: waiting.length },
    { key: "in_progress", label: t("adminOrders.treatment.tabInProgress"), icon: <PackageSearch size={13} />, count: inProgress.length },
    { key: "done", label: t("adminOrders.treatment.tabDone"), icon: <PackageCheck size={13} />, count: done.length },
  ];

  return (
    <AdminShell>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className={clsx("text-2xl font-bold", c.textPrimary)}>{t("adminOrders.treatment.title")}</h1>
            <p className={clsx("text-sm mt-0.5", c.textSecondary)}>
              {t("adminOrders.treatment.subtitle")}
            </p>
          </div>
          <button
            onClick={() => setContactsOpen(true)}
            className={clsx("flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors", c.btnGhost)}
          >
            <Truck size={14} /> {t("adminOrders.treatment.deliveryTeamButton")}
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 text-red-500 text-sm font-medium">
            <AlertCircle size={16} className="flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={clsx(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all",
                tab === t.key ? "bg-brand-500 text-white shadow-sm" : c.filterInactive
              )}
            >
              {t.icon}
              {t.label}
              {!loading && (
                <span className={clsx("rounded-full px-1.5 py-0.5 text-xs",
                  tab === t.key ? "bg-white/25 text-white" : c.isDark ? "bg-gray-700 text-gray-400" : "bg-gray-100 text-gray-500"
                )}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={clsx("rounded-2xl border p-5 h-40 animate-pulse", c.card)} />
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className={clsx("text-center py-20", c.textMuted)}>
            <Package className="mx-auto w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">{t("adminOrders.treatment.empty")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {list.map((order) => {
              const itemSummary = order.items.map((i) => `${i.productName} ×${i.quantity}`).join(", ");
              const totalQty = order.items.reduce((s, i) => s + i.quantity, 0);
              const isBusy = busyId === order.id;

              return (
                <div key={order.id} className={clsx("rounded-2xl border p-5 flex flex-col gap-3", c.card)}>
                  <div className="flex items-start justify-between gap-2">
                    <p className={clsx("font-mono text-xs font-bold leading-tight truncate", c.mono)}>
                      {order.id.slice(0, 8)}…
                    </p>
                    <span className={clsx(
                      "inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0",
                      c.status[order.status]
                    )}>
                      {order.status === "VALIDATED" && <Package size={12} />}
                      {order.status === "PACKAGING" && <PackageSearch size={12} />}
                      {order.status === "PACKAGED" && <PackageCheck size={12} />}
                      {order.status === "VALIDATED" ? t("adminOrders.status.validated") : order.status === "PACKAGING" ? t("adminOrders.status.packaging") : t("adminOrders.status.packaged")}
                    </span>
                  </div>

                  <div className={clsx("rounded-xl p-3", c.innerCard)}>
                    <p className={clsx("text-sm font-semibold leading-relaxed", c.textPrimary)} title={itemSummary}>
                      {itemSummary}
                    </p>
                    <p className={clsx("text-xs mt-1", c.textMuted)}>
                      {t(order.items.length === 1 ? "adminOrders.counts.productOne" : "adminOrders.counts.productOther", { count: order.items.length })}
                      {" · "}
                      {t(totalQty === 1 ? "adminOrders.counts.unitOne" : "adminOrders.counts.unitOther", { count: totalQty })}
                      {" · "}
                      {formatPrice(order.total)}
                    </p>
                  </div>

                  {/* Who's doing / did the work */}
                  {order.status === "PACKAGING" && order.packagingStartedByName && (
                    <div className={clsx("flex items-center gap-2 text-xs px-3 py-2 rounded-lg", c.isDark ? "bg-purple-900/20 text-purple-300" : "bg-purple-50 text-purple-700")}>
                      <User size={13} className="flex-shrink-0" />
                      <span>
                        <strong>{order.packagingStartedByName}</strong> {t("adminOrders.treatment.startedLabel")} {fmtTime(order.packagingStartedAt)}
                      </span>
                    </div>
                  )}
                  {order.status === "PACKAGED" && order.packagingCompletedByName && (
                    <div className={clsx("flex items-center gap-2 text-xs px-3 py-2 rounded-lg", c.isDark ? "bg-teal-900/20 text-teal-300" : "bg-teal-50 text-teal-700")}>
                      <Check size={13} className="flex-shrink-0" />
                      <span>
                        <strong>{order.packagingCompletedByName}</strong> {t("adminOrders.treatment.finishedLabel")} {fmtTime(order.packagingCompletedAt)}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    {order.status === "VALIDATED" && (
                      <button
                        onClick={() => handleStart(order.id)}
                        disabled={!canManage || isBusy}
                        title={!canManage ? t("adminOrders.treatment.noPermission") : undefined}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-purple-500/15 text-purple-600 hover:bg-purple-500/25 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold transition-colors"
                      >
                        <Play size={13} /> {isBusy ? t("adminOrders.treatment.starting") : t("adminOrders.treatment.startPackaging")}
                      </button>
                    )}
                    {order.status === "PACKAGING" && (
                      <button
                        onClick={() => handleComplete(order.id)}
                        disabled={!canManage || !canFinishPackaging(order) || isBusy}
                        title={
                          !canManage
                            ? t("adminOrders.treatment.noPermission")
                            : !canFinishPackaging(order)
                            ? t("adminOrders.treatment.notYourPackage")
                            : undefined
                        }
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-teal-500/15 text-teal-600 hover:bg-teal-500/25 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold transition-colors"
                      >
                        <Check size={13} /> {isBusy ? t("adminOrders.treatment.saving") : t("adminOrders.treatment.markDone")}
                      </button>
                    )}
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className={clsx(
                        "flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap",
                        order.status === "PACKAGED" ? "flex-1" : "",
                        c.btnGhost
                      )}
                    >
                      <Eye size={13} /> {t("adminOrders.list.view")}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {contactsOpen && <DeliveryContactsPanel onClose={() => setContactsOpen(false)} />}
    </AdminShell>
  );
}
