"use client";

import { useState, useRef, useEffect } from "react";
import { useStore } from "@/lib/store";
import { formatPrice } from "@/lib/data";
import * as ordersApi from "@/lib/api/orders";
import { PaymentMethod, Order, CustomerInfo, DeliveryType } from "@/lib/types";
import { StatusBadge } from "@/components/cart/OrdersList";
import { downloadReceipt } from "@/lib/generateReceipt";
import {
  X,
  Copy,
  Check,
  Upload,
  MessageCircle,
  CheckCircle2,
  ArrowLeft,
  ShoppingBag,
  User,
  Phone,
  MapPin,
  Store,
  Truck,
  AlertCircle,
  Printer,
} from "@/components/icons/fa";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { localized } from "@/lib/i18n/localized";

interface Props {
  orderId: string | null;
  onClose: () => void;
}

type Step = "method" | "awaiting" | "info" | "confirmed";

export default function CheckoutFlow({ orderId, onClose }: Props) {
  const router = useRouter();
  const { items, getCartTotal, getLineTotal, clearCart, setChatOpen, customer } = useStore();
  const { t, language } = useTranslation();

  const [order, setOrder] = useState<Order | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(!!orderId);

  // Determine initial step from existing order status
  const getInitialStep = (o: Order | null): Step => {
    if (!o) return "method";
    switch (o.status) {
      case "AWAITING_PAYMENT":
        return "awaiting";
      case "REVIEWING":
      case "VALIDATED":
      case "PACKAGING":
      case "PACKAGED":
      case "CANCELLED":
        return "confirmed";
      default:
        return "method";
    }
  };

  const [step, setStep] = useState<Step>("method");

  // Resolve an existing order (re-opened from "My Orders") from the API
  const [orderLoadError, setOrderLoadError] = useState(false);
  useEffect(() => {
    if (!orderId) return;
    setLoadingOrder(true);
    setOrderLoadError(false);
    ordersApi
      .getOrder(orderId)
      .then((o) => {
        setOrder(o);
        setStep(getInitialStep(o));
      })
      .catch(() => setOrderLoadError(true))
      .finally(() => setLoadingOrder(false));
  }, [orderId]);

  // Customer info form state — prefilled from the logged-in customer, if any
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    firstName: customer?.firstName ?? "",
    lastName: customer?.lastName ?? "",
    phone: customer?.phone ?? "",
    town: "",
    street: "",
    deliveryType: "DELIVERY",
  });
  const [infoErrors, setInfoErrors] = useState<Partial<Record<keyof CustomerInfo, string>>>({});
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [downloadingReceipt, setDownloadingReceipt] = useState(false);
  const [receiptError, setReceiptError] = useState(false);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotName, setScreenshotName] = useState("");
  const [sending, setSending] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const subtotal = order ? order.total : getCartTotal();
  const total = order ? order.total : (subtotal >= 50000 ? subtotal : subtotal + 2500);

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);

  const handleSelectMethod = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setStep("awaiting");
  };

  const handleSendProof = () => {
    if (!screenshotFile) return;
    setStep("info");
  };

  const handleInfoSubmit = async () => {
    if (!validateInfo() || !selectedMethod || !screenshotFile) return;
    setSending(true);
    setSubmitError("");
    try {
      const newOrder = await ordersApi.createOrder({
        customerId: customer?.id,
        items: items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          selectedColor: item.selectedColor ?? undefined,
          selectedSize: item.selectedSize ?? undefined,
          selectedImageIndex: item.selectedImageIndex,
        })),
        customerInfo,
      });
      await ordersApi.setOrderPaymentMethod(newOrder.id, selectedMethod);
      const finalOrder = await ordersApi.uploadPaymentProof(newOrder.id, screenshotFile);
      clearCart();
      setOrder(finalOrder);
      setStep("confirmed");
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : t("cart.checkout.genericError"));
    } finally {
      setSending(false);
    }
  };

  const validateInfo = (): boolean => {
    const errors: Partial<Record<keyof CustomerInfo, string>> = {};
    if (!customerInfo.firstName.trim()) errors.firstName = t("cart.checkout.required");
    if (!customerInfo.lastName.trim()) errors.lastName = t("cart.checkout.required");
    if (!customerInfo.phone.trim()) errors.phone = t("cart.checkout.required");
    if (customerInfo.deliveryType === "DELIVERY") {
      if (!customerInfo.town?.trim()) errors.town = t("cart.checkout.requiredForDelivery");
      if (!customerInfo.street?.trim()) errors.street = t("cart.checkout.requiredForDelivery");
    }
    setInfoErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCopyCode = () => {
    const code = selectedMethod ? buildUssdCode(selectedMethod) : "";
    setCopyFailed(false);
    navigator.clipboard.writeText(code).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      },
      () => setCopyFailed(true)
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScreenshotFile(file);
    setScreenshotName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setScreenshotPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };


  const paymentInfo: Record<
    PaymentMethod,
    { name: string; accountName: string; ussdTemplate: string; color: string; bg: string; logo: string }
  > = {
    ORANGE_MONEY: {
      name: "Orange Money",
      accountName: "IBRAHIMA HAYA",
      ussdTemplate: "*150*14*244153*694282606*%s#",
      color: "text-orange-600",
      bg: "bg-orange-50 border-orange-200",
      logo: "/orange-money.png",
    },
    MOBILE_MONEY: {
      name: "MTN Mobile Money",
      accountName: "KHAN RAPHEAL",
      ussdTemplate: "*126*14*673267022*%s#",
      color: "text-yellow-600",
      bg: "bg-yellow-50 border-yellow-200",
      logo: "/MobileMoney.jpg",
    },
  };

  // Bakes the amount to pay into the dial code so the customer can copy one
  // string straight into their phone's dialer, e.g. *126*14*673267022*12000#
  const buildUssdCode = (method: PaymentMethod) =>
    paymentInfo[method].ussdTemplate.replace("%s", String(Math.round(total)));

  if (loadingOrder) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
        <div className="bg-white rounded-3xl shadow-2xl p-10 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-brand-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (orderLoadError) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center animate-slide-up">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={22} />
          </div>
          <p className="font-semibold text-gray-900 mb-1.5">{t("cart.checkout.orderLoadFailedTitle")}</p>
          <p className="text-sm text-gray-500 mb-5">{t("cart.checkout.orderLoadFailedMessage")}</p>
          <button onClick={onClose} className="w-full py-3 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors">
            {t("cart.checkout.close")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-3xl z-10">
          <div className="flex items-center gap-3">
            {step !== "method" && step !== "confirmed" && (
              <button
                onClick={() => {
                  if (step === "awaiting") setStep("method");
                  if (step === "info") setStep("awaiting");
                }}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <ArrowLeft size={16} />
              </button>
            )}
            <div>
              <h2 className="font-display font-bold text-lg text-gray-900">
                {step === "method" && t("cart.checkout.chooseMethod")}
                {step === "awaiting" && t("cart.checkout.completePayment")}
                {step === "info" && t("cart.checkout.yourInformation")}
                {step === "confirmed" && (order?.status === "CANCELLED" ? t("cart.checkout.orderCancelled") : t("cart.checkout.orderConfirmed"))}
              </h2>
              {order && <p className="text-xs text-gray-400 font-mono">{order.id}</p>}
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Step indicator */}
        <div className="px-6 pt-4 pb-2">
          <div className="flex items-center gap-1">
            {[
              { key: "method", label: t("cart.checkout.stepPayment") },
              { key: "awaiting", label: t("cart.checkout.stepProof") },
              { key: "info", label: t("cart.checkout.stepInfo") },
              { key: "confirmed", label: t("cart.checkout.stepDone") },
            ].map((s, i) => {
              const stepOrder = ["method", "awaiting", "info", "confirmed"];
              const currentIdx = stepOrder.indexOf(step);
              const stepIdx = stepOrder.indexOf(s.key);
              const done = stepIdx < currentIdx;
              const active = stepIdx === currentIdx;
              return (
                <div key={s.key} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
                    <div className={clsx(
                      "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all",
                      done ? "bg-green-500 border-green-500 text-white"
                        : active ? "bg-brand-500 border-brand-500 text-white"
                        : "bg-white border-gray-200 text-gray-300"
                    )}>
                      {done ? "✓" : i + 1}
                    </div>
                    <span className={clsx("text-[9px] font-medium", active ? "text-brand-600" : done ? "text-green-600" : "text-gray-300")}>
                      {s.label}
                    </span>
                  </div>
                  {i < 3 && (
                    <div className={clsx("flex-1 h-0.5 mx-1 mb-3", stepIdx < currentIdx ? "bg-green-400" : "bg-gray-200")} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="px-6 pb-6 space-y-5">
          {/* ===== STEP 1: Choose payment method ===== */}
          {step === "method" && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-gray-50 rounded-2xl p-4 space-y-2 max-h-40 overflow-y-auto">
                {items.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-white">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={
                          (item.selectedImageIndex != null
                            ? item.product.media[item.selectedImageIndex]?.presignedUrl
                            : undefined) ?? item.product.media[0]?.presignedUrl
                        }
                        alt={localized(item.product.name, item.product.nameFr, language)}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{localized(item.product.name, item.product.nameFr, language)}</p>
                      <p className="text-xs text-gray-400">
                        {[
                          item.selectedColor || null,
                          item.selectedSize || null,
                          item.selectedImageIndex != null ? t("cart.items.photoLabel", { index: item.selectedImageIndex + 1 }) : null,
                        ].filter(Boolean).join(" · ")}
                        {" · ×"}{item.quantity}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-brand-600 flex-shrink-0">{formatPrice(getLineTotal(item))}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center bg-brand-50 rounded-xl px-4 py-3">
                <span className="font-semibold text-gray-700">{t("cart.checkout.totalToPay")}</span>
                <span className="font-bold text-2xl text-brand-600">{formatPrice(total)}</span>
              </div>

              <p className="text-sm text-gray-500 text-center">{t("cart.checkout.selectMethodPrompt")}</p>

              <button onClick={() => handleSelectMethod("ORANGE_MONEY")} className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-orange-200 bg-orange-50 hover:border-orange-400 hover:bg-orange-100 transition-all group text-left">
                <div className="w-14 h-14 rounded-2xl bg-white border border-orange-200 flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-105 transition-transform overflow-hidden p-1">
                  <Image src="/orange-money.png" alt="Orange Money" width={48} height={48} className="w-full h-full object-contain" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-base">{t("cart.checkout.orangeMoneyName")}</p>
                  <p className="text-sm text-orange-600">{t("cart.checkout.orangeMoneyDesc")}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{t("cart.checkout.orangeMoneyHint")}</p>
                </div>
                <ArrowLeft size={20} className="ml-auto text-orange-400 rotate-180 group-hover:translate-x-1 transition-transform" />
              </button>

              <button onClick={() => handleSelectMethod("MOBILE_MONEY")} className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-yellow-200 bg-yellow-50 hover:border-yellow-400 hover:bg-yellow-100 transition-all group text-left">
                <div className="w-14 h-14 rounded-2xl bg-white border border-yellow-200 flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-105 transition-transform overflow-hidden p-1">
                  <Image src="/MobileMoney.jpg" alt="MTN Mobile Money" width={48} height={48} className="w-full h-full object-contain" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-base">{t("cart.checkout.momoName")}</p>
                  <p className="text-sm text-yellow-600">{t("cart.checkout.momoDesc")}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{t("cart.checkout.momoHint")}</p>
                </div>
                <ArrowLeft size={20} className="ml-auto text-yellow-400 rotate-180 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Auth prompt */}
              {!customer && (
                <div className="border border-brand-100 bg-brand-50 rounded-2xl p-4 space-y-2">
                  <p className="text-sm font-semibold text-brand-700">{t("cart.checkout.authPrompt")}</p>
                  <p className="text-xs text-gray-500">{t("cart.checkout.authSubtitle")}</p>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => router.push("/register?redirect=" + encodeURIComponent("/cart?checkout=1"))}
                      className="flex-1 py-2 rounded-xl bg-brand-500 text-white text-xs font-semibold hover:bg-brand-600 transition-colors"
                    >
                      {t("cart.checkout.signUp")}
                    </button>
                    <button
                      onClick={() => router.push("/login?redirect=" + encodeURIComponent("/cart?checkout=1"))}
                      className="flex-1 py-2 rounded-xl border border-brand-300 text-brand-600 text-xs font-semibold hover:bg-brand-100 transition-colors"
                    >
                      {t("cart.checkout.logIn")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===== STEP 2: Copy code + upload screenshot ===== */}
          {step === "awaiting" && selectedMethod && (
            <div className="space-y-5 animate-fade-in">
              <div className={clsx("rounded-2xl border-2 p-5 text-center", paymentInfo[selectedMethod].bg)}>
                <div className="flex justify-center mb-3">
                  <div className="w-16 h-16 rounded-2xl bg-white border border-gray-200 shadow flex items-center justify-center overflow-hidden p-1.5">
                    <Image src={paymentInfo[selectedMethod].logo} alt={paymentInfo[selectedMethod].name} width={56} height={56} className="w-full h-full object-contain" />
                  </div>
                </div>
                <p className="font-semibold text-gray-700 mb-1">{t("cart.checkout.dialCodeToSend", { amount: formatPrice(total) })}</p>
                <p className="font-bold text-xl text-gray-900 tracking-wide mb-1 break-all">{buildUssdCode(selectedMethod)}</p>
                <p className={clsx("font-semibold text-sm", paymentInfo[selectedMethod].color)}>
                  {paymentInfo[selectedMethod].name} · {paymentInfo[selectedMethod].accountName}
                </p>
              </div>

              <button onClick={handleCopyCode} className={clsx(
                "w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 font-semibold text-sm transition-all",
                copied ? "border-green-400 bg-green-50 text-green-700" : "border-gray-200 hover:border-brand-300 hover:bg-brand-50 text-gray-700"
              )}>
                {copied ? <><Check size={18} className="text-green-500" />{t("cart.checkout.codeCopied")}</> : <><Copy size={18} />{t("cart.checkout.copyCode")}</>}
              </button>
              {copyFailed && (
                <p className="text-xs text-red-500 text-center mt-1.5">{t("cart.checkout.copyFailed")}</p>
              )}

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
                <strong>{t("cart.checkout.instructionsLabel")}</strong> {t("cart.checkout.instructionsBefore", { amount: formatPrice(total) })}<strong>{paymentInfo[selectedMethod].accountName}</strong>{t("cart.checkout.instructionsAfter")}
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">{t("cart.checkout.uploadPrompt")}</p>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                {!screenshotFile ? (
                  <button onClick={() => fileInputRef.current?.click()} className="w-full border-2 border-dashed border-gray-300 hover:border-brand-400 rounded-2xl p-8 flex flex-col items-center gap-3 transition-colors group">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 group-hover:bg-brand-50 flex items-center justify-center transition-colors">
                      <Upload size={22} className="text-gray-400 group-hover:text-brand-500" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-600 group-hover:text-brand-600">{t("cart.checkout.uploadCta")}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{t("cart.checkout.uploadHint")}</p>
                    </div>
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="relative rounded-2xl overflow-hidden border border-gray-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={screenshotPreview ?? undefined} alt={t("cart.checkout.paymentProofAlt")} className="w-full max-h-52 object-contain bg-gray-50" />
                      <button onClick={() => { setScreenshotFile(null); setScreenshotPreview(null); setScreenshotName(""); }} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 shadow flex items-center justify-center hover:bg-red-50 transition-colors">
                        <X size={14} className="text-gray-600" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 truncate">📎 {screenshotName}</p>
                  </div>
                )}
              </div>

              {screenshotFile && (
                <button onClick={handleSendProof} className="w-full btn-primary py-4 rounded-2xl text-base">
                  <Upload size={20} />{t("cart.checkout.sendProof")}
                </button>
              )}

              <button onClick={() => setChatOpen(true)} className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-gray-200 text-gray-500 hover:border-brand-300 hover:text-brand-500 transition-colors text-sm font-medium">
                <MessageCircle size={18} />{t("cart.checkout.needHelp")}
              </button>
            </div>
          )}

          {/* ===== STEP 3: Customer info ===== */}
          {step === "info" && (
            <div className="space-y-5 animate-fade-in">
              <p className="text-sm text-gray-500">{t("cart.checkout.infoSubtitle")}</p>

              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">{t("cart.checkout.deliveryQuestion")}</p>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setCustomerInfo((p) => ({ ...p, deliveryType: "DELIVERY" as DeliveryType }))} className={clsx("flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all", customerInfo.deliveryType === "DELIVERY" ? "border-brand-500 bg-brand-50 text-brand-700" : "border-gray-200 bg-white text-gray-500 hover:border-gray-300")}>
                    <Truck size={28} className={customerInfo.deliveryType === "DELIVERY" ? "text-brand-500" : "text-gray-400"} />
                    <div className="text-center"><p className="font-bold text-sm">{t("cart.checkout.delivery")}</p><p className="text-xs opacity-70">{t("cart.checkout.deliveryDesc")}</p></div>
                  </button>
                  <button onClick={() => setCustomerInfo((p) => ({ ...p, deliveryType: "PICKUP" as DeliveryType }))} className={clsx("flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all", customerInfo.deliveryType === "PICKUP" ? "border-brand-500 bg-brand-50 text-brand-700" : "border-gray-200 bg-white text-gray-500 hover:border-gray-300")}>
                    <Store size={28} className={customerInfo.deliveryType === "PICKUP" ? "text-brand-500" : "text-gray-400"} />
                    <div className="text-center"><p className="font-bold text-sm">{t("cart.checkout.pickup")}</p><p className="text-xs opacity-70">{t("cart.checkout.pickupDesc")}</p></div>
                  </button>
                </div>
              </div>

              {customerInfo.deliveryType === "PICKUP" && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700 flex gap-2">
                  <Store size={16} className="flex-shrink-0 mt-0.5" />
                  <span>{t("cart.checkout.pickupNotice")}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1"><User size={12} /> {t("cart.checkout.firstName")}</label>
                  <input type="text" value={customerInfo.firstName} onChange={(e) => setCustomerInfo((p) => ({ ...p, firstName: e.target.value }))} placeholder={t("cart.checkout.firstNamePlaceholder")} className={clsx("w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-colors", infoErrors.firstName ? "border-red-400 bg-red-50" : "border-gray-200 bg-gray-50 focus:border-brand-400 focus:bg-white")} />
                  {infoErrors.firstName && <p className="text-xs text-red-500 mt-1">{infoErrors.firstName}</p>}
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1"><User size={12} /> {t("cart.checkout.lastName")}</label>
                  <input type="text" value={customerInfo.lastName} onChange={(e) => setCustomerInfo((p) => ({ ...p, lastName: e.target.value }))} placeholder={t("cart.checkout.lastNamePlaceholder")} className={clsx("w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-colors", infoErrors.lastName ? "border-red-400 bg-red-50" : "border-gray-200 bg-gray-50 focus:border-brand-400 focus:bg-white")} />
                  {infoErrors.lastName && <p className="text-xs text-red-500 mt-1">{infoErrors.lastName}</p>}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1"><Phone size={12} /> {t("cart.checkout.phone")}</label>
                <input type="tel" value={customerInfo.phone} onChange={(e) => setCustomerInfo((p) => ({ ...p, phone: e.target.value }))} placeholder={t("cart.checkout.phonePlaceholder")} className={clsx("w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-colors", infoErrors.phone ? "border-red-400 bg-red-50" : "border-gray-200 bg-gray-50 focus:border-brand-400 focus:bg-white")} />
                {infoErrors.phone && <p className="text-xs text-red-500 mt-1">{infoErrors.phone}</p>}
              </div>

              {customerInfo.deliveryType === "DELIVERY" && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1"><MapPin size={12} /> {t("cart.checkout.town")}</label>
                    <input type="text" value={customerInfo.town ?? ""} onChange={(e) => setCustomerInfo((p) => ({ ...p, town: e.target.value }))} placeholder={t("cart.checkout.townPlaceholder")} className={clsx("w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-colors", infoErrors.town ? "border-red-400 bg-red-50" : "border-gray-200 bg-gray-50 focus:border-brand-400 focus:bg-white")} />
                    {infoErrors.town && <p className="text-xs text-red-500 mt-1">{infoErrors.town}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1"><MapPin size={12} /> {t("cart.checkout.street")}</label>
                    <input type="text" value={customerInfo.street ?? ""} onChange={(e) => setCustomerInfo((p) => ({ ...p, street: e.target.value }))} placeholder={t("cart.checkout.streetPlaceholder")} className={clsx("w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-colors", infoErrors.street ? "border-red-400 bg-red-50" : "border-gray-200 bg-gray-50 focus:border-brand-400 focus:bg-white")} />
                    {infoErrors.street && <p className="text-xs text-red-500 mt-1">{infoErrors.street}</p>}
                  </div>
                </>
              )}

              {submitError && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-600">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <span>{submitError}</span>
                </div>
              )}

              <button onClick={handleInfoSubmit} disabled={sending} className="w-full btn-primary py-4 rounded-2xl text-base">
                {sending ? (
                  <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t("cart.checkout.placingOrder")}</>
                ) : (
                  <>{t("cart.checkout.confirmOrder")}</>
                )}
              </button>
            </div>
          )}

          {/* ===== STEP 4: Confirmed ===== */}
          {step === "confirmed" && (
            <div className="space-y-5 animate-fade-in text-center">
              {order?.status === "CANCELLED" ? (
                <div className="py-6">
                  <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                    <AlertCircle size={40} className="text-red-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{t("cart.checkout.cancelledTitle")}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">
                    {t("cart.checkout.cancelledBody")}
                  </p>
                </div>
              ) : (
                <div className="py-6">
                  <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={40} className="text-green-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{t("cart.checkout.successTitle")}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">
                    {t("cart.checkout.successBodyBefore")}
                    <strong>{t("cart.checkout.successBodyStrong")}</strong>{t("cart.checkout.successBodyAfter")}
                  </p>
                </div>
              )}

              {order?.status === "CANCELLED" && order.rejectionReason && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-left">
                  <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-1">{t("cart.checkout.reasonLabel")}</p>
                  <p className="text-sm text-red-800">{order.rejectionReason}</p>
                </div>
              )}

              {order && (
                <button
                  onClick={async () => {
                    if (downloadingReceipt) return;
                    setDownloadingReceipt(true);
                    setReceiptError(false);
                    try {
                      await downloadReceipt(order);
                    } catch {
                      setReceiptError(true);
                    } finally {
                      setDownloadingReceipt(false);
                    }
                  }}
                  disabled={downloadingReceipt}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed font-medium text-sm transition-colors"
                >
                  {downloadingReceipt ? (
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                  ) : (
                    <Printer size={18} />
                  )}
                  {t("cart.checkout.downloadReceipt")}
                </button>
              )}
              {receiptError && (
                <p className="text-xs text-red-500 text-center -mt-2">{t("cart.checkout.receiptFailed")}</p>
              )}

              {order && (
                <div className={clsx(
                  "rounded-2xl border p-4 text-left space-y-2",
                  order.status === "CANCELLED" ? "bg-gray-50 border-gray-200" : "bg-green-50 border-green-100"
                )}>
                  <div className="flex items-center justify-between">
                    <p className={clsx("text-xs font-semibold uppercase tracking-wide", order.status === "CANCELLED" ? "text-gray-600" : "text-green-800")}>{t("cart.checkout.orderSummaryLabel")}</p>
                    <StatusBadge status={order.status} />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{t("cart.checkout.orderIdLabel")}</span>
                    <span className="font-mono font-semibold text-gray-800">{order.id}</span>
                  </div>
                  {order.customerInfo && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">{t("cart.checkout.nameLabel")}</span>
                        <span className="font-medium text-gray-800">{order.customerInfo.firstName} {order.customerInfo.lastName}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">{t("cart.checkout.phoneLabel")}</span>
                        <span className="font-medium text-gray-800">{order.customerInfo.phone}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">{t("cart.checkout.deliveryLabel")}</span>
                        <span className="font-medium text-gray-800 flex items-center gap-1">
                          {order.customerInfo.deliveryType === "DELIVERY" ? <><Truck size={13} className="text-brand-500" />{t("cart.checkout.delivery")}</> : <><Store size={13} className="text-brand-500" />{t("cart.checkout.pickup")}</>}
                        </span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{t("cart.checkout.amountLabel")}</span>
                    <span className={clsx("font-bold", order.status === "CANCELLED" ? "text-gray-700" : "text-green-700")}>{formatPrice(order.total)}</span>
                  </div>
                </div>
              )}

              {order && (
                <Link
                  href={`/track/${order.id}`}
                  className="block text-center text-sm font-semibold text-brand-500 hover:text-brand-600 transition-colors py-1"
                >
                  {t("cart.checkout.trackOrder")}
                </Link>
              )}

              {order?.status !== "CANCELLED" && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-left">
                  <p className="text-sm font-semibold text-amber-800 mb-1">{t("cart.checkout.whatNext")}</p>
                  <ul className="text-xs text-amber-700 space-y-1">
                    <li>• {t("cart.checkout.nextReview")}</li>
                    <li>• {t("cart.checkout.nextCall")}</li>
                    <li>• {t("cart.checkout.nextShip")}</li>
                  </ul>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <button onClick={() => setChatOpen(true)} className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-brand-200 text-brand-600 hover:bg-brand-50 font-medium text-sm transition-colors">
                  <MessageCircle size={18} />{t("cart.checkout.chatAboutOrder")}
                </button>
                <button onClick={() => { onClose(); router.push("/products"); }} className="w-full btn-primary py-4 rounded-2xl text-base">
                  <ShoppingBag size={20} />{t("cart.checkout.continueShopping")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
