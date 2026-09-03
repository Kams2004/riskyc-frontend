"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  ShoppingCart,
  Search,
  Menu,
  X,
  Globe,
  Heart,
  ChevronDown,
  User,
  LogIn,
  UserPlus,
  LogOut,
  HelpCircle,
  Package,
  MapPin,
  Gift,
} from "@/components/icons/fa";
import { useStore } from "@/lib/store";
import { useCategories } from "@/lib/useCategories";
import { FaIconPreview } from "@/components/admin/FaIconPicker";
import DownloadAppButton from "@/components/shared/DownloadAppButton";
import { Customer } from "@/lib/types";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { localized } from "@/lib/i18n/localized";
import clsx from "clsx";

// First N categories get their own top-level nav slot (with their
// subcategories in a hover dropdown); anything past this count moves into
// the "More" dropdown instead, grouped in columns of the same size so that
// list grows sideways (scrollable) instead of into one ever-taller list.
// Kept low (rather than shrinking each item to fit) because category names
// are admin-authored and can run long, especially once translated to
// French — a handful of guaranteed-visible slots beats an unpredictable
// number that depends on exactly how long today's names happen to be.
const MAX_NAV_CATEGORIES = 3;

/** Initials avatar for a logged-in customer — same visual language as the admin sidebar's "RF" badge. */
function CustomerAvatar({ customer, size = 32 }: { customer: Customer; size?: number }) {
  const initials = `${customer.firstName[0] ?? ""}${customer.lastName[0] ?? ""}`.toUpperCase();
  return (
    <span
      className="flex items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white font-bold flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initials || <User size={size * 0.55} />}
    </span>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { getCartCount, language, setLanguage, items, customer, logoutCustomer } = useStore();
  const { t } = useTranslation();
  const { categories: allCategories } = useCategories();
  // Categories with no storefront-visible products are excluded everywhere
  // navigation/browsing surfaces list categories — an admin still sees them
  // in the admin panel (that list comes from useCategories() unfiltered).
  const categories = allCategories.filter((cat) => cat.productCount > 0);
  const visibleCategories = categories.slice(0, MAX_NAV_CATEGORIES);
  const overflowCategories = categories.slice(MAX_NAV_CATEGORIES);
  const [cartCount, setCartCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);

  // Sync cart count after hydration to avoid SSR mismatch
  useEffect(() => {
    setCartCount(getCartCount());
  }, [items, getCartCount]);

  // Sync logged-in customer after hydration to avoid SSR mismatch
  useEffect(() => {
    setCurrentCustomer(customer);
  }, [customer]);

  const handleLogout = () => {
    logoutCustomer();
    setActiveDropdown(null);
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
      {/* Top bar */}
      <div className="bg-gradient-to-r from-brand-600 to-brand-500 text-white text-xs text-center py-1.5 tracking-wide">
        {t("nav.topBanner")}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group mr-3 lg:mr-5 xl:mr-8 flex-shrink-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-md group-hover:shadow-brand-200 transition-shadow">
              <span className="text-white font-display font-bold text-sm">RF</span>
            </div>
            <div>
              <span className="font-display font-bold text-xl text-brand-600 leading-none block">
                Riskyc
              </span>
              <span className="text-[10px] text-gray-400 tracking-widest uppercase leading-none">
                Fashion
              </span>
            </div>
          </Link>

          {/* Desktop Nav — a fixed cap of top-level items (Home + up to
              MAX_NAV_CATEGORIES categories + More + All Products) so it
              always fits at any lg:+ width without scrolling, regardless of
              how many categories exist or how long their translated names
              run (French names especially). No overflow-x-auto here — that
              was the earlier bug: an overflow:auto ancestor clips every
              absolutely-positioned dropdown inside it too, so a scrolling
              nav row meant every category dropdown rendered but was never
              visible. The "More" dropdown below has its own bounded
              overflow instead, which only clips its own content. */}
          <nav className="hidden lg:flex items-center gap-0.5 flex-1">
            <Link
              href="/home"
              className={clsx(
                "px-3 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap flex-shrink-0",
                pathname === "/home"
                  ? "text-brand-600 bg-brand-50"
                  : "text-gray-600 hover:text-brand-600 hover:bg-gray-50"
              )}
            >
              {t("nav.home")}
            </Link>

            {visibleCategories.map((cat) => {
              const subs = cat.subcategories.filter((sub) => sub.productCount > 0);
              return (
              <div
                key={cat.id}
                className="relative flex-shrink-0"
                onMouseEnter={() => setActiveDropdown(cat.slug)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <Link
                  href={`/category/${cat.slug}`}
                  title={localized(cat.name, cat.nameFr, language)}
                  className={clsx(
                    "flex items-center gap-1 px-3 py-2 rounded-lg font-medium text-sm transition-colors",
                    pathname.startsWith(`/category/${cat.slug}`)
                      ? "text-brand-600 bg-brand-50"
                      : "text-gray-600 hover:text-brand-600 hover:bg-gray-50"
                  )}
                >
                  {/* Capped rather than whitespace-nowrap alone — an admin-authored
                      name (esp. translated to French) can otherwise be the one
                      item that pushes the whole row past the viewport width. No
                      icon here (kept in the dropdowns, where space is ample) —
                      at the narrow end of the lg: range every few px counts. */}
                  <span className="truncate max-w-[90px]">{localized(cat.name, cat.nameFr, language)}</span>
                  {subs.length > 0 && (
                    <ChevronDown
                      size={14}
                      className={clsx(
                        "transition-transform duration-200",
                        activeDropdown === cat.slug ? "rotate-180" : ""
                      )}
                    />
                  )}
                </Link>

                {activeDropdown === cat.slug && subs.length > 0 && (
                  <div className="absolute top-full left-0 mt-1 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-2 animate-fade-in">
                    {subs.map((sub) => (
                      <Link
                        key={sub.id}
                        href={`/category/${cat.slug}/${sub.slug}`}
                        className="block px-4 py-2 text-sm text-gray-600 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                      >
                        {localized(sub.name, sub.nameFr, language)}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              );
            })}

            {overflowCategories.length > 0 && (
              <div
                className="relative flex-shrink-0"
                onMouseEnter={() => setActiveDropdown("__more")}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button
                  className={clsx(
                    "flex items-center gap-1 px-3 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap",
                    overflowCategories.some((cat) => pathname.startsWith(`/category/${cat.slug}`))
                      ? "text-brand-600 bg-brand-50"
                      : "text-gray-600 hover:text-brand-600 hover:bg-gray-50"
                  )}
                >
                  {t("nav.more")}
                  <ChevronDown
                    size={14}
                    className={clsx(
                      "transition-transform duration-200",
                      activeDropdown === "__more" ? "rotate-180" : ""
                    )}
                  />
                </button>

                {/* Grouped in columns of MAX_NAV_CATEGORIES rows rather than
                    one endlessly-tall list — extra categories add columns,
                    revealed by scrolling the panel sideways. */}
                {activeDropdown === "__more" && (
                  <div
                    className="absolute top-full right-0 mt-1 grid grid-flow-col gap-x-1 auto-cols-[13rem] max-w-[80vw] overflow-x-auto bg-white rounded-xl shadow-xl border border-gray-100 p-2 animate-fade-in"
                    style={{ gridTemplateRows: `repeat(${MAX_NAV_CATEGORIES}, auto)` }}
                  >
                    {overflowCategories.map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/category/${cat.slug}`}
                        onClick={() => setActiveDropdown(null)}
                        className={clsx(
                          "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors whitespace-nowrap",
                          pathname.startsWith(`/category/${cat.slug}`)
                            ? "text-brand-600 bg-brand-50"
                            : "text-gray-600 hover:text-brand-600 hover:bg-brand-50"
                        )}
                      >
                        <FaIconPreview value={cat.icon ?? "fa:solid:tag"} size={13} />
                        {localized(cat.name, cat.nameFr, language)}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            <Link
              href="/"
              className={clsx(
                "px-3 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap flex-shrink-0",
                pathname === "/"
                  ? "text-brand-600 bg-brand-50"
                  : "text-gray-600 hover:text-brand-600 hover:bg-gray-50"
              )}
            >
              {t("nav.allProducts")}
            </Link>
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-1 xl:gap-2">
            {/* Search */}
            <div className="relative hidden sm:block">
              {searchOpen ? (
                <div className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2 animate-slide-in-right">
                  <Search size={16} className="text-gray-400" />
                  <input
                    autoFocus
                    type="text"
                    placeholder={t("nav.searchPlaceholder")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && searchQuery.trim()) {
                        window.location.href = `/products?q=${encodeURIComponent(searchQuery)}`;
                      }
                      if (e.key === "Escape") setSearchOpen(false);
                    }}
                    className="bg-transparent text-sm outline-none w-40"
                  />
                  <button onClick={() => setSearchOpen(false)}>
                    <X size={14} className="text-gray-400 hover:text-gray-600" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="btn-ghost p-2 rounded-full"
                >
                  <Search size={20} />
                </button>
              )}
            </div>

            {/* Language toggle — icon-only until xl:, where there's room for the label too */}
            <button
              onClick={() => setLanguage(language === "en" ? "fr" : "en")}
              className="hidden sm:flex items-center gap-1 btn-ghost px-2 xl:px-3 py-2 rounded-full text-sm font-medium"
              title={t("nav.toggleLanguage")}
            >
              <Globe size={16} />
              <span className="hidden xl:inline">{language.toUpperCase()}</span>
            </button>

            {/* Download App */}
            <DownloadAppButton variant="navbar-icon" />

            {/* Wishlist placeholder */}
            <button className="btn-ghost p-2 rounded-full hidden sm:flex">
              <Heart size={20} />
            </button>

            {/* Account */}
            <div
              className="relative hidden sm:block"
              onMouseEnter={() => setActiveDropdown("account")}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button className="flex items-center gap-1.5 btn-ghost px-2 py-1.5 rounded-full text-sm font-medium max-w-[160px]">
                {currentCustomer ? (
                  <CustomerAvatar customer={currentCustomer} size={28} />
                ) : (
                  <User size={18} />
                )}
                {currentCustomer && (
                  <span className="truncate hidden md:inline">{currentCustomer.firstName}</span>
                )}
                <ChevronDown
                  size={14}
                  className={clsx(
                    "transition-transform duration-200 flex-shrink-0",
                    activeDropdown === "account" ? "rotate-180" : ""
                  )}
                />
              </button>

              {activeDropdown === "account" && (
                <div className="absolute top-full right-0 mt-1 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 animate-fade-in z-50">
                  {currentCustomer ? (
                    <>
                      <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-100 mb-1">
                        <CustomerAvatar customer={currentCustomer} size={36} />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {currentCustomer.firstName} {currentCustomer.lastName}
                          </p>
                          <p className="text-xs text-gray-400 truncate">{currentCustomer.email}</p>
                        </div>
                      </div>
                      <Link
                        href="/cart?tab=orders"
                        onClick={() => setActiveDropdown(null)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                      >
                        <Package size={15} /> {t("nav.myOrders")}
                      </Link>
                      <Link
                        href="/account"
                        onClick={() => setActiveDropdown(null)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                      >
                        <Gift size={15} /> {t("nav.myReferrals")}
                      </Link>
                      <Link
                        href="/help"
                        onClick={() => setActiveDropdown(null)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                      >
                        <HelpCircle size={15} /> {t("nav.helpCenter")}
                      </Link>
                      <Link
                        href="/contact"
                        onClick={() => setActiveDropdown(null)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                      >
                        <MapPin size={15} /> {t("nav.contactUs")}
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <LogOut size={15} /> {t("nav.logOut")}
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        onClick={() => setActiveDropdown(null)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                      >
                        <LogIn size={15} /> {t("nav.login")}
                      </Link>
                      <Link
                        href="/register"
                        onClick={() => setActiveDropdown(null)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                      >
                        <UserPlus size={15} /> {t("nav.register")}
                      </Link>
                      <Link
                        href="/help"
                        onClick={() => setActiveDropdown(null)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                      >
                        <HelpCircle size={15} /> {t("nav.helpCenter")}
                      </Link>
                      <Link
                        href="/contact"
                        onClick={() => setActiveDropdown(null)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                      >
                        <MapPin size={15} /> {t("nav.contactUs")}
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Cart */}
            <Link
              href="/cart"
              className="relative flex items-center justify-center w-10 h-10 rounded-full bg-brand-500 hover:bg-brand-600 text-white transition-colors shadow-md"
            >
              <ShoppingCart size={18} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gold-400 text-gray-900 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </Link>

            {/* Mobile menu toggle */}
            <button
              className="lg:hidden btn-ghost p-2 rounded-full"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 animate-slide-up">
          <div className="px-4 py-4 space-y-1 max-h-[80vh] overflow-y-auto">
            {/* Download App */}
            <DownloadAppButton variant="mobile-banner" onNavigate={() => setMobileOpen(false)} />

            {/* Mobile search */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2 mb-3">
              <Search size={16} className="text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchQuery.trim()) {
                    setMobileOpen(false);
                    window.location.href = `/products?q=${encodeURIComponent(searchQuery)}`;
                  }
                }}
                className="bg-transparent text-sm outline-none flex-1"
              />
            </div>

            <Link
              href="/home"
              onClick={() => setMobileOpen(false)}
              className="block py-2 px-3 rounded-lg text-gray-700 hover:bg-brand-50 hover:text-brand-600 font-medium"
            >
              🏠 {t("nav.home")}
            </Link>
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className="block py-2 px-3 rounded-lg text-gray-700 hover:bg-brand-50 hover:text-brand-600 font-medium"
            >
              🛍️ {t("nav.allProducts")}
            </Link>

            {categories.map((cat) => (
              <div key={cat.id}>
                <button
                  onClick={() =>
                    setActiveDropdown(
                      activeDropdown === cat.slug ? null : cat.slug
                    )
                  }
                  className="w-full flex items-center justify-between py-2 px-3 rounded-lg text-gray-700 hover:bg-brand-50 hover:text-brand-600 font-medium"
                >
                  <span className="flex items-center gap-1.5">
                    <FaIconPreview value={cat.icon ?? "fa:solid:tag"} size={14} /> {localized(cat.name, cat.nameFr, language)}
                  </span>
                  <ChevronDown
                    size={16}
                    className={clsx(
                      "transition-transform",
                      activeDropdown === cat.slug ? "rotate-180" : ""
                    )}
                  />
                </button>
                {activeDropdown === cat.slug && (
                  <div className="ml-4 pl-3 border-l-2 border-brand-100 space-y-1 mt-1 mb-2">
                    <Link
                      href={`/category/${cat.slug}`}
                      onClick={() => setMobileOpen(false)}
                      className="block py-1.5 px-2 text-sm text-gray-600 hover:text-brand-600 rounded"
                    >
                      {t("nav.allOfCategory", { category: localized(cat.name, cat.nameFr, language) })}
                    </Link>
                    {cat.subcategories.filter((sub) => sub.productCount > 0).map((sub) => (
                      <Link
                        key={sub.id}
                        href={`/category/${cat.slug}/${sub.slug}`}
                        onClick={() => setMobileOpen(false)}
                        className="block py-1.5 px-2 text-sm text-gray-600 hover:text-brand-600 rounded"
                      >
                        {localized(sub.name, sub.nameFr, language)}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Mobile account section */}
            <div className="pt-3 mt-1 border-t border-gray-100">
              {currentCustomer ? (
                <>
                  <div className="flex items-center gap-3 px-3 py-2">
                    <CustomerAvatar customer={currentCustomer} size={40} />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {currentCustomer.firstName} {currentCustomer.lastName}
                      </p>
                      <p className="text-xs text-gray-400">{currentCustomer.email}</p>
                    </div>
                  </div>
                  <Link
                    href="/cart?tab=orders"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 py-2 px-3 rounded-lg text-gray-700 hover:bg-brand-50 hover:text-brand-600 font-medium"
                  >
                    <Package size={16} /> {t("nav.myOrders")}
                  </Link>
                  <Link
                    href="/account"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 py-2 px-3 rounded-lg text-gray-700 hover:bg-brand-50 hover:text-brand-600 font-medium"
                  >
                    <Gift size={16} /> {t("nav.myReferrals")}
                  </Link>
                  <Link
                    href="/help"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 py-2 px-3 rounded-lg text-gray-700 hover:bg-brand-50 hover:text-brand-600 font-medium"
                  >
                    <HelpCircle size={16} /> {t("nav.helpCenter")}
                  </Link>
                  <Link
                    href="/contact"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 py-2 px-3 rounded-lg text-gray-700 hover:bg-brand-50 hover:text-brand-600 font-medium"
                  >
                    <MapPin size={16} /> {t("nav.contactUs")}
                  </Link>
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-2 py-2 px-3 rounded-lg text-red-500 hover:bg-red-50 font-medium"
                  >
                    <LogOut size={16} /> {t("nav.logOut")}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 py-2 px-3 rounded-lg text-gray-700 hover:bg-brand-50 hover:text-brand-600 font-medium"
                  >
                    <LogIn size={16} /> {t("nav.login")}
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 py-2 px-3 rounded-lg text-gray-700 hover:bg-brand-50 hover:text-brand-600 font-medium"
                  >
                    <UserPlus size={16} /> {t("nav.register")}
                  </Link>
                  <Link
                    href="/help"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 py-2 px-3 rounded-lg text-gray-700 hover:bg-brand-50 hover:text-brand-600 font-medium"
                  >
                    <HelpCircle size={16} /> {t("nav.helpCenter")}
                  </Link>
                  <Link
                    href="/contact"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 py-2 px-3 rounded-lg text-gray-700 hover:bg-brand-50 hover:text-brand-600 font-medium"
                  >
                    <MapPin size={16} /> {t("nav.contactUs")}
                  </Link>
                </>
              )}
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center gap-3">
              <button
                onClick={() => {
                  setLanguage(language === "en" ? "fr" : "en");
                  setMobileOpen(false);
                }}
                className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-brand-600"
              >
                <Globe size={16} />
                {language === "en" ? t("nav.switchToFrench") : t("nav.switchToEnglish")}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
