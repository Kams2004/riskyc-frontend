"use client";

import { useState } from "react";
import clsx from "clsx";
import { formatPrice } from "@/lib/data";

export interface DayPoint {
  label: string;
  date: Date;
  online: number;
  pos: number;
}

const WIDTH = 640;
const HEIGHT = 220;
const PAD_LEFT = 44;
const PAD_RIGHT = 12;
const PAD_TOP = 12;
const PAD_BOTTOM = 28;

function buildPath(points: { x: number; y: number }[]) {
  return points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
}

/**
 * Online-vs-POS revenue over the last 7 days — a single shared axis (never
 * dual-axis), two categorical series with a legend (color-validated pair,
 * see dataviz skill), thin 2px lines, and a hover crosshair + tooltip.
 */
export default function SalesComparisonChart({ data, isDark }: { data: DayPoint[]; isDark: boolean }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const posColor = "#ff1a5e";
  const onlineColor = isDark ? "#9f75ff" : "#7c3aed";
  const gridColor = isDark ? "#374151" : "#e5e7eb";
  const axisTextColor = isDark ? "#9ca3af" : "#9ca3af";

  const maxVal = Math.max(1, ...data.map((d) => Math.max(d.online, d.pos)));
  const niceMax = Math.ceil(maxVal / 5) * 5 || 1;

  const innerW = WIDTH - PAD_LEFT - PAD_RIGHT;
  const innerH = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const xFor = (i: number) => PAD_LEFT + (data.length <= 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
  const yFor = (v: number) => PAD_TOP + innerH - (v / niceMax) * innerH;

  const onlinePoints = data.map((d, i) => ({ x: xFor(i), y: yFor(d.online) }));
  const posPoints = data.map((d, i) => ({ x: xFor(i), y: yFor(d.pos) }));

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(niceMax * f));

  const hovered = hoverIdx !== null ? data[hoverIdx] : null;

  return (
    <div>
      {/* Legend */}
      <div className="flex items-center gap-4 mb-2">
        <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: onlineColor }}>
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: onlineColor }} /> Online
        </span>
        <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: posColor }}>
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: posColor }} /> POS
        </span>
      </div>

      <div className="relative">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-auto" role="img" aria-label="Online vs POS sales, last 7 days">
          {/* Gridlines + y labels */}
          {ticks.map((t) => {
            const y = yFor(t);
            return (
              <g key={t}>
                <line x1={PAD_LEFT} x2={WIDTH - PAD_RIGHT} y1={y} y2={y} stroke={gridColor} strokeWidth={1} />
                <text x={PAD_LEFT - 8} y={y + 3} textAnchor="end" fontSize={9} fill={axisTextColor}>
                  {t >= 1000 ? `${Math.round(t / 1000)}k` : t}
                </text>
              </g>
            );
          })}

          {/* X labels */}
          {data.map((d, i) => (
            <text key={d.label} x={xFor(i)} y={HEIGHT - 8} textAnchor="middle" fontSize={9} fill={axisTextColor}>
              {d.label}
            </text>
          ))}

          {/* Lines */}
          <path d={buildPath(onlinePoints)} fill="none" stroke={onlineColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          <path d={buildPath(posPoints)} fill="none" stroke={posColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

          {/* Data-end markers */}
          {onlinePoints.map((p, i) => (
            <circle key={`o${i}`} cx={p.x} cy={p.y} r={hoverIdx === i ? 4 : 2.5} fill={onlineColor} stroke={isDark ? "#1f2937" : "#fff"} strokeWidth={1.5} />
          ))}
          {posPoints.map((p, i) => (
            <circle key={`p${i}`} cx={p.x} cy={p.y} r={hoverIdx === i ? 4 : 2.5} fill={posColor} stroke={isDark ? "#1f2937" : "#fff"} strokeWidth={1.5} />
          ))}

          {/* Hover crosshair */}
          {hoverIdx !== null && (
            <line x1={xFor(hoverIdx)} x2={xFor(hoverIdx)} y1={PAD_TOP} y2={PAD_TOP + innerH} stroke={gridColor} strokeWidth={1} strokeDasharray="3,3" />
          )}

          {/* Hover hit targets */}
          {data.map((d, i) => (
            <rect
              key={d.label}
              x={xFor(i) - innerW / data.length / 2}
              y={PAD_TOP}
              width={innerW / data.length}
              height={innerH}
              fill="transparent"
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx((cur) => (cur === i ? null : cur))}
            />
          ))}
        </svg>

        {hovered && hoverIdx !== null && (
          <div
            className={clsx(
              "absolute top-2 -translate-x-1/2 rounded-lg px-3 py-2 text-xs shadow-lg pointer-events-none",
              isDark ? "bg-gray-900 text-white border border-gray-700" : "bg-white text-gray-900 border border-gray-200"
            )}
            style={{ left: `${(xFor(hoverIdx) / WIDTH) * 100}%` }}
          >
            <p className="font-semibold mb-1">{hovered.date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}</p>
            <p style={{ color: onlineColor }}>Online: {formatPrice(hovered.online)}</p>
            <p style={{ color: posColor }}>POS: {formatPrice(hovered.pos)}</p>
          </div>
        )}
      </div>
    </div>
  );
}
