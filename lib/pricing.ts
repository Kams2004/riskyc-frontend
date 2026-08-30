import { BulkPriceTier } from "@/lib/types";

/**
 * Computes what a line item actually costs given the product's regular unit
 * price, its optional bulk/grouped-pricing tiers, and the quantity ordered.
 *
 * Rule (mirrors the backend's identical logic in OrderService):
 *  - below the smallest reached tier's quantity → regular unit price × qty
 *  - exactly at a tier's quantity → that tier's flat price
 *  - above a tier's quantity → that tier's flat price for the first
 *    `tier.quantity` units, plus the remainder priced at the tier's implied
 *    per-unit rate (tier.price / tier.quantity) — not the regular unit price
 *
 * When several tiers qualify (quantity has reached more than one), the
 * largest-quantity tier reached is used.
 */
export function computeLineTotal(unitPrice: number, bulkPrices: BulkPriceTier[] | undefined, quantity: number): number {
  if (quantity <= 0) return 0;
  const tiers = (bulkPrices ?? []).filter((t) => t.quantity > 0 && t.price > 0);
  const applicable = tiers
    .filter((t) => t.quantity <= quantity)
    .sort((a, b) => b.quantity - a.quantity)[0];

  if (!applicable) return unitPrice * quantity;
  if (quantity === applicable.quantity) return applicable.price;

  const perUnitBulkRate = applicable.price / applicable.quantity;
  const remainder = quantity - applicable.quantity;
  return applicable.price + remainder * perUnitBulkRate;
}
