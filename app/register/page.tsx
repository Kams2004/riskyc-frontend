"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import { Eye, EyeOff, Mail, Lock, User, Phone, UserPlus, AlertCircle, Gift } from "@/components/icons/fa";
import { useTranslation } from "@/lib/i18n/useTranslation";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";
  const registerCustomer = useStore((s) => s.registerCustomer);
  const { t } = useTranslation();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [referralCode, setReferralCode] = useState(searchParams.get("ref") || "");
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [googleError, setGoogleError] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!firstName.trim()) e.firstName = t("account.register.errors.required");
    if (!lastName.trim()) e.lastName = t("account.register.errors.required");
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) e.email = t("account.register.errors.validEmail");
    if (!password.trim() || password.length < 6) e.password = t("account.register.errors.minPassword");
    if (confirmPassword !== password) e.confirmPassword = t("account.register.errors.passwordMismatch");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const result = await registerCustomer({
      firstName,
      lastName,
      email,
      phone: phone.trim() || undefined,
      password,
      referralCode: referralCode.trim() || undefined,
    });
    setLoading(false);
    if (result.ok) {
      router.replace(redirectTo);
    } else {
      setErrors({ email: result.error });
    }
  };

  const inputCls = (field: string) =>
    `w-full bg-gray-50 border ${
      errors[field] ? "border-red-300" : "border-gray-200"
    } text-gray-900 placeholder-gray-400 rounded-xl pl-10 pr-3 py-3 text-sm focus:outline-none focus:border-brand-400 focus:bg-white transition-colors`;

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-lg">
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg mb-4">
              <span className="text-white font-display font-bold text-xl">RF</span>
            </div>
            <h1 className="font-display font-bold text-2xl text-gray-900">{t("account.register.title")}</h1>
            <p className="text-gray-400 text-sm mt-1">{t("account.register.subtitle")}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                  {t("account.register.firstNameLabel")}
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder={t("account.register.firstNamePlaceholder")}
                    autoFocus
                    className={inputCls("firstName")}
                  />
                </div>
                {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>}
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                  {t("account.register.lastNameLabel")}
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder={t("account.register.lastNamePlaceholder")}
                    className={inputCls("lastName")}
                  />
                </div>
                {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                {t("account.register.emailLabel")}
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("account.register.emailPlaceholder")}
                  className={inputCls("email")}
                />
              </div>
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                {t("account.register.phoneLabel")} <span className="text-gray-300 normal-case">{t("account.register.optional")}</span>
              </label>
              <div className="relative">
                <Phone size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t("account.register.phonePlaceholder")}
                  className={inputCls("phone")}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                {t("account.register.passwordLabel")}
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
                <input
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("account.register.passwordPlaceholder")}
                  className={`${inputCls("password")} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                {t("account.register.confirmPasswordLabel")}
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
                <input
                  type={show ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t("account.register.confirmPasswordPlaceholder")}
                  className={inputCls("confirmPassword")}
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                {t("account.register.referralCodeLabel")} <span className="text-gray-300 normal-case">{t("account.register.optional")}</span>
              </label>
              <div className="relative">
                <Gift size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
                <input
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  placeholder={t("account.register.referralCodePlaceholder")}
                  className={inputCls("referralCode")}
                />
              </div>
            </div>

            {errors.email && errors.email.includes("already exists") && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
                <AlertCircle size={15} className="text-red-500 flex-shrink-0" />
                <p className="text-red-600 text-xs font-medium">{errors.email}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus size={18} />
                  {t("account.register.submit")}
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

          <GoogleSignInButton
            redirectTo={redirectTo}
            referralCode={referralCode.trim() || undefined}
            onError={setGoogleError}
          />

          <p className="text-center text-gray-500 text-sm mt-6">
            {t("account.register.alreadyHaveAccount")}{" "}
            <Link
              href={`/login${redirectTo !== "/" ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`}
              className="text-brand-600 font-semibold hover:underline"
            >
              {t("account.register.logIn")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}
