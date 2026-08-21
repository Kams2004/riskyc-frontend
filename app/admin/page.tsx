"use client";

import AdminShell from "@/components/admin/AdminShell";
import { useAdminStore } from "@/lib/adminStore";
import { useAdminColors } from "@/lib/useAdminColors";
import { useCategories } from "@/lib/useCategories";
import * as ordersApi from "@/lib/api/orders";
import * as conversationsApi from "@/lib/api/conversations";
import * as productsApi from "@/lib/api/products";
import { formatPrice } from "@/lib/data";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ShoppingBag, Package, TrendingUp, Clock,
  CheckCircle2, Eye, MessageSquare, AlertCircle, ArrowRight,
} from "lucide-react";
import clsx from "clsx";
import { Order, OrderStatus, Conversation } from "@/lib/types";

const statusLabels: Record<OrderStatus, string> = {
  PENDING: "Pending",
  AWAITING_PAYMENT: "Awaiting Payment",
  REVIEWING: "Under Review",
  VALIDATED: "Validated",
  PACKAGING: "Packaging",
  PACKAGED: "Packaged",
  CANCELLED: "Cancelled",
};

export default function AdminDashboardPage() {
  const token = useAdminStore((s) => s.session?.token);
  const { categories } = useCategories();
  const c = useAdminColors();

  const [orders, setOrders] = useState<Order[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [productCount, setProductCount] = useState(0);

  useEffect(() => {
    if (!token) return;
    ordersApi.listOrders(token).then(setOrders).catch(() => {});
    conversationsApi.listConversations(token).then(setConversations).catch(() => {});
    productsApi.listAdminProducts(token).then((p) => setProductCount(p.length)).catch(() => {});
  }, [token]);

  const totalRevenue = orders.filter((o) => o.status === "VALIDATED").reduce((s, o) => s + o.total, 0);
  const pending = orders.filter((o) => o.status === "REVIEWING").length;
  const validated = orders.filter((o) => o.status === "VALIDATED").length;
  const totalUnread = conversations.reduce((s, cv) => s + cv.unread, 0);

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  const stats = [
    { label: "Total Revenue", value: formatPrice(totalRevenue), icon: TrendingUp, color: "from-brand-500 to-brand-700", sub: `${validated} validated order${validated !== 1 ? "s" : ""}` },
    { label: "Total Orders", value: orders.length, icon: ShoppingBag, color: "from-blue-500 to-blue-700", sub: `${pending} awaiting review` },
    { label: "Products", value: productCount, icon: Package, color: "from-purple-500 to-purple-700", sub: `${categories.length} categories` },
    { label: "Chat", value: conversations.length, icon: MessageSquare, color: "from-emerald-500 to-emerald-700", sub: `${totalUnread} unread` },
  ];

  return (
    <AdminShell>
      <div className="p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className={clsx("text-2xl font-bold", c.textPrimary)}>Dashboard</h1>
            <p className={clsx("text-sm mt-0.5", c.textSecondary)}>Welcome back, Admin 👋</p>
          </div>
          <div className={clsx("text-xs px-3 py-1.5 rounded-full border", c.dateBadge)}>
            {new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
          </div>
        </div>

        {/* Alert */}
        {pending > 0 && (
          <div className="flex items-center gap-3 bg-orange-500/10 border border-orange-500/20 rounded-2xl px-5 py-3">
            <AlertCircle size={18} className="text-orange-400 flex-shrink-0" />
            <p className="text-orange-500 text-sm font-medium">
              {pending} order{pending !== 1 ? "s" : ""} awaiting your validation — payment screenshot uploaded.
            </p>
            <Link href="/admin/orders" className="ml-auto flex items-center gap-1 text-orange-500 hover:text-orange-600 text-xs font-semibold whitespace-nowrap">
              Review <ArrowRight size={12} />
            </Link>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className={clsx("rounded-2xl border p-5 transition-colors", c.card)}>
              <div className={clsx("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center mb-4 shadow-sm", s.color)}>
                <s.icon size={18} className="text-white" />
              </div>
              <div className={clsx("text-2xl font-bold mb-0.5", c.textPrimary)}>{s.value}</div>
              <div className={clsx("text-xs font-semibold", c.textLabel)}>{s.label}</div>
              <div className={clsx("text-xs mt-1", c.textMuted)}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent orders */}
          <div className={clsx("lg:col-span-2 rounded-2xl border p-5", c.card)}>
            <div className="flex items-center justify-between mb-5">
              <h2 className={clsx("font-semibold", c.sectionHeader)}>Recent Orders</h2>
              <Link href="/admin/orders" className="text-xs text-brand-500 hover:text-brand-600 flex items-center gap-1">
                View all <ArrowRight size={12} />
              </Link>
            </div>
            {recentOrders.length === 0 ? (
              <div className={clsx("text-center py-10 text-sm", c.textMuted)}>No orders yet</div>
            ) : (
              <div className="space-y-2">
                {recentOrders.map((order) => {
                  const totalQty = order.items.reduce((s, i) => s + i.quantity, 0);
                  const itemNames = order.items.map((i) => i.productName).join(", ");
                  return (
                    <div key={order.id} className={clsx("flex items-center gap-4 p-3 rounded-xl transition-colors", c.innerCard, c.innerCardHover)}>
                      {/* Icon avatar instead of product images */}
                      <div className={clsx("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0", c.isDark ? "bg-gray-700" : "bg-gray-100")}>
                        <ShoppingBag size={16} className="text-brand-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={clsx("text-sm font-mono font-semibold truncate", c.mono)}>{order.id}</p>
                        <p className={clsx("text-xs truncate", c.textMuted)} title={itemNames}>
                          {totalQty} unit{totalQty !== 1 ? "s" : ""} · {new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className={clsx("text-sm font-bold tabular-nums", c.amount)}>{formatPrice(order.total)}</div>
                        <span className={clsx("text-xs font-medium px-2 py-0.5 rounded-full", c.status[order.status])}>
                          {statusLabels[order.status]}
                        </span>
                      </div>
                      <Link href={`/admin/orders/${order.id}`} className={clsx("transition-colors flex-shrink-0", c.textMuted, "hover:text-brand-500")}>
                        <Eye size={16} />
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* Quick actions */}
            <div className={clsx("rounded-2xl border p-5", c.card)}>
              <h2 className={clsx("font-semibold mb-4", c.sectionHeader)}>Quick Actions</h2>
              <div className="space-y-1">
                {[
                  { href: "/admin/orders", icon: Clock, label: "Review Orders", color: "text-orange-500", count: pending },
                  { href: "/admin/products/new", icon: Package, label: "Add Product", color: "text-purple-500" },
                  { href: "/admin/chat", icon: MessageSquare, label: "Customer Chat", color: "text-emerald-500", count: totalUnread },
                ].map((a) => (
                  <Link key={a.href} href={a.href} className={clsx("flex items-center gap-3 p-3 rounded-xl transition-all group", c.quickAction)}>
                    <a.icon size={18} className={a.color} />
                    <span className={clsx("text-sm flex-1 transition-colors", c.textSecondary, "group-hover:" + (c.isDark ? "text-white" : "text-gray-900"))}>
                      {a.label}
                    </span>
                    {a.count !== undefined && a.count > 0 && (
                      <span className="text-xs bg-brand-500 text-white font-bold w-5 h-5 rounded-full flex items-center justify-center">{a.count}</span>
                    )}
                    <ArrowRight size={14} className={c.textMuted} />
                  </Link>
                ))}
              </div>
            </div>

            {/* Order status */}
            <div className={clsx("rounded-2xl border p-5", c.card)}>
              <h2 className={clsx("font-semibold mb-4", c.sectionHeader)}>Order Status</h2>
              <div className="space-y-2.5">
                {(["PENDING", "AWAITING_PAYMENT", "REVIEWING", "VALIDATED", "CANCELLED"] as OrderStatus[]).map((s) => {
                  const count = orders.filter((o) => o.status === s).length;
                  return (
                    <div key={s} className="flex items-center justify-between">
                      <span className={clsx("text-xs font-medium px-2.5 py-1 rounded-full", c.status[s])}>{statusLabels[s]}</span>
                      <span className={clsx("text-sm font-bold tabular-nums", c.textPrimary)}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Revenue banner */}
        {validated > 0 && (
          <div className="bg-gradient-to-br from-brand-500/15 to-brand-600/5 border border-brand-500/20 rounded-2xl p-6 flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-brand-500/15 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 size={28} className="text-brand-500" />
            </div>
            <div>
              <p className={clsx("text-sm", c.textSecondary)}>Total Confirmed Revenue</p>
              <p className={clsx("text-3xl font-bold mt-0.5", c.textPrimary)}>{formatPrice(totalRevenue)}</p>
              <p className={clsx("text-xs mt-1", c.textMuted)}>From {validated} validated order{validated !== 1 ? "s" : ""}</p>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
