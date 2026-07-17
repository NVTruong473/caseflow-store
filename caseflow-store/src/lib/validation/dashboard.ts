import { z } from "zod";

export const DASHBOARD_RANGES = ["7d", "30d", "all"] as const;

const dateOnlySchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/);

export const adminDashboardQuerySchema = z
  .object({
    from: dateOnlySchema.optional(),
    range: z.enum(DASHBOARD_RANGES).optional(),
    to: dateOnlySchema.optional(),
  })
  .strict()
  .superRefine((query, context) => {
    if ((query.from && !query.to) || (!query.from && query.to)) {
      context.addIssue({
        code: "custom",
        message: "from and to must be provided together",
        path: query.from ? ["to"] : ["from"],
      });
    }

    if (!query.from || !query.to) {
      return;
    }

    const fromDate = new Date(`${query.from}T00:00:00.000Z`);
    const toDate = new Date(`${query.to}T00:00:00.000Z`);

    if (
      Number.isNaN(fromDate.getTime()) ||
      Number.isNaN(toDate.getTime()) ||
      fromDate > toDate
    ) {
      context.addIssue({
        code: "custom",
        message: "from must be before or equal to to",
        path: ["from"],
      });
    }
  });

export type AdminDashboardQuery = z.infer<typeof adminDashboardQuerySchema>;
export type DashboardRange = (typeof DASHBOARD_RANGES)[number];
