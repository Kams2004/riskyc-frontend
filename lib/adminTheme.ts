import { create } from "zustand";
import { persist } from "zustand/middleware";

type AdminTheme = "dark" | "light";

interface AdminThemeStore {
  theme: AdminTheme;
  toggle: () => void;
  setTheme: (t: AdminTheme) => void;
}

export const useAdminTheme = create<AdminThemeStore>()(
  persist(
    (set) => ({
      theme: "dark",
      toggle: () =>
        set((s) => ({ theme: s.theme === "dark" ? "light" : "dark" })),
      setTheme: (theme) => set({ theme }),
    }),
    { name: "riskyc-admin-theme" }
  )
);
