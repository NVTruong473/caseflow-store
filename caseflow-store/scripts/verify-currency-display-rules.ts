import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  calculateCurrencyDisplayEstimate,
  formatBasisPoints,
} from "@/lib/format/currency-display";
import { getCurrencyDisplayRules } from "@/lib/format/currency-display.server";

const artifactPath = path.join(
  process.cwd(),
  ".agent/artifacts/d26-t03/currency-display-rules-check.json",
);

async function main() {
  const sourceAmountVnd = 167_000;
  const rules = getCurrencyDisplayRules();
  const estimate = calculateCurrencyDisplayEstimate(sourceAmountVnd, rules);
  const expectedVatVnd = Math.round(
    (sourceAmountVnd * rules.vatBasisPoints) / 10_000,
  );
  const expectedFeeVnd = Math.round(
    (sourceAmountVnd * rules.internationalPaymentFeeBasisPoints) / 10_000,
  );
  const expectedDisplayBaseVnd =
    sourceAmountVnd + expectedVatVnd + expectedFeeVnd;
  const checks = [
    {
      name: "source currency remains VND",
      ok: rules.sourceCurrency === "VND" && estimate.sourceCurrency === "VND",
    },
    {
      name: "display currency is USD only for estimates",
      ok:
        rules.displayCurrency === "USD" &&
        estimate.displayCurrency === "USD",
    },
    {
      name: "source amount is unchanged",
      ok: estimate.sourceAmountVnd === sourceAmountVnd,
    },
    {
      name: "vat estimate is derived from basis points",
      ok: estimate.estimatedVatVnd === expectedVatVnd,
    },
    {
      name: "international payment fee estimate is derived from basis points",
      ok: estimate.estimatedInternationalPaymentFeeVnd === expectedFeeVnd,
    },
    {
      name: "usd estimate is derived from vnd display base",
      ok:
        estimate.estimatedDisplayBaseVnd === expectedDisplayBaseVnd &&
        estimate.approximateAmountUsd ===
          expectedDisplayBaseVnd / rules.exchangeRateVndPerUsd,
    },
    {
      name: "source and timestamp are present",
      ok:
        rules.sourceLabel.length > 0 &&
        rules.sourceUrl.startsWith("https://") &&
        Number.isFinite(new Date(rules.quotedAt).getTime()),
    },
  ];
  const ok = checks.every((check) => check.ok);

  await mkdir(path.dirname(artifactPath), { recursive: true });
  await writeFile(
    artifactPath,
    JSON.stringify(
      {
        task: "D26-T03",
        ok,
        rules: {
          ...rules,
          internationalPaymentFeePercent: formatBasisPoints(
            rules.internationalPaymentFeeBasisPoints,
          ),
          vatPercent: formatBasisPoints(rules.vatBasisPoints),
        },
        sample: {
          estimate,
          sourceAmountVnd,
        },
        checks,
        checkedAt: new Date().toISOString(),
      },
      null,
      2,
    ) + "\n",
  );

  if (!ok) {
    console.error(checks);
    process.exit(1);
  }

  console.log(`Currency display rules verified: ${artifactPath}`);
}

void main();
