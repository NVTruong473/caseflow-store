import type { Metadata } from "next";

import { CheckoutSuccessPage } from "@/features/checkout";

export const metadata: Metadata = {
  title: "Order placed | CaseFlow Store",
  description: "Simulated checkout confirmation for CaseFlow Store.",
};

export default function CheckoutSuccessRoute() {
  return <CheckoutSuccessPage />;
}
