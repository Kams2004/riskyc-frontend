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
} from "@/components/icons/fa";
import { useStore } from "@/lib/store";
import { useCategories } from "@/lib/useCategories";
import { FaIconPreview } from "@/components/admin/FaIconPicker";
import DownloadAppButton from "@/components/shared/DownloadAppButton";
import { Customer } from "@/lib/types";
import clsx from "clsx";

// Keeps the desktop nav row from growing unbounded as categories are added —
// anything past this count moves into the "More" dropdown instead.
const MAX_NAV_CATEGORIES = 5;

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { getCartCount, language, setLanguage, items, customer, logoutCustomer } = useStore();
  const { categories } = useCategories();
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
        ✨ Free delivery on orders above 50,000 XAF &nbsp;|&nbsp; Pay with no extra charges via Orange Money or Mobile Money
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
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

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            <Link
              href="/"
              className={clsx(
                "px-4 py-2 rounded-lg font-medium text-sm transition-colors",
                pathname === "/"
                  ? "text-brand-600 bg-brand-50"
                  : "text-gray-600 hover:text-brand-600 hover:bg-gray-50"
              )}
            >
              Home
            </Link>

            {visibleCategories.map((cat) => (
              <div
                key={cat.id}
                className="relative"
                onMouseEnter={() => setActiveDropdown(cat.slug)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <Link
                  href={`/category/${cat.slug}`}
                  className={clsx(
                    "flex items-center gap-1 px-4 py-2 rounded-lg font-medium text-sm transition-colors",
                    pathname.startsWith(`/category/${cat.slug}`)
                      ? "text-brand-600 bg-brand-50"
                      : "text-gray-600 hover:text-brand-600 hover:bg-gray-50"
                  )}
                >
                  <span className="flex items-center"><FaIconPreview value={cat.icon ?? "fa:solid:tag"} size={14} /></span>
                  {cat.name}
                  <ChevronDown
                    size={14}
                    className={clsx(
                      "transition-transform duration-200",
                      activeDropdown === cat.slug ? "rotate-180" : ""
                    )}
                  />
                </Link>

                {/* Dropdown */}
                {activeDropdown === cat.slug && (
                  <div className="absolute top-full left-0 mt-1 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-2 animate-fade-in">
                    {cat.subcategories.map((sub) => (
                      <Link
                        key={sub.id}
                        href={`/category/${cat.slug}/${sub.slug}`}
                        className="block px-4 py-2 text-sm text-gray-600 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {overflowCategories.length > 0 && (
              <div
                className="relative"
                onMouseEnter={() => setActiveDropdown("__more")}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button
                  className={clsx(
                    "flex items-center gap-1 px-4 py-2 rounded-lg font-medium text-sm transition-colors",
                    "text-gray-600 hover:text-brand-600 hover:bg-gray-50"
                  )}
                >
                  More
                  <ChevronDown
                    size={14}
                    className={clsx(
                      "transition-transform duration-200",
                      activeDropdown === "__more" ? "rotate-180" : ""
                    )}
                  />
                </button>

                {activeDropdown === "__more" && (
                  <div className="absolute top-full left-0 mt-1 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-2 animate-fade-in">
                    {overflowCategories.map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/category/${cat.slug}`}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                      >
                        <FaIconPreview value={cat.icon ?? "fa:solid:tag"} size={13} />
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            <Link
              href="/products"
              className={clsx(
                "px-4 py-2 rounded-lg font-medium text-sm transition-colors",
                pathname === "/products"
                  ? "text-brand-600 bg-brand-50"
                  : "text-gray-600 hover:text-brand-600 hover:bg-gray-50"
              )}
            >
              All Products
            </Link>
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative hidden sm:block">
              {searchOpen ? (
                <div className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2 animate-slide-in-right">
                  <Search size={16} className="text-gray-400" />
                  <input
                    autoFocus
                    type="text"
                    placeholder="Search products..."
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

            {/* Language toggle */}
            <button
              onClick={() => setLanguage(language === "en" ? "fr" : "en")}
              className="hidden sm:flex items-center gap-1 btn-ghost px-3 py-2 rounded-full text-sm font-medium"
              title="Toggle language"
            >
              <Globe size={16} />
              <span>{language.toUpperCase()}</span>
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
              <button className="flex items-center gap-1.5 btn-ghost px-3 py-2 rounded-full text-sm font-medium max-w-[140px]">
                <User size={18} />
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
                      <div className="px-4 py-2 border-b border-gray-100 mb-1">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {currentCustomer.firstName} {currentCustomer.lastName}
                        </p>
                        <p className="text-xs text-gray-400 truncate">{currentCustomer.email}</p>
                      </div>
                      <Link
                        href="/cart?tab=orders"
                        onClick={() => setActiveDropdown(null)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                      >
                        <Package size={15} /> My Orders
                      </Link>
                      <Link
                        href="/help"
                        onClick={() => setActiveDropdown(null)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                      >
                        <HelpCircle size={15} /> Help Center
                      </Link>
                      <Link
                        href="/contact"
                        onClick={() => setActiveDropdown(null)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                      >
                        <MapPin size={15} /> Contact Us
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <LogOut size={15} /> Log Out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        onClick={() => setActiveDropdown(null)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                      >
                        <LogIn size={15} /> Login
                      </Link>
                      <Link
                        href="/register"
                        onClick={() => setActiveDropdown(null)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                      >
                        <UserPlus size={15} /> Register
                      </Link>
                      <Link
                        href="/help"
                        onClick={() => setActiveDropdown(null)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                      >
                        <HelpCircle size={15} /> Help Center
                      </Link>
                      <Link
                        href="/contact"
                        onClick={() => setActiveDropdown(null)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                      >
                        <MapPin size={15} /> Contact Us
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
              href="/"
              onClick={() => setMobileOpen(false)}
              className="block py-2 px-3 rounded-lg text-gray-700 hover:bg-brand-50 hover:text-brand-600 font-medium"
            >
              🏠 Home
            </Link>
            <Link
              href="/products"
              onClick={() => setMobileOpen(false)}
              className="block py-2 px-3 rounded-lg text-gray-700 hover:bg-brand-50 hover:text-brand-600 font-medium"
            >
              🛍️ All Products
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
                    <FaIconPreview value={cat.icon ?? "fa:solid:tag"} size={14} /> {cat.name}
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
                      All {cat.name}
                    </Link>
                    {cat.subcategories.map((sub) => (
                      <Link
                        key={sub.id}
                        href={`/category/${cat.slug}/${sub.slug}`}
                        onClick={() => setMobileOpen(false)}
                        className="block py-1.5 px-2 text-sm text-gray-600 hover:text-brand-600 rounded"
                      >
                        {sub.name}
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
                  <div className="px-3 py-2">
                    <p className="text-sm font-semibold text-gray-900">
                      {currentCustomer.firstName} {currentCustomer.lastName}
                    </p>
                    <p className="text-xs text-gray-400">{currentCustomer.email}</p>
                  </div>
                  <Link
                    href="/cart?tab=orders"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 py-2 px-3 rounded-lg text-gray-700 hover:bg-brand-50 hover:text-brand-600 font-medium"
                  >
                    <Package size={16} /> My Orders
                  </Link>
                  <Link
                    href="/help"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 py-2 px-3 rounded-lg text-gray-700 hover:bg-brand-50 hover:text-brand-600 font-medium"
                  >
                    <HelpCircle size={16} /> Help Center
                  </Link>
                  <Link
                    href="/contact"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 py-2 px-3 rounded-lg text-gray-700 hover:bg-brand-50 hover:text-brand-600 font-medium"
                  >
                    <MapPin size={16} /> Contact Us
                  </Link>
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-2 py-2 px-3 rounded-lg text-red-500 hover:bg-red-50 font-medium"
                  >
                    <LogOut size={16} /> Log Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 py-2 px-3 rounded-lg text-gray-700 hover:bg-brand-50 hover:text-brand-600 font-medium"
                  >
                    <LogIn size={16} /> Login
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 py-2 px-3 rounded-lg text-gray-700 hover:bg-brand-50 hover:text-brand-600 font-medium"
                  >
                    <UserPlus size={16} /> Register
                  </Link>
                  <Link
                    href="/help"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 py-2 px-3 rounded-lg text-gray-700 hover:bg-brand-50 hover:text-brand-600 font-medium"
                  >
                    <HelpCircle size={16} /> Help Center
                  </Link>
                  <Link
                    href="/contact"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 py-2 px-3 rounded-lg text-gray-700 hover:bg-brand-50 hover:text-brand-600 font-medium"
                  >
                    <MapPin size={16} /> Contact Us
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
                Switch to {language === "en" ? "Français" : "English"}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
