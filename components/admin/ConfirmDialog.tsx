"use client";

import { useAdminColors } from "@/lib/useAdminColors";
import { AlertTriangle, X } from "lucide-react";
import clsx from "clsx";

export interface ConfirmState {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
}

interface Props {
  state: ConfirmState | null;
  onCancel: () => void;
}

export default function ConfirmDialog({ state, onCancel }: Props) {
  const c = useAdminColors();
  if (!state) return null;

  const {
    title,
    message,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    destructive = true,
    onConfirm,
  } = state;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onCancel}
      />
      <div
        className={clsx(
          "relative w-full max-w-sm rounded-2xl border p-6 shadow-2xl animate-fade-in",
          c.card
        )}
      >
        <button
          onClick={onCancel}
          className={clsx(
            "absolute top-4 right-4 transition-colors",
            c.textMuted,
            "hover:text-red-500"
          )}
        >
          <X size={16} />
        </button>

        <div
          className={clsx(
            "w-11 h-11 rounded-full flex items-center justify-center mb-4",
            destructive
              ? "bg-red-500/10 text-red-500"
              : "bg-amber-500/10 text-amber-500"
          )}
        >
          <AlertTriangle size={20} />
        </div>

        <h3 className={clsx("font-semibold text-base mb-1.5", c.textPrimary)}>
          {title}
        </h3>
        <p className={clsx("text-sm mb-6 leading-relaxed", c.textSecondary)}>
          {message}
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className={clsx(
              "flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors",
              c.btnGhost
            )}
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => {
              onConfirm();
            }}
            className={clsx(
              "flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors",
              destructive
                ? "bg-red-500 hover:bg-red-600"
                : "bg-brand-500 hover:bg-brand-600"
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
