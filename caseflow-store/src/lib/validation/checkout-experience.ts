import { z } from "zod";

import { cartValidationItemSchema } from "@/lib/validation/cart";

export const checkoutExperienceTokenSchema = z
  .string()
  .trim()
  .min(40)
  .max(128)
  .regex(/^[A-Za-z0-9_-]+$/);

export const checkoutExperienceCreateRequestSchema = z
  .object({
    clientRequestId: z.string().uuid(),
    items: z.array(cartValidationItemSchema).min(1).max(25),
  })
  .strict();

export const checkoutExperienceStatusRequestSchema = z
  .object({
    token: checkoutExperienceTokenSchema,
  })
  .strict();

export const checkoutExperienceCompleteRequestSchema = z
  .object({
    amountVnd: z.number().int().min(1).max(100_000_000),
    confirmationCode: z.string().trim().regex(/^\d{6}$/),
    token: checkoutExperienceTokenSchema,
  })
  .strict();

export const checkoutExperienceCancelRequestSchema = z
  .object({
    token: checkoutExperienceTokenSchema,
  })
  .strict();

export type CheckoutExperienceCreateRequest = z.infer<
  typeof checkoutExperienceCreateRequestSchema
>;
export type CheckoutExperienceCompleteRequest = z.infer<
  typeof checkoutExperienceCompleteRequestSchema
>;
