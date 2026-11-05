import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CartItem, Language, Customer, Product } from "./types";
import * as customersApi from "./api/customers";
import * as productsApi from "./api/products";
import { allocateGroupedLineTotals } from "./pricing";
import { localized } from "./i18n/localized";
import { availableQuantity } from "./stock";

type CartLineId = Pick<CartItem, "selectedColor" | "selectedSize" | "selectedImageIndex"> & { product: Pick<Product, "id"> };

/** One cart line = one product + color + size + photo; two sizes of the same product are separate lines. */
function sameCartLine(a: CartLineId, b: CartLineId): boolean {
  return (
    a.product.id === b.product.id &&
    a.selectedColor === b.selectedColor &&
    (a.selectedSize ?? "") === (b.selectedSize ?? "") &&
    a.selectedImageIndex === b.selectedImageIndex
  );
}

/** Most this line may hold: the variant's stock minus what other lines (other photos) of the same color+size already take. */
export function maxQuantityForLine(items: CartItem[], line: CartItem): number {
  const available = availableQuantity(line.product, line.selectedColor, line.selectedSize ?? "");
  const takenElsewhere = items
    .filter(
      (i) =>
        !sameCartLine(i, line) &&
        i.product.id === line.product.id &&
        i.selectedColor === line.selectedColor &&
        (i.selectedSize ?? "") === (line.selectedSize ?? "")
    )
    .reduce((n, i) => n + i.quantity, 0);
  return Math.max(0, available - takenElsewhere);
}

/**
 * Bulk-tier pricing is pooled across every cart line of the SAME product
 * (different color/size/photo lines included) rather than priced per line
 * in isolation — mirrors the backend's grouped allocation exactly, so the
 * cart total always matches what checkout will actually charge.
 */
function lineKey(i: CartItem) {
  return `${i.product.id}::${i.selectedColor}::${i.selectedSize ?? ""}::${i.selectedImageIndex ?? ""}`;
}

function computeLineTotals(items: CartItem[]): Map<string, number> {
  const byProduct = new Map<string, CartItem[]>();
  for (const item of items) {
    const list = byProduct.get(item.product.id) ?? [];
    list.push(item);
    byProduct.set(item.product.id, list);
  }
  const totals = new Map<string, number>();
  for (const group of byProduct.values()) {
    const allocated = allocateGroupedLineTotals(
      group[0].product.price,
      group[0].product.bulkPrices,
      group.map((i) => i.quantity)
    );
    group.forEach((item, i) => totals.set(lineKey(item), allocated[i]));
  }
  return totals;
}

/**
 * Carts saved by an older version of the app can hold product snapshots from before fields like variants
 * (per-size stock) or bulkPrices existed. Fill those in with empty values on load, so the cart never crashes
 * reading them; refreshCart() then replaces each snapshot with the live product anyway.
 */
function normalizeSavedItems(items: unknown): CartItem[] {
  if (!Array.isArray(items)) return [];
  return items
    .filter((i) => i && typeof i === "object" && (i as CartItem).product)
    .map((i) => {
      const item = i as CartItem;
      const p = item.product;
      return {
        ...item,
        product: {
          ...p,
          variants: p.variants ?? [],
          bulkPrices: p.bulkPrices ?? [],
          colors: p.colors ?? [],
          sizes: p.sizes ?? [],
          media: p.media ?? [],
          tags: p.tags ?? [],
        },
      };
    });
}

interface CartStore {
  items: CartItem[];
  language: Language;
  /** True once the language has been set at least once (an explicit choice, or the one-time browser auto-detect) — guards against re-detecting on every visit and clobbering a returning user's choice. */
  languageInitialized: boolean;
  chatOpen: boolean;

  // Cart actions
  addToCart: (item: CartItem) => void;
  removeFromCart: (line: CartLineId) => void;
  /** Clamped to the line's available stock; 0 or less removes the line. */
  updateQuantity: (line: CartLineId, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;
  getLineTotal: (item: CartItem) => number;
  /**
   * The cart persists full product snapshots (name, price, media presigned
   * URLs) in localStorage indefinitely — a line added before a catalogue
   * change (or, worse, a product deletion) silently goes stale: broken
   * thumbnails once the presigned URL expires (an hour, by default), and a
   * hard "Product not found" from the backend at order-creation time if the
   * product itself is gone. Re-fetches every distinct product still in the
   * cart and refreshes each line in place; a line whose product (or
   * specifically chosen picture) no longer exists is dropped instead. Returns
   * the names of any dropped lines so the UI can tell the customer why.
   */
  refreshCart: () => Promise<string[]>;

  // Language
  setLanguage: (lang: Language) => void;

  // Chat widget UI state
  setChatOpen: (open: boolean) => void;

  // Which conversation this browser/customer owns — created lazily on first message
  conversationId: string | null;
  setConversationId: (id: string | null) => void;

  // One-shot prefill (e.g. from a product's "Ask about this product" button) — ChatBlob
  // consumes it into its input/staged-image on open, then it's cleared.
  chatDraft: { text: string; imageUrl?: string } | null;
  setChatDraft: (draft: { text: string; imageUrl?: string } | null) => void;

  // Customer session — backed by the real API (see lib/api/customers.ts)
  customer: Customer | null;
  registerCustomer: (data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    password: string;
    referralCode?: string;
  }) => Promise<{ ok: true; customer: Customer } | { ok: false; error: string }>;
  loginCustomer: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  loginWithGoogle: (idToken: string, referralCode?: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  logoutCustomer: () => void;
}

export const useStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      language: "en",
      languageInitialized: false,
      chatOpen: false,
      customer: null,
      conversationId: null,
      chatDraft: null,

