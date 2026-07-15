import { z } from "zod";

import { categorySlugSchema, compatibilityLabelSchema } from "@/lib/validation/domain";

export const productSortSchema = z.enum([
  "newest",
  "price-asc",
  "price-desc",
  "name-asc",
]);

const optionalTrimmedStringSchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .optional();

export const productListQuerySchema = z.object({
  category: categorySlugSchema.optional(),
  compatibility: compatibilityLabelSchema.optional(),
  q: optionalTrimmedStringSchema,
  featured: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
  sort: productSortSchema.default("newest"),
});

export type ProductListQuery = z.infer<typeof productListQuerySchema>;
