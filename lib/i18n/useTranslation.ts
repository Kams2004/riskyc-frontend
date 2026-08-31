"use client";

import { useStore } from "@/lib/store";
import { translate } from "./dictionary";

/**
 * `const { t, language } = useTranslation();`  then  `t("nav.home")`.
 * Re-renders automatically when the language changes, since it reads
 * straight from the zustand store (same store the header's language
 * toggle writes to).
 */
export function useTranslation() {
  const language = useStore((s) => s.language);
  const t = (path: string, vars?: Record<string, string | number>) => translate(language, path, vars);
  return { t, language };
}
