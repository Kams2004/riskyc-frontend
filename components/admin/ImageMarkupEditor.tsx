"use client";

import { useEffect, useRef, useState } from "react";
import { Undo2, Trash2, Check, X, Loader2, Pencil, Crop, RotateCw, RotateCcw } from "lucide-react";
import { useTranslation } from "@/lib/i18n/useTranslation";
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

/** Crop rectangle in percentages of the displayed image, so it's resolution-independent. */
interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const PEN_COLORS = ["#ff2d55", "#111111", "#ffffff", "#ffd60a", "#0a84ff"];
// `labelKey` maps to lib/i18n/namespaces/adminProducts.{en,fr}.ts → markup.penThin/penMedium/penThick
const PEN_SIZES = [
  { labelKey: "penThin" as const, value: 3 },
  { labelKey: "penMedium" as const, value: 6 },
  { labelKey: "penThick" as const, value: 12 },
];

const MIN_CROP_PERCENT = 8;
const DEFAULT_CROP: CropRect = { x: 10, y: 10, w: 80, h: 80 };

interface Props {
  /** Must be loadable with crossOrigin="anonymous" (same-origin blob: URLs, or a CORS-enabled endpoint) — otherwise export will fail with a tainted-canvas error. */
  imageUrl: string;
  onSave: (file: File) => void | Promise<void>;
  onCancel: () => void;
}

type Mode = "draw" | "crop" | "rotate";
type CropDragKind = "move" | "nw" | "ne" | "sw" | "se";

/**
 * Full image editor: freehand pen markup (WhatsApp-style), crop, and 90°
 * rotation. Crop/rotate are destructive and immediate — applying either
 * replaces the working image (and clears any pen strokes, since their
 * coordinates no longer make sense against a resized/reoriented image),
 * exactly like a simple photo editor. Draw strokes stay non-destructive
 * until Save, which flattens everything into one exported file.
 */
