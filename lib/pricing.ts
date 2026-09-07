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

/**
 * Splits bulk-tier pricing for a product across several lines requesting
 * that same product (e.g. one line per photo when using the per-photo
 * picker) as one shared, continuous quantity, instead of pricing each line
 * in isolation — 2 + 3 + 5 units of the same product across three lines
 * gets a 10-for-20,000 tier exactly as if they'd been one line of 10,
 * rather than each line individually falling short of the tier and paying
 * full price. Mirrors the backend's OrderService.allocateGroupedLineTotals
 * exactly, so this preview always matches what checkout actually charges.
 *
 * Tiers still apply greedily by largest-quantity first; any leftover is
 * charged at the regular unit price. The resulting tier "chunks" are walked
 * in the order `quantities` was given, splitting a chunk across a line
 * boundary when a line's quantity doesn't land evenly on one — so a single
 * quantity naturally reduces to plain computeLineTotal.
 */
export function allocateGroupedLineTotals(
  unitPrice: number,
  bulkPrices: BulkPriceTier[] | undefined,
  quantities: number[]
): number[] {
  const totalQuantity = quantities.reduce((s, q) => s + q, 0);
  if (totalQuantity <= 0) return quantities.map(() => 0);

  const tiers = (bulkPrices ?? [])
    .filter((t) => t.quantity > 0 && t.price > 0)
    .sort((a, b) => b.quantity - a.quantity);

  const chunks: { units: number; totalPrice: number }[] = [];
  let remaining = totalQuantity;
  for (const tier of tiers) {
    if (remaining >= tier.quantity) {
      const count = Math.floor(remaining / tier.quantity);
      for (let i = 0; i < count; i++) chunks.push({ units: tier.quantity, totalPrice: tier.price });
      remaining -= count * tier.quantity;
    }
  }
  if (remaining > 0) chunks.push({ units: remaining, totalPrice: unitPrice * remaining });

  const lineTotals: number[] = [];
  let chunkIndex = 0;
  let unitsUsedInChunk = 0;
  for (const quantity of quantities) {
    let lineTotal = 0;
    let remainingForLine = quantity;
    while (remainingForLine > 0) {
      const chunk = chunks[chunkIndex];
      const unitsLeftInChunk = chunk.units - unitsUsedInChunk;
      const take = Math.min(remainingForLine, unitsLeftInChunk);
      const perUnit = chunk.totalPrice / chunk.units;
      lineTotal += perUnit * take;
      unitsUsedInChunk += take;
      remainingForLine -= take;
      if (unitsUsedInChunk >= chunk.units) {
        chunkIndex++;
        unitsUsedInChunk = 0;
      }
    }
    lineTotals.push(Math.round(lineTotal));
  }
  return lineTotals;
}
