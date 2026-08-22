"use client";

import { useSyncExternalStore, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Module-level state, not React state — deliberately. `beforeinstallprompt`
 * fires at most once per real page load, but AdminShell (and therefore any
 * component inside it) fully unmounts and remounts on every /admin/* route
 * change, since each admin page wraps its own <AdminShell> rather than
 * sharing one persistent layout. A hook-local listener registered inside a
 * component that comes and goes would miss the event the moment the user
 * navigates once. Living outside React (like the shared STOMP client in
 * chatSocket.ts) means the captured event survives any number of
 * mount/unmounts for the rest of the page session.
 */
let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installed = false;
const subscribers = new Set<() => void>();

function notify() {
  subscribers.forEach((cb) => cb());
}

// Attached at module-evaluation time, not lazily from the first component
// subscription — `beforeinstallprompt` can fire before React ever hydrates,
// and a listener that only attaches once some component renders would lose
// the race and miss it. Importing this file (which happens as soon as any
// bundle chunk referencing it parses) is enough to start listening.
if (typeof window !== "undefined") {
  const standalone =
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true;
  installed = !!standalone;

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    installed = true;
    deferredPrompt = null;
    notify();
  });
}

function subscribe(callback: () => void) {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}

const getCanInstallSnapshot = () => deferredPrompt !== null;
const getInstalledSnapshot = () => installed;
const getServerSnapshot = () => false;

/**
 * Exposes the app's installability state so a custom "Download App" button
 * can trigger the native install flow on demand, instead of relying on the
 * browser's own (easy-to-miss) install affordance.
 *
 * Chrome/Edge (desktop + Android) fire `beforeinstallprompt` — we stash it
 * and replay it via `promptInstall()`. iOS Safari never fires this event
 * (there's no programmatic install prompt there), so `canInstall` stays
 * false and callers should fall back to "Add to Home Screen" instructions.
 */
export function usePwaInstall() {
  const canInstall = useSyncExternalStore(subscribe, getCanInstallSnapshot, getServerSnapshot);
  const isInstalled = useSyncExternalStore(subscribe, getInstalledSnapshot, getServerSnapshot);
  const isIos =
    typeof window !== "undefined" &&
    /iphone|ipad|ipod/i.test(window.navigator.userAgent) &&
    !("MSStream" in window);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    const evt = deferredPrompt;
    await evt.prompt();
    await evt.userChoice;
    deferredPrompt = null;
    notify();
  }, []);

  return { canInstall, isInstalled, isIos, promptInstall };
}
