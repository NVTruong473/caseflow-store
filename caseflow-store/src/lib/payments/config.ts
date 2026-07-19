import type { DemoPaymentProvider } from "@/lib/validation/payments";

export const CASEFLOW_MERCHANT_NAME = "CaseFlow Books";

export type DemoPaymentConfig = {
  accountName: string;
  accountNumber: string;
  allowQrDemoPayments: boolean;
  allowSimulation: boolean;
  bankBin: string;
  bankName: string;
  expiresMinutes: number;
  merchantName: string;
  mode: "demo" | "disabled";
};

export type PaymentProviderOption = {
  description: string;
  label: string;
  provider: DemoPaymentProvider;
};

const DEFAULT_DEMO_BANK_BIN = "970436";
const DEFAULT_DEMO_BANK_NAME = "Vietcombank";
const DEFAULT_DEMO_BANK_ACCOUNT_NUMBER = "0000000000";
const DEFAULT_DEMO_PAYMENT_EXPIRES_MINUTES = 15;

export function getDemoPaymentConfig(): DemoPaymentConfig {
  const mode = getPaymentMode();
  // Khoa toan bo QR demo o production, ke ca khi bien moi truong bi cau hinh sai.
  const allowQrDemoPayments = mode === "demo" && process.env.NODE_ENV !== "production";
  // Nut gia lap chi duoc bat khi QR demo da duoc phep va server cho phep mock.
  const allowSimulation =
    allowQrDemoPayments && getBooleanEnv("ENABLE_MOCK_PAYMENT", true);
  const merchantName = getMerchantName();
  const configuredAccountName = process.env.DEMO_BANK_ACCOUNT_NAME?.trim();
  const accountName =
    configuredAccountName && configuredAccountName.length > 0
      ? normalizeAccountName(configuredAccountName)
      : `${normalizeAccountName(merchantName)} DEMO`;

  return {
    accountName,
    accountNumber:
      process.env.DEMO_BANK_ACCOUNT_NUMBER?.trim() ||
      DEFAULT_DEMO_BANK_ACCOUNT_NUMBER,
    allowQrDemoPayments,
    allowSimulation,
    bankBin: process.env.DEMO_BANK_BIN?.trim() || DEFAULT_DEMO_BANK_BIN,
    bankName: process.env.DEMO_BANK_NAME?.trim() || DEFAULT_DEMO_BANK_NAME,
    expiresMinutes: getIntegerEnv(
      "DEMO_PAYMENT_EXPIRES_MINUTES",
      DEFAULT_DEMO_PAYMENT_EXPIRES_MINUTES,
      1,
      60,
    ),
    merchantName,
    mode,
  };
}

export function getMockPaymentWebhookSecret() {
  const value =
    process.env.MOCK_PAYMENT_WEBHOOK_SECRET?.trim() ||
    "change-me-in-development";

  // Production khong duoc dung default secret yeu cho webhook HMAC.
  if (process.env.NODE_ENV === "production" && value === "change-me-in-development") {
    throw new Error("MOCK_PAYMENT_WEBHOOK_SECRET must not use the default value in production");
  }

  return value;
}

export function getPaymentProviderOptions(): PaymentProviderOption[] {
  return [
    {
      description:
        "Quet QR noi bo CaseFlow de kiem tra trang thai thanh toan tu dong trong sandbox.",
      label: "Cong thanh toan QR gia lap",
      provider: "MOCK_GATEWAY",
    },
    {
      description:
        "Tao ma VietQR bang thong tin ngan hang demo va noi dung chuyen khoan theo ma don.",
      label: "VietQR Demo",
      provider: "DEMO_VIETQR",
    },
  ];
}

function getPaymentMode(): DemoPaymentConfig["mode"] {
  const rawValue = process.env.PAYMENT_MODE?.trim().toLowerCase();

  return rawValue === "disabled" ? "disabled" : "demo";
}

function getMerchantName() {
  return process.env.CASEFLOW_MERCHANT_NAME?.trim() || CASEFLOW_MERCHANT_NAME;
}

function getBooleanEnv(name: string, defaultValue: boolean) {
  const rawValue = process.env[name]?.trim().toLowerCase();

  if (!rawValue) {
    return defaultValue;
  }

  return rawValue === "true" || rawValue === "1" || rawValue === "yes";
}

function getIntegerEnv(
  name: string,
  defaultValue: number,
  min: number,
  max: number,
) {
  const rawValue = process.env[name]?.trim();
  const parsedValue = rawValue ? Number.parseInt(rawValue, 10) : defaultValue;

  if (!Number.isFinite(parsedValue)) {
    return defaultValue;
  }

  return Math.min(Math.max(parsedValue, min), max);
}

export function normalizeAccountName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase()
    .slice(0, 60);
}
