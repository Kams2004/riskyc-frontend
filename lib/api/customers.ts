import { apiFetch } from "@/lib/apiClient";
import { Customer, CustomerStatus } from "@/lib/types";

export function registerCustomer(data: { firstName: string; lastName: string; email: string; phone?: string; password: string }) {
  return apiFetch<Customer>("/api/customers/register", { method: "POST", body: JSON.stringify(data) });
}

export function loginCustomer(email: string, password: string) {
  return apiFetch<Customer>("/api/customers/login", { method: "POST", body: JSON.stringify({ email, password }) });
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
