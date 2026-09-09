"use client";

import AdminShell from "@/components/admin/AdminShell";
import { useAdminStore } from "@/lib/adminStore";
import { useAdminColors } from "@/lib/useAdminColors";
import * as productsApi from "@/lib/api/products";
import { ProductAuditLogEntry } from "@/lib/api/products";
import { Product } from "@/lib/types";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { ArrowLeft, History, Clock } from "lucide-react";
import clsx from "clsx";

const SECTION_LABELS: Record<string, string> = {
  CREATED: "Created",
  DELETED: "Deleted",
  INFO: "Info",
  PRICING: "Pricing",
  IMAGES: "Images",
  COLORS: "Colors",
  STOCK: "Stock",
  DISPLAY: "Display",
  VISIBILITY: "Visibility",
};

export default function ProductActivityPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const token = useAdminStore((s) => s.session?.token);
  const c = useAdminColors();
  const { t } = useTranslation();

  const [product, setProduct] = useState<Product | null>(null);
  const [entries, setEntries] = useState<ProductAuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !token) return;
    Promise.all([productsApi.getProduct(id), productsApi.getProductAuditLog(id, token)])
      .then(([p, log]) => {
        setProduct(p);
        setEntries(log.content);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id, token]);

  return (
    <AdminShell>
      <div className="p-6 lg:p-8 space-y-6 max-w-3xl">
        <div className="flex items-center gap-4 flex-wrap">
          <button
            onClick={() => router.back()}
            className={clsx(
              "flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors",
              c.isDark ? "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
            )}
          >
            <ArrowLeft size={16} /> {t("adminProducts.common.back")}
          </button>
          <div>
            <h1 className={clsx("text-xl font-bold flex items-center gap-2", c.textPrimary)}>
              <History size={18} className="opacity-60" />
              {t("adminProducts.view.activityTitle")}
            </h1>
            {product && <p className={clsx("text-xs mt-0.5 truncate", c.textMuted)}>{product.name}</p>}
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400">{t("adminProducts.common.loading")}</div>
        ) : entries.length === 0 ? (
          <div className={clsx("rounded-2xl border p-8 text-center text-sm", c.isDark ? "bg-gray-800/50 border-gray-700/60 text-gray-400" : "bg-white border-gray-200 text-gray-400")}>
            {t("adminProducts.view.activityEmpty")}
          </div>
        ) : (
          <div className={clsx("rounded-2xl border divide-y", c.isDark ? "bg-gray-800/50 border-gray-700/60 divide-gray-700/60" : "bg-white border-gray-200 divide-gray-100")}>
            {entries.map((entry) => (
              <div key={entry.id} className="p-4 flex items-start gap-3">
                <span
                  className={clsx(
                    "flex-shrink-0 font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full mt-0.5",
                    c.isDark ? "bg-brand-500/15 text-brand-400" : "bg-brand-50 text-brand-600"
                  )}
                >
                  {SECTION_LABELS[entry.section] ?? entry.section}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={clsx("text-sm", c.textPrimary)}>{entry.summary}</p>
                  <p className={clsx("text-xs mt-1 flex items-center gap-1.5", c.textMuted)}>
                    {entry.changedByName && <span className="font-medium">{t("adminProducts.view.activityBy", { name: entry.changedByName })}</span>}
                    <span className="flex items-center gap-1">
                      <Clock size={11} /> {new Date(entry.changedAt).toLocaleString()}
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
