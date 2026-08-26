"use client";

import { useEffect, useRef, useState } from "react";
import { Undo2, Trash2, Check, X, Loader2 } from "lucide-react";
import clsx from "clsx";

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  color: string;
  width: number;
  points: Point[];
}

const PEN_COLORS = ["#ff2d55", "#111111", "#ffffff", "#ffd60a", "#0a84ff"];
const PEN_SIZES = [
  { label: "Thin", value: 3 },
  { label: "Medium", value: 6 },
  { label: "Thick", value: 12 },
];

interface Props {
  /** Must be loadable with crossOrigin="anonymous" (same-origin blob: URLs, or a CORS-enabled endpoint) — otherwise export will fail with a tainted-canvas error. */
  imageUrl: string;
  onSave: (file: File) => void | Promise<void>;
  onCancel: () => void;
}

/** Draws freehand pen strokes directly onto an image — WhatsApp-style markup: pick a color, draw, undo per stroke, clear all, then flatten and save. */
export default function ImageMarkupEditor({ imageUrl, onSave, onCancel }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgElRef = useRef<HTMLImageElement | null>(null);
  const drawingRef = useRef(false);
  const currentPointsRef = useRef<Point[]>([]);

  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [color, setColor] = useState(PEN_COLORS[0]);
  const [penWidth, setPenWidth] = useState(PEN_SIZES[1].value);
  const [saving, setSaving] = useState(false);

  // Load the source image once and size the canvas to its natural (full)
  // resolution — drawing happens in that coordinate space regardless of how
  // large the canvas is displayed on screen, so exports stay full quality
  // and drawing stays accurate on any device.
  useEffect(() => {
    let cancelled = false;
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (cancelled) return;
      imgElRef.current = img;
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
      }
      setReady(true);
    };
    img.onerror = () => {
      if (!cancelled) setLoadError(true);
    };
    img.src = imageUrl;
    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  const paintStrokes = (ctx: CanvasRenderingContext2D, list: Stroke[]) => {
    for (const s of list) {
      if (s.points.length === 0) continue;
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(s.points[0].x, s.points[0].y);
      for (let i = 1; i < s.points.length; i++) ctx.lineTo(s.points[i].x, s.points[i].y);
      ctx.stroke();
    }
  };

  // Live canvas stays transparent (the image shows through from the <img>
  // layered underneath) — only strokes get painted here, which keeps this
  // cheap enough to redraw on every pointer move even on low-end phones.
  const redraw = (activeStroke?: Stroke) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    paintStrokes(ctx, activeStroke ? [...strokes, activeStroke] : strokes);
  };

  useEffect(() => {
    if (ready) redraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, strokes]);

  const toCanvasPoint = (clientX: number, clientY: number): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!ready) return;
    // Keeps receiving move/up events even if the finger/cursor drifts off the
    // canvas mid-stroke. Some browsers reject capture for a pointer they
    // don't consider active (seen with certain synthetic/edge input paths) —
    // drawing still works without it, just less forgiving near the edges.
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    drawingRef.current = true;
    currentPointsRef.current = [toCanvasPoint(e.clientX, e.clientY)];
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    currentPointsRef.current = [...currentPointsRef.current, toCanvasPoint(e.clientX, e.clientY)];
    redraw({ color, width: penWidth, points: currentPointsRef.current });
  };

  const finishStroke = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    // Snapshot before clearing the ref — setState's updater callback may run
    // after this function returns, by which point currentPointsRef.current
    // would already be the reset (empty) array otherwise.
    const points = currentPointsRef.current;
    currentPointsRef.current = [];
    if (points.length > 1) {
      setStrokes((prev) => [...prev, { color, width: penWidth, points }]);
    }
  };

  const handleUndo = () => setStrokes((prev) => prev.slice(0, -1));
  const handleClearAll = () => setStrokes([]);

  const handleSave = async () => {
    const canvas = canvasRef.current;
    const img = imgElRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !img || !ctx) return;
    setSaving(true);
    try {
      // Flatten: draw the source image first, then the strokes on top, into
      // the same full-resolution canvas — this becomes the exported file.
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      paintStrokes(ctx, strokes);

      const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("Failed to export image");
      const file = new File([blob], `annotated-${Date.now()}.png`, { type: "image/png" });
      await onSave(file);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-gray-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 flex-shrink-0">
          <h3 className="text-white font-semibold text-sm">Draw on image</h3>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-300"
          >
            <X size={16} />
          </button>
        </div>

        {/* Canvas area */}
        <div className="relative flex-1 min-h-0 bg-black flex items-center justify-center p-2 overflow-hidden">
          {loadError ? (
            <p className="text-red-400 text-sm p-8 text-center">Couldn&apos;t load this image for editing.</p>
          ) : (
            <div className="relative max-w-full max-h-full" style={{ touchAction: "none" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="" className="block max-w-full max-h-[70vh] w-auto h-auto select-none pointer-events-none" draggable={false} />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full touch-none cursor-crosshair"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={finishStroke}
                onPointerLeave={finishStroke}
                onPointerCancel={finishStroke}
              />
              {!ready && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 size={24} className="animate-spin text-white/60" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Toolbar */}
        <div className="px-4 py-3 border-t border-gray-800 flex-shrink-0 space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            {/* Colors */}
            <div className="flex items-center gap-1.5">
              {PEN_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  title={c}
                  className={clsx(
                    "w-7 h-7 rounded-full border-2 transition-all flex-shrink-0",
                    color === c ? "border-brand-400 ring-2 ring-brand-400/40 scale-110" : "border-gray-600"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            {/* Pen size */}
            <div className="flex items-center gap-1.5">
              {PEN_SIZES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setPenWidth(s.value)}
                  title={s.label}
                  className={clsx(
                    "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                    penWidth === s.value ? "bg-brand-500" : "bg-gray-800 hover:bg-gray-700"
                  )}
                >
                  <span className="rounded-full bg-white" style={{ width: s.value, height: s.value }} />
                </button>
              ))}
            </div>

            {/* Undo / Clear */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleUndo}
                disabled={strokes.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-gray-200 transition-colors"
              >
                <Undo2 size={13} /> Undo
              </button>
              <button
                onClick={handleClearAll}
                disabled={strokes.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-red-400 transition-colors"
              >
                <Trash2 size={13} /> Erase all
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !ready}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white transition-colors"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
