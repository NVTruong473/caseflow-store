import type { CurrencyConversionEstimate } from "@/types/domain";

export type CurrencyDisplayRules = {
  sourceCurrency: "VND";
  displayCurrency: "USD";
  exchangeRateVndPerUsd: number;
  vatBasisPoints: number;
  internationalPaymentFeeBasisPoints: number;
  sourceLabel: string;
  sourceUrl: string;
  quotedAt: string;
};

export type CurrencyDisplayEstimate = CurrencyConversionEstimate & {
  estimatedVatVnd: number;
  estimatedInternationalPaymentFeeVnd: number;
  estimatedDisplayBaseVnd: number;
};

export type CurrencyDisplayEstimateOptions = {
  includeInternationalPaymentFee?: boolean;
  includeVatEstimate?: boolean;
};

export function calculateCurrencyDisplayEstimate(
  sourceAmountVnd: number,
  rules: CurrencyDisplayRules,
  options: CurrencyDisplayEstimateOptions = {},
): CurrencyDisplayEstimate {
  const includeVatEstimate = options.includeVatEstimate ?? true;
  const includeInternationalPaymentFee =
    options.includeInternationalPaymentFee ?? true;
  const estimatedVatVnd = calculateBasisPointAmount(
    sourceAmountVnd,
    includeVatEstimate ? rules.vatBasisPoints : 0,
  );
  const estimatedInternationalPaymentFeeVnd = calculateBasisPointAmount(
    sourceAmountVnd,
    includeInternationalPaymentFee
      ? rules.internationalPaymentFeeBasisPoints
      : 0,
  );
  const estimatedDisplayBaseVnd =
    sourceAmountVnd + estimatedVatVnd + estimatedInternationalPaymentFeeVnd;

  return {
    approximateAmountUsd:
      estimatedDisplayBaseVnd / rules.exchangeRateVndPerUsd,
    displayCurrency: rules.displayCurrency,
    estimatedDisplayBaseVnd,
    estimatedInternationalPaymentFeeVnd,
    estimatedVatVnd,
    exchangeRateVndPerUsd: rules.exchangeRateVndPerUsd,
    feeBasisPoints: includeInternationalPaymentFee
      ? rules.internationalPaymentFeeBasisPoints
      : 0,
    quotedAt: rules.quotedAt,
    sourceAmountVnd,
    sourceCurrency: rules.sourceCurrency,
    sourceNote: {
      checkedAt: rules.quotedAt,
      label: rules.sourceLabel,
      license: null,
      url: rules.sourceUrl,
    },
  };
}

export function formatBasisPoints(value: number) {
  const percent = value / 100;

  return Number.isInteger(percent) ? `${percent}%` : `${percent.toFixed(2)}%`;
}

function calculateBasisPointAmount(amount: number, basisPoints: number) {
  return Math.round((amount * basisPoints) / 10_000);
}
