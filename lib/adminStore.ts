import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ALL_PERMISSIONS, Permission } from "./types";
import { apiFetch, ApiError } from "./apiClient";

// ── Admin session (backed by the real API — see lib/apiClient.ts) ──────────
export interface AdminSession {
  token: string;
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roleId: string;
  roleName: string;
  permissions: Permission[];
  /** Null for platform staff (sees/manages every seller) — set for a seller's own scoped admin. */
  enterpriseId: string | null;
  /** The Categories this seller is approved to list products under — only meaningful when enterpriseId is set. */
  enterpriseCategoryIds: string[];
  /** True right after an invite-provisioned login — AdminGuard redirects to /admin/set-password until this is cleared. */
  mustChangePassword: boolean;
}

interface AdminLoginResponse {
  token: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    roleId: string;
    roleName: string;
    enterpriseId: string | null;
  };
  permissions: Permission[];
  mustChangePassword: boolean;
  enterpriseCategoryIds: string[];
}

interface AdminStore {
  session: AdminSession | null;

  // Auth — real backend, email (username) + password
  login: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  logout: () => void;
  hasPermission: (permission: Permission) => boolean;
  /** Holds every permission that exists (rather than a hardcoded "Super Admin" role name, which is user-editable) — sees and manages everyone's work, not just their own. */
  isSuperAdmin: () => boolean;
  /** Clears the forced-change flag after a successful POST /api/admin-users/me/change-password, without a full re-login. */
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ ok: true } | { ok: false; error: string }>;
}

export const useAdminStore = create<AdminStore>()(
  persist(
    (set, get) => ({
      session: null,

      login: async (email, password) => {
        try {
          const data = await apiFetch<AdminLoginResponse>("/api/admin-users/login", {
            method: "POST",
            body: JSON.stringify({ email, password }),
          });
          set({
            session: {
              token: data.token,
              id: data.user.id,
              firstName: data.user.firstName,
              lastName: data.user.lastName,
              email: data.user.email,
              roleId: data.user.roleId,
              roleName: data.user.roleName,
              permissions: data.permissions,
              enterpriseId: data.user.enterpriseId,
              enterpriseCategoryIds: data.enterpriseCategoryIds,
              mustChangePassword: data.mustChangePassword,
            },
          });
          return { ok: true };
        } catch (e) {
          const message = e instanceof ApiError ? e.message : "Could not reach the server. Please try again.";
          return { ok: false, error: message };
        }
      },

      logout: () => set({ session: null }),

      hasPermission: (permission) => get().session?.permissions.includes(permission) ?? false,

      isSuperAdmin: () => {
        const perms = get().session?.permissions;
        if (!perms) return false;
        return ALL_PERMISSIONS.every((p) => perms.includes(p.key));
      },

      changePassword: async (currentPassword, newPassword) => {
        const session = get().session;
        if (!session) return { ok: false, error: "Not signed in." };
        try {
          await apiFetch<void>("/api/admin-users/me/change-password", {
            method: "POST",
            token: session.token,
            body: JSON.stringify({ currentPassword, newPassword }),
          });
          set({ session: { ...session, mustChangePassword: false } });
          return { ok: true };
        } catch (e) {
          const message = e instanceof ApiError ? e.message : "Could not reach the server. Please try again.";
          return { ok: false, error: message };
        }
      },
    }),
    {
      // bumped from "riskyc-admin-v2" — products/categories are no longer
      // cached in this store, they're fetched from the API on demand
      name: "riskyc-admin-v3",
      partialize: (s) => ({
        session: s.session,
      }),
    }
  )
);
