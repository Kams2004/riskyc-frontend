"use client";

import { AlertTriangle } from "lucide-react";
import clsx from "clsx";

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Storefront "are you sure?" popup — mirrors the admin panel's ConfirmDialog, styled for the light customer-facing theme. */
export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-2xl bg-white border border-gray-100 p-6 shadow-2xl animate-fade-in">
        <div
          className={clsx(
            "w-11 h-11 rounded-full flex items-center justify-center mb-4",
            destructive ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500"
          )}
        >
          <AlertTriangle size={20} />
        </div>
        <h3 className="font-semibold text-base mb-1.5 text-gray-900">{title}</h3>
        <p className="text-sm mb-5 leading-relaxed text-gray-500">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={clsx(
              "flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors",
              destructive ? "bg-red-500 hover:bg-red-600" : "bg-brand-500 hover:bg-brand-600"
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
