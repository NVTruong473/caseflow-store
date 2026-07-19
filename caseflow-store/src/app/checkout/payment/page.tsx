import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { QrPaymentPage } from "@/features/checkout/qr-payment-page";
import { getCustomerAuthState } from "@/lib/auth/customer";
import { getRequestLanguage } from "@/lib/i18n/server";
import { getDemoPaymentConfig } from "@/lib/payments/config";
import { createPageMetadata } from "@/lib/seo/metadata";
import { paymentProviderSchema } from "@/lib/validation/payments";

type CheckoutPaymentRouteProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata(): Promise<Metadata> {
  const language = await getRequestLanguage();

  return createPageMetadata({
    description:
      language === "vi"
        ? "Kiểm tra phiên thanh toán đơn hàng CaseFlow Books."
        : "Review a CaseFlow Books order payment session.",
    language,
    path: "/checkout/payment",
    robots: {
      follow: false,
      index: false,
    },
    title:
      language === "vi"
        ? "Thanh toán QR - CaseFlow Books"
        : "QR payment - CaseFlow Books",
  });
}

export default async function CheckoutPaymentRoute({
  searchParams,
}: CheckoutPaymentRouteProps) {
  const language = await getRequestLanguage();
  const authState = await getCustomerAuthState();
  const paymentConfig = getDemoPaymentConfig();

  if (authState.status !== "authenticated" || authState.user.role !== "customer") {
    redirect("/account?next=/checkout/payment");
  }

  if (!paymentConfig.allowQrDemoPayments) {
    redirect("/account/orders");
  }

  const params = await searchParams;
  const orderCode = getParamValue(params?.orderCode) ?? null;
  const provider =
    paymentProviderSchema.safeParse(getParamValue(params?.provider)).data ??
    "DEMO_VIETQR";

  return (
    <QrPaymentPage
      initialOrderCode={orderCode}
      initialProvider={provider}
      language={language}
    />
  );
}

function getParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
