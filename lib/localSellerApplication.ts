/**
 * Remembers this device's most recent seller application so the "Become a
 * Seller" wizard can show its status on return, without any applicant
 * account/session — mirrors lib/localOrders.ts's guest-order pattern.
 */

const STORAGE_KEY = "riskyc-seller-application";

export interface LocalSellerApplication {
  applicationId: string;
  businessName: string;
  contactEmail: string;
}

export function recordLocalApplication(app: LocalSellerApplication): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(app));
  } catch {
    // Best-effort — private browsing / storage disabled shouldn't break submission.
  }
}

export function getLocalApplication(): LocalSellerApplication | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.applicationId === "string" && typeof parsed.contactEmail === "string") {
      return parsed as LocalSellerApplication;
    }
    return null;
  } catch {
    return null;
  }
}

export function clearLocalApplication(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Best-effort.
  }
}
