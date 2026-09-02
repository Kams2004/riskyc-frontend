import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { Order } from "@/lib/types";

/** Both callers of this module only ever run client-side (button click handlers, never SSR). */
export function trackingUrl(orderId: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/track/${orderId}`;
}

/**
 * The receipt's QR code deliberately encodes a plain "riskyc-order:<id>"
 * string — not a URL — so a customer's own camera app just shows inert
 * text with nothing to tap. Real order details only ever load when this
 * exact payload is decoded by the admin panel's own scanner (see
 * components/admin/OrderQrScanner.tsx), which already requires an admin to
 * be logged in to reach it at all — the same gate as clicking through to
 * the order normally.
 */
export const ORDER_QR_PREFIX = "riskyc-order:";

export function orderQrPayload(orderId: string): string {
  return `${ORDER_QR_PREFIX}${orderId}`;
}

/** Returns the order id if `raw` is a recognized order QR payload, else null. */
export function parseOrderQrPayload(raw: string): string | null {
  const trimmed = raw.trim();
  return trimmed.startsWith(ORDER_QR_PREFIX) ? trimmed.slice(ORDER_QR_PREFIX.length) : null;
}

// The app's own formatPrice() uses Intl.NumberFormat("fr-CM", ...), which
// inserts a narrow no-break space (U+202F) as the thousands separator —
// jsPDF's core Helvetica font has no glyph for that character and silently
// renders it as "/". A plain ASCII space sidesteps that entirely.
function pdfFormatPrice(price: number): string {
  const withSpaces = Math.round(price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${withSpaces} FCFA`;
}

/** Builds and triggers a download of a one-page PDF receipt for an order, including its tracking link and a staff scan code. */
export async function downloadReceipt(order: Order) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 48;
  let y = 56;

  // Header
  doc.setFillColor(255, 26, 94);
  doc.rect(0, 0, pageWidth, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(20, 20, 20);
  doc.text("Riskyc Fashion", margin, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text("Order Receipt", margin, y + 16);
  y += 44;

  doc.setDrawColor(230, 230, 230);
  doc.line(margin, y, pageWidth - margin, y);
  y += 24;

  // Order meta
  doc.setFontSize(10);
  doc.setTextColor(90, 90, 90);
  doc.text("Order ID", margin, y);
  doc.text("Date", pageWidth - margin - 140, y);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20, 20, 20);
  doc.text(order.id, margin, y + 14);
  doc.text(new Date(order.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }), pageWidth - margin - 140, y + 14);
  y += 36;

  if (order.customerInfo) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(90, 90, 90);
    doc.text("Customer", margin, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(20, 20, 20);
    doc.text(`${order.customerInfo.firstName} ${order.customerInfo.lastName}  ·  ${order.customerInfo.phone}`, margin, y + 14);
    y += 36;
  }

  // Items table header
  doc.setDrawColor(230, 230, 230);
  doc.line(margin, y, pageWidth - margin, y);
  y += 18;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text("ITEM", margin, y);
  doc.text("QTY", pageWidth - margin - 160, y);
  doc.text("PRICE", pageWidth - margin - 60, y, { align: "right" });
  y += 10;
  doc.setDrawColor(230, 230, 230);
  doc.line(margin, y, pageWidth - margin, y);
  y += 18;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(30, 30, 30);
  for (const item of order.items) {
    const label = [
      item.productName,
      item.selectedColor,
      item.selectedSize,
    ].filter(Boolean).join(" — ");
    const lines = doc.splitTextToSize(label, pageWidth - margin * 2 - 180);
    doc.text(lines, margin, y);
    doc.text(String(item.quantity), pageWidth - margin - 160, y);
    doc.text(pdfFormatPrice(item.unitPrice * item.quantity), pageWidth - margin - 60, y, { align: "right" });
    y += 16 * lines.length + 6;
  }

  y += 8;
  doc.setDrawColor(230, 230, 230);
  doc.line(margin, y, pageWidth - margin, y);
  y += 22;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(255, 26, 94);
  doc.text("Total", margin, y);
  doc.text(pdfFormatPrice(order.total), pageWidth - margin, y, { align: "right" });
  y += 40;

  // Tracking link + staff scan code, side by side
  const url = trackingUrl(order.id);
  const boxHeight = 72;
  const qrSize = 56;
  const qrGap = 16;
  const trackingBoxWidth = pageWidth - margin * 2 - qrSize - qrGap;

  doc.setFillColor(250, 245, 247);
  doc.roundedRect(margin, y, trackingBoxWidth, boxHeight, 8, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(20, 20, 20);
  doc.text("Track your order", margin + 16, y + 26);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(255, 26, 94);
  doc.textWithLink(url, margin + 16, y + 44, { url });

  const qrX = margin + trackingBoxWidth + qrGap;
  try {
    // Default quiet-zone margin (4 modules, the spec-recommended minimum) —
    // a tighter margin looked fine on screen but made the code genuinely
    // unreliable to scan, confirmed while testing this against a real decoder.
    const qrDataUrl = await QRCode.toDataURL(orderQrPayload(order.id), { width: 240 });
    doc.addImage(qrDataUrl, "PNG", qrX, y + (boxHeight - qrSize) / 2, qrSize, qrSize);
  } catch (e) {
    // Non-fatal — the receipt is still fully usable without the scan code,
    // it just falls back to the tracking link/plain order ID above.
    console.warn("Couldn't generate the receipt's staff scan code:", e);
  }

  y += boxHeight + 20;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(180, 180, 180);
  doc.text("Staff: scan the code above in the admin panel to open this order.", margin, y);
  y += 20;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(160, 160, 160);
  doc.text("Riskyc Fashion · Marché Central, Douala — Précisément au Marché des Pommes", margin, y);
  y += 26;

  // Help / support center — a page-break guard here would need real content
  // measurement, but this receipt's fixed layout never runs an order with
  // enough items to reach the bottom margin in practice.
  const helpBoxHeight = 58;
  doc.setFillColor(250, 245, 247);
  doc.roundedRect(margin, y, pageWidth - margin * 2, helpBoxHeight, 8, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(20, 20, 20);
  doc.text("Need help with your order?", margin + 16, y + 20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(90, 90, 90);
  doc.text("Our support team is here for any question or worry — call or WhatsApp us:", margin + 16, y + 34);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 26, 94);
  doc.text("MTN & Orange: +237 693 45 67 89", margin + 16, y + 47);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(90, 90, 90);
  doc.text("Email: contact@riskyc.cm", margin + 260, y + 47);

  doc.save(`riskyc-receipt-${order.id.slice(0, 8)}.pdf`);
}
