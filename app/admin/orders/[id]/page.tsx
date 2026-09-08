"use client";

import AdminShell from "@/components/admin/AdminShell";
import { useAdminStore } from "@/lib/adminStore";
import * as ordersApi from "@/lib/api/orders";
import * as conversationsApi from "@/lib/api/conversations";
import { useAdminColors } from "@/lib/useAdminColors";
import { formatPrice } from "@/lib/data";
import { Order, OrderStatus } from "@/lib/types";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ConfirmDialog, { ConfirmState } from "@/components/admin/ConfirmDialog";
import DeliveryTeamCard from "@/components/shared/DeliveryTeamCard";
import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft, CheckCircle2, XCircle, Clock,
  CreditCard, Package, ZoomIn, MessageSquare,
  Truck, Paperclip, X as XIcon, PackageCheck, Loader2,
} from "lucide-react";
import clsx from "clsx";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const token = useAdminStore((s) => s.session?.token);
  const adminId = useAdminStore((s) => s.session?.id);
  const isSuperAdmin = useAdminStore((s) => s.isSuperAdmin());
  const hasSendPackagingMessagePermission = useAdminStore((s) => s.hasPermission("SEND_PACKAGING_MESSAGE"));
  const c = useAdminColors();
  const { t } = useTranslation();

  const statusMeta: Record<OrderStatus, { label: string }> = {
    PENDING:          { label: t("adminOrders.status.pending") },
    AWAITING_PAYMENT: { label: t("adminOrders.status.awaitingPayment") },
    REVIEWING:        { label: t("adminOrders.status.reviewing") },
    VALIDATED:        { label: `${t("adminOrders.status.validated")} ✓` },
    PACKAGING:        { label: t("adminOrders.status.packaging") },
    PACKAGED:         { label: `${t("adminOrders.status.packaged")} ✓` },
    CANCELLED:        { label: t("adminOrders.status.cancelled") },
  };

  const steps: { key: OrderStatus; label: string }[] = [
    { key: "PENDING",          label: t("adminOrders.steps.orderPlaced") },
    { key: "AWAITING_PAYMENT", label: t("adminOrders.steps.payment") },
    { key: "REVIEWING",        label: t("adminOrders.steps.review") },
    { key: "VALIDATED",        label: t("adminOrders.steps.validated") },
    { key: "PACKAGING",        label: t("adminOrders.steps.packaging") },
    { key: "PACKAGED",         label: t("adminOrders.steps.packaged") },
  ];
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const [zoomImg, setZoomImg] = useState(false);
  const [chatMsg, setChatMsg] = useState("");
  const [chatSent, setChatSent] = useState(false);
  const [chatSending, setChatSending] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [statusBusy, setStatusBusy] = useState(false);
  const [chatImage, setChatImage] = useState<File | null>(null);
  const [chatImagePreview, setChatImagePreview] = useState<string | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!id) return;
    ordersApi
      .getOrder(id)
      .then(setOrder)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <AdminShell>
        <div className="p-8 text-center text-sm text-gray-400">{t("adminOrders.detail.loading")}</div>
      </AdminShell>
    );
  }

  if (!order) {
    return (
      <AdminShell>
        <div className="p-8 text-center space-y-3">
          <p className={clsx("text-sm", c.textMuted)}>{t("adminOrders.detail.notFound")}</p>
          <Link href="/admin/orders" className="text-brand-500 underline text-sm">
            {t("adminOrders.detail.backToOrders")}
          </Link>
        </div>
      </AdminShell>
    );
  }

  const stepOrder: OrderStatus[] = ["PENDING", "AWAITING_PAYMENT", "REVIEWING", "VALIDATED", "PACKAGING", "PACKAGED"];
  const currentIdx = order.status === "CANCELLED" ? -1 : stepOrder.indexOf(order.status);
  const statusLocked = order.status === "VALIDATED" || order.status === "PACKAGING" || order.status === "PACKAGED";
  // Sending the packaging confirmation is restricted to whoever started
  // packing this specific order, a super admin, or anyone separately
  // granted SEND_PACKAGING_MESSAGE — not just anyone with that permission
  // acting on an order someone else packed.
  const canSendPackagingMessage = isSuperAdmin || order.packagingStartedById === adminId || hasSendPackagingMessagePermission;
  const packagingLocked = order.status === "PACKAGED" && !canSendPackagingMessage;
  // While packaging is in progress, there's nothing useful to tell the
  // customer yet — the composer re-opens once it's marked done (as the
  // packaging-confirmation send, gated by packagingLocked above).
  const packagingInProgress = order.status === "PACKAGING";
  const messagingLocked = packagingInProgress || packagingLocked;
  const lockReasonHint = packagingInProgress
    ? t("adminOrders.detail.messageHintPackagingInProgress")
    : t("adminOrders.detail.messageHintPackagingNoPermission");

  const setStatus = async (status: OrderStatus, reason?: string) => {
    if (!token) return;
    setStatusBusy(true);
    try {
      const updated = await ordersApi.updateOrderStatus(order.id, status, token, reason);
      setOrder(updated);
    } finally {
      setStatusBusy(false);
    }
  };

  const askReject = () => {
    setConfirm({
      title: t("adminOrders.confirm.rejectTitle"),
      message: t("adminOrders.confirm.rejectMessage"),
      confirmLabel: t("adminOrders.confirm.rejectConfirmLabel"),
      input: {
        label: t("adminOrders.confirm.rejectReasonLabel"),
        placeholder: t("adminOrders.confirm.rejectReasonPlaceholder"),
        required: true,
      },
      onConfirm: async (reason) => {
        await setStatus("CANCELLED", reason);
        setConfirm(null);
      },
    });
  };

  const handlePickChatImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setChatImage(file);
    setChatImagePreview(URL.createObjectURL(file));
  };

  const clearChatImage = () => {
    if (chatImagePreview) URL.revokeObjectURL(chatImagePreview);
    setChatImage(null);
    setChatImagePreview(null);
  };

  const handleSendMessage = async () => {
    if ((!chatMsg.trim() && !chatImage) || !token || chatSending) return;
    if (messagingLocked) return;
    const text = chatMsg.trim();
    const image = chatImage ?? undefined;
    setChatSending(true);
    setChatError(null);
    try {
      if (order.status === "PACKAGED") {
        // Packaging confirmation — the backend appends the delivery team's
        // contact info automatically and this becomes findable by a guest's
        // tracking page (GET /api/conversations/order/{orderId}).
        await conversationsApi.sendPackagingConfirmation(order.id, token, text || undefined, image);
        setOrder(await ordersApi.getOrder(order.id));
      } else {
        // Match by customerId first — that's the thread the customer's own
        // chat widget will find and reuse. Fall back to orderId for guest
        // orders, then create a fresh thread only if neither turns one up.
        const existing = await conversationsApi.listConversations(token);
        let conv = order.customerId
          ? existing.find((cv) => cv.customerId === order.customerId)
          : existing.find((cv) => cv.orderId === order.id);
        if (!conv) {
          const name = order.customerInfo ? `${order.customerInfo.firstName} ${order.customerInfo.lastName}` : "Customer";
          conv = await conversationsApi.createConversation({ customerName: name, customerId: order.customerId ?? undefined, orderId: order.id });
        }
        if (image) {
          await conversationsApi.sendImageMessage(conv.id, "ADMIN", image, text || undefined, token);
        } else {
          await conversationsApi.sendMessage({ conversationId: conv.id, sender: "ADMIN", text }, token);
        }
      }
      setChatMsg("");
      clearChatImage();
      setChatSent(true);
      setTimeout(() => setChatSent(false), 2000);
    } catch (e) {
      // Keep the draft in place so nothing typed gets lost on a failed send.
      setChatError(e instanceof Error ? e.message : t("adminOrders.detail.messageSendError"));
    } finally {
      setChatSending(false);
    }
  };

  return (
    <AdminShell>
      <div className="p-6 lg:p-8 space-y-6">

        {/* ── Header ── */}
        <div className="flex items-center gap-4 flex-wrap">
          <button
            onClick={() => router.back()}
            className={clsx("flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg transition-colors", c.isDark ? "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900")}
          >
            <ArrowLeft size={16} /> {t("adminOrders.detail.back")}
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className={clsx("text-xl font-bold font-mono", c.textPrimary)}>{order.id}</h1>
              <span className={clsx("inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full", c.status[order.status])}>
                {statusMeta[order.status].label}
              </span>
            </div>
            <p className={clsx("text-xs mt-0.5", c.textMuted)}>
              {t("adminOrders.detail.placedOn", {
                date: new Date(order.createdAt).toLocaleDateString("en-GB", {
                  day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
                }),
              })}
            </p>
          </div>

          {order.status === "REVIEWING" && (
            <div className="flex gap-3">
              <button onClick={() => setStatus("VALIDATED")} disabled={statusBusy}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500 hover:bg-green-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors">
                {statusBusy ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} {t("adminOrders.detail.validateOrder")}
              </button>
              <button onClick={askReject} disabled={statusBusy}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 disabled:opacity-60 disabled:cursor-not-allowed text-red-500 text-sm font-semibold border border-red-500/20 transition-colors">
                <XCircle size={16} /> {t("adminOrders.detail.cancel")}
              </button>
            </div>
          )}
          {order.status === "AWAITING_PAYMENT" && (
            <button onClick={askReject} disabled={statusBusy}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 disabled:opacity-60 disabled:cursor-not-allowed text-red-500 text-sm font-semibold border border-red-500/20 transition-colors">
              {statusBusy ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />} {t("adminOrders.detail.cancelOrder")}
            </button>
          )}
        </div>

        {/* ── Progress timeline ── */}
        {order.status !== "CANCELLED" && (
          <div className={clsx("rounded-2xl border p-5", c.card)}>
            <h2 className={clsx("text-sm font-semibold mb-5", c.textPrimary)}>{t("adminOrders.detail.progressHeading")}</h2>
            <div className="flex items-center">
              {steps.map((step, i) => {
                const done = i <= currentIdx;
                const active = i === currentIdx;
                return (
                  <div key={step.key} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center gap-1">
                      <div className={clsx(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all",
                        done && !active ? "bg-green-500 border-green-500 text-white"
                        : active        ? "bg-brand-500 border-brand-500 text-white"
                        : c.isDark      ? "bg-gray-800 border-gray-600 text-gray-500"
                                        : "bg-gray-100 border-gray-300 text-gray-400"
                      )}>
                        {done && !active ? "✓" : i + 1}
                      </div>
                      <span className={clsx(
                        "text-[10px] font-medium text-center max-w-[64px] leading-tight",
                        active ? "text-brand-500" : done ? "text-green-500" : c.textMuted
                      )}>
                        {step.label}
                      </span>
                    </div>
                    {i < steps.length - 1 && (
                      <div className={clsx("flex-1 h-0.5 mx-2 mb-5", i < currentIdx ? "bg-green-500" : c.isDark ? "bg-gray-700" : "bg-gray-200")} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {order.status === "CANCELLED" && order.rejectionReason && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
            <h2 className="text-sm font-semibold mb-1.5 text-red-500 flex items-center gap-2">
              <XCircle size={15} /> {t("adminOrders.detail.rejectionReasonHeading")}
            </h2>
            <p className={clsx("text-sm leading-relaxed", c.textSecondary)}>{order.rejectionReason}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left: items + payment ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Order items */}
            <div className={clsx("rounded-2xl border p-5", c.card)}>
              <h2 className={clsx("font-semibold mb-4 flex items-center gap-2", c.textPrimary)}>
                <Package size={16} className="text-brand-500" /> {t("adminOrders.detail.orderItemsHeading")}
              </h2>
              <div className="space-y-3">
                {order.items.map((item, i) => (
                  <div key={i} className={clsx("flex gap-4 p-3 rounded-xl", c.innerCard)}>
                    {/* Product image */}
                    <div className={clsx("w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border", c.border)}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.productThumbnailUrl ?? undefined} alt={item.productName} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={clsx("text-base font-bold truncate", c.textPrimary)}>{item.productName}</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {item.selectedColor && (
                          <span className={clsx("text-xs px-2 py-0.5 rounded-full", c.isDark ? "bg-gray-700 text-gray-400" : "bg-gray-100 text-gray-600")}>
                            {item.selectedColor}
                          </span>
                        )}
                        {item.selectedSize && (
                          <span className={clsx("text-xs px-2 py-0.5 rounded-full", c.isDark ? "bg-gray-700 text-gray-400" : "bg-gray-100 text-gray-600")}>
                            {item.selectedSize}
                          </span>
                        )}
                        {item.selectedImageIndex != null && (
                          <span className={clsx("text-xs px-2 py-0.5 rounded-full", c.isDark ? "bg-gray-700 text-gray-400" : "bg-gray-100 text-gray-600")}>
                            {t("adminOrders.detail.photoLabel", { index: item.selectedImageIndex + 1 })}
                          </span>
                        )}
                        <span className={clsx("text-xs px-2 py-0.5 rounded-full font-semibold", c.isDark ? "bg-brand-500/15 text-brand-400" : "bg-brand-50 text-brand-600")}>
                          ×{item.quantity}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={clsx("text-sm font-bold", c.textPrimary)}>{formatPrice(item.unitPrice * item.quantity)}</p>
                      <p className={clsx("text-xs", c.textMuted)}>{formatPrice(item.unitPrice)} {t("adminOrders.detail.each")}</p>
                    </div>
                  </div>
                ))}
              </div>
              {/* Total */}
              <div className={clsx("mt-4 pt-4 border-t flex justify-between", c.border)}>
                <span className={clsx("font-medium", c.textSecondary)}>{t("adminOrders.detail.total")}</span>
                <span className={clsx("text-xl font-bold", c.textPrimary)}>{formatPrice(order.total)}</span>
              </div>
            </div>

            {/* Payment info */}
            <div className={clsx("rounded-2xl border p-5", c.card)}>
              <h2 className={clsx("font-semibold mb-4 flex items-center gap-2", c.textPrimary)}>
                <CreditCard size={16} className="text-brand-500" /> {t("adminOrders.detail.paymentInfoHeading")}
              </h2>
              {order.paymentMethod ? (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className={c.textSecondary}>{t("adminOrders.detail.method")}</span>
                    <span className={clsx("font-medium", c.textPrimary)}>
                      {order.paymentMethod === "ORANGE_MONEY" ? t("adminOrders.payment.orangeMoneyFull") : t("adminOrders.payment.momoFull")}
                    </span>
                  </div>
                  {order.paymentCode && (
                    <div className="flex justify-between text-sm gap-3">
                      <span className={c.textSecondary}>{t("adminOrders.detail.codeUsed")}</span>
                      <span className={clsx("font-mono text-right break-all", c.textPrimary)}>{order.paymentCode}</span>
                    </div>
                  )}
                  {order.paymentAccountName && (
                    <div className="flex justify-between text-sm">
                      <span className={c.textSecondary}>{t("adminOrders.detail.account")}</span>
                      <span className={clsx("font-medium", c.textPrimary)}>{order.paymentAccountName}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className={c.textSecondary}>{t("adminOrders.detail.amount")}</span>
                    <span className="font-bold text-brand-500">{formatPrice(order.total)}</span>
                  </div>
                </div>
              ) : (
                <p className={clsx("text-sm", c.textMuted)}>{t("adminOrders.detail.noPaymentMethod")}</p>
              )}
            </div>

            {/* Shipping info — what the customer entered at checkout */}
            {order.customerInfo && (
              <div className={clsx("rounded-2xl border p-5", c.card)}>
                <h2 className={clsx("font-semibold mb-4 flex items-center gap-2", c.textPrimary)}>
                  <Truck size={16} className="text-brand-500" /> {t("adminOrders.detail.shippingInfoHeading")}
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className={c.textSecondary}>{t("adminOrders.detail.recipient")}</span>
                    <span className={clsx("font-medium", c.textPrimary)}>
                      {order.customerInfo.firstName} {order.customerInfo.lastName}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className={c.textSecondary}>{t("adminOrders.detail.phone")}</span>
                    <span className={clsx("font-medium", c.textPrimary)}>{order.customerInfo.phone}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className={c.textSecondary}>{t("adminOrders.detail.deliveryType")}</span>
                    <span className={clsx("font-medium", c.textPrimary)}>
                      {order.customerInfo.deliveryType === "DELIVERY"
                        ? t("adminOrders.detail.deliveryTypeDelivery")
                        : t("adminOrders.detail.deliveryTypePickup")}
                    </span>
                  </div>
                  {order.customerInfo.town && (
                    <div className="flex justify-between text-sm gap-3">
                      <span className={c.textSecondary}>{t("adminOrders.detail.town")}</span>
                      <span className={clsx("font-medium text-right", c.textPrimary)}>{order.customerInfo.town}</span>
                    </div>
                  )}
                  {order.customerInfo.street && (
                    <div className="flex justify-between text-sm gap-3">
                      <span className={c.textSecondary}>{t("adminOrders.detail.street")}</span>
                      <span className={clsx("font-medium text-right", c.textPrimary)}>{order.customerInfo.street}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Payment screenshot */}
            {order.paymentScreenshotUrl && (
              <div className={clsx("rounded-2xl border p-5", c.card)}>
                <h2 className={clsx("font-semibold mb-4 flex items-center gap-2", c.textPrimary)}>
                  <CheckCircle2 size={16} className="text-blue-500" />
                  {t("adminOrders.detail.paymentProofHeading")}
                  <span className="ml-auto text-xs bg-blue-500/15 text-blue-500 border border-blue-500/20 px-2 py-0.5 rounded-full">
                    {t("adminOrders.detail.submittedByCustomer")}
                  </span>
                </h2>
                <div className="relative group cursor-zoom-in" onClick={() => setZoomImg(true)}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={order.paymentScreenshotUrl ?? undefined}
                    alt={t("adminOrders.detail.paymentProofAlt")}
                    className={clsx("w-full max-h-64 object-contain rounded-xl border", c.border, c.isDark ? "bg-gray-900" : "bg-gray-50")}
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 rounded-xl flex items-center justify-center transition-opacity">
                    <ZoomIn size={28} className="text-white" />
                  </div>
                </div>
                {order.status === "REVIEWING" && (
                  <div className="flex gap-3 mt-4">
                    <button onClick={() => setStatus("VALIDATED")} disabled={statusBusy}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-green-500 hover:bg-green-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors">
                      {statusBusy ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} {t("adminOrders.detail.approveValidate")}
                    </button>
                    <button onClick={askReject} disabled={statusBusy}
                      className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/15 hover:bg-red-500/25 disabled:opacity-60 disabled:cursor-not-allowed text-red-500 font-semibold text-sm border border-red-500/20 transition-colors">
                      <XCircle size={16} /> {t("adminOrders.detail.reject")}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Right: timeline + message ── */}
          <div className="space-y-5">

            {/* Order meta / timeline */}
            <div className={clsx("rounded-2xl border p-5", c.card)}>
              <h2 className={clsx("font-semibold mb-4 flex items-center gap-2", c.textPrimary)}>
                <Clock size={16} className="text-brand-500" /> {t("adminOrders.detail.timelineHeading")}
              </h2>
              <div className="space-y-3">
                {[
                  { label: t("adminOrders.detail.created"),     value: new Date(order.createdAt).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) },
                  { label: t("adminOrders.detail.lastUpdate"), value: new Date(order.updatedAt).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between text-sm">
                    <span className={c.textSecondary}>{row.label}</span>
                    <span className={clsx("text-xs", c.textPrimary)}>{row.value}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm items-center">
                  <span className={c.textSecondary}>{t("adminOrders.detail.status")}</span>
                  <span className={clsx("text-xs font-semibold px-2 py-0.5 rounded-full", c.status[order.status])}>
                    {statusMeta[order.status].label}
                  </span>
                </div>
                {order.statusChangedByName && (
                  <div className="flex justify-between text-sm">
                    <span className={c.textSecondary}>{t("adminOrders.detail.changedBy")}</span>
                    <span className={clsx("text-xs", c.textPrimary)}>
                      {order.statusChangedByName}
                      {order.statusChangedAt && ` · ${new Date(order.statusChangedAt).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}`}
                    </span>
                  </div>
                )}
                {order.packagingStartedByName && (
                  <div className="flex justify-between text-sm">
                    <span className={c.textSecondary}>{t("adminOrders.detail.packagingStarted")}</span>
                    <span className={clsx("text-xs", c.textPrimary)}>
                      {order.packagingStartedByName}
                      {order.packagingStartedAt && ` · ${new Date(order.packagingStartedAt).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}`}
                    </span>
                  </div>
                )}
                {order.packagingCompletedByName && (
                  <div className="flex justify-between text-sm">
                    <span className={c.textSecondary}>{t("adminOrders.detail.packagingDone")}</span>
                    <span className={clsx("text-xs", c.textPrimary)}>
                      {order.packagingCompletedByName}
                      {order.packagingCompletedAt && ` · ${new Date(order.packagingCompletedAt).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}`}
                    </span>
                  </div>
                )}
              </div>

              {/* Change status — locked once the order has moved past review, so a mis-click
                  here can't undo a validated/packaged order; use the packaging actions
                  below or Treatment instead. */}
              {!statusLocked && (
              <div className={clsx("mt-4 pt-4 border-t", c.border)}>
                <p className={clsx("text-xs font-medium uppercase tracking-wide mb-2", c.textMuted)}>{t("adminOrders.detail.changeStatus")}</p>
                <div className="grid grid-cols-2 gap-2">
                  {(["PENDING", "AWAITING_PAYMENT", "REVIEWING", "VALIDATED", "CANCELLED"] as OrderStatus[])
                    .filter((s) => s !== order.status)
                    .map((s) => (
                      <button key={s} onClick={() => (s === "CANCELLED" ? askReject() : setStatus(s))}
                        className={clsx(
                          "text-xs py-1.5 px-2 rounded-lg font-medium transition-colors",
                          s === "VALIDATED" ? "bg-green-500/15 text-green-500 hover:bg-green-500/25"
                          : s === "CANCELLED" ? "bg-red-500/15 text-red-500 hover:bg-red-500/25"
                          : c.isDark ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                     : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        )}
                      >
                        → {statusMeta[s].label}
                      </button>
                    ))}
                </div>
              </div>
              )}
            </div>

            {/* Message customer */}
            <div className={clsx("rounded-2xl border p-5", c.card)}>
              <h2 className={clsx("font-semibold mb-1 flex items-center gap-2", c.textPrimary)}>
                <MessageSquare size={16} className="text-brand-500" /> {t("adminOrders.detail.messageCustomerHeading")}
              </h2>
              <p className={clsx("text-xs mb-3", messagingLocked ? "text-amber-500 font-medium" : c.textMuted)}>
                {packagingInProgress
                  ? t("adminOrders.detail.messageHintPackagingInProgress")
                  : order.status === "PACKAGED"
                  ? t(packagingLocked ? "adminOrders.detail.messageHintPackagingNoPermission" : "adminOrders.detail.messageHintPackaging")
                  : order.customerId
                  ? t("adminOrders.detail.messageHintWithChat")
                  : t("adminOrders.detail.messageHintGuest")}
              </p>

              {order.packagingConfirmation && (
                <div className={clsx("mb-3 rounded-xl p-3 border", c.isDark ? "bg-teal-900/15 border-teal-500/20" : "bg-teal-50 border-teal-200")}>
                  <p className={clsx("text-xs font-semibold flex items-center gap-1.5 mb-1", c.isDark ? "text-teal-300" : "text-teal-700")}>
                    <PackageCheck size={13} /> {t("adminOrders.detail.packagingConfirmationSent")}
                  </p>
                  {order.packagingConfirmation.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={order.packagingConfirmation.imageUrl} alt="" className="rounded-lg max-h-28 object-cover mb-1.5" />
                  )}
                  {order.packagingConfirmation.text && (
                    <p className={clsx("text-xs whitespace-pre-line mb-1.5", c.textSecondary)}>{order.packagingConfirmation.text}</p>
                  )}
                  <DeliveryTeamCard contacts={order.packagingConfirmation.deliveryContacts} compact />
                </div>
              )}

              <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePickChatImage} className="hidden" />
              {chatImagePreview && (
                <div className="relative inline-block mb-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={chatImagePreview} alt="" className="h-16 w-16 rounded-xl object-cover border border-gray-200" />
                  <button onClick={clearChatImage} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gray-800 text-white flex items-center justify-center shadow">
                    <XIcon size={11} />
                  </button>
                </div>
              )}
              <textarea
                value={chatMsg}
                onChange={(e) => { setChatMsg(e.target.value); setChatError(null); }}
                placeholder={
                  order.status === "PACKAGED"
                    ? t("adminOrders.detail.messagePackagingPlaceholder")
                    : t("adminOrders.detail.messagePlaceholder")
                }
                rows={3}
                disabled={messagingLocked}
                className={clsx(
                  "w-full border rounded-xl p-3 text-sm resize-none outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                  c.isDark
                    ? "bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-brand-500"
                    : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-brand-400"
                )}
              />
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={messagingLocked}
                  title={messagingLocked ? lockReasonHint : t("adminOrders.detail.attachPhoto")}
                  className={clsx("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors disabled:opacity-40 disabled:cursor-not-allowed", c.btnGhost)}
                >
                  <Paperclip size={16} />
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={(!chatMsg.trim() && !chatImage) || chatSending || messagingLocked}
                  title={messagingLocked ? lockReasonHint : undefined}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
                >
                  {chatSending ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : chatSent ? null : order.status === "PACKAGED" ? (
                    <PackageCheck size={15} />
                  ) : null}
                  {chatSent
                    ? t("adminOrders.detail.messageSent")
                    : order.status === "PACKAGED"
                    ? t("adminOrders.detail.sendPackagingConfirmation")
                    : t("adminOrders.detail.sendMessage")}
                </button>
              </div>
              {chatError && (
                <p className="text-xs text-red-500 mt-2">{chatError}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Zoom modal */}
      {zoomImg && order.paymentScreenshotUrl && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setZoomImg(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={order.paymentScreenshotUrl ?? undefined} alt={t("adminOrders.detail.paymentProofFullscreenAlt")}
            className="max-w-full max-h-full rounded-xl shadow-2xl object-contain" />
        </div>
      )}

      <ConfirmDialog state={confirm} onCancel={() => setConfirm(null)} />
    </AdminShell>
  );
}
