"use client";

import { useAdminStore } from "@/lib/adminStore";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

// Admin pages each wrap themselves in AdminShell/AdminGuard (there's no
// shared app/admin/layout.tsx), so this component remounts on every
// in-admin navigation. Hydration only needs to be awaited once per
// browser session — caching it at module scope stops the loading
// spinner from flashing again on every page change after the first.
let cachedHydrated = false;

export default function AdminGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAuthenticated = useAdminStore((s) => s.session !== null);
  const router = useRouter();
  const pathname = usePathname();

  // Wait for the persisted store to rehydrate from localStorage before
  // deciding to redirect — otherwise a fresh page load briefly sees the
  // default isAuthenticated:false and bounces an already-logged-in admin
  // to the login screen. The persist API is only touched client-side
  // (inside useEffect) since it isn't available during SSR.
  const [hydrated, setHydrated] = useState(cachedHydrated);
  useEffect(() => {
    if (cachedHydrated || useAdminStore.persist.hasHydrated()) {
      cachedHydrated = true;
      setHydrated(true);
      return;
    }
    return useAdminStore.persist.onFinishHydration(() => {
      cachedHydrated = true;
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (hydrated && !isAuthenticated && pathname !== "/admin/login") {
      router.replace("/admin/login");
    }
  }, [hydrated, isAuthenticated, pathname, router]);

  if (!hydrated || (!isAuthenticated && pathname !== "/admin/login")) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  return <>{children}</>;
}
