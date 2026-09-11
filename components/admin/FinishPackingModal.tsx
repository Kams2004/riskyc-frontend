"use client";

import { useRef, useState } from "react";
import { useAdminColors } from "@/lib/useAdminColors";
import { Camera, CheckCircle2, RotateCcw, AlertTriangle } from "lucide-react";
import clsx from "clsx";
import * as ordersApi from "@/lib/api/orders";
import * as conversationsApi from "@/lib/api/conversations";
import { ApiError } from "@/lib/apiClient";
import { Order } from "@/lib/types";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface Props {
  orderId: string;
  token: string;
  onCancel: () => void;
  onDone: (order: Order) => void;
  onConflict: (message: string) => void;
}

type Step = "confirm" | "capture" | "sending";

/**
 * Replaces a plain "mark it done" confirmation — finishing packing now
 * requires the sealed-parcel photo (and sends it, with the delivery-team
 * roster auto-attached) in the same guided action, so an order can never
 * end up PACKAGED without the customer actually having been told. Built
 * as its own backdrop+card (matching ConfirmDialog/AlertDialog's visual
 * language) rather than on either of them, since neither supports a
 * multi-step body or an image.
 */
export default function FinishPackingModal({ orderId, token, onCancel, onDone, onConflict }: Props) {
  const c = useAdminColors();
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>("confirm");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Tracks whether completePackaging already succeeded, so a retry after a
  // failed send doesn't try (and 409-fail) to complete packaging again.
  const [packagedOrder, setPackagedOrder] = useState<Order | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    e.target.value = "";
    if (!picked) return;
    // A just-taken photo can briefly hand off a 0-byte file before the OS
    // finishes writing it — same guard used elsewhere in this app.
    if (picked.size === 0) {
      setError(t("adminOrders.finishPacking.photoNotReadyError"));
      return;
    }
    setError(null);
    setFile(picked);
    setPreviewUrl(URL.createObjectURL(picked));
  };

  const retake = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setError(null);
  };

  const handleSend = async () => {
    if (!file) return;
    setStep("sending");
    setError(null);
    try {
      let updated = packagedOrder;
      if (!updated) {
        updated = await ordersApi.completePackaging(orderId, token);
        setPackagedOrder(updated);
      }
      await conversationsApi.sendPackagingConfirmation(orderId, token, undefined, file);
      onDone(updated);
    } catch (e) {
      if (!packagedOrder && e instanceof ApiError && e.status === 409) {
        // Someone else finished this order between opening this popup and
        // sending — nothing to retry, hand off to the parent's conflict UI.
        onConflict(e.message);
        return;
      }
      setError(e instanceof Error ? e.message : t("adminOrders.finishPacking.genericError"));
      setStep("capture");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={step === "sending" ? undefined : onCancel} />
      <div className={clsx("relative w-full max-w-sm rounded-2xl border p-6 shadow-2xl animate-fade-in", c.card)}>
        {step === "confirm" && (
          <>
            <div className="w-11 h-11 rounded-full flex items-center justify-center mb-4 bg-teal-500/10 text-teal-600">
              <CheckCircle2 size={20} />
            </div>
            <h3 className={clsx("font-semibold text-base mb-1.5", c.textPrimary)}>{t("adminOrders.finishPacking.confirmTitle")}</h3>
            <p className={clsx("text-sm mb-5 leading-relaxed", c.textSecondary)}>
              {t("adminOrders.finishPacking.confirmBody")}
            </p>
            <div className="flex gap-3">
              <button onClick={onCancel} className={clsx("flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors", c.btnGhost)}>
                {t("adminOrders.finishPacking.cancel")}
              </button>
              <button
                onClick={() => setStep("capture")}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 transition-colors"
              >
                {t("adminOrders.finishPacking.confirmButton")}
              </button>
            </div>
          </>
        )}

        {(step === "capture" || step === "sending") && (
          <>
            <div className="w-11 h-11 rounded-full flex items-center justify-center mb-4 bg-teal-500/10 text-teal-600">
              <Camera size={20} />
            </div>
            <h3 className={clsx("font-semibold text-base mb-1.5", c.textPrimary)}>{t("adminOrders.finishPacking.captureTitle")}</h3>
            <p className={clsx("text-sm mb-4 leading-relaxed", c.textSecondary)}>
              {t("adminOrders.finishPacking.captureBody")}
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePickFile}
              className="hidden"
            />

            {previewUrl ? (
              <div className="mb-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt={t("adminOrders.finishPacking.photoAlt")} className="w-full h-48 object-cover rounded-xl mb-2" />
                <p className={clsx("text-xs leading-relaxed", c.textMuted)}>
                  {t("adminOrders.finishPacking.previewCaption")}
                </p>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={step === "sending"}
                className={clsx(
                  "w-full flex flex-col items-center justify-center gap-2 py-8 rounded-xl border-2 border-dashed mb-4 transition-colors",
                  c.isDark ? "border-gray-700 hover:border-teal-500 text-gray-400" : "border-gray-300 hover:border-teal-400 text-gray-500"
                )}
              >
                <Camera size={22} />
                <span className="text-xs font-semibold">{t("adminOrders.finishPacking.openCamera")}</span>
              </button>
            )}

            {error && (
              <div className="flex items-start gap-2 text-red-600 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-4">
                <AlertTriangle size={13} className="mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex gap-3">
              {previewUrl && step !== "sending" && (
                <button
                  onClick={retake}
                  className={clsx("flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors", c.btnGhost)}
                >
                  <RotateCcw size={14} /> {t("adminOrders.finishPacking.retake")}
                </button>
              )}
              <button
                onClick={handleSend}
                disabled={!file || step === "sending"}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {step === "sending" ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : null}
                {step === "sending" ? t("adminOrders.finishPacking.sending") : t("adminOrders.finishPacking.sendButton")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
