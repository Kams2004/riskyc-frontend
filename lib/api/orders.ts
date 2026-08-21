import { apiFetch, API_BASE_URL } from "@/lib/apiClient";
import { Order, OrderStatus, PaymentMethod, CustomerInfo } from "@/lib/types";

export interface CreateOrderItemInput {
  productId: string;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
}

export function createOrder(data: { customerId?: string; items: CreateOrderItemInput[]; customerInfo: CustomerInfo }) {
  return apiFetch<Order>("/api/orders", { method: "POST", body: JSON.stringify(data) });
}

export function setOrderPaymentMethod(orderId: string, paymentMethod: PaymentMethod) {
  return apiFetch<Order>(`/api/orders/${orderId}/payment-method`, {
    method: "POST",
    body: JSON.stringify({ paymentMethod }),
  });
}

export async function uploadPaymentProof(orderId: string, file: File): Promise<Order> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}/payment-proof`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || "Failed to upload payment proof");
  }
  return res.json();
}

export function getOrder(orderId: string) {
  return apiFetch<Order>(`/api/orders/${orderId}`);
}

export function listOrdersForCustomer(customerId: string) {
  return apiFetch<Order[]>(`/api/orders/customer/${customerId}`);
}

/** Admin — every order. */
export function listOrders(token: string) {
  return apiFetch<Order[]>("/api/orders", { token });
}

export function updateOrderStatus(orderId: string, status: OrderStatus, token: string) {
  return apiFetch<Order>(`/api/orders/${orderId}/status`, {
    method: "PATCH",
    token,
    body: JSON.stringify({ status }),
  });
}

/** Claims a validated order for packaging — 409s if someone else already started it. */
export function startPackaging(orderId: string, token: string) {
  return apiFetch<Order>(`/api/orders/${orderId}/packaging/start`, { method: "PATCH", token });
}

export function completePackaging(orderId: string, token: string) {
  return apiFetch<Order>(`/api/orders/${orderId}/packaging/complete`, { method: "PATCH", token });
}
