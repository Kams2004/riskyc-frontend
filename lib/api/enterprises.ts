import { apiFetch } from "@/lib/apiClient";
import { Enterprise } from "@/lib/types";

export interface EnterpriseApplication {
  businessName: string;
  description?: string;
  businessType: string;
  contactFirstName: string;
  contactLastName: string;
  contactEmail: string;
  contactPhone?: string;
  whatDoYouSell: string;
  estimatedCatalogSize?: string;
}

/** Anonymous — no token. Used by the public "Become a Seller" wizard. */
export function applyAsSeller(data: EnterpriseApplication) {
  return apiFetch<Enterprise>("/api/enterprises/apply", { method: "POST", body: JSON.stringify(data) });
}

export function listEnterprises(token: string) {
  return apiFetch<Enterprise[]>("/api/enterprises", { token });
}

export function getEnterprise(id: string, token: string) {
  return apiFetch<Enterprise>(`/api/enterprises/${id}`, { token });
}

export function approveEnterprise(id: string, categoryIds: string[], token: string) {
  return apiFetch<Enterprise>(`/api/enterprises/${id}/approve`, {
    method: "POST",
    token,
    body: JSON.stringify({ categoryIds }),
  });
}

export function rejectEnterprise(id: string, reason: string | undefined, token: string) {
  return apiFetch<Enterprise>(`/api/enterprises/${id}/reject`, {
    method: "POST",
    token,
    body: JSON.stringify({ reason }),
  });
}
