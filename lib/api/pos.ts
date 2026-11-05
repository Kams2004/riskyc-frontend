import { apiFetch, API_BASE_URL } from "@/lib/apiClient";
import { PosReconciliationLine, PosSale, PosSettings } from "@/lib/types";

export function listSales(token: string) {
  return apiFetch<PosSale[]>("/api/pos/sales", { token });
}

export function listFlaggedSales(token: string) {
  return apiFetch<PosSale[]>("/api/pos/sales/flagged", { token });
}

export function listReconciliation(token: string) {
  return apiFetch<PosReconciliationLine[]>("/api/pos/reconciliation", { token });
}

export function resolveReconciliation(token: string, itemId: string) {
  return apiFetch<PosReconciliationLine>(`/api/pos/reconciliation/${itemId}/resolve`, { method: "POST", token });
}

export function voidSale(token: string, saleId: string) {
  return apiFetch<PosSale>(`/api/pos/sales/${saleId}/void`, { method: "POST", token });
}

export function getSettings(token: string) {
  return apiFetch<PosSettings>("/api/pos/settings", { token });
}

export function updateSettings(token: string, data: Omit<PosSettings, "logoUrl">) {
  return apiFetch<PosSettings>("/api/pos/settings", { method: "PATCH", token, body: JSON.stringify(data) });
}

export async function uploadLogo(token: string, file: File): Promise<PosSettings> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE_URL}/api/pos/settings/logo`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || "Couldn't upload logo");
  return res.json();
}

export function removeLogo(token: string) {
  return apiFetch<PosSettings>("/api/pos/settings/logo", { method: "DELETE", token });
}

// ── Tills (POS desktop app) ──

export interface PosDevice {
  id: string;
  name: string;
  platform: string | null;
  appVersion: string | null;
  enrolledAt: string;
  enrolledByName: string | null;
  lastSeenAt: string | null;
  online: boolean;
  pendingSales: number;
  revokedAt: string | null;
}

export function listDevices(token: string) {
  return apiFetch<PosDevice[]>("/api/pos/devices", { token });
}

export function createEnrollmentCode(token: string) {
  return apiFetch<{ code: string; expiresAt: string }>("/api/pos/devices/enrollment-codes", { method: "POST", token });
}

export function revokeDevice(token: string, id: string) {
  return apiFetch<PosDevice>(`/api/pos/devices/${id}/revoke`, { method: "POST", token });
}
