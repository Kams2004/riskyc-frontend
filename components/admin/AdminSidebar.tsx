"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdminStore } from "@/lib/adminStore";
import { useAdminTheme } from "@/lib/adminTheme";
import { listConversations } from "@/lib/api/conversations";
import { useAdminNotificationSocket } from "@/lib/chatSocket";
import { adminNavItems } from "@/lib/adminNav";
import {
  LogOut,
  ChevronRight,
  Store,
  Sun,
  Moon,
} from "lucide-react";
import clsx from "clsx";

export default function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const session = useAdminStore((s) => s.session);
  const logout = useAdminStore((s) => s.logout);
  const { theme, toggle } = useAdminTheme();
  const [totalUnread, setTotalUnread] = useState(0);
  const isDark = theme === "dark";

  const refreshUnread = useCallback(() => {
    if (!session) return;
    listConversations(session.token)
      .then((convs) => setTotalUnread(convs.reduce((sum, c) => sum + c.unread, 0)))
      .catch(() => {});
  }, [session]);

  useEffect(() => {
    refreshUnread();
  }, [refreshUnread]);

  useAdminNotificationSocket(refreshUnread);

  const visibleNavItems = adminNavItems.filter(
    (item) => session?.permissions.includes(item.permission)
  );

  return (
    <aside className="w-64 min-h-screen flex flex-col flex-shrink-0 bg-gradient-to-b from-[#3d0518] via-gray-950 to-gray-950 text-gray-300 border-r border-brand-900/30 shadow-2xl shadow-black/40">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-900/50 flex-shrink-0">
            <span className="text-white font-bold text-sm">RF</span>
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm leading-tight text-white">
              Riskyc Fashion
            </p>
            <p className="text-xs text-brand-200/60">
              Admin Panel
            </p>
          </div>
        </div>
      </div>

      {/* Current admin */}
      {session && (
        <div className="px-6 py-3 border-b border-white/5">
          <p className="text-sm font-semibold text-white truncate">
            {session.firstName} {session.lastName}
          </p>
          <p className="text-xs text-brand-300/70 truncate">{session.roleName}</p>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visibleNavItems.map(({ href, label, icon: Icon, exact }) => {
          const active = exact
            ? pathname === href
            : pathname.startsWith(href);
          const isChat = href === "/admin/chat";

          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                active
                  ? "bg-gradient-to-r from-brand-500/25 to-brand-500/5 text-white border border-brand-400/30 shadow-inner"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon
                size={18}
                className={clsx(
                  active
                    ? "text-brand-400"
                    : "text-gray-500 group-hover:text-brand-300"
                )}
              />
              <span className="flex-1">{label}</span>

              {/* Unread badge on Chat */}
              {isChat && totalUnread > 0 && (
                <span className="bg-brand-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0">
                  {totalUnread > 9 ? "9+" : totalUnread}
                </span>
              )}

              {active && !isChat && (
                <ChevronRight size={14} className="text-brand-400" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="px-3 py-4 border-t border-white/5 space-y-1 flex-shrink-0">
        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group text-gray-400 hover:bg-white/5 hover:text-white"
        >
          {isDark ? (
            <>
              <Sun size={18} className="text-gold-400" />
              <span>Light Mode</span>
              <span className="ml-auto text-[10px] bg-white/5 text-gray-500 px-2 py-0.5 rounded-full">
                Dark
              </span>
            </>
          ) : (
            <>
              <Moon size={18} className="text-indigo-400" />
              <span>Dark Mode</span>
              <span className="ml-auto text-[10px] bg-white/5 text-gray-500 px-2 py-0.5 rounded-full">
                Light
              </span>
            </>
          )}
        </button>

        {/* View Store */}
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group text-gray-400 hover:bg-white/5 hover:text-white"
        >
          <Store size={18} className="text-gray-500 group-hover:text-brand-300" />
          View Store
        </Link>

        {/* Logout */}
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group text-gray-400 hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut size={18} className="text-gray-500 group-hover:text-red-400" />
          Logout
        </button>
      </div>
    </aside>
  );
}
