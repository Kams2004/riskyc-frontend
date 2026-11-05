import { apiFetch } from "@/lib/apiClient";
import { Enterprise, EnterpriseStatus } from "@/lib/types";

export interface EnterpriseStatusLookup {
  name: string;
  status: EnterpriseStatus;
}

export interface EnterpriseApplication {
  businessName: string;
  description?: string;
  businessType: string;
  contactFirstName: string;
  contactLastName: string;
  contactEmail: string;
  contactPhone?: string;
  whatsappNumber?: string;
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

/** Anonymous — no token. The applicant's own contact email must match. Used by the "Become a Seller" wizard's returning-applicant status check. */
export function getApplicationStatus(id: string, email: string) {
  return apiFetch<EnterpriseStatusLookup>(`/api/enterprises/${id}/status?email=${encodeURIComponent(email)}`);
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

export function suspendEnterprise(id: string, token: string) {
  return apiFetch<Enterprise>(`/api/enterprises/${id}/suspend`, { method: "POST", token });
}

export function reactivateEnterprise(id: string, token: string) {
  return apiFetch<Enterprise>(`/api/enterprises/${id}/reactivate`, { method: "POST", token });
}
