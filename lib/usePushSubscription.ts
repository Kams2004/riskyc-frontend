"use client";

import { useEffect, useRef, useState } from "react";
import { getVapidPublicKey, subscribePush } from "@/lib/api/push";
import { useStore } from "@/lib/store";

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
  // Subscribed (not just read via getState()) so a live in-session language
  // toggle re-runs the mount effect below and re-syncs the subscription's
  // stored language, instead of leaving it stuck at whatever it was when
  // this hook first mounted.
  const language = useStore((s) => s.language);
  // The button's `disabled` prop only takes effect after React re-renders,
  // which isn't necessarily before a second click event fires (a fast
  // double-click, or a click landing while the browser's own native
  // permission prompt is up) — a synchronous ref closes that gap. Without
  // it, two concurrent subscribe() calls can both reach
  // pushManager.subscribe(): most browsers just return the same
  // subscription to both, but under true concurrency one can throw, whose
  // catch then overwrites a status the other call had already set to
  // "subscribed" — the subscription itself still went through, but the UI
  // is left permanently claiming it failed.
  const subscribingRef = useRef(false);

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
      .then(async (reg) => {
        const sub = await reg.pushManager.getSubscription();
        if (cancelled) return;
        if (!sub) {
          setStatus("idle");
          return;
        }
        // A browser-level subscription can already exist from tracking a
        // *different* order earlier on this device — the backend only knows
        // about whichever order this endpoint was last associated with, so
        // re-registering it for the current order (idempotent upsert) is
        // required, otherwise this order silently never gets notified even
        // though the UI would otherwise claim it's already subscribed.
        const json = sub.toJSON();
        if (json.endpoint && json.keys?.p256dh && json.keys?.auth) {
          try {
            await subscribePush({
              orderId,
              endpoint: json.endpoint,
              keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
              language,
            });
            if (!cancelled) setStatus("subscribed");
          } catch {
            if (!cancelled) setStatus("idle");
          }
        } else {
          setStatus("idle");
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("idle");
      });
    return () => {
      cancelled = true;
    };
  }, [orderId, language]);

  const subscribe = async () => {
    if (subscribingRef.current) return;
    subscribingRef.current = true;
    setStatus("subscribing");
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        return;
      }
      // Re-subscribing with a *different* applicationServerKey than an
      // already-registered subscription throws InvalidStateError in most
      // browsers — reuse whatever's already there instead of always calling
      // subscribe() fresh (the same reuse the mount effect above does).
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        const { publicKey } = await getVapidPublicKey();
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
      }
      const json = sub.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) throw new Error("Incomplete subscription");
      await subscribePush({
        orderId,
        endpoint: json.endpoint,
        keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
        language,
      });
      setStatus("subscribed");
    } catch (e) {
      // Swallowed before, which made this unfixable from a bug report alone
      // ("it says couldn't" and nothing else) — log the real reason instead.
      console.error("Push subscription failed:", e);
      setStatus("error");
    } finally {
      subscribingRef.current = false;
    }
  };

  return { status, subscribe };
}
