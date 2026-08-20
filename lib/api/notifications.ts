import { apiFetch } from "@/lib/apiClient";
import { AppNotification } from "@/lib/types";

export function listAdminNotifications(token: string) {
  return apiFetch<AppNotification[]>("/api/notifications/admin", { token });
}

export function markNotificationRead(id: string, token: string) {
  return apiFetch<AppNotification>(`/api/notifications/${id}/read`, { method: "PATCH", token });
}
