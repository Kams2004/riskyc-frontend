"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import AlertDialog from "@/components/admin/AlertDialog";
import { useAdminStore } from "@/lib/adminStore";
import { useAdminColors } from "@/lib/useAdminColors";
import * as posApi from "@/lib/api/pos";
import { PosReconciliationLine } from "@/lib/types";
import { ApiError } from "@/lib/apiClient";
import clsx from "clsx";
import {
  ChevronLeft,
  Loader2,
  Search,
  AlertTriangle,
  Package,
  Layers,
  CheckCircle2,
  Clock,
  Check,
} from "lucide-react";

export default function AdminReconciliationPage() {
  const router = useRouter();
  const token = useAdminStore((s) => s.session?.token);
  const canManage = useAdminStore((s) => s.hasPermission("MANAGE_POS"));
  const c = useAdminColors();

  const [lines, setLines] = useState<PosReconciliationLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"pending" | "resolved">("pending");
  const [search, setSearch] = useState("");
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    posApi
      .listReconciliation(token)
      .then(setLines)
      .catch(() => setError("Could not load the reconciliation list."))
      .finally(() => setLoading(false));
  }, [token]);

  const pending = lines.filter((l) => !l.reconciled);
  const resolved = lines.filter((l) => l.reconciled);

  const stats = [
    { label: "Oversold sales", value: new Set(lines.map((l) => l.saleId)).size, icon: AlertTriangle, color: "from-orange-500 to-orange-700" },
    { label: "Lines affected", value: lines.length, icon: Package, color: "from-rose-500 to-rose-700" },
    { label: "Units short", value: lines.reduce((s, l) => s + l.oversoldBy, 0), icon: Layers, color: "from-purple-500 to-purple-700" },
    { label: "Resolved", value: resolved.length, icon: CheckCircle2, color: "from-green-500 to-green-700" },
    { label: "Pending", value: pending.length, icon: Clock, color: "from-amber-500 to-amber-700" },
  ];

  const visible = tab === "pending" ? pending : resolved;
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return visible;
    return visible.filter((l) => [l.productName, l.saleId, l.cashierName].join(" ").toLowerCase().includes(q));
  }, [visible, search]);

  const handleResolve = async (line: PosReconciliationLine) => {
    if (!token) return;
    setResolvingId(line.itemId);
    try {
      const updated = await posApi.resolveReconciliation(token, line.itemId);
      setLines((prev) => prev.map((l) => (l.itemId === line.itemId ? updated : l)));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't resolve that line.");
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <AdminShell>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/admin/pos")} className={clsx("w-9 h-9 rounded-xl flex items-center justify-center border shadow-sm transition-colors", c.isDark ? "bg-gray-800 border-gray-600 text-white hover:bg-gray-700" : "bg-white border-gray-300 text-gray-900 hover:bg-gray-50")}>
            <ChevronLeft size={18} />
          </button>
          <div>
            <h1 className={clsx("text-2xl font-bold", c.textPrimary)}>Reconciliation</h1>
            <p className={clsx("text-sm mt-0.5", c.textSecondary)}>Sales that pushed a size/color's stock negative.</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
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

        {/* Tabs + search */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setTab("pending")}
            className={clsx("px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors", tab === "pending" ? "bg-brand-500 text-white shadow-sm" : c.filterInactive)}
          >
            Pending ({pending.length})
          </button>
          <button
            onClick={() => setTab("resolved")}
            className={clsx("px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors", tab === "resolved" ? "bg-brand-500 text-white shadow-sm" : c.filterInactive)}
          >
            Resolved ({resolved.length})
          </button>
          <div className={clsx("flex items-center gap-2 border rounded-xl px-3 py-2 flex-1 min-w-[200px]", c.isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-300")}>
            <Search size={15} className="text-gray-400 flex-shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search a product, sale # or cashier…"
              className={clsx("bg-transparent text-sm outline-none w-full", c.isDark ? "text-white placeholder-gray-500" : "text-gray-900 placeholder-gray-400")}
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className={clsx("text-center py-20 rounded-2xl border", c.card)}>
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className={clsx("text-center py-20", c.textMuted)}>
            <CheckCircle2 className="mx-auto w-10 h-10 mb-2 text-green-400" />
            <p className="text-sm">{tab === "pending" ? "Nothing to reconcile." : "Nothing resolved yet."}</p>
          </div>
        ) : (
          <div className={clsx("rounded-2xl border overflow-hidden overflow-x-auto", c.card)}>
            <table className="w-full min-w-[980px] border-collapse text-sm">
              <thead>
                <tr className={clsx("border-b text-xs font-semibold uppercase tracking-wider", c.border, c.textMuted)}>
                  <th className="px-4 py-3 text-left">Sold</th>
                  <th className="px-4 py-3 text-left">Sale #</th>
                  <th className="px-4 py-3 text-left">Product</th>
                  <th className="px-4 py-3 text-left">Color</th>
                  <th className="px-4 py-3 text-left">Size</th>
                  <th className="px-4 py-3 text-right">Qty sold</th>
                  <th className="px-4 py-3 text-right">Stock before</th>
                  <th className="px-4 py-3 text-right">Stock after</th>
                  <th className="px-4 py-3 text-right">Short by</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className={clsx("divide-y", c.divide)}>
                {filtered.map((line) => (
                  <tr key={line.itemId} className={clsx("transition-colors", c.rowHover)}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className={clsx("text-xs", c.textMuted)}>
                        {new Date(line.soldAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                      </p>
                      <p className={clsx("text-xs", c.textMuted)}>{new Date(line.soldAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</p>
                    </td>
                    <td className={clsx("px-4 py-3 font-mono text-xs font-bold", c.mono)}>{line.saleId.slice(0, 8)}…</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          {line.thumbnailUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={line.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                          )}
                        </div>
                        <span className={clsx("text-xs font-semibold max-w-[140px] truncate", c.textPrimary)}>{line.productName}</span>
                      </div>
                    </td>
                    <td className={clsx("px-4 py-3 text-xs", c.textSecondary)}>{line.selectedColor || "—"}</td>
                    <td className={clsx("px-4 py-3 text-xs", c.textSecondary)}>{line.selectedSize || "—"}</td>
                    <td className={clsx("px-4 py-3 text-xs font-semibold text-right tabular-nums", c.textPrimary)}>{line.quantity}</td>
                    <td className={clsx("px-4 py-3 text-xs text-right tabular-nums", c.textSecondary)}>{line.stockBefore}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-red-500 text-right tabular-nums">{line.stockAfter}</td>
                    <td className="px-4 py-3 text-xs font-bold text-red-600 text-right tabular-nums">-{line.oversoldBy}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center">
                        {line.reconciled ? (
                          <span title={line.reconciledByName ? `By ${line.reconciledByName}` : undefined} className="flex items-center gap-1 text-[11px] font-semibold text-green-600 bg-green-500/15 px-2.5 py-1.5 rounded-lg whitespace-nowrap">
                            <Check size={11} /> {line.reconciledByName ?? "Resolved"}
                          </span>
                        ) : canManage ? (
                          <button
                            onClick={() => handleResolve(line)}
                            disabled={resolvingId === line.itemId}
                            className="flex items-center gap-1 text-[11px] font-semibold text-white bg-gray-900 hover:bg-brand-600 px-2.5 py-1.5 rounded-lg disabled:opacity-50 whitespace-nowrap"
                          >
                            {resolvingId === line.itemId ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                            Resolve
                          </button>
                        ) : (
                          <span className="text-[11px] font-semibold text-amber-600 bg-amber-500/15 px-2.5 py-1.5 rounded-lg">Pending</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AlertDialog title="Reconciliation" message={error} onClose={() => setError(null)} />
    </AdminShell>
  );
}
