"use client";

import { useAdminColors } from "@/lib/useAdminColors";
import { Users } from "lucide-react";
import clsx from "clsx";

interface Props {
  title: string;
  message: string | null;
  onClose: () => void;
}

/** Single-button "heads up" popup — used for the packaging-race conflict message, where a plain inline banner is easy to miss. */
export default function AlertDialog({ title, message, onClose }: Props) {
  const c = useAdminColors();
  if (!message) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className={clsx("relative w-full max-w-sm rounded-2xl border p-6 shadow-2xl animate-fade-in", c.card)}>
        <div className="w-11 h-11 rounded-full flex items-center justify-center mb-4 bg-amber-500/10 text-amber-500">
          <Users size={20} />
        </div>
        <h3 className={clsx("font-semibold text-base mb-1.5", c.textPrimary)}>{title}</h3>
        <p className={clsx("text-sm mb-5 leading-relaxed", c.textSecondary)}>{message}</p>
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 transition-colors"
        >
          OK
        </button>
      </div>
    </div>
  );
}
