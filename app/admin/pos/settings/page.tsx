"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import AlertDialog from "@/components/admin/AlertDialog";
import TillsPanel from "@/components/admin/pos/TillsPanel";
import Receipt from "@/components/admin/pos/Receipt";
import { useAdminStore } from "@/lib/adminStore";
import { useAdminColors } from "@/lib/useAdminColors";
import { useTranslation } from "@/lib/i18n/useTranslation";
import * as posApi from "@/lib/api/pos";
import { PosSettings, ReceiptPaperWidth } from "@/lib/types";
import { ApiError } from "@/lib/apiClient";
import clsx from "clsx";
import { ChevronLeft, Loader2, Check, Upload, Banknote, Trash2 } from "lucide-react";

const PAYMENT_METHODS: {
  key: "cashEnabled" | "orangeMoneyEnabled" | "mobileMoneyEnabled";
  /** A brand logo for mobile-money methods; the Banknote icon for cash. */
  logo?: string;
  title: string;
  subtitle: string;
}[] = [
  { key: "cashEnabled", title: "Cash", subtitle: "Paid in physical currency" },
  { key: "orangeMoneyEnabled", logo: "/orange-money.png", title: "Orange Money", subtitle: "Mobile payment via Orange" },
  { key: "mobileMoneyEnabled", logo: "/mtn-momo.png", title: "MTN MoMo", subtitle: "Mobile payment via MTN" },
];

const PAPER_WIDTHS: { value: ReceiptPaperWidth; labelKey: string }[] = [
  { value: "MM58", labelKey: "paperWidth58" },
  { value: "MM80", labelKey: "paperWidth80" },
  { value: "A4", labelKey: "paperWidthA4" },
];

const SAMPLE_RECEIPT = {
  saleRef: "A1B2C3D4",
  cashierName: "Jane Doe",
  items: [
    { productName: "Blousson Ermess", selectedColor: "Black", selectedSize: "M", quantity: 1, unitPrice: 35000 },
    { productName: "FC Barcelon Jessey", selectedColor: "", selectedSize: "", quantity: 2, unitPrice: 3500 },
  ],
  total: 42000,
  paymentMethod: "CASH" as const,
  soldAt: new Date().toISOString(),
};

