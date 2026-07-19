import { z } from "zod";

import { orderCodeSchema } from "@/lib/validation/domain";

export const paymentProviderSchema = z.enum(["MOCK_GATEWAY", "DEMO_VIETQR"]);

export const demoPaymentStatusSchema = z.enum([
  "PENDING",
  "PAID",
  "EXPIRED",
  "FAILED",
  "CANCELLED",
]);

export const paymentIdSchema = z
  .string()
  .trim()
  .min(12)
  .max(96)
  .regex(/^pay_[a-z0-9][a-z0-9_-]{8,80}$/);

export const paymentReferenceSchema = z
  .string()
  .trim()
  .min(12)
  .max(88)
  .regex(/^CFPAY-[A-Z0-9-]{8,80}$/);

export const createPaymentRequestSchema = z
  .object({
    orderId: z
      .string()
      .trim()
      .min(4)
      .max(80)
      .transform((value) => value.toUpperCase()),
    provider: paymentProviderSchema,
  })
  .strict();

export const mockPaymentWebhookPayloadSchema = z
  .object({
    event: z.literal("payment.paid"),
    orderId: orderCodeSchema,
    paidAt: z.string().datetime({ offset: true }),
    paymentId: paymentIdSchema,
    paymentReference: paymentReferenceSchema,
    status: z.literal("PAID"),
  })
  .strict();

export type CreatePaymentRequest = z.infer<typeof createPaymentRequestSchema>;
export type DemoPaymentProvider = z.infer<typeof paymentProviderSchema>;
export type DemoPaymentStatus = z.infer<typeof demoPaymentStatusSchema>;
export type MockPaymentWebhookPayload = z.infer<
  typeof mockPaymentWebhookPayloadSchema
>;
