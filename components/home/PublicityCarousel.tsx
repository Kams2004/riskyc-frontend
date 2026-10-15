"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { PublicityItem } from "@/lib/types";

const AUTO_ADVANCE_MS = 5000;

/**
 * object-contain (not cover) + a neutral letterbox background — admin-uploaded
 * media can be any aspect ratio, and nothing here should ever be cropped.
 */
function PublicitySlide({ item, active }: { item: PublicityItem; active: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (active) el.play().catch(() => {});
    else el.pause();
  }, [active]);

  return (
    <div className="w-full flex-shrink-0 px-0.5">
      <div className="relative w-full aspect-[16/9] max-h-[320px] rounded-3xl overflow-hidden bg-gray-100">
        {item.type === "VIDEO" ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video
            ref={videoRef}
            src={item.presignedUrl}
            className="w-full h-full object-contain"
            muted
            loop
            playsInline
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.presignedUrl} alt={item.caption ?? ""} className="w-full h-full object-contain" />
        )}
        {item.caption && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-5 py-4">
            <p className="text-white font-semibold text-sm sm:text-base line-clamp-2">{item.caption}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/** Promo carousel, admin-managed via /admin/publicity. Renders nothing until at least one item exists. */
export default function PublicityCarousel({ items }: { items: PublicityItem[] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (items.length <= 1) return;
    const id = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % items.length);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(id);
  }, [items.length]);

  if (items.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="relative overflow-hidden rounded-3xl">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {items.map((item, i) => (
            <PublicitySlide key={item.id} item={item} active={i === activeIndex} />
          ))}
        </div>
      </div>
      {items.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-3">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              aria-label={`Slide ${i + 1}`}
              className={clsx(
                "h-1.5 rounded-full transition-all",
                i === activeIndex ? "w-6 bg-brand-500" : "w-1.5 bg-gray-300"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
