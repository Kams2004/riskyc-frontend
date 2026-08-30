import { BulkPriceTier } from "@/lib/types";

export interface PriceBreakdownPart {
  kind: "bulk" | "unit";
  /** Set when kind is "bulk" — the tier's quantity and flat price. */
  tierQuantity?: number;
  tierPrice?: number;
  /** How many of this part — tiers applied (bulk) or individual units (unit). */
  count: number;
  subtotal: number;
}

/**
 * Prices a line by greedily applying the largest bulk tier that still fits,
 * then the next-largest for whatever quantity is left, and so on, charging
 * the regular unit price for anything left over once no more tiers fit.
 * E.g. a 10-for-20,000 tier with a quantity of 12 → one tier (20,000) plus
 * 2 units at the regular price — never a partial/prorated tier rate.
 */
export function computeLineBreakdown(
  unitPrice: number,
  bulkPrices: BulkPriceTier[] | undefined,
  quantity: number
): { parts: PriceBreakdownPart[]; total: number } {
  if (quantity <= 0) return { parts: [], total: 0 };

  const tiers = (bulkPrices ?? [])
    .filter((t) => t.quantity > 0 && t.price > 0)
    .sort((a, b) => b.quantity - a.quantity);

  let remaining = quantity;
  const parts: PriceBreakdownPart[] = [];
  let total = 0;

  for (const tier of tiers) {
    if (remaining >= tier.quantity) {
      const count = Math.floor(remaining / tier.quantity);
      const subtotal = count * tier.price;
      total += subtotal;
      remaining -= count * tier.quantity;
      parts.push({ kind: "bulk", tierQuantity: tier.quantity, tierPrice: tier.price, count, subtotal });
    }
  }
  if (remaining > 0) {
    const subtotal = remaining * unitPrice;
    total += subtotal;
    parts.push({ kind: "unit", count: remaining, subtotal });
  }

  return { parts, total };
}

/** Convenience wrapper when only the final total is needed. */
export function computeLineTotal(unitPrice: number, bulkPrices: BulkPriceTier[] | undefined, quantity: number): number {
  return computeLineBreakdown(unitPrice, bulkPrices, quantity).total;
}
