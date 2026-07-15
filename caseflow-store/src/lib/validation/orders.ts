import { z } from "zod";

import {
  customerEmailSchema,
  customerNameSchema,
  customerPhoneSchema,
  orderStatusSchema,
  shippingAddressSchema,
} from "@/lib/validation/domain";
import { cartValidationItemSchema } from "@/lib/validation/cart";

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

export type CreateOrderRequest = z.infer<typeof createOrderRequestSchema>;
export type UpdateOrderStatusRequest = z.infer<typeof updateOrderStatusRequestSchema>;
