import type { Language } from "@/lib/types";

/**
 * For admin-authored content (product/category names & descriptions) that
 * the backend machine-translates into French on save — see nameFr/
 * descriptionFr on Product/Category/Subcategory. Falls back to the base
 * (untranslated) value whenever the French version hasn't been generated
 * yet (e.g. GOOGLE_TRANSLATE_API_KEY isn't configured, or the API call
 * failed) — never shows a blank field.
 */
export function localized(base: string, translated: string | null | undefined, language: Language): string {
  return language === "fr" && translated ? translated : base;
}
