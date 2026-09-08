"use client";

import Link from "next/link";
import { FileText } from "@/components/icons/fa";
import { useTranslation } from "@/lib/i18n/useTranslation";

const SECTION_KEYS = [
  "acceptance",
  "accounts",
  "orders",
  "payment",
  "review",
  "delivery",
  "returns",
  "referral",
  "communications",
  "conduct",
  "ip",
  "liability",
  "changes",
  "contact",
] as const;

const LAST_UPDATED = "7 September 2026";

export default function TermsPage() {
  const { t } = useTranslation();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 min-h-[70vh]">
      <div className="text-center mb-10">
        <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-4">
          <FileText size={24} className="text-brand-500" />
        </div>
        <h1 className="font-display font-bold text-3xl text-gray-900">{t("terms.page.title")}</h1>
        <p className="text-gray-500 mt-2">{t("terms.page.subtitle")}</p>
        <p className="text-gray-400 text-xs mt-3">{t("terms.page.lastUpdated", { date: LAST_UPDATED })}</p>
      </div>

      <div className="space-y-8">
        {SECTION_KEYS.map((key) => (
          <section key={key}>
            <h2 className="font-display font-bold text-lg text-gray-900 mb-2">
              {t(`terms.sections.${key}Title`)}
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">{t(`terms.sections.${key}Body`)}</p>
          </section>
        ))}
      </div>

      <div className="mt-12 text-center">
        <Link
          href="/register"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors"
        >
          {t("terms.backToRegister")}
        </Link>
      </div>
    </div>
  );
}
