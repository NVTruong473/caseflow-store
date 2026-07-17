import { z } from "zod";

import { isoDateTimeStringSchema } from "@/lib/validation/domain";

import type { CurrencyDisplayRules } from "./currency-display";

const defaultCurrencyDisplayRules: CurrencyDisplayRules = {
  displayCurrency: "USD",
  exchangeRateVndPerUsd: 26_400,
  internationalPaymentFeeBasisPoints: 300,
  quotedAt: "2026-07-16T08:35:00+07:00",
  sourceCurrency: "VND",
  sourceLabel: "HSBC Vietnam telegraphic selling rate",
  sourceUrl: "https://www.hsbc.com.vn/en-vn/foreign-exchange/rate/",
  vatBasisPoints: 1_000,
};

const currencyDisplayRulesSchema = z.object({
  displayCurrency: z.literal("USD"),
  exchangeRateVndPerUsd: z.coerce.number().positive(),
  internationalPaymentFeeBasisPoints: z.coerce.number().int().min(0).max(10_000),
  quotedAt: isoDateTimeStringSchema,
  sourceCurrency: z.literal("VND"),
  sourceLabel: z.string().trim().min(1).max(160),
  sourceUrl: z.string().trim().url().max(500),
  vatBasisPoints: z.coerce.number().int().min(0).max(10_000),
}) satisfies z.ZodType<CurrencyDisplayRules>;

export function getCurrencyDisplayRules(): CurrencyDisplayRules {
  const parsedRules = currencyDisplayRulesSchema.safeParse({
    displayCurrency: "USD",
    exchangeRateVndPerUsd:
      process.env.CASEFLOW_FX_VND_PER_USD ??
      defaultCurrencyDisplayRules.exchangeRateVndPerUsd,
    internationalPaymentFeeBasisPoints:
      process.env.CASEFLOW_INTL_PAYMENT_FEE_BASIS_POINTS ??
      defaultCurrencyDisplayRules.internationalPaymentFeeBasisPoints,
    quotedAt:
      process.env.CASEFLOW_FX_QUOTED_AT ??
      defaultCurrencyDisplayRules.quotedAt,
    sourceCurrency: "VND",
    sourceLabel:
      process.env.CASEFLOW_FX_SOURCE_LABEL ??
      defaultCurrencyDisplayRules.sourceLabel,
    sourceUrl:
      process.env.CASEFLOW_FX_SOURCE_URL ??
      defaultCurrencyDisplayRules.sourceUrl,
    vatBasisPoints:
      process.env.CASEFLOW_VAT_BASIS_POINTS ??
      defaultCurrencyDisplayRules.vatBasisPoints,
  });

  if (!parsedRules.success) {
    throw new Error("Invalid currency display rules configuration", {
      cause: parsedRules.error,
    });
  }

  return parsedRules.data;
}
