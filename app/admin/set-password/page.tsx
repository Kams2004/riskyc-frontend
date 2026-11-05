"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import AdminGuard from "@/components/admin/AdminGuard";
import { useAdminStore } from "@/lib/adminStore";
import { firstAccessibleHref } from "@/lib/adminNav";
import { Eye, EyeOff, Lock, KeyRound, AlertCircle } from "lucide-react";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function SetPasswordPage() {
  return (
    <AdminGuard>
      <SetPasswordInner />
    </AdminGuard>
  );
}

function SetPasswordInner() {
  const router = useRouter();
  const changePassword = useAdminStore((s) => s.changePassword);
  const { t } = useTranslation();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError(t("adminCommon.setPassword.tooShort"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t("adminCommon.setPassword.mismatch"));
      return;
    }

    setLoading(true);
    const result = await changePassword(currentPassword, newPassword);
    setLoading(false);
    if (result.ok) {
      const permissions = useAdminStore.getState().session?.permissions ?? [];
      router.replace(firstAccessibleHref(permissions));
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Same desk scene as the login screen, for visual continuity across the admin auth flow. */}
      <Image src="/admin-login-background.png" alt="" fill priority sizes="100vw" className="object-cover" />
      <div className="absolute inset-0 bg-gray-950/75" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-brand-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-10 shadow-2xl">
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-xl mb-4">
              <KeyRound className="text-white" size={28} />
            </div>
            <h1 className="text-white font-display font-bold text-2xl text-center">{t("adminCommon.setPassword.title")}</h1>
            <p className="text-gray-500 text-sm mt-1 text-center">{t("adminCommon.setPassword.subtitle")}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                {t("adminCommon.setPassword.currentPasswordLabel")}
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-4 text-gray-500" />
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoFocus
                  required
                  className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                {t("adminCommon.setPassword.newPasswordLabel")}
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-4 text-gray-500" />
                <input
                  type={show ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl pl-11 pr-11 py-3.5 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-3.5 top-3.5 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                {t("adminCommon.setPassword.confirmPasswordLabel")}
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-4 text-gray-500" />
                <input
                  type={show ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5">
                <AlertCircle size={15} className="text-red-400 flex-shrink-0" />
                <p className="text-red-400 text-xs font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !currentPassword || !newPassword || !confirmPassword}
              className="w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                t("adminCommon.setPassword.submit")
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
