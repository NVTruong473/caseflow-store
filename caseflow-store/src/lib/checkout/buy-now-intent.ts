import { z } from "zod";

export const MAX_BUY_NOW_QUANTITY = 99;

const buyNowIntentSchema = z.object({
  editionId: z.string().uuid(),
  quantity: z.coerce.number().int().min(1).max(MAX_BUY_NOW_QUANTITY),
});

type SearchParamValue = string | string[] | undefined;

export type BuyNowIntent = z.infer<typeof buyNowIntentSchema>;
export type CheckoutPurchaseSource = "cart" | "buy-now";

export type BuyNowIntentResult =
  | { requested: false; intent: null }
  | { requested: true; intent: BuyNowIntent }
  | { requested: true; intent: null };

export function buildBuyNowCheckoutHref(input: BuyNowIntent) {
  const intent = buyNowIntentSchema.parse(input);
  const params = new URLSearchParams({
    editionId: intent.editionId,
    mode: "buy-now",
    quantity: String(intent.quantity),
  });

  return `/checkout?${params.toString()}`;
}

export function parseBuyNowIntent(
  searchParams: Record<string, SearchParamValue> | undefined,
): BuyNowIntentResult {
  if (firstParam(searchParams?.mode) !== "buy-now") {
    return { requested: false, intent: null };
  }

  const result = buyNowIntentSchema.safeParse({
    editionId: firstParam(searchParams?.editionId),
    quantity: firstParam(searchParams?.quantity),
  });

  return result.success
    ? { requested: true, intent: result.data }
    : { requested: true, intent: null };
}

function firstParam(value: SearchParamValue) {
  return Array.isArray(value) ? value[0] : value;
}
