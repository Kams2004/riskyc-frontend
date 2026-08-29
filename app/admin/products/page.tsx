"use client";

import AdminShell from "@/components/admin/AdminShell";
import { useAdminStore } from "@/lib/adminStore";
import { useAdminColors } from "@/lib/useAdminColors";
import { useCategories } from "@/lib/useCategories";
import * as productsApi from "@/lib/api/products";
import { formatPrice } from "@/lib/data";
import { Product } from "@/lib/types";
import Link from "next/link";
import ConfirmDialog, { ConfirmState } from "@/components/admin/ConfirmDialog";
import { useState, useEffect } from "react";
import {
  Plus, Pencil, Trash2, Search, Star, Package,
  LayoutGrid, List, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, Eye, EyeOff,
} from "lucide-react";
import clsx from "clsx";

const PAGE_SIZES = [10, 20, 50];

export default function AdminProductsPage() {
  const token = useAdminStore((s) => s.session?.token);
  const { categories } = useCategories();
  const c = useAdminColors();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [catFilter, setCatFilter]   = useState("all");
  const [confirm, setConfirm]       = useState<ConfirmState | null>(null);
  const [viewMode, setViewMode]     = useState<"grid" | "table">("table");
  const [page, setPage]             = useState(1);
  const [pageSize, setPageSize]     = useState(10);

  useEffect(() => {
    if (!token) return;
    productsApi.listAdminProducts(token).then(setProducts).catch(() => {}).finally(() => setLoading(false));
  }, [token]);

  const setHidden = async (id: string, hidden: boolean) => {
    if (!token) return;
    const updated = await productsApi.setProductVisibility(id, hidden, token);
    setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
  };

  const filtered = products
    .filter((p) => search ? p.name.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase()) : true)
    .filter((p) => catFilter === "all" ? true : p.categorySlug === catFilter);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage   = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleSearch  = (v: string) => { setSearch(v);  setPage(1); };
  const handleCat     = (v: string) => { setCatFilter(v); setPage(1); };
  const handlePgSize  = (v: number) => { setPageSize(v); setPage(1); };

  const askDelete = (id: string, name: string) => {
    setConfirm({
      title: "Delete product?",
      message: `This will permanently delete "${name}". This cannot be undone.`,
      confirmLabel: "Delete",
      onConfirm: async () => {
        if (token) {
          await productsApi.deleteProduct(id, token);
          setProducts((prev) => prev.filter((p) => p.id !== id));
        }
        setConfirm(null);
      },
    });
  };

  const PaginationBar = () => (
    <div className={clsx("flex items-center justify-between flex-wrap gap-3 px-1", c.textSecondary)}>
      <div className="flex items-center gap-3 text-sm">
        <span>
          {filtered.length === 0 ? "No products"
            : `${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, filtered.length)} of ${filtered.length}`}
        </span>
        <select value={pageSize} onChange={(e) => handlePgSize(Number(e.target.value))}
          className={clsx("text-sm rounded-lg px-2 py-1 border outline-none",
            c.isDark ? "bg-gray-800 border-gray-700 text-gray-300" : "bg-white border-gray-300 text-gray-700")}>
          {PAGE_SIZES.map((s) => <option key={s} value={s}>{s} / page</option>)}
        </select>
      </div>
      <div className="flex items-center gap-1">
        <PagBtn onClick={() => setPage(1)} disabled={safePage === 1} title="First"><ChevronsLeft size={14} /></PagBtn>
        <PagBtn onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1} title="Prev"><ChevronLeft size={14} /></PagBtn>
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
          .reduce<(number | "…")[]>((acc, p, i, arr) => {
            if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push("…");
            acc.push(p); return acc;
          }, [])
          .map((p, i) => p === "…"
            ? <span key={`e${i}`} className="px-1 text-xs text-gray-500">…</span>
            : <PagBtn key={p} onClick={() => setPage(p as number)} active={safePage === p} title={`Page ${p}`}>{p}</PagBtn>
          )}
        <PagBtn onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} title="Next"><ChevronRight size={14} /></PagBtn>
        <PagBtn onClick={() => setPage(totalPages)} disabled={safePage === totalPages} title="Last"><ChevronsRight size={14} /></PagBtn>
      </div>
    </div>
  );

  return (
    <AdminShell>
      <div className="p-6 lg:p-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className={clsx("text-2xl font-bold", c.textPrimary)}>Products</h1>
            <p className={clsx("text-sm mt-0.5", c.textSecondary)}>
              {products.length} products across {categories.length} categories
            </p>
          </div>
          <Link href="/admin/products/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors shadow-lg shadow-brand-500/20">
            <Plus size={16} /> Add Product
          </Link>
        </div>

        {/* Filters + view toggle */}
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex flex-wrap gap-3 items-center">
            <div className={clsx("flex items-center gap-2 border rounded-xl px-3 py-2",
              c.isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-300")}>
              <Search size={15} className="text-gray-400 flex-shrink-0" />
              <input type="text" placeholder="Search products…" value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className={clsx("bg-transparent text-sm outline-none w-44",
                  c.isDark ? "text-white placeholder-gray-500" : "text-gray-900 placeholder-gray-400")} />
            </div>
            <div className="flex gap-2 flex-wrap">
              {[{ slug: "all", label: "All" }, ...categories.map((cat) => ({ slug: cat.slug, label: cat.name }))].map((cat) => (
                <button key={cat.slug} onClick={() => handleCat(cat.slug)}
                  className={clsx("px-3 py-1.5 rounded-xl text-xs font-semibold transition-all",
                    catFilter === cat.slug ? "bg-brand-500 text-white shadow-sm" : c.filterInactive)}>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
          <div className={clsx("flex items-center rounded-xl border p-1 gap-1",
            c.isDark ? "bg-gray-800 border-gray-700" : "bg-gray-100 border-gray-200")}>
            <button onClick={() => setViewMode("table")} title="Table view"
              className={clsx("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                viewMode === "table" ? "bg-brand-500 text-white shadow-sm"
                : c.isDark ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-800")}>
              <List size={14} /> Table
            </button>
            <button onClick={() => setViewMode("grid")} title="Grid view"
              className={clsx("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                viewMode === "grid" ? "bg-brand-500 text-white shadow-sm"
                : c.isDark ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-800")}>
              <LayoutGrid size={14} /> Grid
            </button>
          </div>
        </div>

        {/* Empty state */}
        {loading ? (
          <div className={clsx("text-center py-20 rounded-2xl border", c.card)}>
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Package size={40} className={clsx("mx-auto mb-3 opacity-30", c.textMuted)} />
            <p className={clsx("text-sm", c.textMuted)}>No products found</p>
          </div>
        ) : (
          <>
            <PaginationBar />

            {/* ── TABLE VIEW ─────────────────────────────────────────────────── */}
            {viewMode === "table" && (
              <div className={clsx("rounded-2xl border overflow-hidden overflow-x-auto", c.card)}>
                {/*
                  Use a real <table> so the browser aligns every column
                  header with its data cells automatically.
                */}
                <table className="w-full min-w-[880px] border-collapse text-sm">
                  <colgroup>
                    <col style={{ width: "44px" }} />
                    <col style={{ width: "auto" }} />
                    <col style={{ width: "110px" }} />
                    <col style={{ width: "130px" }} />
                    <col style={{ width: "72px" }} />
                    <col style={{ width: "72px" }} />
                    <col style={{ width: "68px" }} />
                    <col style={{ width: "90px" }} />
                    <col style={{ width: "150px" }} />
                  </colgroup>

                  {/* ── Header ── */}
                  <thead>
                    <tr className={clsx("border-b text-xs font-semibold uppercase tracking-wider", c.border, c.textMuted)}>
                      <th className="px-4 py-3 text-left font-semibold" />
                      <th className="px-4 py-3 text-left font-semibold">Product</th>
                      <th className="px-4 py-3 text-left font-semibold">Category</th>
                      <th className="px-4 py-3 text-left font-semibold">Price</th>
                      <th className="px-4 py-3 text-center font-semibold">Stock</th>
                      <th className="px-4 py-3 text-center font-semibold">Rating</th>
                      <th className="px-4 py-3 text-center font-semibold">Badge</th>
                      <th className="px-4 py-3 text-center font-semibold">Visibility</th>
                      <th className="px-4 py-3 text-center font-semibold">Actions</th>
                    </tr>
                  </thead>

                  {/* ── Rows ── */}
                  <tbody className={clsx("divide-y", c.divide)}>
                    {paginated.map((product) => {
                      const cat        = categories.find((ca) => ca.slug === product.categorySlug);
                      const totalStock = product.colors.reduce((s, col) => s + (col.stock ?? 0), 0);
                      return (
                        <tr key={product.id} className={clsx("transition-colors", c.rowHover, product.hidden && "opacity-50")}>

                          {/* Thumbnail */}
                          <td className="px-4 py-3">
                            <div className={clsx("w-9 h-9 rounded-lg overflow-hidden border flex-shrink-0", c.border)}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={product.media[0]?.presignedUrl} alt="" className="w-full h-full object-cover" />
                            </div>
                          </td>

                          {/* Name + color swatches */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <p className={clsx("text-sm font-semibold leading-tight", c.textPrimary)}>{product.name}</p>
                              {product.hidden && (
                                <span className={clsx("flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap", c.isDark ? "bg-gray-700 text-gray-400" : "bg-gray-200 text-gray-500")}>
                                  <EyeOff size={9} /> HIDDEN
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 mt-1.5">
                              {product.colors.slice(0, 6).map((col) => (
                                <div key={col.name} title={`${col.name}${col.stock != null ? ` (${col.stock})` : ""}`}
                                  className="w-3 h-3 rounded-full border flex-shrink-0"
                                  style={{ backgroundColor: col.hex, borderColor: c.isDark ? "#4b5563" : "#d1d5db" }} />
                              ))}
                              {product.colors.length > 6 && <span className={clsx("text-xs", c.textMuted)}>+{product.colors.length - 6}</span>}
                            </div>
                            {product.createdByName && (
                              <p className={clsx("text-[10px] mt-1", c.textMuted)}>Added by {product.createdByName}</p>
                            )}
                          </td>

                          {/* Category */}
                          <td className="px-4 py-3">
                            <span className={clsx("text-xs whitespace-nowrap", c.textSecondary)}>
                              {cat?.name}
                            </span>
                          </td>

                          {/* Price */}
                          <td className="px-4 py-3">
                            <span className="text-sm font-bold text-brand-500 whitespace-nowrap">{formatPrice(product.price)}</span>
                            {product.originalPrice && (
                              <p className={clsx("text-xs line-through whitespace-nowrap", c.textMuted)}>{formatPrice(product.originalPrice)}</p>
                            )}
                          </td>

                          {/* Stock */}
                          <td className="px-4 py-3 text-center">
                            <span className={clsx("text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap",
                              totalStock === 0   ? "bg-red-100 text-red-600"
                              : totalStock <= 5  ? "bg-orange-100 text-orange-600"
                                                 : "bg-green-100 text-green-700")}>
                              {totalStock === 0 ? "Out" : totalStock}
                            </span>
                          </td>

                          {/* Rating */}
                          <td className="px-4 py-3 text-center">
                            <span className={clsx("inline-flex items-center gap-1 text-xs whitespace-nowrap", c.textSecondary)}>
                              <Star size={11} className="text-amber-400 fill-amber-400" />
                              {product.rating}
                            </span>
                          </td>

                          {/* Badge */}
                          <td className="px-4 py-3 text-center">
                            {product.badge ? (
                              <span className={clsx("text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap",
                                product.badge === "NEW"  ? "bg-emerald-500/15 text-emerald-500"
                                : product.badge === "SALE" ? "bg-brand-500/15 text-brand-500"
                                                           : "bg-orange-500/15 text-orange-500")}>
                                {product.badge}
                              </span>
                            ) : <span className={clsx("text-xs", c.textMuted)}>—</span>}
                          </td>

                          {/* Visibility */}
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => setHidden(product.id, !product.hidden)}
                              title={product.hidden ? "Unhide product" : "Hide product"}
                              className={clsx("inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap",
                                product.hidden
                                  ? c.isDark ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                                  : c.isDark ? "bg-green-500/15 text-green-400 hover:bg-green-500/25" : "bg-green-50 text-green-600 hover:bg-green-100")}>
                              {product.hidden ? <EyeOff size={12} /> : <Eye size={12} />}
                            </button>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1.5">
                              <Link href={`/admin/products/${product.id}/view`}
                                className={clsx("inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap",
                                  c.isDark ? "bg-blue-500/15 text-blue-400 hover:bg-blue-500/25" : "bg-blue-50 text-blue-600 hover:bg-blue-100")}>
                                <Eye size={12} /> View
                              </Link>
                              <Link href={`/admin/products/${product.id}/edit`}
                                className={clsx("inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap", c.btnGhost)}>
                                <Pencil size={12} /> Edit
                              </Link>
                              <button onClick={() => askDelete(product.id, product.name)}
                                className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap bg-red-500/10 text-red-500 hover:bg-red-500/20">
                                <Trash2 size={12} />
                                Del
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── GRID VIEW ──────────────────────────────────────────────────── */}
            {viewMode === "grid" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {paginated.map((product) => {
                  const cat        = categories.find((ca) => ca.slug === product.categorySlug);
                  const totalStock = product.colors.reduce((s, col) => s + (col.stock ?? 0), 0);
                  return (
                    <div key={product.id}
                      className={clsx("rounded-2xl border overflow-hidden group transition-all hover:-translate-y-0.5 hover:shadow-md", c.card, product.hidden && "opacity-60")}>
                      <div className="relative h-48 overflow-hidden bg-gray-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={product.media[0]?.presignedUrl} alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        {product.hidden && (
                          <div className="absolute top-2 left-2">
                            <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-gray-900/80 text-white backdrop-blur-sm">
                              <EyeOff size={11} /> HIDDEN
                            </span>
                          </div>
                        )}
                        {!product.hidden && product.badge && (
                          <div className="absolute top-2 left-2">
                            <span className={clsx("text-xs font-bold px-2 py-0.5 rounded-full",
                              product.badge === "NEW" ? "bg-emerald-500 text-white"
                              : product.badge === "SALE" ? "bg-brand-500 text-white"
                              : "bg-orange-500 text-white")}>
                              {product.badge}
                            </span>
                          </div>
                        )}
                        <div className="absolute bottom-2 left-2">
                          <span className="text-xs bg-black/50 text-white px-2 py-0.5 rounded-full backdrop-blur-sm">
                            {cat?.name}
                          </span>
                        </div>
                        <div className="absolute top-2 right-2">
                          <span className={clsx("text-xs font-medium px-2 py-0.5 rounded-full",
                            totalStock === 0  ? "bg-red-100 text-red-600"
                            : totalStock <= 5 ? "bg-orange-100 text-orange-600"
                                              : "bg-green-100 text-green-700")}>
                            {totalStock === 0 ? "Out of stock" : `${totalStock} in stock`}
                          </span>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className={clsx("font-semibold text-sm leading-tight line-clamp-2 mb-1.5", c.textPrimary)}>{product.name}</h3>
                        <div className="flex items-center gap-1 mb-2">
                          <Star size={11} className="text-amber-400 fill-amber-400" />
                          <span className={clsx("text-xs", c.textSecondary)}>{product.rating} ({product.reviews})</span>
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="font-bold text-brand-500">{formatPrice(product.price)}</span>
                          {product.originalPrice && (
                            <span className={clsx("text-xs line-through", c.textMuted)}>{formatPrice(product.originalPrice)}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mb-4">
                          {product.colors.slice(0, 5).map((col) => (
                            <div key={col.name} title={`${col.name}${col.stock != null ? ` (${col.stock})` : ""}`}
                              className={clsx("w-4 h-4 rounded-full border", c.isDark ? "border-gray-600" : "border-gray-300")}
                              style={{ backgroundColor: col.hex }} />
                          ))}
                          {product.colors.length > 5 && <span className={clsx("text-xs", c.textMuted)}>+{product.colors.length - 5}</span>}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setHidden(product.id, !product.hidden)}
                            title={product.hidden ? "Unhide product" : "Hide product"}
                            className={clsx("inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-colors",
                              product.hidden
                                ? c.isDark ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                                : c.isDark ? "bg-green-500/15 text-green-400 hover:bg-green-500/25" : "bg-green-50 text-green-600 hover:bg-green-100")}>
                            {product.hidden ? <EyeOff size={13} /> : <Eye size={13} />}
                          </button>
                          <Link href={`/admin/products/${product.id}/view`}
                            className={clsx("inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-colors",
                              c.isDark ? "bg-blue-500/15 text-blue-400 hover:bg-blue-500/25" : "bg-blue-50 text-blue-600 hover:bg-blue-100")}>
                            <Eye size={13} /> View
                          </Link>
                          <Link href={`/admin/products/${product.id}/edit`}
                            className={clsx("flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-colors", c.btnGhost)}>
                            <Pencil size={13} /> Edit
                          </Link>
                          <button onClick={() => askDelete(product.id, product.name)}
                            title="Delete product"
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all bg-red-500/10 text-red-500 hover:bg-red-500/20">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <PaginationBar />
          </>
        )}
      </div>

      <ConfirmDialog state={confirm} onCancel={() => setConfirm(null)} />
    </AdminShell>
  );
}

// ── Pagination button helper ───────────────────────────────────────────────────
function PagBtn({ children, onClick, disabled, active, title }: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  title?: string;
}) {
  return (
    <button onClick={onClick} disabled={disabled} title={title}
      className={clsx(
        "min-w-[2rem] h-8 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center",
        active   ? "bg-brand-500 text-white shadow-sm"
        : disabled ? "opacity-30 cursor-not-allowed text-gray-500"
                   : "hover:bg-brand-500/10 text-gray-500 hover:text-brand-500"
      )}>
      {children}
    </button>
  );
}
