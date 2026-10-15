import { apiFetch } from "@/lib/apiClient";
import { PublicityItem } from "@/lib/types";

/** Public — the active carousel slides. Not used by the admin page (see listPublicityAdmin). */
export function listPublicity() {
  return apiFetch<PublicityItem[]>("/api/publicity");
}

/** Admin — every slide, active or not. */
export function listPublicityAdmin(token: string) {
  return apiFetch<PublicityItem[]>("/api/publicity/admin", { token });
}

export async function addPublicityItem(file: File, caption: string | undefined, token: string): Promise<PublicityItem> {
  const { API_BASE_URL, handleUnauthorized } = await import("@/lib/apiClient");
  const form = new FormData();
  form.append("file", file);
  if (caption) form.append("caption", caption);
  const res = await fetch(`${API_BASE_URL}/api/publicity`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    await handleUnauthorized(res.status, true);
    throw new Error(body.message || "Failed to upload publicity item");
  }
  return res.json();
}

export function updatePublicityItem(id: string, data: { caption?: string; active?: boolean }, token: string) {
  return apiFetch<PublicityItem>(`/api/publicity/${id}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(data),
  });
}

export function reorderPublicity(orderedIds: string[], token: string) {
  return apiFetch<void>("/api/publicity/reorder", {
    method: "PATCH",
    token,
    body: JSON.stringify({ orderedIds }),
  });
}

export function deletePublicityItem(id: string, token: string) {
  return apiFetch<void>(`/api/publicity/${id}`, { method: "DELETE", token });
}
