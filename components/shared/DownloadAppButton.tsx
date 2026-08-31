"use client";

import { useState } from "react";
import { usePwaInstall } from "@/lib/usePwaInstall";
import { Download } from "@/components/icons/fa";
import { useTranslation } from "@/lib/i18n/useTranslation";
import clsx from "clsx";

interface Props {
  variant: "navbar-icon" | "mobile-banner" | "sidebar";
  onNavigate?: () => void;
}

/** "Tap Share → Add to Home Screen" — the only install path iOS Safari offers, since it never fires beforeinstallprompt. */
function IosHint({ className }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <div className={className}>
      {t("home.downloadApp.iosHint.tap")} <strong>{t("home.downloadApp.iosHint.share")}</strong>{" "}
      {t("home.downloadApp.iosHint.then")} <strong>{t("home.downloadApp.iosHint.addToHomeScreen")}</strong>{" "}
      {t("home.downloadApp.iosHint.toInstall")}
    </div>
  );
}

export default function DownloadAppButton({ variant, onNavigate }: Props) {
  const { canInstall, isInstalled, isIos, promptInstall } = usePwaInstall();
  const [showHint, setShowHint] = useState(false);
  const { t } = useTranslation();

  if (isInstalled) return null;
  if (!canInstall && !isIos) return null; // no viable install path on this browser (e.g. desktop Firefox)

  const handleClick = () => {
    if (canInstall) {
      promptInstall();
      onNavigate?.();
    } else {
      setShowHint((v) => !v);
    }
  };

  if (variant === "navbar-icon") {
    return (
      <div className="relative hidden sm:block">
        <button onClick={handleClick} title={t("home.downloadApp.label")} className="btn-ghost p-2 rounded-full flex">
          <Download size={20} className="animate-bounce" />
        </button>
        {showHint && (
          <div className="absolute right-0 top-full mt-2 w-56 p-3 rounded-xl bg-white border border-gray-200 text-xs text-gray-600 shadow-lg z-50">
            <IosHint />
          </div>
        )}
      </div>
    );
  }

  if (variant === "mobile-banner") {
    return (
      <div className="mb-3">
        <button
          onClick={handleClick}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 text-white font-semibold text-sm shadow-md"
        >
          <Download size={18} className="animate-bounce" />
          {t("home.downloadApp.label")}
        </button>
        {showHint && <IosHint className="mt-2 p-3 rounded-xl bg-brand-50 text-xs text-brand-700" />}
      </div>
    );
  }

  // Admin sidebar — matches the existing "View Store" / "Logout" row style.
  return (
    <div className="relative">
      <button
        onClick={handleClick}
        className={clsx(
          "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
          "text-gray-400 hover:bg-brand-500/10 hover:text-brand-300"
        )}
      >
        <Download size={18} className="text-brand-400 group-hover:text-brand-300 animate-bounce" />
        {t("home.downloadApp.label")}
      </button>
      {showHint && (
        <div className="absolute left-0 right-0 bottom-full mb-2 p-3 rounded-xl bg-gray-800 border border-gray-700 text-xs text-gray-300 shadow-lg z-50">
          <IosHint />
        </div>
      )}
    </div>
  );
}
