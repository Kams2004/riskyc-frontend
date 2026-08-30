import { apiFetch } from "@/lib/apiClient";

export function getVapidPublicKey() {
  return apiFetch<{ publicKey: string }>("/api/push/vapid-public-key");
}

export function subscribePush(data: {
  orderId: string;
  endpoint: string;
  keys: { p256dh: string; auth: string };
}) {
  return apiFetch<void>("/api/push/subscribe", { method: "POST", body: JSON.stringify(data) });
}
