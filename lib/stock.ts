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
  return (product.variants ?? []).find((v) => v.colorName === (selectedColor || "") && v.size === (selectedSize || ""));
}

/**
 * Available quantity for a selection. Infinity for an untracked variant, or for a missing one on a product whose
 * stock was never entered; a missing combo on a tracked product is 0 — the same rule the backend's
 * ProductVariantService applies at checkout, so what's shown is always what can actually be bought.
 */
export function availableQuantity(product: Pick<Product, "variants">, selectedColor: string, selectedSize: string): number {
  const variant = findVariant(product, selectedColor, selectedSize);
  if (!variant) return (product.variants ?? []).some((v) => !v.untracked) ? 0 : Infinity;
  if (variant.untracked) return Infinity;
  return Math.max(0, variant.quantity);
}

/** Sums a color's stock across every size — null ("no stock set") only when every variant for this color is still an untracked migration sentinel. Used by the admin product list/view pages, which show one figure per color, not per (color, size). */
export function colorTotalStock(product: Pick<Product, "variants">, colorName: string): number | null {
  const variants = (product.variants ?? []).filter((v) => v.colorName === colorName);
  if (variants.length === 0 || variants.every((v) => v.untracked)) return null;
  return variants.filter((v) => !v.untracked).reduce((s, v) => s + Math.max(0, v.quantity), 0);
}

/**
 * Whether every *tracked* variant of this product is at 0 — used for the
 * product-grid "Sold out" ribbon. A product with no tracked variants yet
 * (all untracked, or no variant data at all) is never reported sold out —
 * "we don't know" isn't the same as "it's empty".
 */
export function isProductSoldOut(product: Pick<Product, "variants">): boolean {
  const tracked = (product.variants ?? []).filter((v) => !v.untracked);
  if (tracked.length === 0) return false;
  return tracked.every((v) => v.quantity <= 0);
}
