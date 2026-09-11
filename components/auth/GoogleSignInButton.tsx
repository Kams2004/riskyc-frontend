"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { attachCustomerToOrder } from "@/lib/api/orders";

interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleIdApi {
  initialize: (config: { client_id: string; callback: (res: GoogleCredentialResponse) => void }) => void;
  renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleIdApi } };
  }
}

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const SCRIPT_SRC = "https://accounts.google.com/gsi/client";

interface Props {
  redirectTo: string;
  /** Only meaningful on the register flow — applied once, on account creation. */
  referralCode?: string;
  /** The order id from a "?attachOrder=" link (confirmation screen/tracking page prompt) — attached to this customer's account once sign-in succeeds. */
  attachOrderId?: string;
  onError?: (message: string) => void;
}

/** Renders Google's own "Sign in with Google" button once the Identity Services script + a Client ID are both available; renders nothing otherwise (e.g. before GOOGLE_CLIENT_ID is configured). */
export default function GoogleSignInButton({ redirectTo, referralCode, attachOrderId, onError }: Props) {
  const router = useRouter();
  const loginWithGoogle = useStore((s) => s.loginWithGoogle);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    if (!CLIENT_ID) return;
    if (window.google?.accounts?.id) {
      setScriptReady(true);
      return;
    }
    const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => setScriptReady(true));
      return;
    }
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => setScriptReady(true);
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!scriptReady || !CLIENT_ID || !containerRef.current || !window.google) return;
    const container = containerRef.current;

    window.google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: async (response) => {
        const result = await loginWithGoogle(response.credential, referralCode);
        if (result.ok) {
          const customer = useStore.getState().customer;
          if (attachOrderId && customer) {
            attachCustomerToOrder(attachOrderId, customer.id).catch(() => {});
          }
          router.replace(redirectTo);
        } else {
          onError?.(result.error);
        }
      },
    });

    container.innerHTML = "";
    window.google.accounts.id.renderButton(container, {
      type: "standard",
      theme: "outline",
      size: "large",
      shape: "pill",
      text: "continue_with",
      width: Math.min(container.offsetWidth || 320, 400),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scriptReady, redirectTo, referralCode, attachOrderId]);

  if (!CLIENT_ID) return null;

  return <div ref={containerRef} className="w-full flex justify-center" />;
}
