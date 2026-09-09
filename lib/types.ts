export type Language = "en" | "fr";

// ── Products / Media ─────────────────────────────────────────────────────────
// These shapes mirror the Spring Boot API's response DTOs exactly (camelCase
// field names, UPPER_SNAKE_CASE enum values) — the frontend has no product
// data of its own anymore, everything comes from GET /api/products.

export interface MediaItem {
  id: string;
  presignedUrl: string;
  type: "IMAGE" | "VIDEO";
  contentType?: string | null;
  sizeBytes?: number | null;
  uploadedAt?: string | null;
}

export interface ProductColor {
  id?: string;
  name: string;
  hex: string;
  /** Null/undefined means the admin never tracked quantity for this color — treat as available. */
  stock?: number | null;
}

export type Badge = "NEW" | "SALE" | "HOT";

/** A "buy N for this total price" tier — independent of the product's regular unit price. */
export interface BulkPriceTier {
  quantity: number;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  description?: string | null;
  /** Machine-translated French versions — null until a translation has succeeded; use lib/i18n/localized.ts to fall back to name/description. */
  nameFr?: string | null;
  descriptionFr?: string | null;
  /** 0 means the admin hasn't set a price yet — display as "Price on request". */
  price: number;
  originalPrice?: number | null;
  categorySlug: string;
  subcategorySlug?: string | null;
  sizes: string[];
  tags: string[];
  rating: number;
  reviews: number;
  badge?: Badge | null;
  hidden: boolean;
  colors: ProductColor[];
  bulkPrices: BulkPriceTier[];
  media: MediaItem[];
  createdByName?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor: string;
  selectedSize?: string;
  /** Which of the product's photos this line was ordered against — set only via the "quantity by photo" picker (colorless products). */
  selectedImageIndex?: number;
}

// ── Categories ───────────────────────────────────────────────────────────────

export interface Subcategory {
  id: string;
  slug: string;
  name: string;
  nameFr?: string | null;
  /** Storefront-visible product count — subcategories with none should be hidden from customer-facing surfaces. */
  productCount: number;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  nameFr?: string | null;
  icon?: string | null;
  imageUrl?: string | null;
  createdByName?: string | null;
  subcategories: Subcategory[];
  /** Storefront-visible product count — categories with none are hidden from the nav/footer/homepage. */
  productCount: number;
}

// ── Orders ───────────────────────────────────────────────────────────────────

export type OrderStatus =
  | "PENDING"
  | "AWAITING_PAYMENT"
  | "REVIEWING"
  | "VALIDATED"
  | "PACKAGING"
  | "PACKAGED"
  | "CANCELLED";

export type PaymentMethod = "ORANGE_MONEY" | "MOBILE_MONEY";

export type DeliveryType = "DELIVERY" | "PICKUP";

export interface CustomerInfo {
  firstName: string;
  lastName: string;
  phone: string;
  town?: string | null;
  street?: string | null;
  deliveryType: DeliveryType;
}

export interface OrderItem {
  id: string;
  productId?: string | null;
  productName: string;
  productThumbnailUrl?: string | null;
  quantity: number;
  selectedColor?: string | null;
  selectedSize?: string | null;
  /** Which of the product's photos this line was ordered against — set only via the "quantity by photo" picker. */
  selectedImageIndex?: number | null;
  unitPrice: number;
}

export interface Order {
  id: string;
  customerId?: string | null;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  customerInfo?: CustomerInfo | null;
  paymentMethod?: PaymentMethod | null;
  paymentCode?: string | null;
  paymentAccountName?: string | null;
  paymentScreenshotUrl?: string | null;
  statusChangedByName?: string | null;
  statusChangedAt?: string | null;
  rejectionReason?: string | null;
  packagingStartedByName?: string | null;
  packagingStartedById?: string | null;
  packagingStartedAt?: string | null;
  packagingCompletedByName?: string | null;
  packagingCompletedById?: string | null;
  packagingCompletedAt?: string | null;
  /** The latest "your order has been packaged" confirmation sent for this order, if any. */
  packagingConfirmation?: ChatMessage | null;
  createdAt: string;
  updatedAt: string;
}

