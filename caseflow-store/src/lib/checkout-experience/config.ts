import { storefrontConfig } from "@/config/storefront";

const PLACEHOLDER_PATTERN =
  /^(change-me|changeme|password|secret|test|demo|example|your-|your_)/i;

export type CheckoutExperienceConfig = {
  accountName: string;
  accountNumber: string;
  bankName: string;
  durationMinutes: number;
  merchantName: string;
  tokenSecret: string;
};

export function getCheckoutExperienceConfig(): CheckoutExperienceConfig {
  const tokenSecret = process.env.CHECKOUT_EXPERIENCE_TOKEN_SECRET?.trim();

  if (
    !tokenSecret ||
    tokenSecret.length < 32 ||
    PLACEHOLDER_PATTERN.test(tokenSecret)
  ) {
    throw new Error(
      "CHECKOUT_EXPERIENCE_TOKEN_SECRET must be a strong server-only secret",
    );
  }

  return {
    accountName: `CUA HANG ${storefrontConfig.name.toUpperCase()} DEMO`,
    accountNumber:
      process.env.CHECKOUT_EXPERIENCE_ACCOUNT_NUMBER?.trim() ||
      "000000000000",
    bankName:
      process.env.CHECKOUT_EXPERIENCE_BANK_NAME?.trim() ||
      "CASEFLOW EXPERIENCE",
    durationMinutes: parseDurationMinutes(
      process.env.CHECKOUT_EXPERIENCE_EXPIRES_MINUTES,
    ),
    merchantName: `${storefrontConfig.name} Experience`,
    tokenSecret,
  };
}

function parseDurationMinutes(value: string | undefined) {
  const parsed = Number(value ?? 15);

  if (!Number.isInteger(parsed) || parsed < 5 || parsed > 30) {
    throw new Error(
      "CHECKOUT_EXPERIENCE_EXPIRES_MINUTES must be an integer from 5 to 30",
    );
  }

  return parsed;
}
