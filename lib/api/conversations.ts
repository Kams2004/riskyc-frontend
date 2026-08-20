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

/** REST fallback for sending a message — the STOMP path (lib/chatSocket.ts) is used when connected. */
export function sendMessage(data: { conversationId: string; sender: MessageSender; text: string }) {
  return apiFetch<ChatMessage>("/api/conversations/messages", { method: "POST", body: JSON.stringify(data) });
}

/** Uploads a photo (with an optional caption) as a chat message — multipart, like the other media endpoints. */
export async function sendImageMessage(
  conversationId: string,
  sender: MessageSender,
  file: File,
  text?: string
): Promise<ChatMessage> {
  const { API_BASE_URL } = await import("@/lib/apiClient");
  const form = new FormData();
  form.append("sender", sender);
  form.append("file", file);
  if (text) form.append("text", text);
  const res = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}/messages/image`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || "Failed to send image");
  }
  return res.json();
}

export function markConversationRead(id: string, token: string) {
  return apiFetch<void>(`/api/conversations/${id}/read`, { method: "POST", token });
}

export function deleteConversation(id: string, token: string) {
  return apiFetch<void>(`/api/conversations/${id}`, { method: "DELETE", token });
}
