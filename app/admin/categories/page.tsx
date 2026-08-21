"use client";

import AdminShell from "@/components/admin/AdminShell";
import { useAdminStore } from "@/lib/adminStore";
import * as categoriesApi from "@/lib/api/categories";
import { Category } from "@/lib/types";
import { useAdminColors } from "@/lib/useAdminColors";
import FaIconPicker, { FaIconPreview } from "@/components/admin/FaIconPicker";
import ConfirmDialog, { ConfirmState } from "@/components/admin/ConfirmDialog";
import { useState, useEffect, useRef } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  Tag,
  Save,
  X,
  FolderOpen,
  LayoutList,
  LayoutGrid,
  Image as ImageIcon,
  Upload,
  Loader2,
} from "lucide-react";
import clsx from "clsx";

function slugify(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, "-");
}

export default function AdminCategoriesPage() {
  const token = useAdminStore((s) => s.session?.token);
  const c = useAdminColors();

  const [categories, setCategories] = useState<Category[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [view, setView] = useState<"list" | "grid">("grid");
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editIcon, setEditIcon] = useState("");
  const [adding, setAdding] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("fa:solid:tag");
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const uploadTargetRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    categoriesApi.listCategories().then(setCategories).catch(() => {});
  }, []);

  const triggerImageUpload = (catId: string) => {
    uploadTargetRef.current = catId;
    fileInputRef.current?.click();
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    const catId = uploadTargetRef.current;
    if (!file || !catId || !token) return;
    setUploadingId(catId);
    try {
      const updated = await categoriesApi.uploadCategoryImage(catId, file, token);
      setCategories((prev) => prev.map((cat) => (cat.id === catId ? { ...cat, imageUrl: updated.imageUrl } : cat)));
    } finally {
      setUploadingId(null);
      uploadTargetRef.current = null;
    }
  };

  const handleDeleteImage = async (catId: string) => {
    if (!token) return;
    const updated = await categoriesApi.deleteCategoryImage(catId, token);
    setCategories((prev) => prev.map((cat) => (cat.id === catId ? { ...cat, imageUrl: updated.imageUrl } : cat)));
  };

  const toggleExpand = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const startEditCat = (id: string, name: string, icon: string) => {
    setEditing(`cat-${id}`);
    setEditValue(name);
    setEditIcon(icon);
    setAdding(null);
  };

  const saveEditCat = async (id: string) => {
    if (!editValue.trim() || !token) return;
    const existing = categories.find((cat) => cat.id === id);
    if (!existing) return;
    const updated = await categoriesApi.updateCategory(
      id,
      { slug: existing.slug, name: editValue.trim(), icon: editIcon || "fa:solid:tag" },
      token
    );
    setCategories((prev) => prev.map((cat) => (cat.id === id ? { ...updated, subcategories: cat.subcategories } : cat)));
    setEditing(null);
  };

  const startEditSub = (catId: string, subId: string, name: string) => {
    setEditing(`sub-${catId}-${subId}`);
    setEditValue(name);
    setAdding(null);
  };

  const saveEditSub = async (catId: string, subId: string) => {
    if (!editValue.trim() || !token) return;
    const cat = categories.find((c) => c.id === catId);
    const existing = cat?.subcategories.find((s) => s.id === subId);
    if (!existing) return;
    const updated = await categoriesApi.updateSubcategory(subId, { slug: existing.slug, name: editValue.trim() }, token);
    setCategories((prev) =>
      prev.map((c) =>
        c.id === catId
          ? { ...c, subcategories: c.subcategories.map((s) => (s.id === subId ? updated : s)) }
          : c
      )
    );
    setEditing(null);
  };

  const startAddCat = () => {
    setAdding("new-cat");
    setNewName("");
    setNewIcon("fa:solid:tag");
    setEditing(null);
  };

  const saveAddCat = async () => {
    if (!newName.trim() || !token) return;
    const created = await categoriesApi.createCategory(
      { slug: slugify(newName), name: newName.trim(), icon: newIcon || "fa:solid:tag" },
      token
    );
    setCategories((prev) => [...prev, created]);
    setAdding(null);
  };

  const startAddSub = (catId: string) => {
    setAdding(`new-sub-${catId}`);
    setNewName("");
    setEditing(null);
    setExpanded((prev) => ({ ...prev, [catId]: true }));
  };

  const saveAddSub = async (catId: string) => {
    if (!newName.trim() || !token) return;
    const created = await categoriesApi.addSubcategory(catId, { slug: slugify(newName), name: newName.trim() }, token);
    setCategories((prev) =>
      prev.map((c) => (c.id === catId ? { ...c, subcategories: [...c.subcategories, created] } : c))
    );
    setAdding(null);
  };

  const askDeleteCategory = (id: string, name: string, subCount: number) => {
    setConfirm({
      title: "Delete category?",
      message: `This will permanently delete "${name}"${
        subCount > 0 ? ` and its ${subCount} subcategor${subCount !== 1 ? "ies" : "y"}` : ""
      }. This cannot be undone.`,
      confirmLabel: "Delete",
      onConfirm: async () => {
        if (token) {
          await categoriesApi.deleteCategory(id, token);
          setCategories((prev) => prev.filter((cat) => cat.id !== id));
        }
        setConfirm(null);
      },
    });
  };

  const askDeleteSubcategory = (catId: string, subId: string, name: string) => {
    setConfirm({
      title: "Delete subcategory?",
      message: `This will permanently delete "${name}". This cannot be undone.`,
      confirmLabel: "Delete",
      onConfirm: async () => {
        if (token) {
          await categoriesApi.deleteSubcategory(subId, token);
          setCategories((prev) =>
            prev.map((cat) =>
              cat.id === catId ? { ...cat, subcategories: cat.subcategories.filter((s) => s.id !== subId) } : cat
            )
          );
        }
        setConfirm(null);
      },
    });
  };

  const inlineInput = clsx(
    "border rounded-lg px-2.5 py-1.5 text-sm outline-none transition-colors",
    c.isDark
      ? "bg-gray-800 border-gray-600 text-white focus:border-brand-500"
      : "bg-white border-gray-300 text-gray-900 focus:border-brand-400"
  );

  return (
    <AdminShell>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageFileChange}
        className="hidden"
      />
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className={clsx("text-2xl font-bold", c.textPrimary)}>Categories</h1>
            <p className={clsx("text-sm mt-0.5", c.textSecondary)}>
              {categories.length} categories ·{" "}
              {categories.reduce((s, cat) => s + cat.subcategories.length, 0)} subcategories
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className={clsx("flex items-center rounded-xl border overflow-hidden", c.isDark ? "border-gray-700" : "border-gray-200")}>
              <button
                onClick={() => setView("list")}
                className={clsx("p-2 transition-colors", view === "list" ? "bg-brand-500 text-white" : c.isDark ? "bg-gray-800 text-gray-400 hover:bg-gray-700" : "bg-white text-gray-500 hover:bg-gray-50")}
                title="List view"
              >
                <LayoutList size={16} />
              </button>
              <button
                onClick={() => setView("grid")}
                className={clsx("p-2 transition-colors", view === "grid" ? "bg-brand-500 text-white" : c.isDark ? "bg-gray-800 text-gray-400 hover:bg-gray-700" : "bg-white text-gray-500 hover:bg-gray-50")}
                title="Grid view"
              >
                <LayoutGrid size={16} />
              </button>
            </div>
            <button
              onClick={startAddCat}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors shadow-lg shadow-brand-500/20"
            >
              <Plus size={16} /> Add Category
            </button>
          </div>
        </div>

        {/* New category form */}
        {adding === "new-cat" && (
          <div className={clsx("rounded-2xl border p-5 space-y-4", c.card)}>
            <p className={clsx("text-sm font-semibold", c.textPrimary)}>New Category</p>
            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <p className={clsx("text-xs font-semibold mb-1.5", c.textSecondary)}>Icon</p>
                <FaIconPicker value={newIcon} onChange={setNewIcon} isDark={c.isDark} />
              </div>
              <div className="flex-1 min-w-[140px]">
                <p className={clsx("text-xs font-semibold mb-1.5", c.textSecondary)}>Name</p>
                <input
                  className={clsx(inlineInput, "w-full")}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveAddCat()}
                  placeholder="Category name"
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={saveAddCat}
                  disabled={!newName.trim()}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white text-sm font-semibold transition-colors"
                >
                  <Save size={14} /> Save
                </button>
                <button
                  onClick={() => setAdding(null)}
                  className={clsx("flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors", c.isDark ? "bg-gray-700 hover:bg-gray-600 text-gray-300" : "bg-gray-100 hover:bg-gray-200 text-gray-600")}
                >
                  <X size={14} /> Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Category list / grid */}
        <div className={clsx(view === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3")}>
          {categories.length === 0 && (
            <div className="text-center py-20">
              <FolderOpen size={40} className={clsx("mx-auto mb-3 opacity-30", c.textMuted)} />
              <p className={clsx("text-sm", c.textMuted)}>No categories yet</p>
            </div>
          )}

          {categories.map((cat) => {
            const isExpanded = expanded[cat.id] ?? true;
            const isEditingCat = editing === `cat-${cat.id}`;
            const isAddingSub = adding === `new-sub-${cat.id}`;

            if (view === "grid") return (
              <div key={cat.id} className={clsx("rounded-2xl border overflow-hidden flex flex-col", c.card)}>
                {/* Cover image */}
                <div className={clsx("relative h-28 group/img flex-shrink-0", c.isDark ? "bg-gray-800" : "bg-gray-100")}>
                  {cat.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon size={22} className={c.textMuted} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover/img:opacity-100">
                    <button
                      onClick={() => triggerImageUpload(cat.id)}
                      disabled={uploadingId === cat.id}
                      title={cat.imageUrl ? "Change cover image" : "Upload cover image"}
                      className="p-2 rounded-lg bg-white/90 text-gray-700 hover:bg-white transition-colors"
                    >
                      {uploadingId === cat.id ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                    </button>
                    {cat.imageUrl && (
                      <button
                        onClick={() => handleDeleteImage(cat.id)}
                        title="Remove cover image"
                        className="p-2 rounded-lg bg-white/90 text-red-600 hover:bg-white transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
                {/* Grid card header */}
                <div className={clsx("flex items-center gap-3 px-4 py-4", c.isDark ? "bg-gray-800/60" : "bg-gray-50")}>
                  {isEditingCat ? (
                    <div className="flex-1 flex flex-col gap-2.5 min-w-0">
                      <FaIconPicker value={editIcon} onChange={setEditIcon} isDark={c.isDark} />
                      <input
                        className={clsx(inlineInput, "w-full")}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") saveEditCat(cat.id); if (e.key === "Escape") setEditing(null); }}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button onClick={() => saveEditCat(cat.id)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-brand-500 text-white text-xs font-semibold">
                          <Save size={12} /> Save
                        </button>
                        <button onClick={() => setEditing(null)} className={clsx("flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs", c.isDark ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-600")}>
                          <X size={12} /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-brand-600", c.isDark ? "bg-brand-500/15" : "bg-brand-50")}>
                        <FaIconPreview value={cat.icon ?? "fa:solid:tag"} size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={clsx("font-semibold text-sm truncate", c.textPrimary)}>{cat.name}</p>
                        <p className={clsx("text-xs font-mono", c.textMuted)}>{cat.id}</p>
                        {cat.createdByName && (
                          <p className={clsx("text-[10px]", c.textMuted)}>Added by {cat.createdByName}</p>
                        )}
                      </div>
                    </>
                  )}
                </div>
                {/* Subcategory pills */}
                <div className="flex-1 px-4 py-3 flex flex-wrap gap-1.5 content-start">
                  {cat.subcategories.length === 0 && !isAddingSub ? (
                    <span className={clsx("text-xs italic", c.textMuted)}>No subcategories</span>
                  ) : cat.subcategories.map((sub) => {
                    const isEditingSub = editing === `sub-${cat.id}-${sub.id}`;
                    if (isEditingSub) {
                      return (
                        <div key={sub.id} className="flex items-center gap-1.5 w-full">
                          <input
                            className={clsx(inlineInput, "flex-1 min-w-0")}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") saveEditSub(cat.id, sub.id); if (e.key === "Escape") setEditing(null); }}
                            autoFocus
                          />
                          <button onClick={() => saveEditSub(cat.id, sub.id)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold flex-shrink-0">
                            <Save size={12} />
                          </button>
                          <button onClick={() => setEditing(null)} className={clsx("p-1.5 rounded-lg flex-shrink-0", c.isDark ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-600")}>
                            <X size={12} />
                          </button>
                          <button onClick={() => askDeleteSubcategory(cat.id, sub.id, sub.name)} className="p-1.5 rounded-lg flex-shrink-0 bg-red-500/10 text-red-500 hover:bg-red-500/20">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      );
                    }
                    return (
                      <button
                        key={sub.id}
                        onClick={() => startEditSub(cat.id, sub.id, sub.name)}
                        className={clsx("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-colors group", c.isDark ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}
                        title="Click to edit"
                      >
                        <Tag size={10} />{sub.name}
                        <Pencil size={9} className="opacity-0 group-hover:opacity-60 transition-opacity" />
                      </button>
                    );
                  })}
                  {isAddingSub && (
                    <div className="flex items-center gap-1.5 w-full mt-1">
                      <input
                        className={clsx(inlineInput, "flex-1 min-w-0")}
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") saveAddSub(cat.id); if (e.key === "Escape") setAdding(null); }}
                        placeholder="Subcategory name"
                        autoFocus
                      />
                      <button
                        onClick={() => saveAddSub(cat.id)}
                        disabled={!newName.trim()}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white text-xs font-semibold flex-shrink-0"
                      >
                        <Save size={12} /> Add
                      </button>
                      <button
                        onClick={() => setAdding(null)}
                        className={clsx("p-1.5 rounded-lg flex-shrink-0", c.isDark ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-600")}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>
                {/* Grid card footer */}
                <div className={clsx("flex items-center justify-between px-4 py-3 border-t", c.divide)}>
                  <span className={clsx("text-xs", c.textMuted)}>{cat.subcategories.length} sub{cat.subcategories.length !== 1 ? "s" : ""}</span>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => startAddSub(cat.id)} className={clsx("flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-colors", c.isDark ? "bg-gray-700 hover:bg-gray-600 text-gray-300" : "bg-white hover:bg-gray-100 text-gray-600 border border-gray-200")}>
                      <Plus size={11} /> Sub
                    </button>
                    <button onClick={() => startEditCat(cat.id, cat.name, cat.icon ?? "fa:solid:tag")} className={clsx("flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-colors", c.btnGhost)}>
                      <Pencil size={11} /> Edit
                    </button>
                    <button onClick={() => askDeleteCategory(cat.id, cat.name, cat.subcategories.length)} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all bg-red-500/10 text-red-500 hover:bg-red-500/20">
                      <Trash2 size={11} />Delete
                    </button>
                  </div>
                </div>
              </div>
            );

            return (
              <div key={cat.id} className={clsx("rounded-2xl border overflow-hidden", c.card)}>
                {/* Category header — entire row is clickable to toggle */}
                <div
                  onClick={() => !isEditingCat && toggleExpand(cat.id)}
                  className={clsx(
                    "flex items-center gap-3 px-5 py-4",
                    !isEditingCat && "cursor-pointer",
                    c.isDark ? "bg-gray-800/60 hover:bg-gray-800/80" : "bg-gray-50 hover:bg-gray-100",
                    "transition-colors"
                  )}
                >
                  <span className={clsx("flex-shrink-0 transition-transform duration-200", isExpanded ? "rotate-0" : "-rotate-90")}>
                    <ChevronDown size={16} className={c.textSecondary} />
                  </span>

                  {!isEditingCat && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className={clsx("relative w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 group/img", c.isDark ? "bg-gray-700" : "bg-gray-200")}
                    >
                      {cat.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon size={14} className={c.textMuted} />
                        </div>
                      )}
                      <button
                        onClick={() => triggerImageUpload(cat.id)}
                        disabled={uploadingId === cat.id}
                        title="Change cover image"
                        className="absolute inset-0 bg-black/0 hover:bg-black/50 transition-colors flex items-center justify-center opacity-0 group-hover/img:opacity-100"
                      >
                        {uploadingId === cat.id ? <Loader2 size={12} className="animate-spin text-white" /> : <Upload size={12} className="text-white" />}
                      </button>
                    </div>
                  )}

                  {isEditingCat ? (
                    <div className="flex flex-wrap items-center gap-3 flex-1">
                      <div>
                        <p className={clsx("text-xs font-semibold mb-1", c.textSecondary)}>Icon</p>
                        <FaIconPicker value={editIcon} onChange={setEditIcon} isDark={c.isDark} />
                      </div>
                      <div className="flex-1 min-w-[140px]">
                        <p className={clsx("text-xs font-semibold mb-1", c.textSecondary)}>Name</p>
                        <input
                          className={clsx(inlineInput, "w-full")}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") saveEditCat(cat.id); if (e.key === "Escape") setEditing(null); }}
                          autoFocus
                        />
                      </div>
                      <div className="flex gap-2 self-end">
                        <button onClick={() => saveEditCat(cat.id)} className="flex items-center gap-1 px-2.5 py-2 rounded-lg bg-brand-500 text-white text-xs font-semibold">
                          <Save size={12} /> Save
                        </button>
                        <button onClick={() => setEditing(null)} className={clsx("flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs", c.isDark ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-600")}>
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Icon display */}
                      <div className={clsx(
                        "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-brand-600",
                        c.isDark ? "bg-brand-500/15" : "bg-brand-50"
                      )}>
                        <FaIconPreview value={cat.icon ?? "fa:solid:tag"} size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className={clsx("font-semibold text-sm", c.textPrimary)}>{cat.name}</p>
                        <p className={clsx("text-xs", c.textSecondary)}>
                          ID: <span className="font-mono">{cat.id}</span> · {cat.subcategories.length} subcategor{cat.subcategories.length !== 1 ? "ies" : "y"}
                        </p>
                      </div>
                    </div>
                  )}

                  {!isEditingCat && (
                    <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => startAddSub(cat.id)}
                        className={clsx("flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors", c.isDark ? "bg-gray-700 hover:bg-gray-600 text-gray-300" : "bg-white hover:bg-gray-100 text-gray-600 border border-gray-200")}
                      >
                        <Plus size={12} /> Sub
                      </button>
                      <button
                        onClick={() => startEditCat(cat.id, cat.name, cat.icon ?? "fa:solid:tag")}
                        className={clsx("flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors", c.btnGhost)}
                      >
                        <Pencil size={12} /> Edit
                      </button>
                      <button
                        onClick={() => askDeleteCategory(cat.id, cat.name, cat.subcategories.length)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all bg-red-500/10 text-red-500 hover:bg-red-500/20"
                      >
                        <Trash2 size={12} />
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                {/* Subcategories */}
                {isExpanded && (
                  <div className={clsx("divide-y", c.divide)}>
                    {cat.subcategories.length === 0 && !isAddingSub && (
                      <div className={clsx("px-6 py-4 text-xs italic", c.textMuted)}>
                        No subcategories yet — click &quot;+ Sub&quot; to add one.
                      </div>
                    )}

                    {cat.subcategories.map((sub) => {
                      const isEditingSub = editing === `sub-${cat.id}-${sub.id}`;

                      return (
                        <div key={sub.id} className={clsx("flex items-center gap-3 px-6 py-3 group transition-colors", c.rowHover)}>
                          <ChevronRight size={13} className={clsx("flex-shrink-0", c.textMuted)} />
                          <Tag size={13} className={clsx("flex-shrink-0", c.textSecondary)} />

                          {isEditingSub ? (
                            <div className="flex flex-wrap items-center gap-2 flex-1">
                              <input
                                className={clsx(inlineInput, "flex-1 min-w-[140px]")}
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") saveEditSub(cat.id, sub.id); if (e.key === "Escape") setEditing(null); }}
                                autoFocus
                              />
                              <button onClick={() => saveEditSub(cat.id, sub.id)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-brand-500 text-white text-xs font-semibold">
                                <Save size={12} /> Save
                              </button>
                              <button onClick={() => setEditing(null)} className={clsx("p-1.5 rounded-lg text-xs", c.isDark ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-600")}>
                                <X size={12} />
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className="flex-1 min-w-0">
                                <span className={clsx("text-sm", c.textPrimary)}>{sub.name}</span>
                                <span className={clsx("ml-2 text-xs font-mono", c.textMuted)}>{sub.id}</span>
                              </div>
                              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                <button
                                  onClick={() => startEditSub(cat.id, sub.id, sub.name)}
                                  className={clsx("flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-colors", c.btnGhost)}
                                >
                                  <Pencil size={11} /> Edit
                                </button>
                                <button
                                  onClick={() => askDeleteSubcategory(cat.id, sub.id, sub.name)}
                                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all bg-red-500/10 text-red-500 hover:bg-red-500/20"
                                >
                                  <Trash2 size={11} />
                                  Delete
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}

                    {/* New subcategory form */}
                    {isAddingSub && (
                      <div className={clsx("flex flex-wrap items-center gap-2 px-6 py-3", c.isDark ? "bg-gray-900/40" : "bg-brand-50/50")}>
                        <ChevronRight size={13} className={c.textMuted} />
                        <Tag size={13} className="text-brand-400" />
                        <input
                          className={clsx(inlineInput, "flex-1 min-w-[140px]")}
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") saveAddSub(cat.id); if (e.key === "Escape") setAdding(null); }}
                          placeholder="Subcategory name"
                          autoFocus
                        />
                        <button
                          onClick={() => saveAddSub(cat.id)}
                          disabled={!newName.trim()}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white text-xs font-semibold"
                        >
                          <Save size={12} /> Add
                        </button>
                        <button
                          onClick={() => setAdding(null)}
                          className={clsx("p-1.5 rounded-lg", c.isDark ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-600")}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <ConfirmDialog state={confirm} onCancel={() => setConfirm(null)} />
    </AdminShell>
  );
}
