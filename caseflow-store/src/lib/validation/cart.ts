import { z } from "zod";

import { idSchema, quantitySchema } from "@/lib/validation/domain";

export const cartValidationItemSchema = z.object({
  productId: idSchema,
  quantity: quantitySchema.max(99),
});

export const cartValidationRequestSchema = z.object({
  items: z.array(cartValidationItemSchema).max(25).default([]),
});

export type CartValidationRequest = z.infer<typeof cartValidationRequestSchema>;
