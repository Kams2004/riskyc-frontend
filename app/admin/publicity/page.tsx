"use client";

import { useEffect, useRef, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { useAdminStore } from "@/lib/adminStore";
import { useAdminColors } from "@/lib/useAdminColors";
import { useTranslation } from "@/lib/i18n/useTranslation";
import * as publicityApi from "@/lib/api/publicity";
import { PublicityItem } from "@/lib/types";
import { CAPTION_FONT_VALUES, CAPTION_STYLE_VALUES, captionClassName, captionTextShadow } from "@/lib/publicityCaption";
import ConfirmDialog, { ConfirmState } from "@/components/admin/ConfirmDialog";
import clsx from "clsx";
import {
  Megaphone,
  Upload,
  Loader2,
  Trash2,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
} from "lucide-react";

export default function AdminPublicityPage() {
  const token = useAdminStore((s) => s.session?.token);
  const canManage = useAdminStore((s) => s.hasPermission("MANAGE_PUBLICITY"));
  const c = useAdminColors();
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [items, setItems] = useState<PublicityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);

  useEffect(() => {
    if (!token) return;
    publicityApi
      .listPublicityAdmin(token)
      .then(setItems)
      .catch(() => setError(t("adminPublicity.errorLoad")))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleFilesPicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length || !token) return;
    setUploading(true);
    setError(null);
    try {
      for (const file of files) {
        const item = await publicityApi.addPublicityItem(file, undefined, token);
        setItems((prev) => [...prev, item]);
      }
    } catch {
      setError(t("adminPublicity.errorUpload"));
    } finally {
      setUploading(false);
    }
  };

  const handleCaptionBlur = async (id: string, caption: string) => {
    if (!token) return;
    const current = items.find((i) => i.id === id);
    if (!current || current.caption === caption) return;
    try {
      const updated = await publicityApi.updatePublicityItem(id, { caption }, token);
      setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
    } catch {
      setError(t("adminPublicity.errorSave"));
    }
  };

  const handleCaptionStyleChange = async (
    item: PublicityItem,
    patch: { captionFont?: PublicityItem["captionFont"]; captionStyle?: PublicityItem["captionStyle"] }
  ) => {
    if (!token) return;
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, ...patch } : i))); // optimistic, preview updates instantly
    try {
      const updated = await publicityApi.updatePublicityItem(item.id, patch, token);
      setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
    } catch {
      setError(t("adminPublicity.errorSave"));
      setItems((prev) => prev.map((i) => (i.id === item.id ? item : i)));
    }
  };

  const fontLabel = (v: PublicityItem["captionFont"]) => t(v === "display" ? "adminPublicity.fontDisplay" : "adminPublicity.fontSans");
  const styleLabel = (v: PublicityItem["captionStyle"]) =>
    t(
      v === "bold"
        ? "adminPublicity.styleBold"
        : v === "italic"
        ? "adminPublicity.styleItalic"
        : v === "boldItalic"
        ? "adminPublicity.styleBoldItalic"
        : "adminPublicity.styleNormal"
    );

  const toggleActive = async (item: PublicityItem) => {
    if (!token) return;
    setBusyId(item.id);
    try {
      const updated = await publicityApi.updatePublicityItem(item.id, { active: !item.active }, token);
      setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
    } catch {
      setError(t("adminPublicity.errorSave"));
    } finally {
      setBusyId(null);
    }
  };

  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= items.length || !token) return;
    const reordered = [...items];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setItems(reordered);
    try {
      await publicityApi.reorderPublicity(reordered.map((i) => i.id), token);
    } catch {
      setError(t("adminPublicity.errorReorder"));
      setItems(items); // revert on failure
    }
  };

  const askDelete = (item: PublicityItem) => {
    setConfirm({
      title: t("adminPublicity.deleteTitle"),
      message: t("adminPublicity.deleteMessage"),
      confirmLabel: t("adminPublicity.delete"),
      destructive: true,
      onConfirm: async () => {
        if (!token) return;
        try {
          await publicityApi.deletePublicityItem(item.id, token);
          setItems((prev) => prev.filter((i) => i.id !== item.id));
        } catch {
          setError(t("adminPublicity.errorDelete"));
        }
        setConfirm(null);
      },
    });
  };

  return (
    <AdminShell>
      <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple onChange={handleFilesPicked} className="hidden" />
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className={clsx("text-2xl font-bold flex items-center gap-2", c.textPrimary)}>
              <Megaphone size={22} className="text-brand-500" /> {t("adminPublicity.title")}
            </h1>
            <p className={clsx("text-sm mt-0.5", c.textSecondary)}>{t("adminPublicity.subtitle")}</p>
          </div>
          {canManage && (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white transition-colors"
            >
              {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
              {uploading ? t("adminPublicity.uploading") : t("adminPublicity.addButton")}
            </button>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 text-red-500 text-sm font-medium">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={clsx("rounded-2xl border h-56 animate-pulse", c.card)} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className={clsx("text-center py-20", c.textMuted)}>
            <Megaphone className="mx-auto w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">{t("adminPublicity.empty")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item, i) => (
              <div key={item.id} className={clsx("rounded-2xl border overflow-hidden flex flex-col", c.card, !item.active && "opacity-50")}>
                <div className="relative aspect-video bg-black/5">
                  {item.type === "VIDEO" ? (
                    // eslint-disable-next-line jsx-a11y/media-has-caption
                    <video src={item.presignedUrl} className="w-full h-full object-contain" muted loop playsInline autoPlay />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.presignedUrl} alt="" className="w-full h-full object-contain" />
                  )}
                  {/* Live preview — exactly the scrim + font/style treatment the real carousel renders */}
                  {item.caption && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent px-3 pt-8 pb-2.5 pointer-events-none">
                      <p
                        className={clsx("text-white text-xs sm:text-sm line-clamp-2", captionClassName(item))}
                        style={{ textShadow: captionTextShadow }}
                      >
                        {item.caption}
                      </p>
                    </div>
                  )}
                </div>
                <div className="p-3 flex flex-col gap-2 flex-1">
                  <input
                    type="text"
                    defaultValue={item.caption ?? ""}
                    placeholder={t("adminPublicity.captionPlaceholder")}
                    disabled={!canManage}
                    onBlur={(e) => handleCaptionBlur(item.id, e.target.value)}
                    className={clsx(
                      "border rounded-lg px-2.5 py-1.5 text-sm outline-none transition-colors",
                      c.isDark ? "bg-gray-800 border-gray-600 text-white focus:border-brand-500" : "bg-white border-gray-300 text-gray-900 focus:border-brand-400"
                    )}
                  />
                  {canManage && item.caption && (
                    <div className="flex items-center gap-1.5">
                      <select
                        value={item.captionFont}
                        onChange={(e) => handleCaptionStyleChange(item, { captionFont: e.target.value as PublicityItem["captionFont"] })}
                        title={t("adminPublicity.captionFontLabel")}
                        className={clsx(
                          "flex-1 border rounded-lg px-2 py-1.5 text-xs outline-none transition-colors",
                          c.isDark ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                        )}
                      >
                        {CAPTION_FONT_VALUES.map((v) => (
                          <option key={v} value={v}>
                            {fontLabel(v)}
                          </option>
                        ))}
                      </select>
                      <select
                        value={item.captionStyle}
                        onChange={(e) => handleCaptionStyleChange(item, { captionStyle: e.target.value as PublicityItem["captionStyle"] })}
                        title={t("adminPublicity.captionStyleLabel")}
                        className={clsx(
                          "flex-1 border rounded-lg px-2 py-1.5 text-xs outline-none transition-colors",
                          c.isDark ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                        )}
                      >
                        {CAPTION_STYLE_VALUES.map((v) => (
                          <option key={v} value={v}>
                            {styleLabel(v)}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-2 mt-auto pt-1">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => move(i, -1)}
                        disabled={i === 0 || !canManage}
                        title={t("adminPublicity.moveUp")}
                        className={clsx("p-1.5 rounded-lg disabled:opacity-30", c.btnGhost)}
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        onClick={() => move(i, 1)}
                        disabled={i === items.length - 1 || !canManage}
                        title={t("adminPublicity.moveDown")}
                        className={clsx("p-1.5 rounded-lg disabled:opacity-30", c.btnGhost)}
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>
                    {canManage && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => toggleActive(item)}
                          disabled={busyId === item.id}
                          title={item.active ? t("adminPublicity.activeLabel") : t("adminPublicity.inactiveLabel")}
                          className={clsx(
                            "inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-60",
                            item.active
                              ? c.isDark ? "bg-green-500/15 text-green-400 hover:bg-green-500/25" : "bg-green-50 text-green-600 hover:bg-green-100"
                              : c.isDark ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                          )}
                        >
                          {busyId === item.id ? <Loader2 size={12} className="animate-spin" /> : item.active ? <Eye size={12} /> : <EyeOff size={12} />}
                        </button>
                        <button
                          onClick={() => askDelete(item)}
                          title={t("adminPublicity.delete")}
                          className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog state={confirm} onCancel={() => setConfirm(null)} />
    </AdminShell>
  );
}
