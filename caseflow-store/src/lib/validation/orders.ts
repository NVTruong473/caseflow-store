import { z } from "zod";

import {
  bookShippingAddressSchema,
  customerEmailSchema,
  customerNameSchema,
  customerPhoneSchema,
  orderCodeSchema,
  orderStatusSchema,
  paymentStatusSchema,
  paymentMethodSchema,
  shippingAddressSchema,
  shippingMethodSchema,
  shippingStatusSchema,
} from "@/lib/validation/domain";
import { cartValidationItemSchema } from "@/lib/validation/cart";
import { checkoutPromotionCodeSchema } from "@/lib/validation/books";

export const createOrderRequestSchema = z.object({
  customerName: customerNameSchema,
  customerEmail: customerEmailSchema,
  customerPhone: customerPhoneSchema,
  shippingAddress: shippingAddressSchema,
  items: z.array(cartValidationItemSchema).min(1).max(25),
});

export const updateOrderStatusRequestSchema = z.object({
  status: orderStatusSchema,
});

export const adminOrderFiltersSchema = z
  .object({
    q: z.string().trim().max(120).optional(),
    status: orderStatusSchema.optional(),
    paymentStatus: paymentStatusSchema.optional(),
    shippingStatus: shippingStatusSchema.optional(),
  })
  .strict();

export const updateAdminOrderOperationsRequestSchema = z
  .object({
    status: orderStatusSchema.optional(),
    paymentStatus: paymentStatusSchema.optional(),
    shippingStatus: shippingStatusSchema.optional(),
    internalNotes: z.string().trim().max(2000).optional(),
  })
  .strict()
  .refine(
    (input) =>
      input.status !== undefined ||
      input.paymentStatus !== undefined ||
      input.shippingStatus !== undefined ||
      input.internalNotes !== undefined,
    "At least one order operation field is required",
  );

export const createBookOrderRequestSchema = z.object({
  customerName: customerNameSchema,
  customerEmail: customerEmailSchema,
  customerPhone: customerPhoneSchema,
  shippingAddress: bookShippingAddressSchema,
  shippingMethod: shippingMethodSchema,
  paymentMethod: paymentMethodSchema,
  promotionCode: checkoutPromotionCodeSchema,
  items: z.array(cartValidationItemSchema).min(1).max(25),
});

const trackingOrderCodeSchema = z
  .string()
  .trim()
  .transform((value) => value.toUpperCase())
  .pipe(orderCodeSchema);

const trackingContactSchema = z
  .string()
  .trim()
  .min(7)
  .max(254)
  .refine(
    (value) =>
      customerEmailSchema.safeParse(value).success ||
      customerPhoneSchema.safeParse(value).success,
    "Contact must be a customer email or phone number",
  );

export const publicOrderTrackingLookupRequestSchema = z
  .object({
    orderCode: trackingOrderCodeSchema,
    contact: trackingContactSchema,
  })
  .strict();

export const customerOrderActionRequestSchema = z
  .object({
    action: z.literal("cancel"),
  })
  .strict();

export type CreateOrderRequest = z.infer<typeof createOrderRequestSchema>;
export type CreateBookOrderRequest = z.infer<
  typeof createBookOrderRequestSchema
>;
export type PublicOrderTrackingLookupRequest = z.infer<
  typeof publicOrderTrackingLookupRequestSchema
>;
export type CustomerOrderActionRequest = z.infer<
  typeof customerOrderActionRequestSchema
>;
export type AdminOrderFilters = z.infer<typeof adminOrderFiltersSchema>;
export type UpdateAdminOrderOperationsRequest = z.infer<
  typeof updateAdminOrderOperationsRequestSchema
>;
export type UpdateOrderStatusRequest = z.infer<typeof updateOrderStatusRequestSchema>;
