import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { bookShippingAddressSchema } from "@/lib/validation/domain";
import type {
  CustomerRequiredProfileField,
  ShippingAddress,
} from "@/types/domain";
import type { TableRow } from "@/types/supabase";

export type AdminCustomerShippingSummary = {
  countryCode: "VN";
  district: string;
  province: string;
};

export type AdminCustomerRecord = {
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

type CustomerOrderSummaryRow = Pick<
  TableRow<"orders">,
  "created_at" | "customer_id" | "order_code" | "total_vnd"
>;

export async function listSupabaseAdminCustomers(query = ""): Promise<
  AdminCustomerRecord[]
> {
  const supabase = createSupabaseAdminClient();
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select(
      "id,display_name,full_name,email,email_verified_at,phone,phone_verified_at,default_shipping_address,created_at,updated_at",
    )
    .eq("role", "customer")
    .order("created_at", { ascending: false });

  if (profileError) {
    throw new Error("Failed to list customer profiles", {
      cause: profileError,
    });
  }

  if (!profiles || profiles.length === 0) {
    return [];
  }

  const profileIds = profiles.map((profile) => profile.id);
  const { data: orders, error: orderError } = await supabase
    .from("orders")
    .select("customer_id,order_code,total_vnd,created_at")
    .in("customer_id", profileIds)
    .order("created_at", { ascending: false });

  if (orderError) {
    throw new Error("Failed to read customer order summaries", {
      cause: orderError,
    });
  }

  const ordersByCustomerId = groupOrdersByCustomerId(orders ?? []);
  const customers = profiles.map((profile) =>
    mapCustomerProfile(profile, ordersByCustomerId.get(profile.id) ?? []),
  );
  const normalizedQuery = normalizeSearch(query);

  if (!normalizedQuery) {
    return customers;
  }

  return customers.filter((customer) =>
    normalizeSearch(
      [
        customer.displayName,
        customer.email,
        customer.fullName,
        customer.lastOrderCode,
        customer.defaultShippingAddressSummary?.district,
        customer.defaultShippingAddressSummary?.province,
      ]
        .filter(Boolean)
        .join(" "),
    ).includes(normalizedQuery),
  );
}

function mapCustomerProfile(
  profile: Pick<
    TableRow<"profiles">,
    | "created_at"
    | "default_shipping_address"
    | "display_name"
    | "email"
    | "email_verified_at"
    | "full_name"
    | "id"
    | "phone"
    | "phone_verified_at"
    | "updated_at"
  >,
  orders: CustomerOrderSummaryRow[],
): AdminCustomerRecord {
  const email = profile.email?.trim() ?? "";
  const fullName = profile.full_name?.trim() || null;
  const displayName =
    fullName ||
    profile.display_name?.trim() ||
    email ||
    "CaseFlow Books customer";
  const phone = profile.phone?.trim() || null;
  const defaultShippingAddress = parseShippingAddress(
    profile.default_shipping_address,
  );
  const totalSpendVnd = orders.reduce(
    (sum, order) => sum + order.total_vnd,
    0,
  );
  const lastOrder = orders[0] ?? null;

  return {
    id: profile.id,
    createdAt: profile.created_at,
    defaultShippingAddressSummary:
      defaultShippingAddress === null
        ? null
        : {
            countryCode: defaultShippingAddress.countryCode,
            district: defaultShippingAddress.district,
            province: defaultShippingAddress.province,
          },
    displayName,
    email,
    emailVerified: Boolean(profile.email_verified_at),
    fullName,
    hasPhone: Boolean(phone),
    lastOrderAt: lastOrder?.created_at ?? null,
    lastOrderCode: lastOrder?.order_code ?? null,
    orderCount: orders.length,
    phoneLast4: phone ? getPhoneLast4(phone) : null,
    phoneVerified: Boolean(profile.phone_verified_at),
    profileCompleteness: getProfileCompleteness({
      defaultShippingAddress,
      email,
      fullName,
      phone,
    }),
    totalSpendVnd,
    updatedAt: profile.updated_at,
  };
}

function groupOrdersByCustomerId(orders: CustomerOrderSummaryRow[]) {
  const ordersByCustomerId = new Map<string, CustomerOrderSummaryRow[]>();

  for (const order of orders) {
    if (!order.customer_id) {
      continue;
    }

    const currentOrders = ordersByCustomerId.get(order.customer_id) ?? [];
    currentOrders.push(order);
    ordersByCustomerId.set(order.customer_id, currentOrders);
  }

  return ordersByCustomerId;
}

function parseShippingAddress(value: unknown): ShippingAddress | null {
  const parsedAddress = bookShippingAddressSchema.safeParse(value);

  return parsedAddress.success ? parsedAddress.data : null;
}

function getProfileCompleteness(options: {
  defaultShippingAddress: ShippingAddress | null;
  email: string;
  fullName: string | null;
  phone: string | null;
}) {
  const missingFields: CustomerRequiredProfileField[] = [];

  if (!options.fullName?.trim()) {
    missingFields.push("fullName");
  }

  if (!options.email.trim()) {
    missingFields.push("email");
  }

  if (!options.phone) {
    missingFields.push("phone");
  }

  if (!options.defaultShippingAddress) {
    missingFields.push("shippingAddress");
  }

  return {
    isCompleteForCheckout: missingFields.length === 0,
    missingFields,
  };
}

function getPhoneLast4(phone: string) {
  const digits = phone.replace(/\D/g, "");

  return digits.length >= 4 ? digits.slice(-4) : digits || null;
}

function normalizeSearch(value: string) {
  return value.trim().toLocaleLowerCase();
}
