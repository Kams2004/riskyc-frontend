/**
 * Product/category data now comes entirely from the backend API (see
 * lib/api/products.ts, lib/api/categories.ts) — this file only keeps the
 * pure display-formatting helper that has nothing to do with data source.
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat("fr-CM", {
    style: "currency",
    currency: "XAF",
    minimumFractionDigits: 0,
  }).format(price);
}
