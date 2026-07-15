export const CATEGORY_SLUGS = [
  "phone-cases",
  "screen-protectors",
  "chargers",
  "cables-adapters",
  "stands-mounts",
] as const;

export const COMPATIBILITY_LABELS = [
  "iPhone 13",
  "iPhone 14",
  "iPhone 15",
  "iPhone 16",
  "Galaxy S23",
  "Galaxy S24",
  "Galaxy S25",
  "Pixel 8",
  "Pixel 9",
  "Universal",
] as const;

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "shipping",
  "completed",
  "cancelled",
] as const;

export type CategorySlug = (typeof CATEGORY_SLUGS)[number];
export type CompatibilityLabel = (typeof COMPATIBILITY_LABELS)[number];
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type ISODateTimeString = string;

// Integer amount in the smallest currency unit. Runtime checks are added in D03-T03.
export type MoneyAmount = number;

// Product stock can be zero; cart and order quantities must be positive.
export type StockQuantity = number;
export type Quantity = number;

export type Category = {
  id: string;
  slug: CategorySlug;
  name: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
};

export type Product = {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  price: MoneyAmount;
  stock: StockQuantity;
  imageUrl: string;
  compatibility: CompatibilityLabel[];
  isFeatured: boolean;
  isActive: boolean;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
};

export type CartItem = {
  productId: string;
  quantity: Quantity;
};

export type Order = {
  id: string;
  orderCode: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  status: OrderStatus;
  subtotal: MoneyAmount;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
};

export type OrderItem = {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  unitPrice: MoneyAmount;
  quantity: Quantity;
  lineTotal: MoneyAmount;
};
