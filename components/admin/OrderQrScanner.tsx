"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X, AlertCircle } from "lucide-react";
import { parseOrderQrPayload } from "@/lib/generateReceipt";
import { useTranslation } from "@/lib/i18n/useTranslation";
import clsx from "clsx";

interface Props {
  onClose: () => void;
}

/**
 * Camera-based scanner for the QR code printed on a customer's receipt.
 * Lives entirely inside the admin panel, which already requires a logged-in
 * admin to reach any page here (AdminGuard) — so a decoded order id is only
 * ever turned into real order data for someone already authenticated. The
 * QR payload itself is a plain "riskyc-order:<id>" string, not a link, so a
 * customer's own camera app has nothing to open even if they scan it.
 */
export default function OrderQrScanner({ onClose }: Props) {
  const router = useRouter();
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let scanner: any;

    (async () => {
      const { default: QrScanner } = await import("qr-scanner");
      if (cancelled || !videoRef.current) return;

      scanner = new QrScanner(
        videoRef.current,
        (result: { data: string }) => {
          const orderId = parseOrderQrPayload(result.data);
          if (!orderId) {
            setError(t("adminOrders.scan.notAnOrderCode"));
            return;
          }
          scanner.stop();
          onClose();
          router.push(`/admin/orders/${orderId}`);
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: "environment",
        }
      );

      try {
        await scanner.start();
        if (!cancelled) {
          setReady(true);
          setError(null);
        }
      } catch {
        if (!cancelled) setError(t("adminOrders.scan.cameraError"));
      }
    })();

    return () => {
      cancelled = true;
      scanner?.stop();
      scanner?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-display font-bold text-lg text-gray-900">{t("adminOrders.scan.title")}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors flex-shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        <div className="relative aspect-square bg-black">
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
          {!ready && !error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          )}
        </div>

        <div className="p-4">
          {error ? (
            <div className={clsx("flex items-start gap-2 text-sm", "text-red-600")}>
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center">
              {ready ? t("adminOrders.scan.instructions") : t("adminOrders.scan.startingCamera")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
