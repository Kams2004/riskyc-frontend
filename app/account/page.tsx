"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import * as customersApi from "@/lib/api/customers";
import { ReferralSummary } from "@/lib/types";
import {
  Gift,
  Copy,
  Check,
  Users,
  Share2,
  Pencil,
  AlertCircle,
} from "@/components/icons/fa";
import clsx from "clsx";
import { useTranslation } from "@/lib/i18n/useTranslation";

function timeAgo(iso: string, t: (path: string, vars?: Record<string, string | number>) => string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 0) return t("account.dashboard.timeAgo.today");
  if (days === 1) return t("account.dashboard.timeAgo.yesterday");
  if (days < 30) return t("account.dashboard.timeAgo.daysAgo", { days });
  const months = Math.floor(days / 30);
  if (months < 12) return t("account.dashboard.timeAgo.monthsAgo", { months });
  return t("account.dashboard.timeAgo.yearsAgo", { years: Math.floor(months / 12) });
}

export default function AccountPage() {
  const router = useRouter();
  const customer = useStore((s) => s.customer);
  const { t } = useTranslation();
  const [hydrated, setHydrated] = useState(false);
  const [summary, setSummary] = useState<ReferralSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [acronym, setAcronym] = useState("");
  const [editingAcronym, setEditingAcronym] = useState(false);
  const [savingAcronym, setSavingAcronym] = useState(false);
  const [acronymError, setAcronymError] = useState("");

  const [copiedField, setCopiedField] = useState<"link" | "code" | null>(null);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!customer) {
      router.replace("/login?redirect=" + encodeURIComponent("/account"));
      return;
    }
    setAcronym(customer.acronym);
    customersApi
      .getReferralSummary(customer.id)
      .then(setSummary)
      .catch(() => setError(t("account.dashboard.referrals.loadError")))
      .finally(() => setLoading(false));
  }, [hydrated, customer, router]);

  if (!hydrated || !customer) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  const shareLink =
    typeof window !== "undefined" ? `${window.location.origin}/register?ref=${summary?.referralCode ?? customer.referralCode}` : "";

  const handleCopy = (value: string, field: "link" | "code") => {
    navigator.clipboard.writeText(value).catch(() => {});
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSaveAcronym = async () => {
    const trimmed = acronym.trim();
    if (!trimmed) {
      setAcronymError(t("account.dashboard.displayName.emptyError"));
      return;
    }
    setSavingAcronym(true);
    setAcronymError("");
    try {
      const updated = await customersApi.updateAcronym(customer.id, trimmed);
      useStore.setState({ customer: updated });
      setSummary((s) => (s ? { ...s, acronym: updated.acronym } : s));
      setEditingAcronym(false);
    } catch (e) {
      setAcronymError(e instanceof Error ? e.message : t("account.dashboard.displayName.saveError"));
    } finally {
      setSavingAcronym(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-gray-900">{t("account.dashboard.title")}</h1>
        <p className="text-gray-400 text-sm mt-1">
          {customer.firstName} {customer.lastName} · {customer.email}
        </p>
      </div>

      {/* Display name (acronym) */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-1">{t("account.dashboard.displayName.title")}</h2>
        <p className="text-sm text-gray-400 mb-4">
          {t("account.dashboard.displayName.description")}
        </p>
        {editingAcronym ? (
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={acronym}
              onChange={(e) => setAcronym(e.target.value)}
              maxLength={24}
              className="flex-1 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:bg-white transition-colors"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveAcronym}
                disabled={savingAcronym}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
              >
                {savingAcronym ? t("account.dashboard.displayName.saving") : t("account.dashboard.displayName.save")}
              </button>
              <button
                onClick={() => {
                  setEditingAcronym(false);
                  setAcronym(customer.acronym);
                  setAcronymError("");
                }}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-semibold transition-colors"
              >
                {t("account.dashboard.displayName.cancel")}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="font-mono font-bold text-lg text-brand-600">{customer.acronym}</span>
            <button
              onClick={() => setEditingAcronym(true)}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-brand-600 transition-colors"
            >
              <Pencil size={13} /> {t("account.dashboard.displayName.edit")}
            </button>
          </div>
        )}
        {acronymError && <p className="text-xs text-red-500 mt-2">{acronymError}</p>}
      </div>

      {/* Referral link/code */}
      <div className="bg-gradient-to-br from-brand-500 to-brand-700 rounded-3xl p-6 shadow-lg text-white">
        <div className="flex items-center gap-2 mb-1">
          <Gift size={18} />
          <h2 className="font-semibold">{t("account.dashboard.invite.title")}</h2>
        </div>
        <p className="text-sm text-white/80 mb-4">
          {t("account.dashboard.invite.description")}
        </p>

        <div className="space-y-2">
          <div className="flex items-center gap-2 bg-white/15 rounded-xl px-4 py-2.5">
            <Share2 size={14} className="flex-shrink-0 text-white/70" />
            <span className="flex-1 text-sm truncate font-mono">{shareLink}</span>
            <button
              onClick={() => handleCopy(shareLink, "link")}
              className="flex-shrink-0 flex items-center gap-1.5 bg-white/20 hover:bg-white/30 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
            >
              {copiedField === "link" ? <><Check size={13} />{t("account.dashboard.invite.copied")}</> : <><Copy size={13} />{t("account.dashboard.invite.copyLink")}</>}
            </button>
          </div>
          <div className="flex items-center gap-2 bg-white/15 rounded-xl px-4 py-2.5">
            <Gift size={14} className="flex-shrink-0 text-white/70" />
            <span className="flex-1 text-sm font-mono tracking-widest">{summary?.referralCode ?? customer.referralCode}</span>
            <button
              onClick={() => handleCopy(summary?.referralCode ?? customer.referralCode, "code")}
              className="flex-shrink-0 flex items-center gap-1.5 bg-white/20 hover:bg-white/30 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
            >
              {copiedField === "code" ? <><Check size={13} />{t("account.dashboard.invite.copied")}</> : <><Copy size={13} />{t("account.dashboard.invite.copyCode")}</>}
            </button>
          </div>
        </div>

        {summary?.referredByAcronym && (
          <p className="text-xs text-white/70 mt-4">{t("account.dashboard.invite.referredBy", { acronym: summary.referredByAcronym })}</p>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          <AlertCircle size={15} className="text-red-500 flex-shrink-0" />
          <p className="text-red-600 text-sm font-medium">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="bg-white border border-gray-100 rounded-3xl p-10 flex items-center justify-center shadow-sm">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-brand-500 rounded-full animate-spin" />
        </div>
      ) : summary ? (
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Users size={18} className="text-brand-500" />
            <h2 className="font-semibold text-gray-900">{t("account.dashboard.referrals.title")}</h2>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-brand-50 rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-brand-600">{summary.directReferralCount}</p>
              <p className="text-xs text-gray-500 mt-0.5">{t("account.dashboard.referrals.direct")}</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-gray-700">{summary.indirectReferralCount}</p>
              <p className="text-xs text-gray-500 mt-0.5">{t("account.dashboard.referrals.indirect")}</p>
            </div>
          </div>

          {summary.referrals.length === 0 ? (
            <div className="text-center py-8">
              <Gift className="mx-auto w-10 h-10 mb-3 text-gray-200" />
              <p className="text-sm text-gray-400">{t("account.dashboard.referrals.empty")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 uppercase tracking-wide">
                    <th className="px-2 py-2 font-medium">{t("account.dashboard.referrals.tableReferred")}</th>
                    <th className="px-2 py-2 font-medium">{t("account.dashboard.referrals.tableJoined")}</th>
                    <th className="px-2 py-2 font-medium text-right">{t("account.dashboard.referrals.tableTheirReferrals")}</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.referrals.map((r, i) => (
                    <tr key={i} className={clsx(i > 0 && "border-t border-gray-50")}>
                      <td className="px-2 py-3 font-mono font-semibold text-gray-800">{r.acronym}</td>
                      <td className="px-2 py-3 text-gray-500">{timeAgo(r.joinedAt, t)}</td>
                      <td className="px-2 py-3 text-right font-semibold text-brand-600">{r.referredCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
