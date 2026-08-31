import { apiFetch } from "@/lib/apiClient";
import { Conversation, ChatMessage, MessageSender } from "@/lib/types";

export function listConversations(token: string) {
  return apiFetch<Conversation[]>("/api/conversations", { token });
}

export function getConversation(id: string) {
  return apiFetch<Conversation>(`/api/conversations/${id}`);
}

/** Finds the conversation an admin may have already started with this customer (returns undefined if none yet). */
export function getConversationForCustomer(customerId: string) {
  return apiFetch<Conversation | undefined>(`/api/conversations/customer/${customerId}`);
}

export function createConversation(data: { customerName: string; customerId?: string; orderId?: string }) {
  return apiFetch<Conversation>("/api/conversations", { method: "POST", body: JSON.stringify(data) });
}

/**
 * REST fallback for sending a message — the STOMP path (lib/chatSocket.ts)
 * is used when connected. Pass `token` for admin sends so the backend can
 * stamp who answered (customers never pass one — there's no customer JWT).
 */
export function sendMessage(data: { conversationId: string; sender: MessageSender; text: string }, token?: string) {
  return apiFetch<ChatMessage>("/api/conversations/messages", { method: "POST", body: JSON.stringify(data), token });
}

/** Uploads a photo (with an optional caption) as a chat message — multipart, like the other media endpoints. */
export async function sendImageMessage(
  conversationId: string,
  sender: MessageSender,
  file: File,
  text?: string,
  token?: string
): Promise<ChatMessage> {
  const { API_BASE_URL } = await import("@/lib/apiClient");
  const form = new FormData();
  form.append("sender", sender);
  form.append("file", file);
  if (text) form.append("text", text);
  const res = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}/messages/image`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || "Failed to send image");
  }
  return res.json();
}

/** Uploads a recorded voice note as a chat message — multipart, like the photo endpoint. */
export async function sendVoiceMessage(
  conversationId: string,
  sender: MessageSender,
  file: Blob,
  durationSeconds: number,
  token?: string
): Promise<ChatMessage> {
  const { API_BASE_URL } = await import("@/lib/apiClient");
  const form = new FormData();
  form.append("sender", sender);
  form.append("file", file, "voice-note.webm");
  form.append("durationSeconds", String(Math.round(durationSeconds)));
  const res = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}/messages/voice`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || "Failed to send voice message");
  }
  return res.json();
}

export function markConversationRead(id: string, token: string) {
  return apiFetch<void>(`/api/conversations/${id}/read`, { method: "POST", token });
}

/** Customer-side equivalent — no token, matching the rest of the public customer chat API. */
export function markConversationReadByCustomer(id: string) {
  return apiFetch<void>(`/api/conversations/${id}/read-by-customer`, { method: "POST" });
}

export function deleteConversation(id: string, token: string) {
  return apiFetch<void>(`/api/conversations/${id}`, { method: "DELETE", token });
}
