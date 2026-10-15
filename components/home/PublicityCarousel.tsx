"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { PublicityItem } from "@/lib/types";

const AUTO_ADVANCE_MS = 5000;
const MAX_HEIGHT = 380;
const DEFAULT_RATIO = 16 / 9;

/**
 * object-contain (not cover) — admin-uploaded media can be any aspect ratio,
 * and nothing here should ever be cropped. The box itself is sized (by the
 * parent) to match the active item's own ratio, so this rarely needs to
 * letterbox at all — only "max-w-full" guards the rare case a very wide
 * image doesn't fit the shared box height on a narrow viewport.
 */
function PublicitySlide({
  item,
  active,
  ratio,
  onRatio,
}: {
  item: PublicityItem;
  active: boolean;
  ratio: number;
  onRatio: (id: string, ratio: number) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (active) el.play().catch(() => {});
    else el.pause();
  }, [active]);

  return (
    <div className="w-full h-full flex-shrink-0 flex items-center justify-center px-0.5">
      <div
        className="relative h-full max-w-full rounded-3xl overflow-hidden bg-gray-100"
        style={{ aspectRatio: ratio }}
      >
        {item.type === "VIDEO" ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video
            ref={videoRef}
            src={item.presignedUrl}
            className="w-full h-full object-contain"
            muted
            loop
            playsInline
            onLoadedMetadata={(e) => {
              const v = e.currentTarget;
              if (v.videoWidth && v.videoHeight) onRatio(item.id, v.videoWidth / v.videoHeight);
            }}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.presignedUrl}
            alt={item.caption ?? ""}
            className="w-full h-full object-contain"
            onLoad={(e) => {
              const img = e.currentTarget;
              if (img.naturalWidth && img.naturalHeight) onRatio(item.id, img.naturalWidth / img.naturalHeight);
            }}
          />
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
  const [ratios, setRatios] = useState<Record<string, number>>({});
  const [height, setHeight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleRatio = useCallback((id: string, ratio: number) => {
    setRatios((prev) => (prev[id] === ratio ? prev : { ...prev, [id]: ratio }));
  }, []);

  useEffect(() => {
    if (items.length <= 1) return;
    const id = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % items.length);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(id);
  }, [items.length]);

  const activeId = items[activeIndex]?.id;
  const activeRatio = (activeId && ratios[activeId]) || DEFAULT_RATIO;

  // The box's height tracks the active slide's own ratio (capped) instead of
  // a single fixed ratio for every upload — a 16:9 default would leave big
  // empty bars next to a portrait fashion photo, which is most of what gets uploaded here.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const recompute = () => setHeight(Math.min(MAX_HEIGHT, el.clientWidth / activeRatio));
    recompute();
    const ro = new ResizeObserver(recompute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [activeRatio]);

  if (items.length === 0) return null;

  return (
    <div className="mb-8">
      <div
        ref={containerRef}
        className="relative overflow-hidden transition-[height] duration-500 ease-out"
        style={{ height: height || undefined }}
      >
        <div
          className="flex h-full transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {items.map((item, i) => (
            <PublicitySlide
              key={item.id}
              item={item}
              active={i === activeIndex}
              ratio={ratios[item.id] ?? DEFAULT_RATIO}
              onRatio={handleRatio}
            />
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
