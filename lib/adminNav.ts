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
  { href: "/admin/treatment",  label: "Packing",  icon: PackageCheck,    permission: "VIEW_TREATMENT" },
  { href: "/admin/products",   label: "Products",   icon: Package,         permission: "VIEW_PRODUCTS" },
  { href: "/admin/categories", label: "Categories", icon: Layers,          permission: "VIEW_CATEGORIES" },
  { href: "/admin/customers",  label: "Customers",  icon: UserRound,       permission: "VIEW_CUSTOMERS" },
  { href: "/admin/users",      label: "Users",      icon: Users,           permission: "VIEW_USERS" },
  { href: "/admin/chat",       label: "Chat",       icon: MessageSquare,   permission: "VIEW_CHAT" },
];

// These sub-routes need the stricter MANAGE_PRODUCTS permission, not just
// the section's own VIEW_PRODUCTS — checked before the general nav-item
// match below so a view-only admin can't reach the create/edit form via a
// direct URL even though the corresponding buttons are already hidden from
// them. Not added to adminNavItems itself since that would also duplicate
// them into the sidebar.
const PRODUCT_EDIT_PATH = /^\/admin\/products\/[^/]+\/edit/;

/** Resolves which permission a given /admin/... path requires, if any. */
export function permissionForPath(pathname: string): Permission | null {
  if (pathname.startsWith("/admin/products/new") || PRODUCT_EDIT_PATH.test(pathname)) {
    return "MANAGE_PRODUCTS";
  }
  const matches = adminNavItems.filter((item) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href)
  );
  if (matches.length === 0) return null;
  // Prefer the most specific (longest) href match.
  return matches.sort((a, b) => b.href.length - a.href.length)[0].permission;
}

/**
 * Where to land an admin right after login. Landing everyone on "/admin"
 * (the dashboard) assumes VIEW_DASHBOARD — a role scoped to just one area
 * (e.g. only "Manage Orders") would otherwise hit the "Access Restricted"
 * screen with an empty sidebar and no way to reach the page they can
 * actually use. Falls back to "/admin" itself if no nav item is reachable
 * (nothing to send them to instead).
 */
export function firstAccessibleHref(permissions: Permission[]): string {
  // A role scoped mainly to packing (can see Packing but not the general
  // Orders list) is better served landing directly on it than on the
  // Dashboard overview — that overview's aggregate stats aren't very
  // actionable for someone whose whole job is packing, even if Dashboard
  // also happens to be granted on their role.
  if (permissions.includes("VIEW_TREATMENT") && !permissions.includes("VIEW_ORDERS")) {
    return "/admin/treatment";
  }
  const first = adminNavItems.find((item) => permissions.includes(item.permission));
  return first?.href ?? "/admin";
}
