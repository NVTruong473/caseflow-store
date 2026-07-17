import type {
  AdminCustomerRecord,
  AdminCustomerShippingSummary,
} from "@/lib/repositories/supabase-customers";
import type { CustomerRequiredProfileField } from "@/types/domain";

export type AdminCustomerApiItem = {
  id: string;
  createdAt: string;
  defaultShippingAddressSummary: AdminCustomerShippingSummary | null;
  displayName: string;
  email: string;
  emailVerified: boolean;
  fullName: string | null;
  hasPhone: boolean;
  lastOrderAt: string | null;
  lastOrderCode: string | null;
  orderCount: number;
  phoneLast4: string | null;
  phoneVerified: boolean;
  profileCompleteness: {
    isCompleteForCheckout: boolean;
    missingFields: CustomerRequiredProfileField[];
  };
  totalSpendVnd: number;
  updatedAt: string;
};

export function toAdminCustomerApiItem(
  customer: AdminCustomerRecord,
): AdminCustomerApiItem {
  return {
    id: customer.id,
    createdAt: customer.createdAt,
    defaultShippingAddressSummary: customer.defaultShippingAddressSummary,
    displayName: customer.displayName,
    email: customer.email,
    emailVerified: customer.emailVerified,
    fullName: customer.fullName,
    hasPhone: customer.hasPhone,
    lastOrderAt: customer.lastOrderAt,
    lastOrderCode: customer.lastOrderCode,
    orderCount: customer.orderCount,
    phoneLast4: customer.phoneLast4,
    phoneVerified: customer.phoneVerified,
    profileCompleteness: customer.profileCompleteness,
    totalSpendVnd: customer.totalSpendVnd,
    updatedAt: customer.updatedAt,
  };
}
