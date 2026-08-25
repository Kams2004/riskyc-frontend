/** Free-text promo caption an admin stamped on a specific product image — shown verbatim, not derived from price. */
export default function PromoLabel({ text }: { text: string }) {
  return (
    <div className="absolute inset-x-0 top-0 z-10 pointer-events-none">
      <div className="bg-brand-500/95 text-white text-[11px] sm:text-sm font-extrabold text-center px-2 py-1.5 leading-tight shadow-md">
        {text}
      </div>
    </div>
  );
}
