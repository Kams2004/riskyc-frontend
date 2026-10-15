import { PublicityItem } from "@/lib/types";

export const CAPTION_FONT_VALUES: PublicityItem["captionFont"][] = ["sans", "display"];
export const CAPTION_STYLE_VALUES: PublicityItem["captionStyle"][] = ["normal", "bold", "italic", "boldItalic"];

/** Shared by the admin preview and the real customer-facing carousel, so what an admin sees while styling a caption is exactly what ships. */
export function captionClassName(item: Pick<PublicityItem, "captionFont" | "captionStyle">) {
  const fontClass = item.captionFont === "display" ? "font-display" : "font-sans";
  const weightClass = item.captionStyle === "bold" || item.captionStyle === "boldItalic" ? "font-bold" : "font-medium";
  const styleClass = item.captionStyle === "italic" || item.captionStyle === "boldItalic" ? "italic" : "";
  return [fontClass, weightClass, styleClass].filter(Boolean).join(" ");
}

/** A text-shadow on top of the gradient scrim — belt and braces so the caption never blends into a busy or light-colored image. */
export const captionTextShadow = "0 1px 3px rgba(0,0,0,0.85), 0 1px 10px rgba(0,0,0,0.5)";
