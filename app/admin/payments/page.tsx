"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { Check, CheckCircle2, AlertTriangle, Loader2, Wallet } from "lucide-react";
import Image from "next/image";
import AdminShell from "@/components/admin/AdminShell";
import { useAdminStore } from "@/lib/adminStore";
import { useAdminColors } from "@/lib/useAdminColors";
import { useTranslation } from "@/lib/i18n/useTranslation";
import * as enterprisesApi from "@/lib/api/enterprises";
import { PaymentSettings } from "@/lib/types";

type Form = { orangeMoneyCode: string; orangeMoneyName: string; mobileMoneyCode: string; mobileMoneyName: string };

const EXAMPLES = { orange: "*150*14*244153*6XXXXXXXX*{amount}#", momo: "*126*14*6XXXXXXXX*{amount}#" };

function toForm(s: PaymentSettings): Form {
  return {
    orangeMoneyCode: s.orangeMoneyCode ?? "",
    orangeMoneyName: s.orangeMoneyName ?? "",
    mobileMoneyCode: s.mobileMoneyCode ?? "",
    mobileMoneyName: s.mobileMoneyName ?? "",
  };
}

/**
 * The signed-in admin's own shop's payment numbers. Customers pay each shop directly into these accounts and the shop
 * confirms the payment itself; a shop with none set can't be bought from online yet. Platform staff manage Riskyc's
 * own store here.
 */
export default function AdminPaymentsPage() {
  const token = useAdminStore((s) => s.session?.token);
  const c = useAdminColors();
  const { t } = useTranslation();
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [form, setForm] = useState<Form>({ orangeMoneyCode: "", orangeMoneyName: "", mobileMoneyCode: "", mobileMoneyName: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!token) return;
    enterprisesApi
      .getPaymentSettings(token)
      .then((s) => {
        setSettings(s);
        setForm(toForm(s));
      })
      .catch(() => setError(t("adminPayments.loadError")))
      .finally(() => setLoading(false));
    // Load once per session: `t` changes identity on every render, and re-running this would wipe what's being typed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const save = async () => {
    if (!token) return;
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const s = await enterprisesApi.updatePaymentSettings(token, form);
      setSettings(s);
      setForm(toForm(s));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("adminPayments.loadError"));
    } finally {
      setSaving(false);
    }
  };

  const preview = (code: string) => code.trim().replace("{amount}", "12000");
  const inputCls = clsx("w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none focus:border-brand-400", c.input);

  const methodCard = (key: "orange" | "momo") => {
    const codeKey = key === "orange" ? "orangeMoneyCode" : "mobileMoneyCode";
    const nameKey = key === "orange" ? "orangeMoneyName" : "mobileMoneyName";
    return (
      <div className={clsx("rounded-2xl border p-5 space-y-4", c.card)}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
            <Image src={key === "orange" ? "/orange-money.png" : "/mtn-momo.png"} alt="" width={80} height={80} className="w-full h-full object-cover" />
          </div>
          <p className={clsx("font-semibold", c.textPrimary)}>{t(key === "orange" ? "adminPayments.orangeMoney" : "adminPayments.momo")}</p>
        </div>
        <div>
          <label className={clsx("block text-xs font-semibold mb-1.5", c.textPrimary)}>{t("adminPayments.codeLabel")}</label>
          <input
            value={form[codeKey]}
            onChange={(e) => setForm((f) => ({ ...f, [codeKey]: e.target.value }))}
            placeholder={EXAMPLES[key]}
            className={clsx(inputCls, "font-mono")}
          />
          <p className={clsx("text-[11px] mt-1", c.textMuted)}>
            {t("adminPayments.codeHelp")} {t("adminPayments.example")}: <span className="font-mono">{EXAMPLES[key]}</span>
          </p>
        </div>
        <div>
          <label className={clsx("block text-xs font-semibold mb-1.5", c.textPrimary)}>{t("adminPayments.nameLabel")}</label>
          <input
            value={form[nameKey]}
            onChange={(e) => setForm((f) => ({ ...f, [nameKey]: e.target.value }))}
            placeholder="JEAN DUPONT"
            className={inputCls}
          />
          <p className={clsx("text-[11px] mt-1", c.textMuted)}>{t("adminPayments.nameHelp")}</p>
        </div>
        {form[codeKey].includes("{amount}") && form[nameKey].trim() && (
          <p className={clsx("text-xs rounded-xl px-3 py-2", c.innerCard)}>
            {t("adminPayments.preview")} <span className="font-mono font-semibold">{preview(form[codeKey])}</span> · {form[nameKey].trim()}
          </p>
        )}
        <p className={clsx("text-[11px]", c.textMuted)}>{t("adminPayments.leaveEmpty")}</p>
      </div>
    );
  };

  return (
    <AdminShell>
      <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 space-y-5">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-brand-500 text-white flex items-center justify-center flex-shrink-0">
            <Wallet size={20} />
          </div>
          <div>
            <h1 className={clsx("text-2xl font-bold", c.textPrimary)}>{t("adminPayments.title")}</h1>
            <p className={clsx("text-sm mt-0.5", c.textSecondary)}>{t("adminPayments.subtitle", { store: settings?.storeName ?? "" })}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={24} className="animate-spin text-gray-400" />
          </div>
        ) : (
          <>
            {settings && (
              <div
                className={clsx(
                  "flex items-start gap-2 rounded-2xl px-4 py-3 text-sm font-medium",
                  settings.acceptsPayments ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-800"
                )}
              >
                {settings.acceptsPayments ? <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" /> : <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />}
                {t(settings.acceptsPayments ? "adminPayments.statusOn" : "adminPayments.statusOff")}
              </div>
            )}

            {methodCard("orange")}
            {methodCard("momo")}

            {error && <div className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</div>}

            <div className="flex justify-end">
              <button
                onClick={save}
                disabled={saving}
                className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl disabled:opacity-60"
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : saved ? <Check size={15} /> : null}
                {saved ? t("adminPayments.saved") : t("adminPayments.save")}
              </button>
            </div>

            <div className={clsx("rounded-2xl border p-5", c.card)}>
              <p className={clsx("text-sm font-semibold mb-2", c.textPrimary)}>{t("adminPayments.howTitle")}</p>
              <ol className={clsx("text-sm space-y-1 list-decimal pl-5", c.textSecondary)}>
                <li>{t("adminPayments.how1")}</li>
                <li>{t("adminPayments.how2")}</li>
                <li>{t("adminPayments.how3")}</li>
              </ol>
            </div>
          </>
        )}
      </div>
    </AdminShell>
  );
}
