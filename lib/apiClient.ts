/**
 * Thin fetch wrapper for the Riskyc Fashion Spring Boot backend. Used for
 * the admin auth/security surface (login, admin users, roles) — everything
 * else in the app still runs on local demo data.
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

interface ApiFetchOptions extends RequestInit {
  token?: string | null;
}

// A 401 on a request that carried a token means the backend rejected that
// token outright (expired or otherwise invalid) — as opposed to a 403, which
// means the token is fine but lacks a permission. Without this, an admin
// whose token expired mid-session just sees empty lists everywhere (every
// fetch fails silently) with no indication why. Exported so the couple of
// admin endpoints that upload files via a raw `fetch` (bypassing apiFetch)
// can trigger the same handling.
export async function handleUnauthorized(status: number, hadToken: boolean) {
  if (status !== 401 || !hadToken || typeof window === "undefined") return;
  const { useAdminStore } = await import("./adminStore");
  useAdminStore.getState().logout();
  if (!window.location.pathname.startsWith("/admin/login")) {
    window.location.href = "/admin/login?expired=1";
  }
}

/** The signed-in shop customer's session token, if any — read lazily to avoid an import cycle with the store. */
async function customerToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const { useStore } = await import("./store");
  return useStore.getState().customer?.token ?? null;
}

/**
 * A 401 on a customer's own-account request means their session ended (expired, or the account was blocked): sign
 * them out so the next screen asks them to log in, instead of every customer page silently failing.
 */
async function handleCustomerUnauthorized(status: number) {
  if (status !== 401 || typeof window === "undefined") return;
  const { useStore } = await import("./store");
  useStore.getState().logoutCustomer();
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { token, headers, ...rest } = options;
  // Admin calls pass their token explicitly; every other call carries the customer's, if one is signed in.
  const customerSession = token ? null : await customerToken();
  const bearer = token || customerSession;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
      ...headers,
    },
  });

  if (!res.ok) {
    let message = "Something went wrong. Please try again.";
    try {
      const body = await res.json();
      message = body.message || message;
    } catch {
      // response wasn't JSON — keep the default message
    }
    await handleUnauthorized(res.status, !!token);
    if (customerSession) await handleCustomerUnauthorized(res.status);
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) {
    return undefined as T;
  }
  return (await res.json()) as T;
}
