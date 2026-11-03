"use client";

import { useEffect, useMemo, useState } from "react";
import { useAdminColors } from "@/lib/useAdminColors";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { listCategories } from "@/lib/api/categories";
import { Category, Enterprise } from "@/lib/types";
import { X, Check, Sparkles, Loader2, AlertCircle } from "lucide-react";
import clsx from "clsx";

interface Props {
  enterprise: Enterprise;
  onClose: () => void;
  onApprove: (categoryIds: string[]) => Promise<void>;
}

/**
 * Lets the super admin confirm (or override) which top-level Categories a
 * seller is approved to list under. Pre-checks EnterpriseService's suggested
 * categories — a starting point, never auto-applied without this review.
 */
export default function EnterpriseApprovalModal({ enterprise, onClose, onApprove }: Props) {
  const c = useAdminColors();
  const { t } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(enterprise.suggestedCategories.map((cat) => cat.id))
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listCategories()
      .then(setCategories)
      .catch(() => setError("Could not load categories."))
      .finally(() => setLoadingCategories(false));
  }, []);

  const suggestedIds = useMemo(
    () => new Set(enterprise.suggestedCategories.map((cat) => cat.id)),
    [enterprise.suggestedCategories]
  );

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (selected.size === 0) {
      setError(t("adminEnterprises.approveModal.noneSelected"));
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onApprove(Array.from(selected));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={submitting ? undefined : onClose} />
      <div className={clsx("relative w-full max-w-lg rounded-2xl border p-6 shadow-2xl animate-fade-in max-h-[85vh] overflow-y-auto", c.card)}>
        <button
          onClick={onClose}
          disabled={submitting}
          className={clsx("absolute right-4 top-4 p-1.5 rounded-lg transition-colors disabled:opacity-40", c.isDark ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-500")}
        >
          <X size={16} />
        </button>

        <h2 className={clsx("text-lg font-bold pr-8", c.textPrimary)}>
          {t("adminEnterprises.approveModal.title", { name: enterprise.name })}
        </h2>
        <p className={clsx("text-sm mt-1.5 leading-relaxed", c.textSecondary)}>
          {t("adminEnterprises.approveModal.subtitle")}
        </p>

        <div className="mt-5 space-y-1.5">
          {loadingCategories ? (
            <div className="py-8 flex justify-center">
              <Loader2 size={20} className="animate-spin text-brand-500" />
            </div>
          ) : (
            categories.map((cat) => {
              const isSelected = selected.has(cat.id);
              const isSuggested = suggestedIds.has(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggle(cat.id)}
                  disabled={submitting}
                  className={clsx(
                    "w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border text-left transition-colors disabled:opacity-60",
                    isSelected
                      ? "border-brand-500 bg-brand-500/10"
                      : c.isDark ? "border-gray-700 hover:bg-gray-700/40" : "border-gray-200 hover:bg-gray-50"
                  )}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <span className={clsx("w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0", isSelected ? "bg-brand-500 border-brand-500" : c.isDark ? "border-gray-600" : "border-gray-300")}>
                      {isSelected && <Check size={12} className="text-white" />}
                    </span>
                    <span className={clsx("text-sm font-medium truncate", c.textPrimary)}>{cat.name}</span>
                  </span>
                  {isSuggested && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-amber-500 flex-shrink-0">
                      <Sparkles size={10} />
                      {t("adminEnterprises.approveModal.suggestedBadge")}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5 mt-4">
            <AlertCircle size={15} className="text-red-400 flex-shrink-0" />
            <p className="text-red-400 text-xs font-medium">{error}</p>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={submitting}
            className={clsx("px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60", c.isDark ? "text-gray-300 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-100")}
          >
            {t("adminEnterprises.approveModal.cancel")}
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || loadingCategories}
            className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            {submitting ? t("adminEnterprises.approveModal.confirming") : t("adminEnterprises.approveModal.confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
