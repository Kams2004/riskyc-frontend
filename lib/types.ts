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
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  icon?: string | null;
  imageUrl?: string | null;
  createdByName?: string | null;
  subcategories: Subcategory[];
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
  paymentScreenshotUrl?: string | null;
  statusChangedByName?: string | null;
  statusChangedAt?: string | null;
  rejectionReason?: string | null;
  packagingStartedByName?: string | null;
  packagingStartedAt?: string | null;
  packagingCompletedByName?: string | null;
  packagingCompletedAt?: string | null;
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
  timestamp: string;
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
  | "VIEW_PRODUCTS"
  | "MANAGE_PRODUCTS"
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
  { key: "VIEW_TREATMENT",    label: "View Treatment",    group: "Treatment" },
  { key: "MANAGE_TREATMENT",  label: "Manage Treatment",  group: "Treatment" },
  { key: "VIEW_PRODUCTS",     label: "View Products",     group: "Products" },
  { key: "MANAGE_PRODUCTS",   label: "Manage Products",   group: "Products" },
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
}
