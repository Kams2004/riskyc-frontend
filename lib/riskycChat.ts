/**
 * Opening a conversation in RiskyC Chat (Riskyc's own messaging app) with a seller's number. The chat app answers
 * `riskycchat://contact?phone=…` (installed app) and https://chat.riskycfashion.com/contact?phone=… (its web version).
 */
export const RISKYC_CHAT_WEB = "https://chat.riskycfashion.com";

/** E.164 for the chat lookup: keeps a leading +, strips spaces/dashes; a bare 9-digit Cameroonian number gets +237. */
export function chatPhone(raw: string): string {
  const trimmed = raw.trim();
  const digits = trimmed.replace(/[^\d]/g, "");
  if (trimmed.startsWith("+")) return `+${digits}`;
  if (digits.startsWith("00")) return `+${digits.slice(2)}`;
  if (digits.length === 9 && digits.startsWith("6")) return `+237${digits}`;
  return `+${digits}`;
}

export function riskycChatLinks(phone: string, name?: string) {
  const query = new URLSearchParams({ phone: chatPhone(phone), ...(name ? { name } : {}) }).toString();
  return { app: `riskycchat://contact?${query}`, web: `${RISKYC_CHAT_WEB}/contact?${query}` };
}

/**
 * Phones: hand the link to the RiskyC Chat app; if nothing opens it within ~1.5 s (app not installed), go to the web
 * version instead. Computers: the web version straight away, in a new tab.
 */
export function openRiskycChat(phone: string, name?: string) {
  if (typeof window === "undefined") return;
  const { app, web } = riskycChatLinks(phone, name);
  const isPhone = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (!isPhone) {
    window.open(web, "_blank", "noopener");
    return;
  }
  let left = false;
  const onHide = () => {
    if (document.visibilityState === "hidden") left = true;
  };
  document.addEventListener("visibilitychange", onHide);
  window.location.href = app;
  window.setTimeout(() => {
    document.removeEventListener("visibilitychange", onHide);
    if (!left) window.location.href = web;
  }, 1500);
}
