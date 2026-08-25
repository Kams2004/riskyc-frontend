import { formatPrice } from "@/lib/data";

/** Diagonal "promo price" sticker stamped across the corner of a chosen product image. */
export default function PromoRibbon({ price }: { price: number }) {
  return (
    <div className="absolute -left-11 top-6 -rotate-45 z-10 pointer-events-none drop-shadow-md">
      <div className="bg-brand-500 text-white text-xs sm:text-sm font-extrabold px-11 py-1 tracking-wide whitespace-nowrap">
        {formatPrice(price)}
      </div>
    </div>
  );
}