      /* ── Cart ── */
      addToCart: (newItem) =>
        set((state) => {
          const existing = state.items.find((i) => sameCartLine(i, newItem));
          const max = maxQuantityForLine(state.items, newItem);
          const quantity = Math.min((existing?.quantity ?? 0) + newItem.quantity, max);
          if (existing) {
            return { items: state.items.map((i) => (sameCartLine(i, newItem) ? { ...i, quantity } : i)) };
          }
          if (quantity <= 0) return state;
          return { items: [...state.items, { ...newItem, quantity }] };
        }),

      removeFromCart: (line) => set((state) => ({ items: state.items.filter((i) => !sameCartLine(i, line)) })),

      updateQuantity: (line, quantity) =>
        set((state) => {
          if (quantity <= 0) return { items: state.items.filter((i) => !sameCartLine(i, line)) };
          return {
            items: state.items.map((i) =>
              sameCartLine(i, line) ? { ...i, quantity: Math.min(quantity, maxQuantityForLine(state.items, i)) } : i
            ),
          };
        }),

      clearCart: () => set({ items: [] }),

      refreshCart: async () => {
        const currentItems = get().items;
        const productIds = Array.from(new Set(currentItems.map((i) => i.product.id)));
        if (productIds.length === 0) return [];

        const results = await Promise.all(
          productIds.map((id) => productsApi.getProduct(id).catch(() => null))
        );
        const freshById = new Map(productIds.map((id, i) => [id, results[i]]));

        const language = get().language;
        const nameOf = (p: Product) => localized(p.name, p.nameFr, language);
        const removedNames: string[] = [];
        const items = get().items.flatMap((item) => {
          const fresh = freshById.get(item.product.id);
          if (!fresh) {
            removedNames.push(nameOf(item.product));
            return [];
          }
          if (item.selectedImageIndex != null && item.selectedImageIndex >= fresh.media.length) {
            removedNames.push(nameOf(fresh));
            return [];
          }
          return [{ ...item, product: fresh }];
        });
        set({ items });
        return removedNames;
      },

      getCartTotal: () => {
        const totals = computeLineTotals(get().items);
        return get().items.reduce((sum, i) => sum + (totals.get(lineKey(i)) ?? 0), 0);
      },

      getCartCount: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),

      getLineTotal: (item) => computeLineTotals(get().items).get(lineKey(item)) ?? 0,

      setLanguage: (lang) => set({ language: lang, languageInitialized: true }),

      setChatOpen: (open) => set({ chatOpen: open }),

      setConversationId: (id) => set({ conversationId: id }),

      setChatDraft: (draft) => set({ chatDraft: draft }),

      /* ── Customer account ── */
      registerCustomer: async (data) => {
        try {
          const customer = await customersApi.registerCustomer(data);
          set({ customer });
          return { ok: true, customer };
        } catch (e) {
          return { ok: false, error: e instanceof Error ? e.message : "Registration failed" };
        }
      },

      loginCustomer: async (email, password) => {
        try {
          const customer = await customersApi.loginCustomer(email, password);
          set({ customer });
          return { ok: true };
        } catch (e) {
          return { ok: false, error: e instanceof Error ? e.message : "Login failed" };
        }
      },

      loginWithGoogle: async (idToken, referralCode) => {
        try {
          const customer = await customersApi.loginWithGoogle(idToken, referralCode);
          set({ customer });
          return { ok: true };
        } catch (e) {
          return { ok: false, error: e instanceof Error ? e.message : "Google sign-in failed" };
        }
      },

      logoutCustomer: () => set({ customer: null }),
    }),
    {
      // bumped from "riskyc-store-v2" — orders/conversations/customers are no
      // longer cached client-side at all, they're fetched from the API on
      // demand, so the old persisted shape (with demo seed arrays) doesn't apply
      name: "riskyc-store-v3",
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<CartStore>;
        return { ...current, ...saved, items: normalizeSavedItems(saved.items) };
      },
      partialize: (state) => ({
        items: state.items,
        language: state.language,
        languageInitialized: state.languageInitialized,
        customer: state.customer,
        conversationId: state.conversationId,
      }),
    }
  )
);
