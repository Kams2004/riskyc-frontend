import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CartItem, Language, Customer } from "./types";
import * as customersApi from "./api/customers";
import { computeLineTotal } from "./pricing";

interface CartStore {
  items: CartItem[];
  language: Language;
  chatOpen: boolean;

  // Cart actions
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string, color: string, selectedImageIndex?: number) => void;
  updateQuantity: (productId: string, color: string, quantity: number, selectedImageIndex?: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;

  // Language
  setLanguage: (lang: Language) => void;

  // Chat widget UI state
  setChatOpen: (open: boolean) => void;

  // Which conversation this browser/customer owns — created lazily on first message
  conversationId: string | null;
  setConversationId: (id: string) => void;

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
  }) => Promise<{ ok: true; customer: Customer } | { ok: false; error: string }>;
  loginCustomer: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  logoutCustomer: () => void;
}

export const useStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      language: "en",
      chatOpen: false,
      customer: null,
      conversationId: null,
      chatDraft: null,

      /* ── Cart ── */
      addToCart: (newItem) =>
        set((state) => {
          const sameLine = (i: CartItem) =>
            i.product.id === newItem.product.id &&
            i.selectedColor === newItem.selectedColor &&
            i.selectedSize === newItem.selectedSize &&
            i.selectedImageIndex === newItem.selectedImageIndex;
          const existing = state.items.find(sameLine);
          if (existing) {
            return {
              items: state.items.map((i) =>
                sameLine(i) ? { ...i, quantity: i.quantity + newItem.quantity } : i
              ),
            };
          }
          return { items: [...state.items, newItem] };
        }),

      removeFromCart: (productId, color, selectedImageIndex) =>
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.product.id === productId && i.selectedColor === color && i.selectedImageIndex === selectedImageIndex)
          ),
        })),

      updateQuantity: (productId, color, quantity, selectedImageIndex) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter(
                  (i) =>
                    !(i.product.id === productId && i.selectedColor === color && i.selectedImageIndex === selectedImageIndex)
                )
              : state.items.map((i) =>
                  i.product.id === productId && i.selectedColor === color && i.selectedImageIndex === selectedImageIndex
                    ? { ...i, quantity }
                    : i
                ),
        })),

      clearCart: () => set({ items: [] }),

      getCartTotal: () =>
        get().items.reduce((sum, i) => sum + computeLineTotal(i.product.price, i.product.bulkPrices, i.quantity), 0),

      getCartCount: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),

      setLanguage: (lang) => set({ language: lang }),

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

      logoutCustomer: () => set({ customer: null }),
    }),
    {
      // bumped from "riskyc-store-v2" — orders/conversations/customers are no
      // longer cached client-side at all, they're fetched from the API on
      // demand, so the old persisted shape (with demo seed arrays) doesn't apply
      name: "riskyc-store-v3",
      partialize: (state) => ({
        items: state.items,
        language: state.language,
        customer: state.customer,
        conversationId: state.conversationId,
      }),
    }
  )
);