export default function AdminPosSettingsPage() {
  const router = useRouter();
  const token = useAdminStore((s) => s.session?.token);
  const c = useAdminColors();
  const { t } = useTranslation();

  const [settings, setSettings] = useState<PosSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    posApi
      .getSettings(token)
      .then(setSettings)
      .catch(() => setError(t("adminPos.settings.loadError")))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleSave = async () => {
    if (!token || !settings) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await posApi.updateSettings(token, settings);
      setSettings(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("adminPos.settings.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const handleLogoPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !token) return;
    try {
      const updated = await posApi.uploadLogo(token, file);
      setSettings(updated);
    } catch {
      setError(t("adminPos.settings.logoError"));
    }
  };

  const handleLogoRemove = async () => {
    if (!token) return;
    try {
      setSettings(await posApi.removeLogo(token));
    } catch {
      setError(t("adminPos.settings.logoError"));
    }
  };

  return (
    <AdminShell>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/admin/pos")}
            className={clsx("w-9 h-9 rounded-xl flex items-center justify-center border shadow-sm transition-colors", c.isDark ? "bg-gray-800 border-gray-600 text-white hover:bg-gray-700" : "bg-white border-gray-300 text-gray-900 hover:bg-gray-50")}
          >
            <ChevronLeft size={18} />
          </button>
          <h1 className={clsx("text-2xl font-bold", c.textPrimary)}>{t("adminPos.settings.pageTitle")}</h1>
        </div>

        <TillsPanel />

        {loading || !settings ? (
          <div className={clsx("text-center py-20 rounded-2xl border", c.card)}>
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
            {/* Form */}
            <div className={clsx("rounded-2xl border p-5 space-y-4 h-fit", c.card)}>
              <div>
                <label className={clsx("block text-xs font-semibold mb-1.5", c.textLabel)}>{t("adminPos.settings.storeName")}</label>
                <input
                  value={settings.storeName}
                  onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                  className={clsx("w-full border rounded-xl px-3.5 py-2.5 text-sm outline-none", c.input)}
                />
              </div>
              <div>
                <label className={clsx("block text-xs font-semibold mb-1.5", c.textLabel)}>{t("adminPos.settings.storeAddress")}</label>
                <input
                  value={settings.storeAddress ?? ""}
                  onChange={(e) => setSettings({ ...settings, storeAddress: e.target.value || null })}
                  className={clsx("w-full border rounded-xl px-3.5 py-2.5 text-sm outline-none", c.input)}
                />
              </div>
              <div>
                <label className={clsx("block text-xs font-semibold mb-1.5", c.textLabel)}>{t("adminPos.settings.storePhone")}</label>
                <input
                  value={settings.storePhone ?? ""}
                  onChange={(e) => setSettings({ ...settings, storePhone: e.target.value || null })}
                  className={clsx("w-full border rounded-xl px-3.5 py-2.5 text-sm outline-none", c.input)}
                />
              </div>
              <div>
                <label className={clsx("block text-xs font-semibold mb-1.5", c.textLabel)}>{t("adminPos.settings.footerMessage")}</label>
                <textarea
                  value={settings.footerMessage ?? ""}
                  onChange={(e) => setSettings({ ...settings, footerMessage: e.target.value || null })}
                  rows={2}
                  placeholder={t("adminPos.settings.footerPlaceholder")}
                  className={clsx("w-full border rounded-xl px-3.5 py-2.5 text-sm outline-none resize-none", c.input)}
                />
              </div>

              <div>
                <label className={clsx("block text-xs font-semibold mb-1.5", c.textLabel)}>{t("adminPos.settings.logo")}</label>
                <div className="flex items-center gap-3">
                  {settings.logoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={settings.logoUrl} alt="" className="w-12 h-12 object-contain border border-gray-200 dark:border-gray-700 rounded-lg" />
                  )}
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-brand-600 bg-brand-500/10 hover:bg-brand-500/20 rounded-xl px-3 py-2 cursor-pointer">
                    <Upload size={13} /> {settings.logoUrl ? t("adminPos.settings.replace") : t("adminPos.settings.upload")}
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoPick} />
                  </label>
                  {settings.logoUrl && (
                    <button
                      type="button"
                      onClick={handleLogoRemove}
                      className="flex items-center gap-1.5 text-xs font-semibold text-red-500 bg-red-500/10 hover:bg-red-500/20 rounded-xl px-3 py-2"
                    >
                      <Trash2 size={13} /> {t("adminPos.settings.removeLogo")}
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className={clsx("block text-xs font-semibold mb-1.5", c.textLabel)}>{t("adminPos.settings.paperWidth")}</label>
                <div className="flex gap-2">
                  {PAPER_WIDTHS.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => setSettings({ ...settings, paperWidth: p.value })}
                      className={clsx(
                        "flex-1 px-3 py-2.5 rounded-xl border-2 text-xs font-semibold transition-colors",
                        settings.paperWidth === p.value ? "border-brand-500 bg-brand-500/10 text-brand-600" : clsx(c.border, c.textLabel)
                      )}
                    >
                      {t(`adminPos.settings.${p.labelKey}`)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2.5 pt-1">
                <label className={clsx("flex items-center justify-between text-sm font-medium", c.textLabel, !settings.logoUrl && "opacity-50")}>
                  {t("adminPos.settings.showLogo")}
                  <input
                    type="checkbox"
                    checked={settings.showLogo}
                    disabled={!settings.logoUrl}
                    onChange={(e) => setSettings({ ...settings, showLogo: e.target.checked })}
                    className="w-4 h-4 accent-brand-500"
                  />
                </label>
                <label className={clsx("flex items-center justify-between text-sm font-medium", c.textLabel)}>
                  {t("adminPos.settings.showSaleId")}
                  <input
                    type="checkbox"
                    checked={settings.showSaleId}
                    onChange={(e) => setSettings({ ...settings, showSaleId: e.target.checked })}
                    className="w-4 h-4 accent-brand-500"
                  />
                </label>
                <label className={clsx("flex items-center justify-between text-sm font-medium", c.textLabel)}>
                  {t("adminPos.settings.showCashierName")}
                  <input
                    type="checkbox"
                    checked={settings.showCashierName}
                    onChange={(e) => setSettings({ ...settings, showCashierName: e.target.checked })}
                    className="w-4 h-4 accent-brand-500"
                  />
                </label>
              </div>

              {error && <div className="text-sm text-red-600 bg-red-50 rounded-xl px-3.5 py-2.5">{error}</div>}

              <button
                onClick={handleSave}
                disabled={saving}
                className={clsx(
                  "w-full flex items-center justify-center gap-2 font-semibold text-sm rounded-xl py-3 transition-colors",
                  saved ? "bg-green-500 text-white" : "bg-brand-500 hover:bg-brand-600 text-white disabled:opacity-60"
                )}
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <Check size={16} /> : null}
                {saving ? t("adminPos.settings.saving") : saved ? t("adminPos.settings.saved") : t("adminPos.settings.save")}
              </button>
            </div>

            {/* Payment methods */}
            <div className={clsx("rounded-2xl border p-5 space-y-1 h-fit", c.card)}>
              <p className={clsx("text-xs font-semibold uppercase tracking-wide mb-2", c.textMuted)}>Payment methods</p>
              {PAYMENT_METHODS.map((m, i) => {
                const enabledCount = PAYMENT_METHODS.filter((pm) => settings[pm.key]).length;
                const isOnlyOneLeft = enabledCount === 1 && settings[m.key];
                return (
                  <div key={m.key} className={clsx("flex items-center gap-3 py-3", i < PAYMENT_METHODS.length - 1 && clsx("border-b", c.border))}>
                    {m.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.logo} alt="" className="w-9 h-9 rounded-xl object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-brand-500/10 text-brand-500">
                        <Banknote size={15} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={clsx("text-sm font-semibold", c.textPrimary)}>{m.title}</p>
                      <p className={clsx("text-[11px]", c.textMuted)}>{m.subtitle}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings[m.key]}
                      disabled={isOnlyOneLeft}
                      onChange={(e) => setSettings({ ...settings, [m.key]: e.target.checked })}
                      className="w-4 h-4 accent-brand-500 disabled:opacity-40"
                    />
                  </div>
                );
              })}
              <p className={clsx("text-[11px] pt-2", c.textMuted)}>At least one payment method must stay on.</p>
            </div>
            </div>

            {/* Live preview */}
            <div>
              <p className={clsx("text-xs font-semibold uppercase tracking-wide mb-3", c.textMuted)}>{t("adminPos.settings.livePreview")}</p>
              <div className={clsx("rounded-2xl p-6 flex justify-center", c.innerCard)}>
                <div className="shadow-xl">
                  <Receipt settings={settings} data={SAMPLE_RECEIPT} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <AlertDialog title={t("adminPos.settings.pageTitle")} message={error} onClose={() => setError(null)} />
    </AdminShell>
  );
}
