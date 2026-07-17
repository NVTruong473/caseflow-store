import { z } from "zod";

import { customerEmailSchema, customerNameSchema } from "@/lib/validation/domain";

export const authPasswordSchema = z.string().min(8).max(200);

export const adminLoginRequestSchema = z.object({
  email: customerEmailSchema,
  password: authPasswordSchema,
});

export const customerSignInRequestSchema = z
  .object({
    intent: z.literal("sign-in"),
    email: customerEmailSchema,
    password: authPasswordSchema,
  })
  .strict();

export const customerSignUpRequestSchema = z
  .object({
    intent: z.literal("sign-up"),
    fullName: customerNameSchema,
    email: customerEmailSchema,
    password: authPasswordSchema,
  })
  .strict();

export const customerSessionRequestSchema = z.discriminatedUnion("intent", [
  customerSignInRequestSchema,
  customerSignUpRequestSchema,
]);
