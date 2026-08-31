"use client";

import Link from "next/link";
import { ArrowRight, ShoppingBag, Star } from "@/components/icons/fa";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function Hero() {
  const { t } = useTranslation();

  const heroImages = [
    {
      src: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&q=80",
      alt: t("home.hero.imageAlt.dress"),
      label: t("home.hero.images.dresses"),
    },
    {
      src: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600&q=80",
      alt: t("home.hero.imageAlt.jersey"),
      label: t("home.hero.images.jerseys"),
    },
    {
      src: "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=600&q=80",
      alt: t("home.hero.imageAlt.skirt"),
      label: t("home.hero.images.fashion"),
    },
    {
      src: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600&q=80",
      alt: t("home.hero.imageAlt.maxiDress"),
      label: t("home.hero.images.newIn"),
    },
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-purple-50 min-h-[90vh] flex items-center">
      {/* Decorative blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-brand-100 rounded-full opacity-50 blur-3xl" />
        <div className="absolute top-1/2 -left-24 w-72 h-72 bg-purple-100 rounded-full opacity-40 blur-3xl" />
        <div className="absolute bottom-0 right-1/3 w-64 h-64 bg-gold-400 rounded-full opacity-10 blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-14 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

        {/* ── Left: Text ── */}
        <div className="animate-slide-up order-2 lg:order-1">
          <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-100 rounded-full px-4 py-1.5 mb-6">
            <Star size={14} className="text-gold-500 fill-gold-500" />
            <span className="text-sm font-medium text-brand-700">
              {t("home.hero.badge")}
            </span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
            {t("home.hero.titleBefore")}
            <span className="relative inline-block mx-2">
              <span className="relative z-10 text-brand-500">{t("home.hero.titleHighlight")}</span>
              <span className="absolute bottom-1 left-0 right-0 h-3 bg-brand-100 -z-0 rounded" />
            </span>
            {t("home.hero.titleAfter")}
          </h1>

          <p className="text-lg text-gray-500 leading-relaxed mb-8 max-w-lg">
            {t("home.hero.subtitle")}
          </p>

          <div className="flex flex-wrap gap-4 mb-12">
            <Link href="/products" className="btn-primary text-base px-8 py-4">
              <ShoppingBag size={20} />
              {t("home.hero.shopNow")}
              <ArrowRight size={18} />
            </Link>
            <Link href="/category/dresses" className="btn-secondary text-base px-8 py-4">
              {t("home.hero.viewDresses")}
            </Link>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-8 pt-8 border-t border-gray-100">
            {[
              { value: "500+", label: t("home.hero.stats.products") },
              { value: "2K+", label: t("home.hero.stats.happyClients") },
              { value: "4.9★", label: t("home.hero.stats.rating") },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl font-display font-bold text-brand-600">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: Image collage ── */}
        <div className="relative order-1 lg:order-2 flex items-center justify-center">
          <div className="relative w-full max-w-lg h-[560px]">

            {/* Large main image — top-left */}
            <div className="absolute top-0 left-0 w-[58%] h-[62%] rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={heroImages[0].src}
                alt={heroImages[0].alt}
                className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                <span className="text-white text-xs font-bold bg-brand-500 px-2 py-0.5 rounded-full">
                  {heroImages[0].label}
                </span>
              </div>
            </div>

            {/* Top-right image */}
            <div className="absolute top-0 right-0 w-[38%] h-[46%] rounded-3xl overflow-hidden shadow-xl border-4 border-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={heroImages[1].src}
                alt={heroImages[1].alt}
                className="w-full h-full object-cover object-center hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                <span className="text-white text-xs font-bold bg-gray-800 px-2 py-0.5 rounded-full">
                  {heroImages[1].label}
                </span>
              </div>
            </div>

            {/* Bottom-left image */}
            <div className="absolute bottom-0 left-0 w-[38%] h-[35%] rounded-3xl overflow-hidden shadow-xl border-4 border-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={heroImages[2].src}
                alt={heroImages[2].alt}
                className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                <span className="text-white text-xs font-bold bg-brand-600 px-2 py-0.5 rounded-full">
                  {heroImages[2].label}
                </span>
              </div>
            </div>

            {/* Bottom-right — large */}
            <div className="absolute bottom-0 right-0 w-[58%] h-[51%] rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={heroImages[3].src}
                alt={heroImages[3].alt}
                className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                <span className="text-white text-xs font-bold bg-emerald-500 px-2 py-0.5 rounded-full">
                  {heroImages[3].label}
                </span>
              </div>
            </div>

            {/* Floating: New Arrivals badge */}
            <div
              className="absolute -left-6 top-[34%] bg-white rounded-2xl shadow-xl p-3 z-10 animate-bounce"
              style={{ animationDuration: "3s" }}
            >
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center text-lg">
                  👗
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-800">{t("home.hero.newArrivals.title")}</p>
                  <p className="text-[10px] text-gray-400">{t("home.hero.newArrivals.subtitle")}</p>
                </div>
              </div>
            </div>

            {/* Floating: Sale badge */}
            <div
              className="absolute -right-4 top-[46%] bg-white rounded-2xl shadow-xl p-3 z-10 animate-bounce"
              style={{ animationDuration: "2.5s", animationDelay: "0.6s" }}
            >
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
                  <span className="text-green-600 font-bold text-xs">-30%</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-800">{t("home.hero.sale.title")}</p>
                  <p className="text-[10px] text-gray-400">{t("home.hero.sale.subtitle")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
