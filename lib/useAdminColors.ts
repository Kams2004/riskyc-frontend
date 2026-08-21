import { useAdminTheme } from "./adminTheme";

export function useAdminColors() {
  const { theme } = useAdminTheme();
  const d = theme === "dark";

  return {
    isDark: d,
    // Page background
    pageBg: d ? "bg-gray-900" : "bg-slate-50",
    // Card / panel
    card: d
      ? "bg-gray-800/60 border-gray-700/50"
      : "bg-white border-gray-200 shadow-sm",
    cardHover: d ? "hover:bg-gray-700/60" : "hover:bg-gray-50",
    // Inner card (nested)
    innerCard: d ? "bg-gray-900/50" : "bg-gray-50",
    innerCardHover: d ? "hover:bg-gray-900" : "hover:bg-gray-100",
    // Table row hover
    rowHover: d ? "hover:bg-gray-700/20" : "hover:bg-slate-50",
    // Dividers
    divide: d ? "divide-gray-700/30" : "divide-gray-100",
    border: d ? "border-gray-700/50" : "border-gray-200",
    borderStrong: d ? "border-gray-700" : "border-gray-300",
    // Text
    textPrimary: d ? "text-white" : "text-gray-900",
    textSecondary: d ? "text-gray-400" : "text-gray-500",
    textMuted: d ? "text-gray-500" : "text-gray-400",
    textLabel: d ? "text-gray-300" : "text-gray-700",
    // Header/top bar
    topBar: d ? "bg-gray-950 border-gray-800" : "bg-white border-gray-200",
    // Input
    input: d
      ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-brand-500"
      : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-brand-400",
    inputBg: d ? "bg-gray-800" : "bg-white",
    // Filter button inactive
    filterInactive: d
      ? "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
      : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900",
    // Status colors — semantic, look good in both modes
    status: {
      PENDING: d
        ? "text-gray-400 bg-gray-700"
        : "text-gray-600 bg-gray-100",
      AWAITING_PAYMENT: d
        ? "text-orange-400 bg-orange-900/30 border border-orange-500/20"
        : "text-orange-600 bg-orange-50 border border-orange-200",
      REVIEWING: d
        ? "text-blue-400 bg-blue-900/30 border border-blue-500/20"
        : "text-blue-600 bg-blue-50 border border-blue-200",
      VALIDATED: d
        ? "text-green-400 bg-green-900/30 border border-green-500/20"
        : "text-green-700 bg-green-50 border border-green-200",
      PACKAGING: d
        ? "text-purple-400 bg-purple-900/30 border border-purple-500/20"
        : "text-purple-600 bg-purple-50 border border-purple-200",
      PACKAGED: d
        ? "text-teal-400 bg-teal-900/30 border border-teal-500/20"
        : "text-teal-600 bg-teal-50 border border-teal-200",
      CANCELLED: d
        ? "text-red-400 bg-red-900/30 border border-red-500/20"
        : "text-red-600 bg-red-50 border border-red-200",
    } as Record<"PENDING" | "AWAITING_PAYMENT" | "REVIEWING" | "VALIDATED" | "PACKAGING" | "PACKAGED" | "CANCELLED", string>,
    // Action buttons
    btnGhost: d
      ? "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white"
      : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900",
    // Payment badge
    paymentBadge: d
      ? "bg-gray-700 text-gray-300"
      : "bg-gray-100 text-gray-700 border border-gray-200",
    // Quick action link hover
    quickAction: d
      ? "hover:bg-gray-700/50"
      : "hover:bg-gray-50 hover:border-gray-200 border border-transparent",
    // Date badge
    dateBadge: d
      ? "bg-gray-800 text-gray-500"
      : "bg-white border border-gray-200 text-gray-500 shadow-sm",
    // Section header text
    sectionHeader: d ? "text-white" : "text-gray-800",
    // Mono text (order IDs)
    mono: d ? "text-gray-300" : "text-gray-700",
    // Amount text
    amount: d ? "text-white" : "text-gray-900",
  };
}
