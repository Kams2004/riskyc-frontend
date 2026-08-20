import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Permission } from "./types";
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
  };
  permissions: Permission[];
}

interface AdminStore {
  session: AdminSession | null;

  // Auth — real backend, email (username) + password
  login: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  logout: () => void;
  hasPermission: (permission: Permission) => boolean;
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
