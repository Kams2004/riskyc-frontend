"use client";

import { useEffect, useMemo, useState, Fragment } from "react";
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
import { PosSale, PosSettings, PosPaymentMethod } from "@/lib/types";
import { ApiError } from "@/lib/apiClient";
import clsx from "clsx";
import {
  AlertTriangle,
  Undo2,
  Loader2,
  Printer,
  Settings as SettingsIcon,
  ShieldAlert,
  Search,
  Download,
  RotateCcw,
  Eye,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Wallet,
  CalendarDays,
  TrendingUp,
} from "lucide-react";

const PAGE_SIZE = 8;

const PAYMENT_LABELS: Record<PosPaymentMethod, string> = {
  CASH: "Cash",
  ORANGE_MONEY: "Orange Money",
  MOBILE_MONEY: "Mobile Money",
};

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
}

function isSameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

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
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "voided">("all");
  const [paymentFilter, setPaymentFilter] = useState<"all" | PosPaymentMethod>("all");
  const [cashierFilter, setCashierFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);

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

  const cashiers = useMemo(() => Array.from(new Set(sales.map((s) => s.cashierName))).sort(), [sales]);

  const today = new Date();
  const last30 = new Date();
  last30.setDate(last30.getDate() - 30);
  const todaySales = sales.filter((s) => !s.voided && isSameDay(new Date(s.soldAt), today));
  const last30Sales = sales.filter((s) => !s.voided && new Date(s.soldAt) >= last30);

  const stats = [
    { label: "Sales today", value: String(todaySales.length), icon: ShoppingBag, color: "from-brand-500 to-brand-700" },
    { label: "Revenue today", value: formatPrice(todaySales.reduce((s, x) => s + x.total, 0)), icon: Wallet, color: "from-purple-500 to-purple-700" },
    { label: "Sales (30 days)", value: String(last30Sales.length), icon: CalendarDays, color: "from-blue-500 to-blue-700" },
    { label: "Revenue (30 days)", value: formatPrice(last30Sales.reduce((s, x) => s + x.total, 0)), icon: TrendingUp, color: "from-emerald-500 to-emerald-700" },
  ];

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setPaymentFilter("all");
    setCashierFilter("all");
    setFromDate("");
    setToDate("");
    setPage(1);
  };

  const handleFilterChange = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(1);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sales
      .filter((s) => {
        if (statusFilter === "completed" && s.voided) return false;
        if (statusFilter === "voided" && !s.voided) return false;
        if (paymentFilter !== "all" && s.paymentMethod !== paymentFilter) return false;
        if (cashierFilter !== "all" && s.cashierName !== cashierFilter) return false;
        if (fromDate && new Date(s.soldAt) < new Date(fromDate)) return false;
        if (toDate && new Date(s.soldAt) > new Date(`${toDate}T23:59:59`)) return false;
        if (q) {
          const haystack = [s.id, s.cashierName, ...s.items.map((i) => i.productName)].join(" ").toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.soldAt).getTime() - new Date(a.soldAt).getTime());
  }, [sales, search, statusFilter, paymentFilter, cashierFilter, fromDate, toDate]);

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

  const exportCsv = () => {
    const header = ["Sale #", "Date", "Cashier", "Items", "Amount", "Payment", "Status"];
    const rows = filtered.map((s) => [
      s.id.slice(0, 8),
      new Date(s.soldAt).toLocaleString(),
      s.cashierName,
      String(s.items.reduce((n, i) => n + i.quantity, 0)),
      String(Math.round(s.total)),
      PAYMENT_LABELS[s.paymentMethod],
      s.voided ? "Voided" : "Completed",
    ]);
    const csv = [header, ...rows].map((r) => r.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pos-sales-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminShell>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className={clsx("text-2xl font-bold", c.textPrimary)}>{t("adminPos.sales.pageTitle")}</h1>
            <p className={clsx("text-sm mt-0.5", c.textSecondary)}>{t("adminPos.sales.subtitle", { count: sales.length })}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/admin/pos/reconciliation"
              className={clsx("flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors", c.btnGhost)}
            >
              <ShieldAlert size={15} /> Reconciliation
            </Link>
            {canManage && (
              <Link
                href="/admin/pos/settings"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors shadow-sm"
              >
                <SettingsIcon size={15} /> {t("adminPos.sales.settingsLink")}
              </Link>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className={clsx("rounded-2xl border p-5", c.card)}>
              <div className={clsx("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3 shadow-sm", s.color)}>
                <s.icon size={17} className="text-white" />
              </div>
              <div className={clsx("text-xl font-bold", c.textPrimary)}>{s.value}</div>
              <div className={clsx("text-xs font-semibold mt-0.5", c.textLabel)}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className={clsx("rounded-2xl border p-4 space-y-3", c.card)}>
          <div className="flex flex-wrap items-center gap-2">
            <div className={clsx("flex items-center gap-2 border rounded-xl px-3 py-2 flex-1 min-w-[220px]", c.isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-300")}>
              <Search size={15} className="text-gray-400 flex-shrink-0" />
              <input
                type="text"
                placeholder={t("adminPos.sales.searchPlaceholder")}
                value={search}
                onChange={(e) => handleFilterChange(setSearch)(e.target.value)}
                className={clsx("bg-transparent text-sm outline-none w-full", c.isDark ? "text-white placeholder-gray-500" : "text-gray-900 placeholder-gray-400")}
              />
            </div>
            <button onClick={exportCsv} className={clsx("flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold", c.btnGhost)}>
              <Download size={13} /> Export
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => handleFilterChange(setStatusFilter)(e.target.value as typeof statusFilter)}
              className={clsx("text-xs font-medium rounded-xl px-2.5 py-2 outline-none border", c.isDark ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200 text-gray-700")}
            >
              <option value="all">All statuses</option>
              <option value="completed">Completed</option>
              <option value="voided">Voided</option>
            </select>
            <select
              value={paymentFilter}
              onChange={(e) => handleFilterChange(setPaymentFilter)(e.target.value as typeof paymentFilter)}
              className={clsx("text-xs font-medium rounded-xl px-2.5 py-2 outline-none border", c.isDark ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200 text-gray-700")}
            >
              <option value="all">All payments</option>
              <option value="CASH">Cash</option>
              <option value="ORANGE_MONEY">Orange Money</option>
              <option value="MOBILE_MONEY">Mobile Money</option>
            </select>
            <select
              value={cashierFilter}
              onChange={(e) => handleFilterChange(setCashierFilter)(e.target.value)}
              className={clsx("text-xs font-medium rounded-xl px-2.5 py-2 outline-none border", c.isDark ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200 text-gray-700")}
            >
              <option value="all">All cashiers</option>
              {cashiers.map((cName) => (
                <option key={cName} value={cName}>
                  {cName}
                </option>
              ))}
            </select>
            <div className={clsx("flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 border", c.isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200")}>
              <input type="date" value={fromDate} onChange={(e) => handleFilterChange(setFromDate)(e.target.value)} className={clsx("text-xs bg-transparent outline-none", c.isDark ? "text-white" : "text-gray-700")} />
              <span className="text-gray-400 text-xs">→</span>
              <input type="date" value={toDate} onChange={(e) => handleFilterChange(setToDate)(e.target.value)} className={clsx("text-xs bg-transparent outline-none", c.isDark ? "text-white" : "text-gray-700")} />
            </div>
            <button onClick={resetFilters} className={clsx("flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold", c.textMuted)}>
              <RotateCcw size={12} /> Reset
            </button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className={clsx("text-center py-20 rounded-2xl border", c.card)}>
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className={clsx("text-center py-20", c.textMuted)}>
            <ShoppingBag className="mx-auto w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">{t("adminPos.sales.empty")}</p>
          </div>
        ) : (
          <>
            <div className={clsx("rounded-2xl border overflow-hidden overflow-x-auto", c.card)}>
              <table className="w-full min-w-[920px] border-collapse text-sm">
                <thead>
                  <tr className={clsx("border-b text-xs font-semibold uppercase tracking-wider", c.border, c.textMuted)}>
                    <th className="px-4 py-3 text-left font-semibold">{t("adminPos.sales.colSale")}</th>
                    <th className="px-4 py-3 text-left font-semibold">Date &amp; Time</th>
                    <th className="px-4 py-3 text-left font-semibold">{t("adminPos.sales.colCashier")}</th>
                    <th className="px-4 py-3 text-left font-semibold">{t("adminPos.sales.colItems")}</th>
                    <th className="px-4 py-3 text-left font-semibold">{t("adminPos.sales.colTotal")}</th>
                    <th className="px-4 py-3 text-left font-semibold">{t("adminPos.sales.colPayment")}</th>
                    <th className="px-4 py-3 text-left font-semibold">{t("adminPos.sales.colStatus")}</th>
                    <th className="px-4 py-3 text-center font-semibold">{t("adminPos.sales.colActions")}</th>
                  </tr>
                </thead>
                <tbody className={clsx("divide-y", c.divide)}>
                  {paginated.map((sale) => {
                    const totalQty = sale.items.reduce((n, i) => n + i.quantity, 0);
                    const expanded = expandedId === sale.id;
                    return (
                      <Fragment key={sale.id}>
                        <tr className={clsx("transition-colors align-top", c.rowHover)}>
                          <td className="px-4 py-3.5">
                            <p className={clsx("font-mono text-xs font-bold leading-tight", c.mono)}>{sale.id.slice(0, 8)}…</p>
                          </td>
                          <td className="px-4 py-3.5">
                            <p className={clsx("text-xs", c.textMuted)}>
                              {new Date(sale.soldAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                            </p>
                            <p className={clsx("text-xs", c.textMuted)}>{new Date(sale.soldAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</p>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-brand-500/15 text-brand-500 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                                {initials(sale.cashierName)}
                              </div>
                              <span className={clsx("text-xs", c.textPrimary)}>{sale.cashierName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <p className={clsx("text-xs", c.textMuted)}>{totalQty} item{totalQty !== 1 ? "s" : ""}</p>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={clsx("text-sm font-bold tabular-nums whitespace-nowrap", c.amount)}>{formatPrice(sale.total)}</span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={clsx("inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg whitespace-nowrap", c.paymentBadge)}>
                              {PAYMENT_LABELS[sale.paymentMethod]}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex flex-col gap-1 items-start">
                              {sale.voided ? (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-500/15 text-gray-500 whitespace-nowrap">
                                  {t("adminPos.sales.statusVoided")}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-green-500/15 text-green-600 whitespace-nowrap">
                                  Completed
                                </span>
                              )}
                              {sale.stockReconciliationFlag && !sale.voided && (
                                <span
                                  title={t("adminPos.sales.statusFlaggedTooltip")}
                                  className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-500 whitespace-nowrap"
                                >
                                  <AlertTriangle size={10} /> {t("adminPos.sales.statusFlagged")}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => setExpandedId(expanded ? null : sale.id)}
                                title="View items"
                                className={clsx("p-1.5 rounded-lg transition-colors", c.btnGhost)}
                              >
                                {expanded ? <ChevronUp size={14} /> : <Eye size={14} />}
                              </button>
                              {!sale.voided && (
                                <button onClick={() => printSale(sale)} title="Reprint" className={clsx("p-1.5 rounded-lg transition-colors", c.btnGhost)}>
                                  <Printer size={14} />
                                </button>
                              )}
                              {!sale.voided && canVoid && (
                                <button
                                  onClick={() => askVoid(sale)}
                                  disabled={busyId === sale.id}
                                  title="Void sale"
                                  className="p-1.5 rounded-lg bg-red-500/15 text-red-500 hover:bg-red-500/25 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                                >
                                  {busyId === sale.id ? <Loader2 size={14} className="animate-spin" /> : <Undo2 size={14} />}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                        {expanded && (
                          <tr className={c.isDark ? "bg-gray-900/40" : "bg-gray-50"}>
                            <td colSpan={8} className="px-4 py-3">
                              <div className="space-y-1 max-w-lg">
                                {sale.items.map((item) => (
                                  <div key={item.id} className={clsx("flex items-center justify-between text-xs", c.textSecondary)}>
                                    <span>
                                      {item.quantity}× {item.productName}
                                      {[item.selectedColor, item.selectedSize].filter(Boolean).length > 0
                                        ? ` (${[item.selectedColor, item.selectedSize].filter(Boolean).join(", ")})`
                                        : ""}
                                    </span>
                                    <span className="tabular-nums">{formatPrice(item.unitPrice * item.quantity)}</span>
                                  </div>
                                ))}
                                {sale.voided && sale.voidedByName && (
                                  <p className={clsx("text-[11px] pt-1", c.textMuted)}>{t("adminPos.sales.voidedBy", { name: sale.voidedByName })}</p>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <p className={clsx("text-xs", c.textMuted)}>
                Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length} sales
              </p>
              {totalPages > 1 && (
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
              )}
            </div>
          </>
        )}
      </div>

      <ConfirmDialog state={confirm} onCancel={() => setConfirm(null)} />
      <AlertDialog title={t("adminPos.sales.pageTitle")} message={error} onClose={() => setError(null)} />
      <PrintArea settings={settings} data={printData} />
    </AdminShell>
  );
}
