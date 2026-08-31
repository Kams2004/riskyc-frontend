import { apiFetch } from "@/lib/apiClient";
import { Customer, CustomerStatus, ReferralSummary } from "@/lib/types";

export function registerCustomer(data: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
  referralCode?: string;
}) {
  return apiFetch<Customer>("/api/customers/register", { method: "POST", body: JSON.stringify(data) });
}

export function loginCustomer(email: string, password: string) {
  return apiFetch<Customer>("/api/customers/login", { method: "POST", body: JSON.stringify({ email, password }) });
}

export function loginWithGoogle(idToken: string, referralCode?: string) {
  return apiFetch<Customer>("/api/customers/google", {
    method: "POST",
    body: JSON.stringify({ idToken, referralCode }),
  });
}

export function getReferralSummary(customerId: string) {
  return apiFetch<ReferralSummary>(`/api/customers/${customerId}/referrals`);
}

export function updateAcronym(customerId: string, acronym: string) {
  return apiFetch<Customer>(`/api/customers/${customerId}/acronym`, {
    method: "PATCH",
    body: JSON.stringify({ acronym }),
  });
}

export function listCustomers(token: string) {
  return apiFetch<Customer[]>("/api/customers", { token });
}

export function updateCustomerStatus(id: string, status: CustomerStatus, token: string) {
  return apiFetch<Customer>(`/api/customers/${id}/status`, {
    method: "PATCH",
    token,
    body: JSON.stringify({ status }),
  });
}

export function deleteCustomer(id: string, token: string) {
  return apiFetch<void>(`/api/customers/${id}`, { method: "DELETE", token });
}
