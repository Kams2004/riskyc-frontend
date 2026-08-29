import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Layers,
  UserRound,
  Users,
  MessageSquare,
  PackageCheck,
  LucideIcon,
} from "lucide-react";
import { Permission } from "./types";

export interface AdminNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  permission: Permission;
}

// Single source of truth for both the sidebar (which links to show) and
// AdminShell (which pages a logged-in admin is allowed to view) — so the
// two never drift out of sync.
export const adminNavItems: AdminNavItem[] = [
  { href: "/admin",            label: "Dashboard",  icon: LayoutDashboard, exact: true, permission: "VIEW_DASHBOARD" },
  { href: "/admin/orders",     label: "Orders",     icon: ShoppingBag,     permission: "VIEW_ORDERS" },
  { href: "/admin/treatment",  label: "Treatment",  icon: PackageCheck,    permission: "VIEW_TREATMENT" },
  { href: "/admin/products",   label: "Products",   icon: Package,         permission: "VIEW_PRODUCTS" },
  { href: "/admin/categories", label: "Categories", icon: Layers,          permission: "VIEW_CATEGORIES" },
  { href: "/admin/customers",  label: "Customers",  icon: UserRound,       permission: "VIEW_CUSTOMERS" },
  { href: "/admin/users",      label: "Users",      icon: Users,           permission: "VIEW_USERS" },
  { href: "/admin/chat",       label: "Chat",       icon: MessageSquare,   permission: "VIEW_CHAT" },
];

/** Resolves which permission a given /admin/... path requires, if any. */
export function permissionForPath(pathname: string): Permission | null {
  const matches = adminNavItems.filter((item) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href)
  );
  if (matches.length === 0) return null;
  // Prefer the most specific (longest) href match.
  return matches.sort((a, b) => b.href.length - a.href.length)[0].permission;
}
