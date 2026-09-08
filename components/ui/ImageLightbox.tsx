"use client";

import { useEffect, useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";

const MIN_SCALE = 1;
const MAX_SCALE = 4;

interface Props {
  src: string;
  alt?: string;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  counterLabel?: string;
}

/**
 * Fullscreen image viewer shared across the admin panel and storefront —
 * scroll/pinch to zoom, drag to pan once zoomed, double-click to toggle.
 * Resets zoom whenever `src` changes so paging through a carousel doesn't
 * carry the previous image's zoom level over.
 */
export default function ImageLightbox({ src, alt, onClose, onPrev, onNext, counterLabel }: Props) {
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const pinchRef = useRef<{ startDist: number; startScale: number } | null>(null);

  useEffect(() => {
    setScale(1);
    setPos({ x: 0, y: 0 });
  }, [src]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && onPrev) onPrev();
      if (e.key === "ArrowRight" && onNext) onNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onPrev, onNext]);

  const clampScale = (s: number) => Math.min(Math.max(s, MIN_SCALE), MAX_SCALE);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const next = clampScale(scale - e.deltaY * 0.0025);
    setScale(next);
    if (next <= MIN_SCALE) setPos({ x: 0, y: 0 });
  };

  const handleDoubleClick = () => {
    if (scale > 1) {
      setScale(1);
      setPos({ x: 0, y: 0 });
    } else {
      setScale(2.5);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y };
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current) return;
    const { startX, startY, origX, origY } = dragRef.current;
    setPos({ x: origX + (e.clientX - startX), y: origY + (e.clientY - startY) });
  };
  const handleMouseUp = () => {
    dragRef.current = null;
  };

  const touchDistance = (t: React.TouchList) => {
    const [a, b] = [t[0], t[1]];
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  };

  const handleTouchStart = (e: React.TouchList | React.TouchEvent) => {
    const touches = "touches" in e ? e.touches : e;
    if (touches.length === 2) {
      pinchRef.current = { startDist: touchDistance(touches), startScale: scale };
    } else if (touches.length === 1 && scale > 1) {
      dragRef.current = { startX: touches[0].clientX, startY: touches[0].clientY, origX: pos.x, origY: pos.y };
    }
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchRef.current) {
      e.preventDefault();
      const ratio = touchDistance(e.touches) / pinchRef.current.startDist;
      const next = clampScale(pinchRef.current.startScale * ratio);
      setScale(next);
      if (next <= MIN_SCALE) setPos({ x: 0, y: 0 });
    } else if (e.touches.length === 1 && dragRef.current) {
      const { startX, startY, origX, origY } = dragRef.current;
      setPos({ x: origX + (e.touches[0].clientX - startX), y: origY + (e.touches[0].clientY - startY) });
    }
  };
  const handleTouchEnd = () => {
    dragRef.current = null;
    pinchRef.current = null;
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center animate-fade-in select-none"
      onClick={onClose}
      onWheel={handleWheel}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
      >
        <X size={20} />
      </button>

      <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
        <button
          onClick={(e) => { e.stopPropagation(); setScale((s) => clampScale(s - 0.5)); }}
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
        >
          <ZoomOut size={16} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setScale((s) => clampScale(s + 0.5)); }}
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
        >
          <ZoomIn size={16} />
        </button>
      </div>

      {onPrev && (
        <button
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
        >
          <ChevronLeft size={20} />
        </button>
      )}
      {onNext && (
        <button
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
        >
          <ChevronRight size={20} />
        </button>
      )}
      {counterLabel && (
        <span className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-white/10 text-white text-xs font-semibold px-3 py-1 rounded-full z-10">
          {counterLabel}
        </span>
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt ?? ""}
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => { e.stopPropagation(); handleDoubleClick(); }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        draggable={false}
        className="max-w-[92vw] max-h-[85vh] object-contain transition-transform duration-100"
        style={{
          transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
          cursor: scale > 1 ? "grab" : "zoom-in",
        }}
      />
    </div>
  );
}
