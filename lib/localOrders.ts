/**
 * Per-device order history for guests (no account) — mirrors the mobile
 * app's riskyc-mobile/src/lib/localOrders.ts exactly, on localStorage
 * instead of AsyncStorage, so "My Orders" has something to show a guest
 * who never downloaded the receipt or opened the tracking link.
 */

const STORAGE_KEY = "riskyc-local-orders";
const MAX_ENTRIES = 50;

export function recordLocalOrder(orderId: string): void {
  try {
    const ids = getLocalOrderIds();
    if (ids.includes(orderId)) return;
    const next = [orderId, ...ids].slice(0, MAX_ENTRIES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Best-effort — private browsing / storage disabled shouldn't break checkout.
  }
}

export function getLocalOrderIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}
