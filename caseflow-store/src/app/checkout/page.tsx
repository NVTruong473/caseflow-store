import type { Metadata } from "next";

import { CheckoutPage } from "@/features/checkout";

export const metadata: Metadata = {
  title: "Checkout - CaseFlow Store",
  description: "Guest checkout for CaseFlow Store demo orders.",
};

export default function CheckoutRoute() {
  return <CheckoutPage />;
}
