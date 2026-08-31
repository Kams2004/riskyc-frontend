"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";
import ChatBlob from "@/components/chat/ChatBlob";
import { useStore } from "@/lib/store";
import { detectBrowserLanguage } from "@/lib/i18n/detectLanguage";

/** Runs once, the very first time this browser ever loads the app (storefront or admin) — never again after that, so it can't clobber a language the visitor picked by hand. */
function useAutoDetectLanguage() {
  useEffect(() => {
    const applyIfNeeded = () => {
      const { languageInitialized, setLanguage } = useStore.getState();
      if (!languageInitialized) setLanguage(detectBrowserLanguage());
    };
    if (useStore.persist.hasHydrated()) {
      applyIfNeeded();
      return;
    }
    return useStore.persist.onFinishHydration(applyIfNeeded);
  }, []);
}

export default function RootClientShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  useAutoDetectLanguage();

  if (isAdmin) {
    // Admin pages manage their own layout via AdminShell
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <ChatBlob />
    </>
  );
}
