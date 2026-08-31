"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import { Eye, EyeOff, Mail, Lock, LogIn, AlertCircle } from "@/components/icons/fa";
import { useTranslation } from "@/lib/i18n/useTranslation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";
  const loginCustomer = useStore((s) => s.loginCustomer);
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [googleError, setGoogleError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await loginCustomer(email, password);
    setLoading(false);
    if (result.ok) {
      router.replace(redirectTo);
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-lg">
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg mb-4">
              <span className="text-white font-display font-bold text-xl">RF</span>
            </div>
            <h1 className="font-display font-bold text-2xl text-gray-900">{t("account.login.title")}</h1>
            <p className="text-gray-400 text-sm mt-1">{t("account.login.subtitle")}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                {t("account.login.emailLabel")}
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("account.login.emailPlaceholder")}
                  autoFocus
                  required
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl pl-10 pr-3 py-3 text-sm focus:outline-none focus:border-brand-400 focus:bg-white transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                {t("account.login.passwordLabel")}
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
                <input
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("account.login.passwordPlaceholder")}
                  required
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl pl-10 pr-10 py-3 text-sm focus:outline-none focus:border-brand-400 focus:bg-white transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
                <AlertCircle size={15} className="text-red-500 flex-shrink-0" />
                <p className="text-red-600 text-xs font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={18} />
                  {t("account.login.submit")}
                </>
              )}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="h-px bg-gray-100 flex-1" />
            <span className="text-xs text-gray-400 uppercase tracking-wider">{t("account.common.orDivider")}</span>
            <div className="h-px bg-gray-100 flex-1" />
          </div>

          {googleError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 mb-4">
              <AlertCircle size={15} className="text-red-500 flex-shrink-0" />
              <p className="text-red-600 text-xs font-medium">{googleError}</p>
            </div>
          )}

          <GoogleSignInButton redirectTo={redirectTo} onError={setGoogleError} />

          <p className="text-center text-gray-500 text-sm mt-6">
            {t("account.login.noAccount")}{" "}
            <Link
              href={`/register${redirectTo !== "/" ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`}
              className="text-brand-600 font-semibold hover:underline"
            >
              {t("account.login.signUp")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
