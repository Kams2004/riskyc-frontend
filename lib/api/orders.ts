import { apiFetch, API_BASE_URL } from "@/lib/apiClient";
import { Order, OrderStatus, PaymentMethod, CustomerInfo } from "@/lib/types";

export interface CreateOrderItemInput {
  productId: string;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
  selectedImageIndex?: number;
}

export function createOrder(data: { customerId?: string; items: CreateOrderItemInput[]; customerInfo: CustomerInfo; language?: string }) {
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

/** Admin — the Packing queue only (validated/packaging/packaged), reachable via VIEW_TREATMENT alone. */
export function listPackingQueue(token: string) {
  return apiFetch<Order[]>("/api/orders/packing-queue", { token });
}

export function updateOrderStatus(orderId: string, status: OrderStatus, token: string, reason?: string) {
  return apiFetch<Order>(`/api/orders/${orderId}/status`, {
    method: "PATCH",
    token,
    body: JSON.stringify({ status, reason }),
  });
}

/** Claims a validated order for packaging — 409s if someone else already started it. */
export function startPackaging(orderId: string, token: string) {
  return apiFetch<Order>(`/api/orders/${orderId}/packaging/start`, { method: "PATCH", token });
}

export function completePackaging(orderId: string, token: string) {
  return apiFetch<Order>(`/api/orders/${orderId}/packaging/complete`, { method: "PATCH", token });
}

/** Public — links a guest order to a customer account right after they sign up or log in from the order's confirmation/tracking screen. Never overwrites an existing attachment. */
export function attachCustomerToOrder(orderId: string, customerId: string) {
  return apiFetch<Order>(`/api/orders/${orderId}/attach-customer`, {
    method: "POST",
    body: JSON.stringify({ customerId }),
  });
}
