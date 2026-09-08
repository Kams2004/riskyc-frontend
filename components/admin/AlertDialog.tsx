"use client";

import { useAdminColors } from "@/lib/useAdminColors";
import { Users, CheckCircle2 } from "lucide-react";
import clsx from "clsx";

interface Props {
  title: string;
  message: string | null;
  onClose: () => void;
  variant?: "warning" | "success";
}

/** Single-button popup — "heads up" (amber) for things like the packaging-race conflict message, or "success" (green) for a confirmed action — either way, easier to miss as just an inline banner. */
export default function AlertDialog({ title, message, onClose, variant = "warning" }: Props) {
  const c = useAdminColors();
  if (!message) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className={clsx("relative w-full max-w-sm rounded-2xl border p-6 shadow-2xl animate-fade-in", c.card)}>
        <div
          className={clsx(
            "w-11 h-11 rounded-full flex items-center justify-center mb-4",
            variant === "success" ? "bg-green-500/10 text-green-500" : "bg-amber-500/10 text-amber-500"
          )}
        >
          {variant === "success" ? <CheckCircle2 size={20} /> : <Users size={20} />}
        </div>
        <h3 className={clsx("font-semibold text-base mb-1.5", c.textPrimary)}>{title}</h3>
        <p className={clsx("text-sm mb-5 leading-relaxed", c.textSecondary)}>{message}</p>
        <button
          onClick={onClose}
          className={clsx(
            "w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-colors",
            variant === "success" ? "bg-green-500 hover:bg-green-600" : "bg-brand-500 hover:bg-brand-600"
          )}
        >
          OK
        </button>
      </div>
    </div>
  );
}
