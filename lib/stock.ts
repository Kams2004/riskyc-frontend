import { Product, ProductVariant } from "@/lib/types";

/** The (colorName, size) key used both to look up a variant and, in the admin stock editor, to key a local edit buffer by the same pair before it's saved. */
export function variantKey(colorName: string, size: string): string {
  return `${colorName || ""}::${size || ""}`;
}

/** Finds the variant matching a (color, size) selection — "" for either means "no option", matching cart/order conventions. */
export function findVariant(
  product: Pick<Product, "variants">,
  selectedColor: string,
  selectedSize: string
): ProductVariant | undefined {
  return product.variants.find((v) => v.colorName === (selectedColor || "") && v.size === (selectedSize || ""));
}

/** Available quantity for a selection — Infinity for an "untracked" migration sentinel, or when no variant row exists yet (a brand-new color/size combo an admin hasn't visited the stock editor for), so neither case blocks a purchase on missing data. */
export function availableQuantity(product: Pick<Product, "variants">, selectedColor: string, selectedSize: string): number {
  const variant = findVariant(product, selectedColor, selectedSize);
  if (!variant || variant.untracked) return Infinity;
  return Math.max(0, variant.quantity);
}

/**
 * Whether every *tracked* variant of this product is at 0 — used for the
 * product-grid "Sold out" ribbon. A product with no tracked variants yet
 * (all untracked, or no variant data at all) is never reported sold out —
 * "we don't know" isn't the same as "it's empty".
 */
export function isProductSoldOut(product: Pick<Product, "variants">): boolean {
  const tracked = product.variants.filter((v) => !v.untracked);
  if (tracked.length === 0) return false;
  return tracked.every((v) => v.quantity <= 0);
}
