"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import ConfirmDialog, { ConfirmState } from "@/components/admin/ConfirmDialog";
import AlertDialog from "@/components/admin/AlertDialog";
import PrintArea from "@/components/admin/pos/PrintArea";
import { ReceiptData } from "@/components/admin/pos/Receipt";
import { useAdminStore } from "@/lib/adminStore";
import { useAdminColors } from "@/lib/useAdminColors";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { formatPrice } from "@/lib/data";
import * as posApi from "@/lib/api/pos";
import { PosSale, PosSettings } from "@/lib/types";
import { ApiError } from "@/lib/apiClient";
import clsx from "clsx";
import {
  CreditCard,
  AlertTriangle,
  Undo2,
  Loader2,
  Printer,
  Settings as SettingsIcon,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const PAGE_SIZE = 8;

export default function AdminPosPage() {
  const token = useAdminStore((s) => s.session?.token);
  const canVoid = useAdminStore((s) => s.hasPermission("VOID_POS_SALE"));
  const canManage = useAdminStore((s) => s.hasPermission("MANAGE_POS"));
  const c = useAdminColors();
  const { t } = useTranslation();

  const [sales, setSales] = useState<PosSale[]>([]);
  const [settings, setSettings] = useState<PosSettings | null>(null);
  const [printData, setPrintData] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "flagged">("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    Promise.all([posApi.listSales(token), posApi.getSettings(token)])
      .then(([s, settingsResp]) => {
        setSales(s);
        setSettings(settingsResp);
      })
      .catch(() => setError(t("adminPos.sales.loadError")))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleFilter = (f: "all" | "flagged") => {
    setFilter(f);
    setPage(1);
  };
  const handleSearch = (v: string) => {
    setSearch(v);
    setPage(1);
  };

  const flaggedCount = sales.filter((s) => s.stockReconciliationFlag && !s.voided).length;

  const filtered = sales
    .filter((s) => filter === "all" || s.stockReconciliationFlag)
    .filter((s) => !search || s.id.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => new Date(b.soldAt).getTime() - new Date(a.soldAt).getTime());

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const askVoid = (sale: PosSale) => {
    setConfirm({
      title: t("adminPos.sales.voidTitle"),
      message: t("adminPos.sales.voidMessage"),
      confirmLabel: t("adminPos.sales.voidConfirmLabel"),
      destructive: true,
      onConfirm: async () => {
        if (!token) return;
        setBusyId(sale.id);
        setError(null);
        try {
          const updated = await posApi.voidSale(token, sale.id);
          setSales((prev) => prev.map((s) => (s.id === sale.id ? updated : s)));
          setConfirm(null);
        } catch (e) {
          setError(e instanceof ApiError ? e.message : "Something went wrong. Please try again.");
          throw e;
        } finally {
          setBusyId(null);
        }
      },
    });
  };

  const printSale = (sale: PosSale) => {
    setPrintData({
      saleRef: sale.id.slice(0, 8).toUpperCase(),
      cashierName: sale.cashierName,
      items: sale.items.map((i) => ({
        productName: i.productName,
        selectedColor: i.selectedColor,
        selectedSize: i.selectedSize,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
      total: sale.total,
      paymentMethod: sale.paymentMethod,
      soldAt: sale.soldAt,
    });
    setTimeout(() => window.print(), 50);
  };

  return (
    <AdminShell>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className={clsx("text-2xl font-bold", c.textPrimary)}>{t("adminPos.sales.pageTitle")}</h1>
            <p className={clsx("text-sm mt-0.5", c.textSecondary)}>
              {t("adminPos.sales.subtitle", { count: sales.length })}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {canManage && (
              <Link
                href="/admin/pos/settings"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors shadow-sm"
              >
                <SettingsIcon size={15} /> {t("adminPos.sales.settingsLink")}
              </Link>
            )}
            <div className={clsx("flex items-center gap-2 border rounded-xl px-3 py-2", c.isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-300")}>
              <Search size={15} className="text-gray-400 flex-shrink-0" />
              <input
                type="text"
                placeholder={t("adminPos.sales.searchPlaceholder")}
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className={clsx("bg-transparent text-sm outline-none w-44", c.isDark ? "text-white placeholder-gray-500" : "text-gray-900 placeholder-gray-400")}
              />
            </div>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleFilter("all")}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all",
              filter === "all" ? "bg-brand-500 text-white shadow-sm" : c.filterInactive
            )}
          >
            <CreditCard size={11} /> {t("adminPos.sales.filterAll")}
            <span className={clsx("rounded-full px-1.5 py-0.5 text-xs", filter === "all" ? "bg-white/25 text-white" : c.isDark ? "bg-gray-700 text-gray-400" : "bg-gray-100 text-gray-500")}>
              {sales.length}
            </span>
          </button>
          <button
            onClick={() => handleFilter("flagged")}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all",
              filter === "flagged" ? "bg-orange-500 text-white shadow-sm" : c.filterInactive
            )}
          >
            <AlertTriangle size={11} /> {t("adminPos.sales.filterFlagged")}
            <span className={clsx("rounded-full px-1.5 py-0.5 text-xs", filter === "flagged" ? "bg-white/25 text-white" : c.isDark ? "bg-gray-700 text-gray-400" : "bg-gray-100 text-gray-500")}>
              {flaggedCount}
            </span>
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div className={clsx("text-center py-20 rounded-2xl border", c.card)}>
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className={clsx("text-center py-20", c.textMuted)}>
            <CreditCard className="mx-auto w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">{t("adminPos.sales.empty")}</p>
            <p className="text-xs mt-1 opacity-70">{t("adminPos.sales.emptyHint")}</p>
          </div>
        ) : (
          <>
            <div className={clsx("rounded-2xl border overflow-hidden overflow-x-auto", c.card)}>
              <table className="w-full min-w-[880px] border-collapse text-sm">
                <thead>
                  <tr className={clsx("border-b text-xs font-semibold uppercase tracking-wider", c.border, c.textMuted)}>
                    <th className="px-4 py-3 text-left font-semibold">{t("adminPos.sales.colSale")}</th>
                    <th className="px-4 py-3 text-left font-semibold">{t("adminPos.sales.colItems")}</th>
                    <th className="px-4 py-3 text-left font-semibold">{t("adminPos.sales.colCashier")}</th>
                    <th className="px-4 py-3 text-left font-semibold">{t("adminPos.sales.colPayment")}</th>
                    <th className="px-4 py-3 text-left font-semibold">{t("adminPos.sales.colTotal")}</th>
                    <th className="px-4 py-3 text-left font-semibold">{t("adminPos.sales.colStatus")}</th>
                    <th className="px-4 py-3 text-center font-semibold">{t("adminPos.sales.colActions")}</th>
                  </tr>
                </thead>
                <tbody className={clsx("divide-y", c.divide)}>
                  {paginated.map((sale) => {
                    const itemSummary = sale.items.map((i) => `${i.productName} ×${i.quantity}`).join(", ");
                    return (
                      <tr key={sale.id} className={clsx("transition-colors align-top", c.rowHover)}>
                        <td className="px-4 py-3.5">
                          <p className={clsx("font-mono text-xs font-bold leading-tight", c.mono)}>{sale.id.slice(0, 8)}…</p>
                          <p className={clsx("text-xs mt-1", c.textMuted)}>
                            {new Date(sale.soldAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                          </p>
                          <p className={clsx("text-xs", c.textMuted)}>
                            {new Date(sale.soldAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className={clsx("text-sm font-semibold leading-snug", c.textPrimary)} title={itemSummary}>
                            {itemSummary}
                          </p>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className={clsx("text-sm", c.textPrimary)}>{sale.cashierName}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={clsx("inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg whitespace-nowrap capitalize", c.paymentBadge)}>
                            {sale.paymentMethod.replace("_", " ").toLowerCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={clsx("text-sm font-bold tabular-nums whitespace-nowrap", c.amount)}>{formatPrice(sale.total)}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex flex-col gap-1 items-start">
                            {sale.voided ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-500/15 text-gray-500 whitespace-nowrap">
                                {t("adminPos.sales.statusVoided")}
                              </span>
                            ) : sale.stockReconciliationFlag ? (
                              <span
                                title={t("adminPos.sales.statusFlaggedTooltip")}
                                className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-500/15 text-orange-500 whitespace-nowrap"
                              >
                                <AlertTriangle size={11} /> {t("adminPos.sales.statusFlagged")}
                              </span>
                            ) : null}
                            {sale.voided && sale.voidedByName && (
                              <p className={clsx("text-[11px]", c.textMuted)}>{t("adminPos.sales.voidedBy", { name: sale.voidedByName })}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-center gap-1.5">
                            {!sale.voided && (
                              <button
                                onClick={() => printSale(sale)}
                                className={clsx("flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap", c.btnGhost)}
                              >
                                <Printer size={12} /> {t("adminPos.sales.print")}
                              </button>
                            )}
                            {!sale.voided && canVoid && (
                              <button
                                onClick={() => askVoid(sale)}
                                disabled={busyId === sale.id}
                                className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-red-500/15 text-red-500 hover:bg-red-500/25 disabled:opacity-60 disabled:cursor-not-allowed text-xs font-semibold transition-colors whitespace-nowrap"
                              >
                                {busyId === sale.id ? <Loader2 size={12} className="animate-spin" /> : <Undo2 size={12} />} {t("adminPos.sales.void")}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between flex-wrap gap-3">
                <p className={clsx("text-xs", c.textMuted)}>
                  Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length} sales
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                    className={clsx("flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold transition-all", safePage === 1 ? "opacity-30 cursor-not-allowed" : c.btnGhost)}
                  >
                    <ChevronLeft size={14} /> Prev
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={clsx("w-8 h-8 rounded-xl text-xs font-semibold transition-all", p === safePage ? "bg-brand-500 text-white shadow-sm" : c.btnGhost)}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage === totalPages}
                    className={clsx("flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold transition-all", safePage === totalPages ? "opacity-30 cursor-not-allowed" : c.btnGhost)}
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
      <AlertDialog title={t("adminPos.sales.pageTitle")} message={error} onClose={() => setError(null)} />
      <PrintArea settings={settings} data={printData} />
    </AdminShell>
  );
}
