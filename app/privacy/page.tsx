"use client";

import Link from "next/link";
import { Shield } from "@/components/icons/fa";
import { useTranslation } from "@/lib/i18n/useTranslation";

const SECTION_KEYS = [
  "intro",
  "collect",
  "use",
  "sharing",
  "sms",
  "cookies",
  "retention",
  "rights",
  "children",
  "security",
  "changes",
  "contact",
] as const;

const LAST_UPDATED = "11 September 2026";

export default function PrivacyPage() {
  const { t } = useTranslation();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 min-h-[70vh]">
      <div className="text-center mb-10">
        <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-4">
          <Shield size={24} className="text-brand-500" />
        </div>
        <h1 className="font-display font-bold text-3xl text-gray-900">{t("privacy.page.title")}</h1>
        <p className="text-gray-500 mt-2">{t("privacy.page.subtitle")}</p>
        <p className="text-gray-400 text-xs mt-3">{t("privacy.page.lastUpdated", { date: LAST_UPDATED })}</p>
      </div>

      <div className="space-y-8">
        {SECTION_KEYS.map((key) => (
          <section key={key}>
            <h2 className="font-display font-bold text-lg text-gray-900 mb-2">
              {t(`privacy.sections.${key}Title`)}
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">{t(`privacy.sections.${key}Body`)}</p>
          </section>
        ))}
      </div>

      <div className="mt-12 text-center">
        <Link
          href="/register"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors"
        >
          {t("privacy.backToRegister")}
        </Link>
      </div>
    </div>
  );
}
