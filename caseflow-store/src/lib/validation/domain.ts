import { z } from "zod";

import {
  CATEGORY_SLUGS,
  COMPATIBILITY_LABELS,
  ORDER_STATUSES,
} from "@/types/domain";
import type {
  CartItem,
  Category,
  Order,
  OrderItem,
  Product,
} from "@/types/domain";

export const categorySlugSchema = z.enum(CATEGORY_SLUGS);
export const compatibilityLabelSchema = z.enum(COMPATIBILITY_LABELS);
export const orderStatusSchema = z.enum(ORDER_STATUSES);

export const idSchema = z.string().trim().min(1).max(120);
export const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const nonEmptyStringSchema = z.string().trim().min(1);
export const isoDateTimeStringSchema = z.string().datetime({ offset: true });

export const moneyAmountSchema = z.number().int().nonnegative();
export const stockQuantitySchema = z.number().int().nonnegative();
export const quantitySchema = z.number().int().positive();

export const productImageUrlSchema = z
  .string()
  .trim()
  .min(1)
  .max(500)
  .refine(
    (value) => value.startsWith("/") || /^https?:\/\//.test(value),
    "Image URL must be a root-relative path or an http(s) URL",
  );

export const compatibilityListSchema = z
  .array(compatibilityLabelSchema)
  .min(1)
  .max(COMPATIBILITY_LABELS.length)
  .refine(
    (values) => new Set(values).size === values.length,
    "Compatibility labels must be unique",
  );

export const categorySchema = z.object({
  id: idSchema,
  slug: categorySlugSchema,
  name: nonEmptyStringSchema.max(80),
  description: nonEmptyStringSchema.max(300),
  sortOrder: z.number().int().nonnegative(),
  isActive: z.boolean(),
  createdAt: isoDateTimeStringSchema,
  updatedAt: isoDateTimeStringSchema,
}) satisfies z.ZodType<Category>;

export const productSchema = z.object({
  id: idSchema,
  categoryId: idSchema,
  name: nonEmptyStringSchema.max(120),
  slug: slugSchema,
  description: nonEmptyStringSchema.max(1_000),
  price: moneyAmountSchema,
  stock: stockQuantitySchema,
  imageUrl: productImageUrlSchema,
  compatibility: compatibilityListSchema,
  isFeatured: z.boolean(),
  isActive: z.boolean(),
  createdAt: isoDateTimeStringSchema,
  updatedAt: isoDateTimeStringSchema,
}) satisfies z.ZodType<Product>;

export const cartItemSchema = z.object({
  productId: idSchema,
  quantity: quantitySchema,
}) satisfies z.ZodType<CartItem>;

export const orderCodeSchema = z
  .string()
  .trim()
  .min(4)
  .max(40)
  .regex(/^[A-Z0-9-]+$/);

export const customerNameSchema = nonEmptyStringSchema.max(120);
export const customerEmailSchema = z.string().trim().email().max(254);
export const customerPhoneSchema = z
  .string()
  .trim()
  .min(7)
  .max(24)
  .regex(/^[0-9+\-\s().]+$/);
export const shippingAddressSchema = nonEmptyStringSchema.max(500);

export const orderSchema = z.object({
  id: idSchema,
  orderCode: orderCodeSchema,
  customerName: customerNameSchema,
  customerEmail: customerEmailSchema,
  customerPhone: customerPhoneSchema,
  shippingAddress: shippingAddressSchema,
  status: orderStatusSchema,
  subtotal: moneyAmountSchema,
  createdAt: isoDateTimeStringSchema,
  updatedAt: isoDateTimeStringSchema,
}) satisfies z.ZodType<Order>;

export const orderItemSchema = z
  .object({
    id: idSchema,
    orderId: idSchema,
    productId: idSchema,
    productName: nonEmptyStringSchema.max(120),
    unitPrice: moneyAmountSchema,
    quantity: quantitySchema,
    lineTotal: moneyAmountSchema,
  })
  .superRefine((item, context) => {
    if (item.lineTotal !== item.unitPrice * item.quantity) {
      context.addIssue({
        code: "custom",
        path: ["lineTotal"],
        message: "lineTotal must equal unitPrice multiplied by quantity",
      });
    }
  }) satisfies z.ZodType<OrderItem>;
