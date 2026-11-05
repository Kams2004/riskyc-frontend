"use client";

import clsx from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAdminColors } from "@/lib/useAdminColors";
import { useTranslation } from "@/lib/i18n/useTranslation";

const PAGE_SIZES = [10, 20, 50];

/** Shared page controls for admin lists (see lib/hooks/usePagination). Hidden when everything fits on one page of 10. */
export default function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
  className,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  className?: string;
}) {
  const c = useAdminColors();
  const { t } = useTranslation();
  if (total <= PAGE_SIZES[0]) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1
  );

  return (
    <div className={clsx("flex items-center justify-between flex-wrap gap-3", className)}>
      <div className="flex items-center gap-3">
        <p className={clsx("text-xs tabular-nums", c.textMuted)}>{t("adminCommon.pagination.showing", { from, to, total })}</p>
        {onPageSizeChange && (
          <label className={clsx("flex items-center gap-1.5 text-xs", c.textMuted)}>
            {t("adminCommon.pagination.perPage")}
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className={clsx("rounded-lg border px-1.5 py-1 text-xs outline-none", c.input)}
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className={clsx(
              "flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold transition-all",
              page === 1 ? "opacity-30 cursor-not-allowed" : c.btnGhost
            )}
          >
            <ChevronLeft size={14} /> {t("adminCommon.pagination.previous")}
          </button>
          {pages.map((p, i) => (
            <span key={p} className="flex items-center">
              {i > 0 && pages[i - 1] !== p - 1 && <span className={clsx("px-1.5 text-xs", c.textMuted)}>…</span>}
              <button
                onClick={() => onPageChange(p)}
                className={clsx(
                  "w-8 h-8 rounded-xl text-xs font-semibold transition-all",
                  p === page ? "bg-brand-500 text-white shadow-sm" : c.btnGhost
                )}
              >
                {p}
              </button>
            </span>
          ))}
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            className={clsx(
              "flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold transition-all",
              page === totalPages ? "opacity-30 cursor-not-allowed" : c.btnGhost
            )}
          >
            {t("adminCommon.pagination.next")} <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
