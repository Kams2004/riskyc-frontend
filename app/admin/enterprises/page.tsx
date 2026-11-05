"use client";

import { useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { useAdminStore } from "@/lib/adminStore";
import { useAdminColors } from "@/lib/useAdminColors";
import { useTranslation } from "@/lib/i18n/useTranslation";
import * as enterprisesApi from "@/lib/api/enterprises";
import { Enterprise, EnterpriseStatus } from "@/lib/types";
import EnterpriseApprovalModal from "@/components/admin/EnterpriseApprovalModal";
import ConfirmDialog, { ConfirmState } from "@/components/admin/ConfirmDialog";
import AlertDialog from "@/components/admin/AlertDialog";
import { Store, Search, Mail, Phone, Calendar, X, Sparkles } from "lucide-react";
import clsx from "clsx";

const TABS: { key: EnterpriseStatus | "ALL"; labelKey: string }[] = [
  { key: "PENDING", labelKey: "tabPending" },
  { key: "ACTIVE", labelKey: "tabActive" },
  { key: "SUSPENDED", labelKey: "tabSuspended" },
  { key: "REJECTED", labelKey: "tabRejected" },
  { key: "ALL", labelKey: "tabAll" },
];

const STATUS_DOT: Record<EnterpriseStatus, string> = {
  PENDING: "bg-gray-400",
  ACTIVE: "bg-green-500",
  SUSPENDED: "bg-red-500",
  REJECTED: "bg-gray-400",
};

const STATUS_TEXT: Record<EnterpriseStatus, string> = {
  PENDING: "text-gray-500",
  ACTIVE: "text-green-600",
  SUSPENDED: "text-red-500",
  REJECTED: "text-gray-500",
};

export default function AdminEnterprisesPage() {
  const token = useAdminStore((s) => s.session?.token);
  const c = useAdminColors();
  const { t } = useTranslation();

  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<EnterpriseStatus | "ALL">("PENDING");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Enterprise | null>(null);
  const [showApprove, setShowApprove] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = () => {
    if (!token) return;
    enterprisesApi
      .listEnterprises(token)
      .then(setEnterprises)
      .catch(() => setActionError("Couldn't load seller applications. Please try again."))
      .finally(() => setLoading(false));
  };

  useEffect(load, [token]);

  const statusLabel: Record<EnterpriseStatus, string> = {
    PENDING: t("adminEnterprises.statusPending"),
    ACTIVE: t("adminEnterprises.statusActive"),
    SUSPENDED: t("adminEnterprises.statusSuspended"),
    REJECTED: t("adminEnterprises.statusRejected"),
  };

  const filtered = useMemo(() => {
    let list = tab === "ALL" ? enterprises : enterprises.filter((e) => e.status === tab);
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (e) => e.name.toLowerCase().includes(q) || e.contactEmail.toLowerCase().includes(q)
      );
    }
    return list;
  }, [enterprises, tab, query]);

  const pendingCount = enterprises.filter((e) => e.status === "PENDING").length;

  const openDetail = async (enterprise: Enterprise) => {
    if (!token) return;
    setSelected(enterprise);
    try {
      const fresh = await enterprisesApi.getEnterprise(enterprise.id, token);
      setSelected(fresh);
    } catch {
      // keep the row's snapshot if the refetch fails
    }
  };

  const handleApprove = async (categoryIds: string[]) => {
    if (!token || !selected) return;
    const updated = await enterprisesApi.approveEnterprise(selected.id, categoryIds, token);
    setEnterprises((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    setSelected(updated);
    setShowApprove(false);
  };

  const askReject = (enterprise: Enterprise) => {
    setConfirm({
      title: t("adminEnterprises.rejectDialog.title", { name: enterprise.name }),
      message: t("adminEnterprises.rejectDialog.message"),
      confirmLabel: t("adminEnterprises.rejectDialog.confirmLabel"),
      input: { label: t("adminEnterprises.rejectDialog.reasonLabel") },
      onConfirm: async (reason) => {
        if (!token) return;
        const updated = await enterprisesApi.rejectEnterprise(enterprise.id, reason, token);
        setEnterprises((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
        setSelected((cur) => (cur?.id === updated.id ? updated : cur));
        setConfirm(null);
      },
    });
  };

  const askSuspend = (enterprise: Enterprise) => {
    setConfirm({
      title: t("adminEnterprises.suspendDialog.title", { name: enterprise.name }),
      message: t("adminEnterprises.suspendDialog.message"),
      confirmLabel: t("adminEnterprises.suspendDialog.confirmLabel"),
      onConfirm: async () => {
        if (!token) return;
        const updated = await enterprisesApi.suspendEnterprise(enterprise.id, token);
        setEnterprises((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
        setSelected((cur) => (cur?.id === updated.id ? updated : cur));
        setConfirm(null);
      },
    });
  };

  const askReactivate = (enterprise: Enterprise) => {
    setConfirm({
      title: t("adminEnterprises.reactivateDialog.title", { name: enterprise.name }),
      message: t("adminEnterprises.reactivateDialog.message"),
      confirmLabel: t("adminEnterprises.reactivateDialog.confirmLabel"),
      destructive: false,
      onConfirm: async () => {
        if (!token) return;
        const updated = await enterprisesApi.reactivateEnterprise(enterprise.id, token);
        setEnterprises((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
        setSelected((cur) => (cur?.id === updated.id ? updated : cur));
        setConfirm(null);
      },
    });
  };

  return (
    <AdminShell>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className={clsx("text-2xl font-bold", c.textPrimary)}>{t("adminEnterprises.pageTitle")}</h1>
            <p className={clsx("text-sm mt-0.5", c.textSecondary)}>
              {t("adminEnterprises.subtitle", { count: enterprises.length, pending: pendingCount })}
            </p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search size={15} className={clsx("absolute left-3 top-1/2 -translate-y-1/2", c.textMuted)} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("adminEnterprises.searchPlaceholder")}
              className={clsx("pl-9 pr-3 py-2.5 rounded-xl border text-sm outline-none transition-colors w-full", c.input)}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {TABS.map(({ key, labelKey }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={clsx(
                "px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5",
                tab === key ? "bg-brand-500 text-white" : c.filterInactive
              )}
            >
              {t(`adminEnterprises.${labelKey}`)}
              {key === "PENDING" && pendingCount > 0 && (
                <span className={clsx("px-1.5 py-0.5 rounded-full text-[10px]", tab === key ? "bg-white/20" : "bg-brand-500 text-white")}>
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className={clsx("rounded-2xl border overflow-x-auto", c.card)}>
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className={clsx("border-b text-xs font-semibold uppercase tracking-wide", c.isDark ? "bg-gray-800/60 border-gray-700 text-gray-400" : "bg-gray-50 border-gray-200 text-gray-500")}>
                <th className="text-left px-5 py-3">{t("adminEnterprises.colBusiness")}</th>
                <th className="text-left px-5 py-3 hidden sm:table-cell">{t("adminEnterprises.colContact")}</th>
                <th className="text-left px-5 py-3 hidden md:table-cell">{t("adminEnterprises.colCategories")}</th>
                <th className="text-left px-5 py-3 hidden lg:table-cell">{t("adminEnterprises.colSubmitted")}</th>
                <th className="text-left px-5 py-3">{t("adminEnterprises.colStatus")}</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className={clsx("divide-y", c.divide)}>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-16">
                    <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className={clsx("text-center py-16 text-sm", c.textMuted)}>
                    {enterprises.length === 0 ? t("adminEnterprises.emptyNoneYet") : t("adminEnterprises.emptyNoneMatch")}
                  </td>
                </tr>
              ) : null}
              {!loading &&
                filtered.map((ent) => (
                  <tr key={ent.id} className={clsx("transition-colors cursor-pointer", c.rowHover)} onClick={() => openDetail(ent)}>
                    <td className={clsx("px-5 py-3.5 font-medium", c.textPrimary)}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center flex-shrink-0">
                          <Store size={14} />
                        </div>
                        <span className="truncate max-w-[220px]">{ent.name}</span>
                      </div>
                    </td>
                    <td className={clsx("px-5 py-3.5 hidden sm:table-cell", c.textSecondary)}>
                      <div className="flex items-center gap-1.5 text-xs">
                        <Mail size={12} className={c.textMuted} />
                        {ent.contactEmail}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      {ent.categories.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {ent.categories.slice(0, 2).map((cat) => (
                            <span key={cat.id} className={clsx("px-2 py-0.5 rounded-full text-[11px] font-medium", c.isDark ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600")}>
                              {cat.name}
                            </span>
                          ))}
                          {ent.categories.length > 2 && (
                            <span className={clsx("text-[11px]", c.textMuted)}>+{ent.categories.length - 2}</span>
                          )}
                        </div>
                      ) : (
                        <span className={clsx("text-xs", c.textMuted)}>
                          {ent.platformDefault ? t("adminEnterprises.allCategoriesShort") : t("adminEnterprises.noCategoriesYet")}
                        </span>
                      )}
                    </td>
                    <td className={clsx("px-5 py-3.5 hidden lg:table-cell text-xs", c.textSecondary)}>
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} className={c.textMuted} />
                        {new Date(ent.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={clsx("flex items-center gap-1.5 text-xs font-semibold", STATUS_TEXT[ent.status])}>
                        <span className={clsx("w-1.5 h-1.5 rounded-full", STATUS_DOT[ent.status])} />
                        {statusLabel[ent.status]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="text-xs font-semibold text-brand-500">
                        {ent.status === "PENDING" ? t("adminEnterprises.review") : t("adminEnterprises.viewDetails")}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setSelected(null)} />
          <div className={clsx("relative w-full max-w-lg rounded-2xl border p-6 shadow-2xl animate-fade-in max-h-[85vh] overflow-y-auto", c.card)}>
            <button
              onClick={() => setSelected(null)}
              className={clsx("absolute right-4 top-4 p-1.5 rounded-lg transition-colors", c.isDark ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-500")}
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-3 pr-8">
              <div className="w-11 h-11 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center flex-shrink-0">
                <Store size={18} />
              </div>
              <div className="min-w-0">
                <h2 className={clsx("text-lg font-bold truncate", c.textPrimary)}>{selected.name}</h2>
                <span className="flex flex-wrap items-center gap-2">
                  <span className={clsx("flex items-center gap-1.5 text-xs font-semibold", STATUS_TEXT[selected.status])}>
                    <span className={clsx("w-1.5 h-1.5 rounded-full", STATUS_DOT[selected.status])} />
                    {statusLabel[selected.status]}
                  </span>
                  {selected.platformDefault && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-600">
                      {t("adminEnterprises.platformStore")}
                    </span>
                  )}
                </span>
              </div>
            </div>

            <dl className="mt-5 space-y-3 text-sm">
              <div>
                <dt className={clsx("text-xs font-semibold uppercase tracking-wide", c.textMuted)}>{t("adminEnterprises.detail.contact")}</dt>
                <dd className={clsx("mt-1 flex flex-col gap-1", c.textSecondary)}>
                  <span className="flex items-center gap-1.5 text-xs">
                    <Mail size={12} className={c.textMuted} /> {selected.contactEmail}
                  </span>
                  {selected.contactPhone && (
                    <span className="flex items-center gap-1.5 text-xs">
                      <Phone size={12} className={c.textMuted} /> {selected.contactPhone}
                    </span>
                  )}
                  {(selected.contactFirstName || selected.contactLastName) && (
                    <span className="text-xs">{[selected.contactFirstName, selected.contactLastName].filter(Boolean).join(" ")}</span>
                  )}
                </dd>
              </div>
              {selected.businessType && (
                <div>
                  <dt className={clsx("text-xs font-semibold uppercase tracking-wide", c.textMuted)}>{t("adminEnterprises.detail.businessType")}</dt>
                  <dd className={clsx("mt-1 text-sm", c.textPrimary)}>{selected.businessType}</dd>
                </div>
              )}
              {selected.whatDoYouSell && (
                <div>
                  <dt className={clsx("text-xs font-semibold uppercase tracking-wide", c.textMuted)}>{t("adminEnterprises.detail.whatTheySell")}</dt>
                  <dd className={clsx("mt-1 text-sm leading-relaxed", c.textPrimary)}>{selected.whatDoYouSell}</dd>
                </div>
              )}
              {selected.estimatedCatalogSize && (
                <div>
                  <dt className={clsx("text-xs font-semibold uppercase tracking-wide", c.textMuted)}>{t("adminEnterprises.detail.catalogSize")}</dt>
                  <dd className={clsx("mt-1 text-sm", c.textPrimary)}>{selected.estimatedCatalogSize}</dd>
                </div>
              )}
              <div>
                <dt className={clsx("text-xs font-semibold uppercase tracking-wide", c.textMuted)}>{t("adminEnterprises.colCategories")}</dt>
                <dd className="mt-1.5 flex flex-wrap gap-1.5">
                  {selected.categories.length > 0 ? (
                    selected.categories.map((cat) => (
                      <span key={cat.id} className={clsx("px-2.5 py-1 rounded-full text-xs font-medium", c.isDark ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600")}>
                        {cat.name}
                      </span>
                    ))
                  ) : (
                    <span className={clsx("text-xs", c.textMuted)}>
                      {selected.platformDefault ? t("adminEnterprises.allCategories") : t("adminEnterprises.noCategoriesYet")}
                    </span>
                  )}
                </dd>
              </div>
              {selected.status === "PENDING" && selected.suggestedCategories.length > 0 && (
                <div>
                  <dt className={clsx("text-xs font-semibold uppercase tracking-wide flex items-center gap-1", c.textMuted)}>
                    <Sparkles size={11} className="text-amber-500" /> {t("adminEnterprises.approveModal.suggestedBadge")}
                  </dt>
                  <dd className="mt-1.5 flex flex-wrap gap-1.5">
                    {selected.suggestedCategories.map((cat) => (
                      <span key={cat.id} className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600">
                        {cat.name}
                      </span>
                    ))}
                  </dd>
                </div>
              )}
              {selected.approvedByName && (
                <div className={clsx("text-xs pt-1", c.textMuted)}>
                  {t("adminEnterprises.detail.approvedBy", { name: selected.approvedByName })}
                </div>
              )}
            </dl>

            {selected.status === "PENDING" && (
              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={() => askReject(selected)}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                >
                  {t("adminEnterprises.reject")}
                </button>
                <button
                  onClick={() => setShowApprove(true)}
                  className="flex-1 bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors"
                >
                  {t("adminEnterprises.approve")}
                </button>
              </div>
            )}

            {/* The platform's own store holds the whole catalog — suspending it would take every listing offline. */}
            {selected.status === "ACTIVE" && !selected.platformDefault && (
              <div className="mt-6">
                <button
                  onClick={() => askSuspend(selected)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                >
                  {t("adminEnterprises.suspend")}
                </button>
              </div>
            )}

            {selected.status === "SUSPENDED" && (
              <div className="mt-6">
                <button
                  onClick={() => askReactivate(selected)}
                  className="w-full bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors"
                >
                  {t("adminEnterprises.reactivate")}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showApprove && selected && (
        <EnterpriseApprovalModal enterprise={selected} onClose={() => setShowApprove(false)} onApprove={handleApprove} />
      )}

      <ConfirmDialog state={confirm} onCancel={() => setConfirm(null)} />
      <AlertDialog title="Something Went Wrong" message={actionError} onClose={() => setActionError(null)} />
    </AdminShell>
  );
}
