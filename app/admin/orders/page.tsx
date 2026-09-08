"use client";

import AdminShell from "@/components/admin/AdminShell";
import { useAdminStore } from "@/lib/adminStore";
import * as ordersApi from "@/lib/api/orders";
import { useAdminColors } from "@/lib/useAdminColors";
import { formatPrice } from "@/lib/data";
import { Order, OrderStatus } from "@/lib/types";
import Link from "next/link";
import ConfirmDialog, { ConfirmState } from "@/components/admin/ConfirmDialog";
import OrderQrScanner from "@/components/admin/OrderQrScanner";
import { useState, useEffect } from "react";
import {
  Eye, CheckCircle2, XCircle, Clock, CreditCard,
  Search, Filter, ShoppingBag, ChevronLeft, ChevronRight,
  LayoutGrid, List, PackageSearch, PackageCheck, ScanLine, Loader2,
} from "lucide-react";
import clsx from "clsx";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { ApiError } from "@/lib/apiClient";
import AlertDialog from "@/components/admin/AlertDialog";

const PAGE_SIZE = 5;

export default function AdminOrdersPage() {
  const token = useAdminStore((s) => s.session?.token);
  const canManageOrders = useAdminStore((s) => s.hasPermission("MANAGE_ORDERS"));
  const c = useAdminColors();
  const { t } = useTranslation();

  const statusMeta: Record<OrderStatus, { label: string; icon: React.ReactNode }> = {
    PENDING:          { label: t("adminOrders.status.pending"),          icon: <Clock size={12} /> },
    AWAITING_PAYMENT: { label: t("adminOrders.status.awaitingPayment"), icon: <CreditCard size={12} /> },
    REVIEWING:        { label: t("adminOrders.status.reviewing"),     icon: <Search size={12} /> },
    VALIDATED:        { label: t("adminOrders.status.validated"),        icon: <CheckCircle2 size={12} /> },
    PACKAGING:        { label: t("adminOrders.status.packaging"),        icon: <PackageSearch size={12} /> },
    PACKAGED:         { label: t("adminOrders.status.packaged"),         icon: <PackageCheck size={12} /> },
    CANCELLED:        { label: t("adminOrders.status.cancelled"),        icon: <XCircle size={12} /> },
  };
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [validateSuccessOpen, setValidateSuccessOpen] = useState(false);

  useEffect(() => {
    if (!token) return;
    ordersApi.listOrders(token).then(setOrders).catch(() => {}).finally(() => setLoading(false));
  }, [token]);

  const setStatus = async (orderId: string, status: OrderStatus, reason?: string) => {
    if (!token) return;
    setBusyId(orderId);
    setActionError(null);
    try {
      const updated = await ordersApi.updateOrderStatus(orderId, status, token, reason);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        setConflictMessage(e.message);
        ordersApi.listOrders(token).then(setOrders).catch(() => {});
      } else {
        setActionError(e instanceof ApiError ? e.message : "Something went wrong. Please try again.");
        throw e;
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleValidate = (orderId: string) => setStatus(orderId, "VALIDATED").then(() => setValidateSuccessOpen(true)).catch(() => {});

  const askReject = (orderId: string) => {
    setConfirm({
      title: t("adminOrders.confirm.rejectTitle"),
      message: t("adminOrders.confirm.rejectMessage"),
      confirmLabel: t("adminOrders.confirm.rejectConfirmLabel"),
      input: { label: t("adminOrders.confirm.rejectReasonLabel"), placeholder: t("adminOrders.confirm.rejectReasonPlaceholder"), required: true },
      onConfirm: async (reason) => {
        await setStatus(orderId, "CANCELLED", reason);
        setConfirm(null);
      },
    });
  };

  const filtered = orders
    .filter((o) => filter === "all" || o.status === filter)
    .filter((o) => !search || o.id.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Reset to page 1 when filter/search changes
  const handleFilter = (f: OrderStatus | "all") => { setFilter(f); setPage(1); };
  const handleSearch = (v: string) => { setSearch(v); setPage(1); };

  const counts: Record<string, number> = {
    all: orders.length,
    REVIEWING:        orders.filter((o) => o.status === "REVIEWING").length,
    AWAITING_PAYMENT: orders.filter((o) => o.status === "AWAITING_PAYMENT").length,
    VALIDATED:        orders.filter((o) => o.status === "VALIDATED").length,
    PACKAGING:        orders.filter((o) => o.status === "PACKAGING").length,
    PACKAGED:         orders.filter((o) => o.status === "PACKAGED").length,
    PENDING:          orders.filter((o) => o.status === "PENDING").length,
    CANCELLED:        orders.filter((o) => o.status === "CANCELLED").length,
  };

  return (
    <AdminShell>
      <div className="p-6 lg:p-8 space-y-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className={clsx("text-2xl font-bold", c.textPrimary)}>{t("adminOrders.list.title")}</h1>
            <p className={clsx("text-sm mt-0.5", c.textSecondary)}>
              {t(orders.length === 1 ? "adminOrders.list.totalOrdersOne" : "adminOrders.list.totalOrdersOther", { count: orders.length })}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setScannerOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors shadow-sm"
            >
              <ScanLine size={15} /> {t("adminOrders.list.scanButton")}
            </button>
            <div className={clsx("flex items-center gap-2 border rounded-xl px-3 py-2", c.isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-300")}>
              <Search size={15} className="text-gray-400 flex-shrink-0" />
              <input
                type="text"
                placeholder={t("adminOrders.list.searchPlaceholder")}
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className={clsx("bg-transparent text-sm outline-none w-44", c.isDark ? "text-white placeholder-gray-500" : "text-gray-900 placeholder-gray-400")}
              />
            </div>
            <div className={clsx("flex items-center rounded-xl border p-1 gap-1",
              c.isDark ? "bg-gray-800 border-gray-700" : "bg-gray-100 border-gray-200")}>
              <button onClick={() => setViewMode("table")} title={t("adminOrders.list.tableView")}
                className={clsx("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                  viewMode === "table" ? "bg-brand-500 text-white shadow-sm"
                  : c.isDark ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-800")}>
                <List size={14} /> {t("adminOrders.list.tableView")}
              </button>
              <button onClick={() => setViewMode("grid")} title={t("adminOrders.list.gridView")}
                className={clsx("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                  viewMode === "grid" ? "bg-brand-500 text-white shadow-sm"
                  : c.isDark ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-800")}>
                <LayoutGrid size={14} /> {t("adminOrders.list.gridView")}
              </button>
            </div>
          </div>
        </div>

        {/* ── Filter tabs ── */}
        <div className="flex flex-wrap gap-2">
          {(["all", "REVIEWING", "AWAITING_PAYMENT", "PENDING", "VALIDATED", "PACKAGING", "PACKAGED", "CANCELLED"] as const).map((s) => (
            <button key={s} onClick={() => handleFilter(s)}
              className={clsx(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all",
                filter === s ? "bg-brand-500 text-white shadow-sm" : c.filterInactive
              )}
            >
              {s === "all" ? <Filter size={11} /> : statusMeta[s as OrderStatus].icon}
              {s === "all" ? t("adminOrders.list.filterAll") : statusMeta[s as OrderStatus].label}
              <span className={clsx("rounded-full px-1.5 py-0.5 text-xs",
                filter === s ? "bg-white/25 text-white" : c.isDark ? "bg-gray-700 text-gray-400" : "bg-gray-100 text-gray-500"
              )}>
                {counts[s]}
              </span>
            </button>
          ))}
        </div>

        {/* ── Table ── */}
        {loading ? (
          <div className={clsx("text-center py-20 rounded-2xl border", c.card)}>
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className={clsx("text-center py-20", c.textMuted)}>
            <ShoppingBag className="mx-auto w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">{t("adminOrders.list.empty")}</p>
          </div>
        ) : (
          <>
            {/* ── TABLE VIEW ─────────────────────────────────────────────────── */}
            {viewMode === "table" && (
              <div className={clsx("rounded-2xl border overflow-hidden overflow-x-auto", c.card)}>
                <table className="w-full min-w-[880px] border-collapse text-sm">
                  <colgroup>
                    <col style={{ width: "150px" }} />
                    <col style={{ width: "auto" }} />
                    <col style={{ width: "110px" }} />
                    <col style={{ width: "110px" }} />
                    <col style={{ width: "150px" }} />
                    <col style={{ width: "190px" }} />
                    <col style={{ width: "80px" }} />
                  </colgroup>
                  <thead>
                    <tr className={clsx("border-b text-xs font-semibold uppercase tracking-wider", c.border, c.textMuted)}>
                      <th className="px-4 py-3 text-left font-semibold">{t("adminOrders.list.table.orderId")}</th>
                      <th className="px-4 py-3 text-left font-semibold">{t("adminOrders.list.table.items")}</th>
                      <th className="px-4 py-3 text-left font-semibold">{t("adminOrders.list.table.method")}</th>
                      <th className="px-4 py-3 text-left font-semibold">{t("adminOrders.list.table.total")}</th>
                      <th className="px-4 py-3 text-left font-semibold">{t("adminOrders.list.table.status")}</th>
                      <th className="px-4 py-3 text-center font-semibold">{t("adminOrders.list.table.actions")}</th>
                      <th className="px-4 py-3 text-center font-semibold">{t("adminOrders.list.table.view")}</th>
                    </tr>
                  </thead>
                  <tbody className={clsx("divide-y", c.divide)}>
                    {paginated.map((order) => {
                      const itemSummary = order.items
                        .map((item) => `${item.productName} ×${item.quantity}`)
                        .join(", ");
                      const totalQty = order.items.reduce((s, i) => s + i.quantity, 0);

                      return (
                        <tr key={order.id} className={clsx("transition-colors align-top", c.rowHover)}>
                          {/* Order ID + date */}
                          <td className="px-4 py-3.5">
                            <p className={clsx("font-mono text-xs font-bold leading-tight", c.mono)}>
                              {order.id.slice(0, 8)}…
                            </p>
                            <p className={clsx("text-xs mt-1", c.textMuted)}>
                              {new Date(order.createdAt).toLocaleDateString("en-GB", {
                                day: "2-digit", month: "short", year: "numeric",
                              })}
                            </p>
                            <p className={clsx("text-xs", c.textMuted)}>
                              {new Date(order.createdAt).toLocaleTimeString("en-GB", {
                                hour: "2-digit", minute: "2-digit",
                              })}
                            </p>
                          </td>

                          {/* Items */}
                          <td className="px-4 py-3.5">
                            <p className={clsx("text-sm font-semibold leading-snug", c.textPrimary)} title={itemSummary}>
                              {itemSummary}
                            </p>
                            <p className={clsx("text-xs mt-1 whitespace-nowrap", c.textMuted)}>
                              {order.items.length} product{order.items.length !== 1 ? "s" : ""} · {totalQty} unit{totalQty !== 1 ? "s" : ""}
                            </p>
                          </td>

                          {/* Payment method */}
                          <td className="px-4 py-3.5">
                            {order.paymentMethod ? (
                              <span className={clsx("inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg whitespace-nowrap", c.paymentBadge)}>
                                {order.paymentMethod === "ORANGE_MONEY" ? "🟠 Orange" : "🟡 MoMo"}
                              </span>
                            ) : (
                              <span className={clsx("text-xs", c.textMuted)}>—</span>
                            )}
                          </td>

                          {/* Total */}
                          <td className="px-4 py-3.5">
                            <span className={clsx("text-sm font-bold tabular-nums whitespace-nowrap", c.amount)}>
                              {formatPrice(order.total)}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3.5">
                            <span className={clsx(
                              "inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap",
                              c.status[order.status]
                            )}>
                              {statusMeta[order.status].icon}
                              {statusMeta[order.status].label}
                            </span>
                          </td>

                          {/* Validate / Cancel */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center justify-center gap-1.5">
                              {canManageOrders && order.status === "REVIEWING" ? (
                                <>
                                  <button
                                    onClick={() => handleValidate(order.id)}
                                    disabled={busyId === order.id}
                                    className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-green-500/15 text-green-600 hover:bg-green-500/25 disabled:opacity-60 disabled:cursor-not-allowed text-xs font-semibold transition-colors whitespace-nowrap"
                                  >
                                    {busyId === order.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />} Validate
                                  </button>
                                  <button
                                    onClick={() => askReject(order.id)}
                                    disabled={busyId === order.id}
                                    className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-red-500/15 text-red-500 hover:bg-red-500/25 disabled:opacity-60 disabled:cursor-not-allowed text-xs font-semibold transition-colors"
                                  >
                                    <XCircle size={12} /> Cancel
                                  </button>
                                </>
                              ) : (
                                <span className={clsx("text-xs", c.textMuted)}>—</span>
                              )}
                            </div>
                          </td>

                          {/* View */}
                          <td className="px-4 py-3.5 text-center">
                            <Link
                              href={`/admin/orders/${order.id}`}
                              className={clsx(
                                "inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap",
                                c.btnGhost
                              )}
                            >
                              <Eye size={13} /> View
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── GRID VIEW ──────────────────────────────────────────────────── */}
            {viewMode === "grid" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {paginated.map((order) => {
                  const totalQty = order.items.reduce((s, i) => s + i.quantity, 0);
                  return (
                    <div key={order.id} className={clsx("rounded-2xl border p-5 flex flex-col gap-3", c.card)}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className={clsx("font-mono text-xs font-bold leading-tight truncate", c.mono)}>{order.id}</p>
                          <p className={clsx("text-xs mt-0.5", c.textMuted)}>
                            {new Date(order.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                            {" · "}
                            {new Date(order.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                        <span className={clsx(
                          "inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0",
                          c.status[order.status]
                        )}>
                          {statusMeta[order.status].icon}
                          {statusMeta[order.status].label}
                        </span>
                      </div>

                      <div className={clsx("rounded-xl p-3", c.innerCard)}>
                        <p className={clsx("text-sm font-semibold leading-relaxed", c.textPrimary)}>
                          {order.items.map((item) => `${item.productName} ×${item.quantity}`).join(", ")}
                        </p>
                        <p className={clsx("text-xs mt-1", c.textMuted)}>
                          {order.items.length} product{order.items.length !== 1 ? "s" : ""} · {totalQty} unit{totalQty !== 1 ? "s" : ""}
                        </p>
                      </div>

                      <div className="flex items-center justify-between">
                        {order.paymentMethod ? (
                          <span className={clsx("inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg whitespace-nowrap", c.paymentBadge)}>
                            {order.paymentMethod === "ORANGE_MONEY" ? "🟠 Orange" : "🟡 MoMo"}
                          </span>
                        ) : (
                          <span className={clsx("text-xs", c.textMuted)}>{t("adminOrders.list.noPaymentYet")}</span>
                        )}
                        <span className={clsx("text-base font-bold tabular-nums", c.amount)}>
                          {formatPrice(order.total)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        {canManageOrders && order.status === "REVIEWING" && (
                          <>
                            <button
                              onClick={() => handleValidate(order.id)}
                              disabled={busyId === order.id}
                              className="flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg bg-green-500/15 text-green-600 hover:bg-green-500/25 disabled:opacity-60 disabled:cursor-not-allowed text-xs font-semibold transition-colors"
                            >
                              {busyId === order.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />} Validate
                            </button>
                            <button
                              onClick={() => askReject(order.id)}
                              disabled={busyId === order.id}
                              className="flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg bg-red-500/15 text-red-500 hover:bg-red-500/25 disabled:opacity-60 disabled:cursor-not-allowed text-xs font-semibold transition-colors"
                            >
                              <XCircle size={12} /> Cancel
                            </button>
                          </>
                        )}
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className={clsx(
                            "flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap",
                            canManageOrders && order.status === "REVIEWING" ? c.btnGhost : "flex-1",
                            c.btnGhost
                          )}
                        >
                          <Eye size={13} /> View
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Pagination ── */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between flex-wrap gap-3">
                <p className={clsx("text-xs", c.textMuted)}>
                  Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length} orders
                </p>

                <div className="flex items-center gap-1">
                  {/* Prev */}
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                    className={clsx(
                      "flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold transition-all",
                      safePage === 1
                        ? "opacity-30 cursor-not-allowed"
                        : c.btnGhost
                    )}
                  >
                    <ChevronLeft size={14} /> Prev
                  </button>

                  {/* Page numbers */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                    const isActive = p === safePage;
                    // Show first, last, current ±1, and ellipsis
                    const show =
                      p === 1 || p === totalPages || Math.abs(p - safePage) <= 1;
                    const showEllipsisBefore = p === safePage - 2 && safePage > 3;
                    const showEllipsisAfter  = p === safePage + 2 && safePage < totalPages - 2;

                    if (!show) return null;
                    return (
                      <span key={p} className="flex items-center">
                        {showEllipsisBefore && (
                          <span className={clsx("px-2 text-xs", c.textMuted)}>…</span>
                        )}
                        <button
                          onClick={() => setPage(p)}
                          className={clsx(
                            "w-8 h-8 rounded-xl text-xs font-semibold transition-all",
                            isActive
                              ? "bg-brand-500 text-white shadow-sm"
                              : c.btnGhost
                          )}
                        >
                          {p}
                        </button>
                        {showEllipsisAfter && (
                          <span className={clsx("px-2 text-xs", c.textMuted)}>…</span>
                        )}
                      </span>
                    );
                  })}

                  {/* Next */}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage === totalPages}
                    className={clsx(
                      "flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold transition-all",
                      safePage === totalPages
                        ? "opacity-30 cursor-not-allowed"
                        : c.btnGhost
                    )}
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmDialog state={confirm} onCancel={() => setConfirm(null)} />
      {scannerOpen && <OrderQrScanner onClose={() => setScannerOpen(false)} />}
      <AlertDialog title="Heads Up" message={conflictMessage} onClose={() => setConflictMessage(null)} />
      <AlertDialog title="Couldn't Update Order" message={actionError} onClose={() => setActionError(null)} />
      <AlertDialog
        title="Order Validated"
        message={validateSuccessOpen ? "The order has been validated and the customer has been notified." : null}
        onClose={() => setValidateSuccessOpen(false)}
        variant="success"
      />
    </AdminShell>
  );
}

