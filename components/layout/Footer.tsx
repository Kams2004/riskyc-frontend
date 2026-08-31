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

export default function Footer() {
  const { categories: allCategories } = useCategories();
  const categories = allCategories.filter((cat) => cat.productCount > 0);

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
              Your go-to destination for the latest fashion trends. Quality
              dresses, jerseys, and fashion delivered with style.
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
            <h3 className="font-semibold text-white mb-4">Categories</h3>
            <ul className="space-y-2">
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/category/${cat.slug}`}
                    className="text-sm text-gray-400 hover:text-brand-400 transition-colors flex items-center gap-1.5"
                  >
                    <span className="flex items-center"><FaIconPreview value={cat.icon ?? "fa:solid:tag"} size={13} /></span>
                    {cat.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/products"
                  className="text-sm text-gray-400 hover:text-brand-400 transition-colors"
                >
                  All Products
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link href="/cart" className="hover:text-brand-400 transition-colors">
                  My Cart
                </Link>
              </li>
              <li>
                <Link href="/cart?tab=orders" className="hover:text-brand-400 transition-colors">
                  My Orders
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-brand-400 transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <a href="#" className="hover:text-brand-400 transition-colors">
                  Size Guide
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-brand-400 transition-colors">
                  Shipping Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-brand-400 transition-colors">
                  Returns & Exchanges
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-brand-400 transition-colors">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-white mb-4">Contact Us</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-start gap-2.5">
                <MapPin size={16} className="mt-0.5 text-brand-400 flex-shrink-0" />
                <span>Marché Central, Douala<br />Précisément au Marché des Pommes</span>
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
              <p className="text-xs text-gray-500 mb-2">We accept:</p>
              <div className="flex gap-2">
                <div className="bg-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg">
                  Orange Money
                </div>
                <div className="bg-yellow-500 text-gray-900 text-xs font-bold px-3 py-1.5 rounded-lg">
                  MTN MoMo
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} Riskyc Fashion. All rights reserved.</p>
          <p>Made with ❤️ in Cameroon</p>
        </div>
      </div>
    </footer>
  );
}
