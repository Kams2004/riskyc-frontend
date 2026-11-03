"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import AlertDialog from "@/components/admin/AlertDialog";
import Receipt from "@/components/admin/pos/Receipt";
import { useAdminStore } from "@/lib/adminStore";
import { useAdminColors } from "@/lib/useAdminColors";
import { useTranslation } from "@/lib/i18n/useTranslation";
import * as posApi from "@/lib/api/pos";
import { PosSettings, ReceiptPaperWidth } from "@/lib/types";
import { ApiError } from "@/lib/apiClient";
import clsx from "clsx";
import { ChevronLeft, Loader2, Check, Upload } from "lucide-react";

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

  return (
    <AdminShell>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/admin/pos")}
            className={clsx("w-9 h-9 rounded-xl flex items-center justify-center", c.btnGhost)}
          >
            <ChevronLeft size={18} />
          </button>
          <h1 className={clsx("text-2xl font-bold", c.textPrimary)}>{t("adminPos.settings.pageTitle")}</h1>
        </div>

        {loading || !settings ? (
          <div className={clsx("text-center py-20 rounded-2xl border", c.card)}>
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
