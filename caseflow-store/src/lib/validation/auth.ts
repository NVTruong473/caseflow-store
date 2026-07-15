import { z } from "zod";

import { customerEmailSchema } from "@/lib/validation/domain";

export const adminLoginRequestSchema = z.object({
  email: customerEmailSchema,
  password: z.string().min(8).max(200),
});
