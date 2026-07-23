import { storefrontConfig } from "@/config/storefront";
import {
  calculateCurrencyDisplayEstimate,
  type CurrencyDisplayRules,
} from "@/lib/format/currency-display";
import type {
  BookOrderTotals,
  PaymentMethod,
  ShippingMethod,
  SourceNote,
} from "@/types/domain";

export const BOOK_CHECKOUT_TOTALS_POLICY = {
  currency: "VND",
  freeStandardShippingThresholdVnd: 500_000,
  shippingFeesVnd: {
    express: 45_000,
    standard: 25_000,
  },
  paymentFeesVnd: {
    "bank-transfer": 0,
    cod: 0,
    momo: 0,
    vnpay: 0,
    zalopay: 0,
  },
  vatBasisPoints: 1_000,
} as const;

export type CalculateBookCheckoutTotalsInput = {
  currencyRules?: CurrencyDisplayRules | null;
  discountTotalVnd?: number;
  includeDisplayEstimate?: boolean;
  paymentMethod: PaymentMethod;
  quotedAt?: string;
  shippingMethod: ShippingMethod;
  subtotalVnd: number;
};

export function calculateBookCheckoutTotals({
  currencyRules = null,
  discountTotalVnd = 0,
  includeDisplayEstimate = false,
  paymentMethod,
  quotedAt = new Date().toISOString(),
  shippingMethod,
  subtotalVnd,
}: CalculateBookCheckoutTotalsInput): BookOrderTotals {
  const safeDiscountTotalVnd = Math.min(Math.max(discountTotalVnd, 0), subtotalVnd);
  const taxableSubtotalVnd = subtotalVnd - safeDiscountTotalVnd;
  const shippingFeeVnd = calculateShippingFeeVnd({
    shippingMethod,
    subtotalVnd,
  });
  const vatBasisPoints =
    currencyRules?.vatBasisPoints ?? BOOK_CHECKOUT_TOTALS_POLICY.vatBasisPoints;
  const taxTotalVnd = calculateBasisPointAmount(taxableSubtotalVnd, vatBasisPoints);
  const paymentFeeVnd = calculatePaymentFeeVnd(paymentMethod);
  const sourceNote = createInterimSourceNote(quotedAt);
  const totalVnd =
    taxableSubtotalVnd + shippingFeeVnd + taxTotalVnd + paymentFeeVnd;

  return {
    currency: "VND",
    discountTotalVnd: safeDiscountTotalVnd,
    displayEstimate:
      includeDisplayEstimate && currencyRules
        ? calculateCurrencyDisplayEstimate(totalVnd, currencyRules, {
            includeInternationalPaymentFee: true,
            includeVatEstimate: false,
          })
        : null,
    feeEstimates: [
      {
        amountVnd: paymentFeeVnd,
        label: "Payment method fee estimate",
        sourceNote,
      },
    ],
    paymentFeeVnd,
    shippingFeeVnd,
    subtotalVnd,
    taxEstimates: [
      {
        amountVnd: taxTotalVnd,
        label: "VAT estimate",
        rateBasisPoints: vatBasisPoints,
        sourceNote,
      },
    ],
    taxTotalVnd,
    totalVnd,
  };
}

function calculateShippingFeeVnd({
  shippingMethod,
  subtotalVnd,
}: {
  shippingMethod: ShippingMethod;
  subtotalVnd: number;
}) {
  if (
    shippingMethod === "standard" &&
    subtotalVnd >= BOOK_CHECKOUT_TOTALS_POLICY.freeStandardShippingThresholdVnd
  ) {
    return 0;
  }

  return BOOK_CHECKOUT_TOTALS_POLICY.shippingFeesVnd[shippingMethod];
}

function calculatePaymentFeeVnd(paymentMethod: PaymentMethod) {
  return BOOK_CHECKOUT_TOTALS_POLICY.paymentFeesVnd[paymentMethod];
}

function calculateBasisPointAmount(amountVnd: number, basisPoints: number) {
  return Math.round((amountVnd * basisPoints) / 10_000);
}

function createInterimSourceNote(checkedAt: string): SourceNote {
  return {
    checkedAt,
    label: `${storefrontConfig.name} checkout totals configuration`,
    license: null,
    url: null,
  };
}
