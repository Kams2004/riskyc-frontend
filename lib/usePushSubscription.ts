"use client";

import { useEffect, useState } from "react";
import { getVapidPublicKey, subscribePush } from "@/lib/api/push";

export type PushStatus = "checking" | "unsupported" | "idle" | "subscribing" | "subscribed" | "denied" | "error";

// Web Push wants the VAPID key as a raw Uint8Array, not the base64url string the API hands back.
function urlBase64ToUint8Array(base64Url: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

/** Lets the customer opt in to push notifications for one specific order (no account needed). */
export function usePushSubscription(orderId: string) {
  const [status, setStatus] = useState<PushStatus>("checking");

  useEffect(() => {
    let cancelled = false;
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => {
        if (cancelled) return;
        setStatus(sub ? "subscribed" : "idle");
      })
      .catch(() => {
        if (!cancelled) setStatus("idle");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const subscribe = async () => {
    setStatus("subscribing");
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        return;
      }
      const { publicKey } = await getVapidPublicKey();
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      const json = sub.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) throw new Error("Incomplete subscription");
      await subscribePush({
        orderId,
        endpoint: json.endpoint,
        keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
      });
      setStatus("subscribed");
    } catch {
      setStatus("error");
    }
  };

  return { status, subscribe };
}
