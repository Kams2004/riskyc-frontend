import { apiFetch } from "@/lib/apiClient";
import { Category, Subcategory } from "@/lib/types";

export function listCategories() {
  return apiFetch<Category[]>("/api/categories");
}

export function createCategory(data: { slug: string; name: string; icon?: string }, token: string) {
  return apiFetch<Category>("/api/categories", { method: "POST", token, body: JSON.stringify(data) });
}

export function updateCategory(id: string, data: { slug: string; name: string; icon?: string }, token: string) {
  return apiFetch<Category>(`/api/categories/${id}`, { method: "PUT", token, body: JSON.stringify(data) });
}

export function deleteCategory(id: string, token: string) {
  return apiFetch<void>(`/api/categories/${id}`, { method: "DELETE", token });
}

export function addSubcategory(categoryId: string, data: { slug: string; name: string }, token: string) {
  return apiFetch<Subcategory>(`/api/categories/${categoryId}/subcategories`, {
    method: "POST",
    token,
    body: JSON.stringify(data),
  });
}

export function updateSubcategory(subcategoryId: string, data: { slug: string; name: string }, token: string) {
  return apiFetch<Subcategory>(`/api/categories/subcategories/${subcategoryId}`, {
    method: "PUT",
    token,
    body: JSON.stringify(data),
  });
}

export function deleteSubcategory(subcategoryId: string, token: string) {
  return apiFetch<void>(`/api/categories/subcategories/${subcategoryId}`, { method: "DELETE", token });
}

export async function uploadCategoryImage(categoryId: string, file: File, token: string): Promise<Category> {
  const { API_BASE_URL } = await import("@/lib/apiClient");
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE_URL}/api/categories/${categoryId}/image`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || "Failed to upload category image");
  }
  return res.json();
}

export function deleteCategoryImage(categoryId: string, token: string) {
  return apiFetch<Category>(`/api/categories/${categoryId}/image`, { method: "DELETE", token });
}
