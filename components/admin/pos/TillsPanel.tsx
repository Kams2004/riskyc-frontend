"use client";

import { useCallback, useEffect, useState } from "react";
import clsx from "clsx";
import { Loader2, Plus, MonitorSmartphone, Ban, Copy, Check, Download } from "lucide-react";
import { useAdminStore } from "@/lib/adminStore";
import { useAdminColors } from "@/lib/useAdminColors";
import { useTranslation } from "@/lib/i18n/useTranslation";
import * as posApi from "@/lib/api/pos";

const APP_DOWNLOAD_URL = "https://github.com/Kams2004/riskyc-pos/releases/latest";

/** Tills = installed Riskyc POS desktop apps: add one (one-time code), watch its status, revoke it. */
export default function TillsPanel() {
  const token = useAdminStore((s) => s.session?.token);
  const c = useAdminColors();
  const { t } = useTranslation();
  const [devices, setDevices] = useState<posApi.PosDevice[] | null>(null);
  const [code, setCode] = useState<{ code: string; expiresAt: string } | null>(null);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());

  const load = useCallback(() => {
    if (!token) return;
    posApi
      .listDevices(token)
      .then(setDevices)
      .catch(() => setError(t("adminPos.tills.loadError")));
  }, [token, t]);

  useEffect(() => {
    load();
    const poll = setInterval(load, 15000);
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearInterval(poll);
      clearInterval(tick);
    };
  }, [load]);

  const timeAgo = (iso: string | null) => {
    if (!iso) return "—";
    const seconds = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
    if (seconds < 60) return t("adminPos.tills.justNow");
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return t("adminPos.tills.minutesAgo", { n: minutes });
    const hours = Math.round(minutes / 60);
    if (hours < 48) return t("adminPos.tills.hoursAgo", { n: hours });
    return new Date(iso).toLocaleDateString();
  };

  const handleAdd = async () => {
    if (!token) return;
    setCreating(true);
    setError("");
    try {
      setCode(await posApi.createEnrollmentCode(token));
      setCopied(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("adminPos.tills.loadError"));
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (device: posApi.PosDevice) => {
    if (!token || !window.confirm(t("adminPos.tills.revokeConfirm", { name: device.name }))) return;
    try {
      await posApi.revokeDevice(token, device.id);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("adminPos.tills.loadError"));
    }
  };

  const secondsLeft = code ? Math.max(0, Math.round((new Date(code.expiresAt).getTime() - now) / 1000)) : 0;
  const ordered = [...(devices ?? []).filter((d) => !d.revokedAt), ...(devices ?? []).filter((d) => d.revokedAt)];

  return (
    <div className={clsx("rounded-2xl border p-5 sm:p-6", c.card)}>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <p className={clsx("text-sm font-bold", c.textPrimary)}>{t("adminPos.tills.title")}</p>
          <p className={clsx("text-xs mt-0.5 max-w-2xl", c.textSecondary)}>{t("adminPos.tills.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={APP_DOWNLOAD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={clsx("flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors", c.btnGhost)}
          >
            <Download size={15} /> {t("adminPos.tills.download")}
          </a>
          <button
            onClick={handleAdd}
            disabled={creating}
            className="flex items-center gap-1.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold px-4 py-2 rounded-xl disabled:opacity-60"
          >
            {creating ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} {t("adminPos.tills.addTill")}
          </button>
        </div>
      </div>

      {code && secondsLeft > 0 && (
        <div className="mb-5 rounded-xl border-2 border-dashed border-brand-400 bg-brand-500/10 p-4 flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[220px]">
            <p className={clsx("text-sm font-semibold", c.textPrimary)}>{t("adminPos.tills.codeTitle")}</p>
            <p className={clsx("text-xs mt-0.5", c.textSecondary)}>
              {t("adminPos.tills.codeHint", { time: `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, "0")}` })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-2xl font-bold tracking-widest text-gray-900 bg-white border border-gray-300 rounded-xl px-4 py-2">
              {code.code}
            </span>
            <button
              onClick={() => navigator.clipboard?.writeText(code.code).then(() => setCopied(true)).catch(() => {})}
              title={t("adminPos.tills.copy")}
              className="p-2.5 rounded-xl bg-white border border-gray-300 text-gray-900 hover:bg-gray-50"
            >
              {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
            </button>
          </div>
        </div>
      )}

      {error && <div className="mb-3 text-sm text-red-500 bg-red-500/10 rounded-xl px-3.5 py-2.5">{error}</div>}

      {devices === null ? (
        <div className={clsx("flex justify-center py-6", c.textMuted)}>
          <Loader2 size={20} className="animate-spin" />
        </div>
      ) : ordered.length === 0 ? (
        <p className={clsx("text-sm py-4 text-center", c.textSecondary)}>{t("adminPos.tills.empty")}</p>
      ) : (
        <div className={clsx("divide-y", c.border)}>
          {ordered.map((d) => (
            <div key={d.id} className={clsx("flex flex-wrap items-center gap-3 py-3", d.revokedAt && "opacity-50")}>
              <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", c.innerCard, c.textPrimary)}>
                <MonitorSmartphone size={18} />
              </div>
              <div className="flex-1 min-w-[180px]">
                <p className={clsx("text-sm font-semibold", c.textPrimary)}>{d.name}</p>
                <p className={clsx("text-[11px]", c.textMuted)}>
                  {[d.platform, d.appVersion && `v${d.appVersion}`, t("adminPos.tills.added", { when: timeAgo(d.enrolledAt) })].filter(Boolean).join(" · ")}
                </p>
              </div>
              {d.revokedAt ? (
                <span className={clsx("text-[11px] font-bold px-2 py-1 rounded-full", c.innerCard, c.textMuted)}>{t("adminPos.tills.revoked")}</span>
              ) : (
                <>
                  <span
                    className={clsx(
                      "flex items-center gap-1.5 text-[11px] font-bold px-2 py-1 rounded-full",
                      d.online ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                    )}
                  >
                    <span className={clsx("w-1.5 h-1.5 rounded-full", d.online ? "bg-green-500" : "bg-red-500")} />
                    {d.online ? t("adminPos.tills.online") : t("adminPos.tills.offline", { when: timeAgo(d.lastSeenAt) })}
                  </span>
                  {d.pendingSales > 0 && (
                    <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-amber-500/10 text-amber-500">
                      {t("adminPos.tills.toSync", { count: d.pendingSales })}
                    </span>
                  )}
                  <button
                    onClick={() => handleRevoke(d)}
                    className="flex items-center gap-1 text-xs font-semibold text-red-500 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-lg"
                  >
                    <Ban size={13} /> {t("adminPos.tills.revoke")}
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