// ── Chat ─────────────────────────────────────────────────────────────────────

export type MessageSender = "CUSTOMER" | "ADMIN";

export interface ChatMessage {
  id: string;
  conversationId: string;
  sender: MessageSender;
  text: string;
  imageUrl?: string | null;
  voiceUrl?: string | null;
  voiceDurationSeconds?: number | null;
  /** Which staff member sent this (ADMIN messages only) — never show this to a customer. */
  adminSenderName?: string | null;
  /** True for the special "your order has been packaged" message — rendered as its own card on the tracking page and in the chat widget. */
  packagingConfirmation: boolean;
  /** Non-empty only on a packagingConfirmation message — the delivery team roster frozen at send time. */
  deliveryContacts: { name: string; phone: string }[];
  timestamp: string;
}

// ── Delivery team contacts ──────────────────────────────────────────────────
// Auto-attached to packaging-confirmation messages — see the admin order
// detail page's "Message Customer" panel and app/track/[orderId]/page.tsx.

export interface DeliveryContact {
  id: string;
  name: string;
  phone: string;
  position: number;
}

export interface Conversation {
  id: string;
  customerName: string;
  customerId?: string | null;
  orderId?: string | null;
  messages: ChatMessage[];
  unread: number;
  createdAt: string;
  lastMessageAt?: string | null;
  /** When each side last opened/viewed this thread — drives read-receipt ticks (a message is "read" once the other side's timestamp is at or after it). */
  customerReadAt?: string | null;
  adminReadAt?: string | null;
}

// ── Notifications ────────────────────────────────────────────────────────────

export type NotificationType =
  | "NEW_ORDER"
  | "NEW_MESSAGE"
  | "PAYMENT_PROOF_UPLOADED"
  | "ORDER_STATUS_CHANGED";

export interface AppNotification {
  id: string;
  recipientType: "ADMIN" | "CUSTOMER";
  customerId?: string | null;
  type: NotificationType;
  message: string;
  referenceId?: string | null;
  read: boolean;
  createdAt: string;
}

// ── User Management ─────────────────────────────────────────────────────────
// Admin auth/roles/permissions are backed by the real Spring Boot API (see
// lib/apiClient.ts + lib/adminStore.ts) — these shapes mirror the backend's
// Permission/Role/AdminUser DTOs exactly, including the UPPER_SNAKE_CASE
// enum values, since the JWT the backend issues carries these same names.

export type Permission =
  | "VIEW_DASHBOARD"
  | "VIEW_ORDERS"
  | "MANAGE_ORDERS"
  | "VIEW_TREATMENT"
  | "MANAGE_TREATMENT"
  | "SEND_PACKAGING_MESSAGE"
  | "MANAGE_DELIVERY_AGENTS"
  | "VIEW_PRODUCTS"
  | "MANAGE_PRODUCTS"
  | "CREATE_PRODUCT"
  | "DELETE_PRODUCT"
  | "UPDATE_PRODUCT_INFO"
  | "UPDATE_PRODUCT_PRICING"
  | "UPDATE_PRODUCT_IMAGES"
  | "UPDATE_PRODUCT_COLORS"
  | "UPDATE_PRODUCT_STOCK"
  | "UPDATE_PRODUCT_DISPLAY"
  | "UPDATE_PRODUCT_VISIBILITY"
  | "VIEW_CATEGORIES"
  | "MANAGE_CATEGORIES"
  | "VIEW_CUSTOMERS"
  | "MANAGE_CUSTOMERS"
  | "VIEW_CHAT"
  | "MANAGE_CHAT"
  | "VIEW_USERS"
  | "MANAGE_USERS";

