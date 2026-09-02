import { apiFetch } from "@/lib/apiClient";
import { DeliveryContact } from "@/lib/types";

export function listDeliveryContacts(token: string) {
  return apiFetch<DeliveryContact[]>("/api/delivery-contacts", { token });
}

export function createDeliveryContact(data: { name: string; phone: string; position?: number }, token: string) {
  return apiFetch<DeliveryContact>("/api/delivery-contacts", { method: "POST", body: JSON.stringify(data), token });
}

export function updateDeliveryContact(id: string, data: { name: string; phone: string; position?: number }, token: string) {
  return apiFetch<DeliveryContact>(`/api/delivery-contacts/${id}`, { method: "PUT", body: JSON.stringify(data), token });
}

export function deleteDeliveryContact(id: string, token: string) {
  return apiFetch<void>(`/api/delivery-contacts/${id}`, { method: "DELETE", token });
}
