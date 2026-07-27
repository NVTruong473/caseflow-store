export const checkoutExperienceStatuses = [
  "pending",
  "completed",
  "expired",
  "locked",
  "cancelled",
] as const;

export type CheckoutExperienceStatus =
  (typeof checkoutExperienceStatuses)[number];

export type CheckoutExperienceMerchant = {
  accountName: string;
  accountNumber: string;
  bankName: string;
  name: string;
};

export type CheckoutExperienceSession = {
  amountVnd: number;
  completedAt: string | null;
  currency: "VND";
  expiresAt: string;
  failedAttemptsRemaining: number;
  merchant: CheckoutExperienceMerchant;
  serverTime: string;
  status: CheckoutExperienceStatus;
  transferContent: string;
};

export type CheckoutExperienceCreatedSession = CheckoutExperienceSession & {
  accessToken: string;
  clientRequestId: string;
  confirmationCode: string;
  scanUrl: string;
};
