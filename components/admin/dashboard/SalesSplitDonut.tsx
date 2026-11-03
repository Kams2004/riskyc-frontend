"use client";

import clsx from "clsx";

/**
 * Online vs POS share of revenue over the same window as the comparison
 * chart above it — same two-color categorical pair, identity carried by a
 * legend (never color alone), direct percentage labels since there are only
 * two slices.
 */
export default function SalesSplitDonut({
  online,
  pos,
  isDark,
}: {
  online: number;
  pos: number;
  isDark: boolean;
}) {
  const total = online + pos;
  const onlinePct = total > 0 ? Math.round((online / total) * 100) : 0;
  const posPct = 100 - onlinePct;

  const posColor = "#ff1a5e";
  const onlineColor = isDark ? "#9f75ff" : "#7c3aed";
  const trackColor = isDark ? "#374151" : "#e5e7eb";

  const r = 54;
  const circumference = 2 * Math.PI * r;
  const onlineLen = total > 0 ? (online / total) * circumference : 0;
  const gap = total > 0 ? 2 : 0; // 2px-equivalent surface gap between the two arcs

  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 140 140" width={140} height={140} role="img" aria-label="Online vs POS share of sales">
        <circle cx={70} cy={70} r={r} fill="none" stroke={trackColor} strokeWidth={16} />
        {total > 0 && (
          <>
            <circle
              cx={70}
              cy={70}
              r={r}
              fill="none"
              stroke={onlineColor}
              strokeWidth={16}
              strokeDasharray={`${Math.max(0, onlineLen - gap)} ${circumference}`}
              strokeLinecap="round"
              transform="rotate(-90 70 70)"
            />
            <circle
              cx={70}
              cy={70}
              r={r}
              fill="none"
              stroke={posColor}
              strokeWidth={16}
              strokeDasharray={`${Math.max(0, circumference - onlineLen - gap)} ${circumference}`}
              strokeDashoffset={-(onlineLen + gap)}
              strokeLinecap="round"
              transform="rotate(-90 70 70)"
            />
          </>
        )}
        <text x={70} y={66} textAnchor="middle" fontSize={22} fontWeight={700} fill={isDark ? "#fff" : "#111827"}>
          {onlinePct}%
        </text>
        <text x={70} y={84} textAnchor="middle" fontSize={10} fill={isDark ? "#9ca3af" : "#6b7280"}>
          Online
        </text>
      </svg>

      <div className="space-y-2.5">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: onlineColor }} />
          <span className={clsx("text-xs", isDark ? "text-gray-300" : "text-gray-600")}>Online</span>
          <span className={clsx("text-xs font-bold tabular-nums ml-auto", isDark ? "text-white" : "text-gray-900")}>{onlinePct}%</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: posColor }} />
          <span className={clsx("text-xs", isDark ? "text-gray-300" : "text-gray-600")}>POS (till)</span>
          <span className={clsx("text-xs font-bold tabular-nums ml-auto", isDark ? "text-white" : "text-gray-900")}>{posPct}%</span>
        </div>
      </div>
    </div>
  );
}
