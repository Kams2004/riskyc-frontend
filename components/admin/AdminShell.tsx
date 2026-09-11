"use client";

import AdminGuard from "./AdminGuard";
import AdminSidebar from "./AdminSidebar";
import { useAdminTheme } from "@/lib/adminTheme";
import { useAdminStore } from "@/lib/adminStore";
import { permissionForPath } from "@/lib/adminNav";
import { usePathname } from "next/navigation";
import { Menu, X, ShieldAlert } from "lucide-react";
import { useState } from "react";
import clsx from "clsx";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLogin = pathname === "/admin/login";
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme } = useAdminTheme();
  const isDark = theme === "dark";
  const session = useAdminStore((s) => s.session);
  const { t } = useTranslation();

  if (isLogin) return <AdminGuard>{children}</AdminGuard>;

  const requiredPermission = permissionForPath(pathname);
  const requiredPermissions = Array.isArray(requiredPermission)
    ? requiredPermission
    : requiredPermission
      ? [requiredPermission]
      : [];
  const isAllowed =
    requiredPermissions.length === 0 ||
    requiredPermissions.some((p) => session?.permissions.includes(p) ?? false);

  return (
    <AdminGuard>
      {/* Full viewport, no scroll on root */}
      <div
        className={clsx(
          "flex h-screen overflow-hidden transition-colors duration-200",
          isDark ? "bg-gray-900 text-gray-100" : "bg-slate-50 text-gray-900"
        )}
      >
        {/* ── Desktop sidebar — fixed height, no scroll ── */}
        <div className="hidden lg:flex flex-col flex-shrink-0">
          <AdminSidebar />
        </div>

        {/* ── Mobile sidebar overlay ── */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="relative z-10 flex flex-col animate-slide-in-right">
              <AdminSidebar onNavigate={() => setSidebarOpen(false)} />
            </div>
          </div>
        )}

        {/* ── Main content area — this is the only thing that scrolls ── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Mobile top bar */}
          <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-brand-900/30 bg-gradient-to-r from-[#3d0518] via-gray-950 to-gray-950 shadow-md flex-shrink-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
                <span className="text-white font-bold text-xs">RF</span>
              </div>
              <span className="font-semibold text-sm text-white">
                {t("adminCommon.sidebar.panelLabel")}
              </span>
            </div>
          </div>

          {/* Scrollable page content */}
          <main className="flex-1 overflow-y-auto">
            {isAllowed ? (
              children
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 py-24 px-6 text-center">
                <div className={clsx("w-14 h-14 rounded-2xl flex items-center justify-center", isDark ? "bg-red-500/10" : "bg-red-50")}>
                  <ShieldAlert size={26} className="text-red-500" />
                </div>
                <h1 className={clsx("text-lg font-bold", isDark ? "text-white" : "text-gray-900")}>
                  {t("adminCommon.guard.accessRestrictedTitle")}
                </h1>
                <p className={clsx("text-sm max-w-sm", isDark ? "text-gray-400" : "text-gray-500")}>
                  {t("adminCommon.guard.accessRestrictedBody", { role: session?.roleName ?? "" })}
                </p>
              </div>
            )}
          </main>
        </div>
      </div>
    </AdminGuard>
  );
}
