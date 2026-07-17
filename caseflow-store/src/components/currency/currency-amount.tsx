import { formatUsd, formatVnd } from "@/lib/format/currency";
import {
  calculateCurrencyDisplayEstimate,
  formatBasisPoints,
  type CurrencyDisplayRules,
} from "@/lib/format/currency-display";
import type { Language } from "@/lib/i18n/language";
import { cn } from "@/lib/utils/cn";

type CurrencyAmountProps = {
  amountVnd: number;
  className?: string;
  estimateClassName?: string;
  language: Language;
  rules: CurrencyDisplayRules;
  size?: "sm" | "md";
};

export function CurrencyAmount({
  amountVnd,
  className,
  estimateClassName,
  language,
  rules,
  size = "md",
}: CurrencyAmountProps) {
  const estimate = calculateCurrencyDisplayEstimate(amountVnd, rules);

  return (
    <span className={cn("inline-flex flex-col", className)}>
      <span>{formatVnd(amountVnd)}</span>
      {language === "en" ? (
        <span
          className={cn(
            "font-medium text-text-muted",
            size === "sm" ? "text-small" : "text-body",
            estimateClassName,
          )}
        >
          approx. {formatUsd(estimate.approximateAmountUsd)}
        </span>
      ) : null}
    </span>
  );
}

export function CurrencyEstimateDisclosure({
  className,
  language,
  rules,
}: {
  className?: string;
  language: Language;
  rules: CurrencyDisplayRules;
}) {
  if (language !== "en") {
    return null;
  }

  return (
    <p className={cn("text-small leading-6 text-text-muted", className)}>
      USD estimates keep VND as the source price and add configurable{" "}
      {formatBasisPoints(rules.vatBasisPoints)} VAT estimate plus{" "}
      {formatBasisPoints(rules.internationalPaymentFeeBasisPoints)}{" "}
      international payment fee estimate. Rate source: {rules.sourceLabel},{" "}
      {formatVnd(rules.exchangeRateVndPerUsd)}/USD, quoted{" "}
      {formatDisplayTimestamp(rules.quotedAt)}. Final checkout currency remains
      VND.
    </p>
  );
}

function formatDisplayTimestamp(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    timeZone: "Asia/Ho_Chi_Minh",
    timeZoneName: "short",
    year: "numeric",
  }).format(date);
}
