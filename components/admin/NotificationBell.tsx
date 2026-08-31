"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAdminStore } from "@/lib/adminStore";
import { useAdminNotificationSocket } from "@/lib/chatSocket";
import { listAdminNotifications, markNotificationRead } from "@/lib/api/notifications";
import { AppNotification, NotificationType } from "@/lib/types";
import { Bell, ShoppingBag, MessageSquare, CreditCard, RefreshCcw } from "lucide-react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import clsx from "clsx";

const ICONS: Record<NotificationType, React.ReactNode> = {
  NEW_ORDER: <ShoppingBag size={14} />,
  NEW_MESSAGE: <MessageSquare size={14} />,
  PAYMENT_PROOF_UPLOADED: <CreditCard size={14} />,
  ORDER_STATUS_CHANGED: <RefreshCcw size={14} />,
};

/** Where clicking a notification should take the admin — the whole point being "click it, land on the right page" instead of a dead badge count. */
function targetFor(n: AppNotification): string | null {
  switch (n.type) {
    case "NEW_ORDER":
    case "PAYMENT_PROOF_UPLOADED":
    case "ORDER_STATUS_CHANGED":
      return n.referenceId ? `/admin/orders/${n.referenceId}` : "/admin/orders";
    case "NEW_MESSAGE":
      return "/admin/chat";
    default:
      return null;
  }
}

function timeAgo(iso: string, t: (path: string, vars?: Record<string, string | number>) => string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return t("adminCommon.notifications.justNow");
  if (diff < 3600) return t("adminCommon.notifications.minutesAgo", { count: Math.floor(diff / 60) });
  if (diff < 86400) return t("adminCommon.notifications.hoursAgo", { count: Math.floor(diff / 3600) });
  return t("adminCommon.notifications.daysAgo", { count: Math.floor(diff / 86400) });
}

export default function NotificationBell() {
  const router = useRouter();
  const { t } = useTranslation();
  const token = useAdminStore((s) => s.session?.token);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(() => {
    if (!token) return;
    listAdminNotifications(token).then(setNotifications).catch(() => {});
  }, [token]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useAdminNotificationSocket((n) => {
    setNotifications((prev) => (prev.some((p) => p.id === n.id) ? prev : [n, ...prev]));
  });

  useEffect(() => {
    if (!open) return;
    const onOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleClick = async (n: AppNotification) => {
    setOpen(false);
    if (!n.read && token) {
      markNotificationRead(n.id, token).catch(() => {});
      setNotifications((prev) => prev.map((p) => (p.id === n.id ? { ...p, read: true } : p)));
    }
    const target = targetFor(n);
    if (target) router.push(target);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-300 hover:text-white transition-colors flex-shrink-0"
        title={t("adminCommon.notifications.tooltip")}
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-brand-500 text-white text-[9px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-3 top-16 sm:absolute sm:inset-x-auto sm:top-full sm:right-0 sm:left-auto sm:mt-2 w-auto sm:w-80 max-w-full sm:max-w-[90vw] bg-gray-900 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in">
          <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
            <p className="text-sm font-semibold text-white">{t("adminCommon.notifications.title")}</p>
            {unreadCount > 0 && (
              <span className="text-[11px] text-brand-300">
                {t("adminCommon.notifications.unread", { count: unreadCount })}
              </span>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-center text-xs text-gray-500 py-8">{t("adminCommon.notifications.empty")}</p>
            ) : (
              notifications.slice(0, 30).map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={clsx(
                    "w-full flex items-start gap-3 px-4 py-3 text-left border-b border-white/5 last:border-0 transition-colors hover:bg-white/5",
                    !n.read && "bg-brand-500/10"
                  )}
                >
                  <span
                    className={clsx(
                      "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
                      !n.read ? "bg-brand-500 text-white" : "bg-white/10 text-gray-400"
                    )}
                  >
                    {ICONS[n.type]}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className={clsx("block text-xs leading-relaxed", !n.read ? "text-white font-medium" : "text-gray-400")}>
                      {n.message}
                    </span>
                    <span className="block text-[10px] text-gray-500 mt-0.5">{timeAgo(n.createdAt, t)}</span>
                  </span>
                  {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-brand-400 flex-shrink-0 mt-1.5" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