export const ALL_PERMISSIONS: { key: Permission; label: string; group: string }[] = [
  { key: "VIEW_DASHBOARD",    label: "View Dashboard",    group: "Dashboard" },
  { key: "VIEW_ORDERS",       label: "View Orders",       group: "Orders" },
  { key: "MANAGE_ORDERS",     label: "Manage Orders",     group: "Orders" },
  { key: "VIEW_TREATMENT",    label: "View Packing",      group: "Packing" },
  { key: "MANAGE_TREATMENT",  label: "Manage Packing",    group: "Packing" },
  { key: "SEND_PACKAGING_MESSAGE", label: "Send Packaging Confirmation", group: "Packing" },
  { key: "MANAGE_DELIVERY_AGENTS", label: "Manage Delivery Agents", group: "Packing" },
  { key: "VIEW_PRODUCTS",     label: "View Products",     group: "Products" },
  { key: "MANAGE_PRODUCTS",   label: "Manage Products (all of the below)", group: "Products" },
  { key: "CREATE_PRODUCT",    label: "Create Products",   group: "Products" },
  { key: "DELETE_PRODUCT",    label: "Delete Products",   group: "Products" },
  { key: "UPDATE_PRODUCT_INFO",       label: "Update: Name/Description/Category", group: "Products" },
  { key: "UPDATE_PRODUCT_PRICING",    label: "Update: Pricing",         group: "Products" },
  { key: "UPDATE_PRODUCT_IMAGES",     label: "Update: Images",         group: "Products" },
  { key: "UPDATE_PRODUCT_COLORS",     label: "Update: Colors",         group: "Products" },
  { key: "UPDATE_PRODUCT_STOCK",      label: "Update: Stock/Quantity", group: "Products" },
  { key: "UPDATE_PRODUCT_DISPLAY",    label: "Update: Badge/Sizes/Rating", group: "Products" },
  { key: "UPDATE_PRODUCT_VISIBILITY", label: "Update: Visibility",     group: "Products" },
  { key: "VIEW_CATEGORIES",   label: "View Categories",   group: "Categories" },
  { key: "MANAGE_CATEGORIES", label: "Manage Categories", group: "Categories" },
  { key: "VIEW_CUSTOMERS",    label: "View Customers",    group: "Customers" },
  { key: "MANAGE_CUSTOMERS",  label: "Manage Customers",  group: "Customers" },
  { key: "VIEW_CHAT",         label: "View Chat",         group: "Chat" },
  { key: "MANAGE_CHAT",       label: "Manage Chat",       group: "Chat" },
  { key: "VIEW_USERS",        label: "View Users",        group: "Users" },
  { key: "MANAGE_USERS",      label: "Manage Users",      group: "Users" },
];

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  createdAt: string;
}

export type UserStatus = "ACTIVE" | "INACTIVE";

export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roleId: string;
  roleName?: string;
  status: UserStatus;
  createdAt: string;
  lastLogin?: string | null;
}

// ── Customer Accounts ───────────────────────────────────────────────────────

export type CustomerStatus = "ACTIVE" | "BLOCKED";

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  status: CustomerStatus;
  createdAt: string;
  lastLogin?: string | null;
  /** This customer's own shareable referral code. */
  referralCode: string;
  /** Display name shown to people this customer refers/is referred by — editable in Account settings. */
  acronym: string;
  /** Acronym of whoever referred this customer in, if anyone. */
  referredByAcronym?: string | null;
}

export interface ReferralEntry {
  acronym: string;
  joinedAt: string;
  /** How many people this referral has, in turn, referred — the one extra level shown ("n+2"). */
  referredCount: number;
}

export interface ReferralSummary {
  referralCode: string;
  acronym: string;
  referredByAcronym?: string | null;
  directReferralCount: number;
  indirectReferralCount: number;
  referrals: ReferralEntry[];
}
