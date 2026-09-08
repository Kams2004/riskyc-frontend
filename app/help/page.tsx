"use client";

import Link from "next/link";
import { Truck, ShieldCheck, RotateCcw, MessageCircle, Mail } from "@/components/icons/fa";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function HelpCenterPage() {
  const { t } = useTranslation();

  const faqs = [
    { q: t("help.faq.question1"), a: t("help.faq.answer1") },
    { q: t("help.faq.question2"), a: t("help.faq.answer2") },
    { q: t("help.faq.question3"), a: t("help.faq.answer3") },
    { q: t("help.faq.question4"), a: t("help.faq.answer4") },
    { q: t("help.faq.question5"), a: t("help.faq.answer5") },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 min-h-[70vh]">
      <div className="text-center mb-10">
        <h1 className="font-display font-bold text-3xl text-gray-900">{t("help.page.title")}</h1>
        <p className="text-gray-500 mt-2">
          {t("help.page.subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
        <div className="flex flex-col items-center text-center gap-2 p-5 rounded-2xl border border-gray-100 bg-white shadow-sm">
          <Truck size={24} className="text-brand-500" />
          <p className="text-sm font-semibold text-gray-800">{t("help.perks.fastDelivery")}</p>
          <p className="text-xs text-gray-400">{t("help.perks.fastDeliverySub")}</p>
        </div>
        <div className="flex flex-col items-center text-center gap-2 p-5 rounded-2xl border border-gray-100 bg-white shadow-sm">
          <ShieldCheck size={24} className="text-brand-500" />
          <p className="text-sm font-semibold text-gray-800">{t("help.perks.securePay")}</p>
          <p className="text-xs text-gray-400">{t("help.perks.securePaySub")}</p>
        </div>
        <div className="flex flex-col items-center text-center gap-2 p-5 rounded-2xl border border-gray-100 bg-white shadow-sm">
          <RotateCcw size={24} className="text-brand-500" />
          <p className="text-sm font-semibold text-gray-800">{t("help.perks.easyReturn")}</p>
          <p className="text-xs text-gray-400">{t("help.perks.easyReturnSub")}</p>
        </div>
      </div>

      <Link
        href="/guide"
        className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white shadow-sm px-5 py-4 mb-8 hover:border-brand-200 transition-colors group"
      >
        <div>
          <p className="font-semibold text-sm text-gray-800 group-hover:text-brand-600 transition-colors">
            {t("help.page.fullGuideTitle")}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{t("help.page.fullGuideSubtitle")}</p>
        </div>
        <span className="text-brand-500 text-lg flex-shrink-0">&rarr;</span>
      </Link>

      <div className="space-y-3 mb-12">
        {faqs.map((item, i) => (
          <details
            key={i}
            className="group rounded-2xl border border-gray-100 bg-white shadow-sm px-5 py-4 open:shadow-md transition-shadow"
          >
            <summary className="flex items-center justify-between cursor-pointer list-none font-semibold text-sm text-gray-800">
              {item.q}
              <span className="text-brand-500 group-open:rotate-45 transition-transform text-lg leading-none">+</span>
            </summary>
            <p className="text-sm text-gray-500 mt-3 leading-relaxed">{item.a}</p>
          </details>
        ))}
      </div>

      <div className="rounded-2xl bg-brand-50 border border-brand-100 p-6 text-center">
        <p className="font-semibold text-brand-700 mb-1">{t("help.support.stillNeedHelp")}</p>
        <p className="text-sm text-gray-500 mb-4">{t("help.support.teamAvailable")}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors"
          >
            <MessageCircle size={16} /> {t("help.support.chatWithUs")}
          </Link>
          <a
            href="mailto:support@riskycfashion.com"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-brand-300 text-brand-600 text-sm font-semibold hover:bg-brand-100 transition-colors"
          >
            <Mail size={16} /> {t("help.support.emailSupport")}
          </a>
        </div>
      </div>
    </div>
  );
}
