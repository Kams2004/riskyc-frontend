import { jsPDF } from "jspdf";
import { Order } from "@/lib/types";

/** Both callers of this module only ever run client-side (button click handlers, never SSR). */
export function trackingUrl(orderId: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/track/${orderId}`;
}

// The app's own formatPrice() uses Intl.NumberFormat("fr-CM", ...), which
// inserts a narrow no-break space (U+202F) as the thousands separator —
// jsPDF's core Helvetica font has no glyph for that character and silently
// renders it as "/". A plain ASCII space sidesteps that entirely.
function pdfFormatPrice(price: number): string {
  const withSpaces = Math.round(price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${withSpaces} FCFA`;
}

/** Builds and triggers a download of a one-page PDF receipt for an order, including its tracking link. */
export function downloadReceipt(order: Order) {
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
      item.selectedImageIndex != null ? `Photo ${item.selectedImageIndex + 1}` : null,
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

  // Tracking link
  const url = trackingUrl(order.id);
  doc.setFillColor(250, 245, 247);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 56, 8, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(20, 20, 20);
  doc.text("Track your order", margin + 16, y + 22);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(255, 26, 94);
  doc.textWithLink(url, margin + 16, y + 38, { url });
  y += 56 + 32;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(160, 160, 160);
  doc.text("Riskyc Fashion · Marché Central, Douala — Précisément au Marché des Pommes", margin, y);

  doc.save(`riskyc-receipt-${order.id.slice(0, 8)}.pdf`);
}
