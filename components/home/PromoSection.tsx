"use client";

import Link from "next/link";
import { Tag, Truck, RotateCcw, Shield } from "@/components/icons/fa";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function PromoSection() {
  const { t } = useTranslation();
  return (
    <>
      {/* Promo Banner */}
      <section className="py-16 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Banner 1 */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 to-brand-700 p-8 text-white min-h-[200px] flex flex-col justify-between">
            <div className="absolute -right-8 -top-8 w-48 h-48 bg-white/10 rounded-full" />
            <div className="absolute -right-4 bottom-0 w-32 h-32 bg-white/5 rounded-full" />
            <div>
              <div className="badge-new mb-3 w-fit">{t("home.promo.banner1.badge")}</div>
              <h3 className="font-display text-2xl font-bold mb-2">
                {t("home.promo.banner1.titleLine1")}<br />{t("home.promo.banner1.titleLine2")}
              </h3>
              <p className="text-brand-100 text-sm">
                {t("home.promo.banner1.subtitle")}
              </p>
            </div>
            <Link
              href="/category/dresses/evening"
              className="mt-4 w-fit bg-white text-brand-600 hover:bg-brand-50 font-semibold px-5 py-2.5 rounded-full text-sm transition-colors"
            >
              {t("home.promo.banner1.cta")}
            </Link>
          </div>

          {/* Banner 2 */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 to-gray-700 p-8 text-white min-h-[200px] flex flex-col justify-between">
            <div className="absolute -right-8 -top-8 w-48 h-48 bg-gold-400/10 rounded-full" />
            <div>
              <div className="bg-gold-400 text-gray-900 text-xs font-bold px-2 py-0.5 rounded-full w-fit mb-3">
                {t("home.promo.banner2.badge")}
              </div>
              <h3 className="font-display text-2xl font-bold mb-2">
                {t("home.promo.banner2.titleLine1")}<br />{t("home.promo.banner2.titleLine2")}
              </h3>
              <p className="text-gray-300 text-sm">
                {t("home.promo.banner2.subtitle")}
              </p>
            </div>
            <Link
              href="/category/jerseys/hoodies"
              className="mt-4 w-fit bg-gold-400 text-gray-900 hover:bg-gold-500 font-semibold px-5 py-2.5 rounded-full text-sm transition-colors"
            >
              {t("home.promo.banner2.cta")}
            </Link>
          </div>
        </div>
      </section>

      {/* Features bar */}
      <section className="py-10 px-4 sm:px-6 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            {
              icon: <Truck size={24} className="text-brand-500" />,
              title: t("home.promo.features.fastDelivery.title"),
              desc: t("home.promo.features.fastDelivery.desc"),
            },
            {
              icon: <RotateCcw size={24} className="text-brand-500" />,
              title: t("home.promo.features.easyReturns.title"),
              desc: t("home.promo.features.easyReturns.desc"),
            },
            {
              icon: <Tag size={24} className="text-brand-500" />,
              title: t("home.promo.features.bestPrices.title"),
              desc: t("home.promo.features.bestPrices.desc"),
            },
            {
              icon: <Shield size={24} className="text-brand-500" />,
              title: t("home.promo.features.securePayment.title"),
              desc: t("home.promo.features.securePayment.desc"),
            },
          ].map((f) => (
            <div key={f.title} className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                {f.icon}
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">{f.title}</p>
                <p className="text-xs text-gray-400">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
