"use client";

import AdminShell from "@/components/admin/AdminShell";
import { useAdminStore } from "@/lib/adminStore";
import * as customersApi from "@/lib/api/customers";
import { Customer } from "@/lib/types";
import { useAdminColors } from "@/lib/useAdminColors";
import ConfirmDialog, { ConfirmState } from "@/components/admin/ConfirmDialog";
import { useState, useMemo, useEffect } from "react";
import {
  UserRound,
  Search,
  Trash2,
  ShieldOff,
  ShieldCheck,
  Mail,
  Phone,
  Calendar,
} from "lucide-react";
import clsx from "clsx";

export default function AdminCustomersPage() {
  const token = useAdminStore((s) => s.session?.token);
  const c = useAdminColors();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);

  useEffect(() => {
    if (!token) return;
    customersApi
      .listCustomers(token)
      .then(setCustomers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (cu) =>
        `${cu.firstName} ${cu.lastName}`.toLowerCase().includes(q) ||
        cu.email.toLowerCase().includes(q) ||
        (cu.phone ?? "").toLowerCase().includes(q)
    );
  }, [customers, query]);

  const setStatus = async (id: string, status: "ACTIVE" | "BLOCKED") => {
    if (!token) return;
    const updated = await customersApi.updateCustomerStatus(id, status, token);
    setCustomers((prev) => prev.map((cu) => (cu.id === id ? updated : cu)));
  };

  const askDelete = (id: string, name: string) => {
    setConfirm({
      title: "Delete customer?",
      message: `This will permanently delete "${name}"'s account. This cannot be undone.`,
      confirmLabel: "Delete",
      onConfirm: async () => {
        if (token) {
          await customersApi.deleteCustomer(id, token);
          setCustomers((prev) => prev.filter((cu) => cu.id !== id));
        }
        setConfirm(null);
      },
    });
  };

  const askBlock = (id: string, name: string) => {
    setConfirm({
      title: "Block customer?",
      message: `"${name}" will no longer be able to log in or place orders until unblocked.`,
      confirmLabel: "Block",
      onConfirm: () => {
        setStatus(id, "BLOCKED");
        setConfirm(null);
      },
    });
  };

  const activeCount = customers.filter((cu) => cu.status === "ACTIVE").length;

  return (
    <AdminShell>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className={clsx("text-2xl font-bold", c.textPrimary)}>Customers</h1>
            <p className={clsx("text-sm mt-0.5", c.textSecondary)}>
              {customers.length} registered · {activeCount} active
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search size={15} className={clsx("absolute left-3 top-1/2 -translate-y-1/2", c.textMuted)} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search customers..."
              className={clsx(
                "pl-9 pr-3 py-2.5 rounded-xl border text-sm outline-none transition-colors w-full",
                c.isDark
                  ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-brand-500"
                  : "bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-brand-400"
              )}
            />
          </div>
        </div>

        {/* Table */}
        <div className={clsx("rounded-2xl border overflow-x-auto", c.card)}>
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr
                className={clsx(
                  "border-b text-xs font-semibold uppercase tracking-wide",
                  c.isDark ? "bg-gray-800/60 border-gray-700 text-gray-400" : "bg-gray-50 border-gray-200 text-gray-500"
                )}
              >
                <th className="text-left px-5 py-3">Customer</th>
                <th className="text-left px-5 py-3 hidden sm:table-cell">Contact</th>
                <th className="text-left px-5 py-3 hidden md:table-cell">Joined</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className={clsx("divide-y", c.divide)}>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-16">
                    <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className={clsx("text-center py-16 text-sm", c.textMuted)}>
                    {customers.length === 0 ? "No registered customers yet" : "No customers match your search"}
                  </td>
                </tr>
              ) : null}
              {!loading && filtered.map((cu) => (
                <tr key={cu.id} className={clsx("transition-colors", c.rowHover)}>
                  <td className={clsx("px-5 py-3.5 font-medium", c.textPrimary)}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                        {cu.firstName[0]}
                        {cu.lastName[0]}
                      </div>
                      <span>
                        {cu.firstName} {cu.lastName}
                      </span>
                    </div>
                  </td>
                  <td className={clsx("px-5 py-3.5 hidden sm:table-cell", c.textSecondary)}>
                    <div className="flex items-center gap-1.5 text-xs">
                      <Mail size={12} className={c.textMuted} />
                      {cu.email}
                    </div>
                    {cu.phone && (
                      <div className="flex items-center gap-1.5 text-xs mt-0.5">
                        <Phone size={12} className={c.textMuted} />
                        {cu.phone}
                      </div>
                    )}
                  </td>
                  <td className={clsx("px-5 py-3.5 hidden md:table-cell text-xs", c.textSecondary)}>
                    <div className="flex items-center gap-1.5">
                      <Calendar size={12} className={c.textMuted} />
                      {new Date(cu.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    {cu.status === "ACTIVE" ? (
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600">
                        <ShieldCheck size={13} /> Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-red-500">
                        <ShieldOff size={13} /> Blocked
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() =>
                          cu.status === "ACTIVE"
                            ? askBlock(cu.id, `${cu.firstName} ${cu.lastName}`)
                            : setStatus(cu.id, "ACTIVE")
                        }
                        className={clsx(
                          "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                          c.btnGhost
                        )}
                      >
                        {cu.status === "ACTIVE" ? (
                          <>
                            <ShieldOff size={11} /> Block
                          </>
                        ) : (
                          <>
                            <ShieldCheck size={11} /> Unblock
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => askDelete(cu.id, `${cu.firstName} ${cu.lastName}`)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all bg-red-500/10 text-red-500 hover:bg-red-500/20"
                      >
                        <Trash2 size={11} />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && customers.length === 0 && (
          <div className={clsx("text-center py-10 rounded-2xl border", c.card)}>
            <UserRound size={40} className={clsx("mx-auto mb-3 opacity-30", c.textMuted)} />
            <p className={clsx("text-sm", c.textMuted)}>
              Customers will appear here once they register on the storefront.
            </p>
          </div>
        )}
      </div>

      <ConfirmDialog state={confirm} onCancel={() => setConfirm(null)} />
    </AdminShell>
  );
}
