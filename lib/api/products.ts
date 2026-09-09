import { apiFetch } from "@/lib/apiClient";
import { Product, MediaItem, ProductColor } from "@/lib/types";

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface ProductQuery {
  category?: string;
  subcategory?: string;
  q?: string;
  page?: number;
  size?: number;
}

function buildQuery(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") search.set(k, String(v));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

/** Storefront listing — only visible products, paginated. */
export function listProducts(query: ProductQuery = {}) {
  return apiFetch<Page<Product>>(
    `/api/products${buildQuery({
      category: query.category,
      subcategory: query.subcategory,
      q: query.q,
      page: query.page,
      size: query.size ?? 100,
    })}`
  );
}

/** Admin listing — includes hidden products, not paginated. */
export function listAdminProducts(token: string) {
  return apiFetch<Product[]>("/api/products/admin", { token });
}

export function getProduct(id: string) {
  return apiFetch<Product>(`/api/products/${id}`);
}

export interface ProductInput {
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  categorySlug: string;
  subcategorySlug?: string;
  sizes: string[];
  tags: string[];
  badge?: string;
  hidden?: boolean;
  rating?: number;
  reviews?: number;
  colors: { id?: string; name: string; hex: string; stock?: number | null }[];
  bulkPrices?: { quantity: number; price: number }[];
}

export function createProduct(data: ProductInput, token: string) {
  return apiFetch<Product>("/api/products", { method: "POST", token, body: JSON.stringify(data) });
}

export function updateProduct(id: string, data: ProductInput, token: string) {
  return apiFetch<Product>(`/api/products/${id}`, { method: "PUT", token, body: JSON.stringify(data) });
}

export function deleteProduct(id: string, token: string) {
  return apiFetch<void>(`/api/products/${id}`, { method: "DELETE", token });
}

export function setProductVisibility(id: string, hidden: boolean, token: string) {
  return apiFetch<Product>(`/api/products/${id}/visibility`, {
    method: "PATCH",
    token,
    body: JSON.stringify({ hidden }),
  });
}

export async function uploadProductMedia(productId: string, file: File, token: string): Promise<MediaItem> {
  const { API_BASE_URL, handleUnauthorized } = await import("@/lib/apiClient");
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE_URL}/api/products/${productId}/media`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    await handleUnauthorized(res.status, true);
    throw new Error(body.message || "Failed to upload media");
  }
  return res.json();
}

export function deleteMedia(mediaId: string, token: string) {
  return apiFetch<void>(`/api/media/${mediaId}`, { method: "DELETE", token });
}

// ── Section-scoped updates — each maps to its own permission (see
// UPDATE_PRODUCT_* in lib/types.ts) so an admin with only, say,
// UPDATE_PRODUCT_STOCK can save just that section instead of needing
// MANAGE_PRODUCTS to submit the whole product via updateProduct() above. ──

export interface ProductInfoInput {
  name: string;
  description?: string;
  categorySlug: string;
  subcategorySlug?: string;
}

export function updateProductInfo(id: string, data: ProductInfoInput, token: string) {
  return apiFetch<Product>(`/api/products/${id}/info`, { method: "PATCH", token, body: JSON.stringify(data) });
}

export interface ProductPricingInput {
  price: number;
  originalPrice?: number;
  bulkPrices?: { quantity: number; price: number }[];
}

export function updateProductPricing(id: string, data: ProductPricingInput, token: string) {
  return apiFetch<Product>(`/api/products/${id}/pricing`, { method: "PATCH", token, body: JSON.stringify(data) });
}

/** Name/hex/add/remove only — a stock value included here is ignored server-side, see updateProductStock. */
export function updateProductColors(id: string, colors: Pick<ProductColor, "id" | "name" | "hex">[], token: string) {
  return apiFetch<Product>(`/api/products/${id}/colors`, { method: "PATCH", token, body: JSON.stringify({ colors }) });
}

/** Updates only the stock count of existing colors (matched by id) — never adds/removes/renames one. */
export function updateProductStock(id: string, colors: { id: string; stock: number | null }[], token: string) {
  return apiFetch<Product>(`/api/products/${id}/stock`, { method: "PATCH", token, body: JSON.stringify({ colors }) });
}

export interface ProductDisplayInput {
  badge?: string;
  sizes: string[];
  rating?: number;
  reviews?: number;
}

export function updateProductDisplay(id: string, data: ProductDisplayInput, token: string) {
  return apiFetch<Product>(`/api/products/${id}/display`, { method: "PATCH", token, body: JSON.stringify(data) });
}

export interface ProductAuditLogEntry {
  id: string;
  productId: string;
  productName: string;
  section: string;
  summary: string;
  changedByName?: string | null;
  changedAt: string;
}

export function getProductAuditLog(id: string, token: string) {
  return apiFetch<Page<ProductAuditLogEntry>>(`/api/products/${id}/audit-log`, { token });
}

export function getAllProductAuditLog(token: string) {
  return apiFetch<Page<ProductAuditLogEntry>>(`/api/products/audit-log`, { token });
}
