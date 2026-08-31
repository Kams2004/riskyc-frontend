"use client";

import Link from "next/link";
import {
  Instagram,
  Facebook,
  Twitter,
  Phone,
  Mail,
  MapPin,
} from "@/components/icons/fa";
import { useCategories } from "@/lib/useCategories";
import { FaIconPreview } from "@/components/admin/FaIconPicker";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { localized } from "@/lib/i18n/localized";

export default function Footer() {
  const { categories: allCategories } = useCategories();
  const categories = allCategories.filter((cat) => cat.productCount > 0);
  const { t, language } = useTranslation();

  return (
    <footer className="bg-gray-900 text-gray-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
                <span className="text-white font-display font-bold text-sm">RF</span>
              </div>
              <div>
                <span className="font-display font-bold text-xl text-white leading-none block">
                  Riskyc
                </span>
                <span className="text-[10px] text-gray-400 tracking-widest uppercase leading-none">
                  Fashion
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              {t("footer.tagline")}
            </p>
            <div className="flex items-center gap-3">
              <a
                href="#"
                className="w-9 h-9 rounded-full bg-gray-800 hover:bg-brand-500 flex items-center justify-center transition-colors"
              >
                <Instagram size={16} />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-full bg-gray-800 hover:bg-blue-600 flex items-center justify-center transition-colors"
              >
                <Facebook size={16} />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-full bg-gray-800 hover:bg-sky-500 flex items-center justify-center transition-colors"
              >
                <Twitter size={16} />
              </a>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-semibold text-white mb-4">{t("footer.categoriesHeading")}</h3>
            <ul className="space-y-2">
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/category/${cat.slug}`}
                    className="text-sm text-gray-400 hover:text-brand-400 transition-colors flex items-center gap-1.5"
                  >
                    <span className="flex items-center"><FaIconPreview value={cat.icon ?? "fa:solid:tag"} size={13} /></span>
                    {localized(cat.name, cat.nameFr, language)}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/products"
                  className="text-sm text-gray-400 hover:text-brand-400 transition-colors"
                >
                  {t("nav.allProducts")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">{t("footer.quickLinksHeading")}</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link href="/cart" className="hover:text-brand-400 transition-colors">
                  {t("footer.myCart")}
                </Link>
              </li>
              <li>
                <Link href="/cart?tab=orders" className="hover:text-brand-400 transition-colors">
                  {t("footer.myOrders")}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-brand-400 transition-colors">
                  {t("footer.contactUs")}
                </Link>
              </li>
              <li>
                <a href="#" className="hover:text-brand-400 transition-colors">
                  {t("footer.sizeGuide")}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-brand-400 transition-colors">
                  {t("footer.shippingPolicy")}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-brand-400 transition-colors">
                  {t("footer.returnsExchanges")}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-brand-400 transition-colors">
                  {t("footer.privacyPolicy")}
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-white mb-4">{t("footer.contactHeading")}</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-start gap-2.5">
                <MapPin size={16} className="mt-0.5 text-brand-400 flex-shrink-0" />
                <span className="whitespace-pre-line">{t("footer.address")}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone size={16} className="text-brand-400 flex-shrink-0" />
                <a href="tel:+237693456789" className="hover:text-brand-400 transition-colors">
                  +237 693 45 67 89
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail size={16} className="text-brand-400 flex-shrink-0" />
                <a href="mailto:contact@riskyc.cm" className="hover:text-brand-400 transition-colors">
                  contact@riskyc.cm
                </a>
              </li>
            </ul>

            {/* Payment methods */}
            <div className="mt-6">
              <p className="text-xs text-gray-500 mb-2">{t("footer.weAccept")}</p>
              <div className="flex gap-2">
                <div className="bg-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg">
                  {t("footer.orangeMoney")}
                </div>
                <div className="bg-yellow-500 text-gray-900 text-xs font-bold px-3 py-1.5 rounded-lg">
                  {t("footer.mtnMomo")}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <p>{t("footer.copyright", { year: new Date().getFullYear() })}</p>
          <p>{t("footer.madeWith")}</p>
        </div>
      </div>
    </footer>
  );
}
