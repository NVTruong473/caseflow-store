import type { DemoPaymentConfig } from "@/lib/payments/config";
import { buildVietQrPayload } from "@/lib/payments/vietqr";
import type { DemoPaymentProvider } from "@/lib/validation/payments";

export type CreateProviderPayloadInput = {
  amount: number;
  config: DemoPaymentConfig;
  orderCode: string;
  paymentId: string;
  paymentReference: string;
};

export interface PaymentProvider {
  createQrPayload(input: CreateProviderPayloadInput): string;
  provider: DemoPaymentProvider;
}

export const mockGatewayPaymentProvider: PaymentProvider = {
  createQrPayload(input) {
    const params = new URLSearchParams({
      amount: input.amount.toString(),
      currency: "VND",
      orderId: input.orderCode,
      paymentId: input.paymentId,
      reference: input.paymentReference,
    });

    return `demo-payment://pay?${params.toString()}`;
  },
  provider: "MOCK_GATEWAY",
};

export const demoVietQrPaymentProvider: PaymentProvider = {
  createQrPayload(input) {
    return buildVietQrPayload({
      accountName: input.config.accountName,
      accountNumber: input.config.accountNumber,
      amount: input.amount,
      bankBin: input.config.bankBin,
      orderCode: input.orderCode,
    });
  },
  provider: "DEMO_VIETQR",
};

export function getPaymentProvider(provider: DemoPaymentProvider) {
  switch (provider) {
    case "MOCK_GATEWAY":
      return mockGatewayPaymentProvider;
    case "DEMO_VIETQR":
      return demoVietQrPaymentProvider;
  }
}
