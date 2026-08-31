import type { Language } from "@/lib/types";

/** French if the browser's negotiated language is French (or a French locale variant like fr-CA), English otherwise. */
export function detectBrowserLanguage(): Language {
  if (typeof navigator === "undefined") return "en";
  const candidates = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language];
  const first = candidates.find(Boolean);
  return first?.toLowerCase().startsWith("fr") ? "fr" : "en";
}