export default function ImageMarkupEditor({ imageUrl, onSave, onCancel }: Props) {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgElRef = useRef<HTMLImageElement | null>(null);
  const drawingRef = useRef(false);
  const currentPointsRef = useRef<Point[]>([]);
  const imageBoxRef = useRef<HTMLDivElement>(null);
  const cropDragRef = useRef<{ kind: CropDragKind; startX: number; startY: number; startRect: CropRect } | null>(null);
  // Every workingUrl after the first is a blob: URL we created ourselves
  // (from a rotate/crop export) — the original `imageUrl` prop is owned by
  // the caller and must never be revoked here.
  const ownedUrlsRef = useRef<Set<string>>(new Set());

  const [mode, setMode] = useState<Mode>("draw");
  const [workingUrl, setWorkingUrl] = useState(imageUrl);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [color, setColor] = useState(PEN_COLORS[0]);
  const [penWidth, setPenWidth] = useState(PEN_SIZES[1].value);
  const [saving, setSaving] = useState(false);
  const [transforming, setTransforming] = useState(false);
  const [cropRect, setCropRect] = useState<CropRect>(DEFAULT_CROP);

  // Load the current working image and size the canvas to its natural
  // (full) resolution — drawing happens in that coordinate space regardless
  // of how large the canvas is displayed on screen, so exports stay full
  // quality and drawing stays accurate on any device.
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
    img.src = workingUrl;
    return () => {
      cancelled = true;
    };
  }, [workingUrl]);

  useEffect(() => {
    return () => {
      for (const url of ownedUrlsRef.current) URL.revokeObjectURL(url);
    };
  }, []);

  const replaceWorkingImage = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    ownedUrlsRef.current.add(url);
    setStrokes([]);
    setReady(false);
    setCropRect(DEFAULT_CROP);
    setWorkingUrl(url);
  };

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
    if (!ready || mode !== "draw") return;
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

  // ── Rotate ───────────────────────────────────────────────────────
  const handleRotate = (direction: "left" | "right") => {
    const img = imgElRef.current;
    if (!img || transforming) return;
    setTransforming(true);
    const off = document.createElement("canvas");
    off.width = img.naturalHeight;
    off.height = img.naturalWidth;
    const ctx = off.getContext("2d");
    if (!ctx) {
      setTransforming(false);
      return;
    }
    ctx.translate(off.width / 2, off.height / 2);
    ctx.rotate((direction === "left" ? -90 : 90) * (Math.PI / 180));
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    off.toBlob((blob) => {
      setTransforming(false);
      if (blob) replaceWorkingImage(blob);
    }, "image/png");
  };

  // ── Crop ─────────────────────────────────────────────────────────
  const clampCrop = (r: CropRect): CropRect => {
    const w = Math.min(100, Math.max(MIN_CROP_PERCENT, r.w));
    const h = Math.min(100, Math.max(MIN_CROP_PERCENT, r.h));
    const x = Math.min(100 - w, Math.max(0, r.x));
    const y = Math.min(100 - h, Math.max(0, r.y));
    return { x, y, w, h };
  };

  const handleCropPointerDown = (kind: CropDragKind) => (e: React.PointerEvent) => {
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    cropDragRef.current = { kind, startX: e.clientX, startY: e.clientY, startRect: cropRect };
  };

  const handleCropPointerMove = (e: React.PointerEvent) => {
    const drag = cropDragRef.current;
    const box = imageBoxRef.current;
    if (!drag || !box) return;
    const rect = box.getBoundingClientRect();
    const dxPct = ((e.clientX - drag.startX) / rect.width) * 100;
    const dyPct = ((e.clientY - drag.startY) / rect.height) * 100;
    const s = drag.startRect;

    if (drag.kind === "move") {
      setCropRect(clampCrop({ ...s, x: s.x + dxPct, y: s.y + dyPct }));
      return;
    }
    let next = { ...s };
    if (drag.kind === "nw") next = { x: s.x + dxPct, y: s.y + dyPct, w: s.w - dxPct, h: s.h - dyPct };
    if (drag.kind === "ne") next = { x: s.x, y: s.y + dyPct, w: s.w + dxPct, h: s.h - dyPct };
    if (drag.kind === "sw") next = { x: s.x + dxPct, y: s.y, w: s.w - dxPct, h: s.h + dyPct };
    if (drag.kind === "se") next = { x: s.x, y: s.y, w: s.w + dxPct, h: s.h + dyPct };
    setCropRect(clampCrop(next));
  };

  const handleCropPointerUp = () => {
    cropDragRef.current = null;
  };

  const handleApplyCrop = () => {
    const img = imgElRef.current;
    if (!img || transforming) return;
    setTransforming(true);
    const sx = (cropRect.x / 100) * img.naturalWidth;
    const sy = (cropRect.y / 100) * img.naturalHeight;
    const sw = (cropRect.w / 100) * img.naturalWidth;
    const sh = (cropRect.h / 100) * img.naturalHeight;
    const off = document.createElement("canvas");
    off.width = Math.max(1, Math.round(sw));
    off.height = Math.max(1, Math.round(sh));
    const ctx = off.getContext("2d");
    if (!ctx) {
      setTransforming(false);
      return;
    }
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, off.width, off.height);
    off.toBlob((blob) => {
      setTransforming(false);
      if (blob) replaceWorkingImage(blob);
      setMode("draw");
    }, "image/png");
  };

  // ── Export ───────────────────────────────────────────────────────
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
      const file = new File([blob], `edited-${Date.now()}.png`, { type: "image/png" });
      await onSave(file);
    } finally {
      setSaving(false);
    }
  };

  const MODE_TABS: { key: Mode; icon: React.ReactNode; labelKey: string }[] = [
    { key: "draw", icon: <Pencil size={13} />, labelKey: "modeDraw" },
    { key: "crop", icon: <Crop size={13} />, labelKey: "modeCrop" },
    { key: "rotate", icon: <RotateCw size={13} />, labelKey: "modeRotate" },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-gray-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 flex-shrink-0">
          <h3 className="text-white font-semibold text-sm">{t("adminProducts.markup.heading")}</h3>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-300"
          >
            <X size={16} />
          </button>
        </div>

        {/* Mode tabs */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-gray-800 flex-shrink-0">
          {MODE_TABS.map((m) => (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              className={clsx(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                mode === m.key ? "bg-brand-500 text-white" : "bg-gray-800 hover:bg-gray-700 text-gray-300"
              )}
            >
              {m.icon} {t(`adminProducts.markup.${m.labelKey}`)}
            </button>
          ))}
        </div>

        {/* Canvas area */}
        <div className="relative flex-1 min-h-0 bg-black flex items-center justify-center p-2 overflow-hidden">
          {loadError ? (
            <p className="text-red-400 text-sm p-8 text-center">{t("adminProducts.markup.loadError")}</p>
          ) : (
            <div ref={imageBoxRef} className="relative max-w-full max-h-full" style={{ touchAction: "none" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={workingUrl} alt="" className="block max-w-full max-h-[70vh] w-auto h-auto select-none pointer-events-none" draggable={false} />
              <canvas
                ref={canvasRef}
                className={clsx("absolute inset-0 w-full h-full touch-none", mode === "draw" ? "cursor-crosshair" : "pointer-events-none")}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={finishStroke}
                onPointerLeave={finishStroke}
                onPointerCancel={finishStroke}
              />
              {(!ready || transforming) && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <Loader2 size={24} className="animate-spin text-white/60" />
                </div>
              )}
              {mode === "crop" && ready && !transforming && (
                <div
                  className="absolute inset-0"
                  onPointerMove={handleCropPointerMove}
                  onPointerUp={handleCropPointerUp}
                  onPointerCancel={handleCropPointerUp}
                >
                  {/* Dimmed area outside the crop rect */}
                  <div className="absolute inset-0 bg-black/50" style={{ clipPath: `polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 ${cropRect.y}%, ${cropRect.x}% ${cropRect.y}%, ${cropRect.x}% ${cropRect.y + cropRect.h}%, ${cropRect.x + cropRect.w}% ${cropRect.y + cropRect.h}%, ${cropRect.x + cropRect.w}% ${cropRect.y}%, 0 ${cropRect.y}%)` }} />
                  <div
                    onPointerDown={handleCropPointerDown("move")}
                    className="absolute border-2 border-white/90 cursor-move"
                    style={{ left: `${cropRect.x}%`, top: `${cropRect.y}%`, width: `${cropRect.w}%`, height: `${cropRect.h}%` }}
                  >
                    {(["nw", "ne", "sw", "se"] as const).map((corner) => (
                      <div
                        key={corner}
                        onPointerDown={handleCropPointerDown(corner)}
                        className={clsx(
                          "absolute w-4 h-4 rounded-full bg-white border-2 border-brand-500",
                          corner === "nw" && "-left-2 -top-2 cursor-nwse-resize",
                          corner === "ne" && "-right-2 -top-2 cursor-nesw-resize",
                          corner === "sw" && "-left-2 -bottom-2 cursor-nesw-resize",
                          corner === "se" && "-right-2 -bottom-2 cursor-nwse-resize"
                        )}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Toolbar */}
        <div className="px-4 py-3 border-t border-gray-800 flex-shrink-0 space-y-3">
          {mode === "draw" && (
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
                    title={t(`adminProducts.markup.${s.labelKey}`)}
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
                  <Undo2 size={13} /> {t("adminProducts.markup.undo")}
                </button>
                <button
                  onClick={handleClearAll}
                  disabled={strokes.length === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-red-400 transition-colors"
                >
                  <Trash2 size={13} /> {t("adminProducts.markup.eraseAll")}
                </button>
              </div>
            </div>
          )}

          {mode === "crop" && (
            <button
              onClick={handleApplyCrop}
              disabled={transforming || !ready}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white transition-colors"
            >
              <Crop size={15} /> {t("adminProducts.markup.applyCrop")}
            </button>
          )}

          {mode === "rotate" && (
            <div className="flex gap-2">
              <button
                onClick={() => handleRotate("left")}
                disabled={transforming || !ready}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-gray-800 hover:bg-gray-700 disabled:opacity-60 text-gray-200 transition-colors"
              >
                <RotateCcw size={15} /> {t("adminProducts.markup.rotateLeft")}
              </button>
              <button
                onClick={() => handleRotate("right")}
                disabled={transforming || !ready}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-gray-800 hover:bg-gray-700 disabled:opacity-60 text-gray-200 transition-colors"
              >
                <RotateCw size={15} /> {t("adminProducts.markup.rotateRight")}
              </button>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
            >
              {t("adminProducts.common.cancel")}
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !ready}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white transition-colors"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              {saving ? t("adminProducts.markup.saving") : t("adminProducts.common.save")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
