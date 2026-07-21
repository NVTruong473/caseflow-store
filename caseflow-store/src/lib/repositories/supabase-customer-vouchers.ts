import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { mapBookPromotionRowToDomain } from "@/lib/supabase/book-mappers";
import type {
  BookPromotion,
  CustomerSignupVoucher,
  CustomerSignupVoucherStatus,
  ISODateTimeString,
} from "@/types/domain";
import type { TableInsert, TableRow } from "@/types/supabase";

const SIGNUP_VOUCHER_VALID_DAYS = 30;
const VOUCHER_RESERVATION_MINUTES = 15;

export const SIGNUP_VOUCHER_CAMPAIGNS = [
  {
    amountVnd: 30_000,
    code: "WELCOME30K",
    name: {
      vi: "Ưu đãi chào mừng 30.000 đ",
      en: "Welcome 30,000 VND offer",
    },
  },
  {
    amountVnd: 20_000,
    code: "READMORE20K",
    name: {
      vi: "Đọc thêm giảm 20.000 đ",
      en: "Read more 20,000 VND offer",
    },
  },
  {
    amountVnd: 25_000,
    code: "FREESHIP25K",
    name: {
      vi: "Hỗ trợ phí giao 25.000 đ",
      en: "Delivery support 25,000 VND offer",
    },
  },
] as const;

export const SIGNUP_VOUCHER_CODES = SIGNUP_VOUCHER_CAMPAIGNS.map(
  (campaign) => campaign.code,
);

type SignupVoucherCode = (typeof SIGNUP_VOUCHER_CODES)[number];

type CustomerVoucherRow = TableRow<"customer_promotion_vouchers">;

export type SignupVoucherReservation =
  | {
      success: true;
      code: SignupVoucherCode;
      reservationToken: string;
      voucherId: string;
    }
  | {
      success: false;
      code: "PROMOTION_INVALID";
      message: string;
    };

export function isSignupVoucherCode(code: string): code is SignupVoucherCode {
  return SIGNUP_VOUCHER_CODES.includes(
    code.trim().toUpperCase() as SignupVoucherCode,
  );
}

export async function ensureCustomerSignupVouchers(
  customerId: string,
  activatedAt = new Date(),
): Promise<CustomerSignupVoucher[]> {
  const promotions = await ensureSignupVoucherPromotions(activatedAt);
  const activatedAtIso = activatedAt.toISOString();
  const expiresAtIso = addDays(activatedAt, SIGNUP_VOUCHER_VALID_DAYS).toISOString();
  const supabase = createSupabaseAdminClient();
  const rows: TableInsert<"customer_promotion_vouchers">[] = promotions.map(
    (promotion) => ({
      activated_at: activatedAtIso,
      code: promotion.code,
      customer_id: customerId,
      expires_at: expiresAtIso,
      promotion_id: promotion.id,
      source: "signup",
    }),
  );

  const { error } = await supabase
    .from("customer_promotion_vouchers")
    .upsert(rows, {
      ignoreDuplicates: true,
      onConflict: "customer_id,promotion_id",
    });

  if (error) {
    throw new Error("Failed to grant signup vouchers", { cause: error });
  }

  return listCustomerSignupVouchers(customerId);
}

export async function listCustomerSignupVouchers(
  customerId: string,
  now = new Date(),
): Promise<CustomerSignupVoucher[]> {
  const supabase = createSupabaseAdminClient();
  const { data: voucherRows, error: voucherError } = await supabase
    .from("customer_promotion_vouchers")
    .select("*")
    .eq("customer_id", customerId)
    .eq("source", "signup");

  if (voucherError) {
    throw new Error("Failed to list customer signup vouchers", {
      cause: voucherError,
    });
  }

  if (!voucherRows || voucherRows.length === 0) {
    return [];
  }

  const promotionIds = [...new Set(voucherRows.map((row) => row.promotion_id))];
  const { data: promotionRows, error: promotionError } = await supabase
    .from("book_promotions")
    .select("*")
    .in("id", promotionIds);

  if (promotionError) {
    throw new Error("Failed to read signup voucher promotions", {
      cause: promotionError,
    });
  }

  const promotionById = new Map(
    (promotionRows ?? []).map((row) => [
      row.id,
      mapBookPromotionRowToDomain(row),
    ]),
  );

  return voucherRows
    .map((row) => mapCustomerVoucher(row, promotionById.get(row.promotion_id), now))
    .filter((voucher): voucher is CustomerSignupVoucher => voucher !== null)
    .sort(
      (a, b) =>
        SIGNUP_VOUCHER_CODES.indexOf(a.code as SignupVoucherCode) -
        SIGNUP_VOUCHER_CODES.indexOf(b.code as SignupVoucherCode),
    );
}

export async function findCustomerSignupVoucherForCode({
  code,
  customerId,
  now = new Date(),
}: {
  code: string;
  customerId: string;
  now?: Date;
}): Promise<CustomerSignupVoucher | null> {
  const normalizedCode = code.trim().toUpperCase();
  const vouchers = await listCustomerSignupVouchers(customerId, now);

  return vouchers.find((voucher) => voucher.code === normalizedCode) ?? null;
}

export async function reserveCustomerSignupVoucher({
  code,
  customerId,
  now = new Date(),
}: {
  code: SignupVoucherCode;
  customerId: string;
  now?: Date;
}): Promise<SignupVoucherReservation> {
  const supabase = createSupabaseAdminClient();
  const nowIso = now.toISOString();

  await supabase
    .from("customer_promotion_vouchers")
    .update({
      reservation_expires_at: null,
      reservation_token: null,
      reserved_at: null,
    })
    .eq("customer_id", customerId)
    .eq("code", code)
    .eq("source", "signup")
    .is("used_at", null)
    .lt("reservation_expires_at", nowIso);

  const reservationToken = crypto.randomUUID();
  const reservationExpiresAt = addMinutes(
    now,
    VOUCHER_RESERVATION_MINUTES,
  ).toISOString();

  // Server locks the account voucher before applying the discount so a
  // double-click or duplicated request cannot spend the same welcome code twice.
  const { data, error } = await supabase
    .from("customer_promotion_vouchers")
    .update({
      reservation_expires_at: reservationExpiresAt,
      reservation_token: reservationToken,
      reserved_at: nowIso,
    })
    .eq("customer_id", customerId)
    .eq("code", code)
    .eq("source", "signup")
    .is("used_at", null)
    .is("reservation_token", null)
    .gt("expires_at", nowIso)
    .select("id,code")
    .maybeSingle();

  if (error) {
    throw new Error("Failed to reserve signup voucher", { cause: error });
  }

  if (!data) {
    return {
      success: false,
      code: "PROMOTION_INVALID",
      message: "This account voucher is already used, expired, or reserved.",
    };
  }

  return {
    success: true,
    code,
    reservationToken,
    voucherId: data.id,
  };
}

export async function confirmCustomerSignupVoucherReservation({
  customerId,
  orderId,
  reservationToken,
}: {
  customerId: string;
  orderId: string;
  reservationToken: string;
}) {
  const supabase = createSupabaseAdminClient();
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("customer_promotion_vouchers")
    .update({
      reservation_expires_at: null,
      reservation_token: null,
      reserved_at: null,
      used_at: nowIso,
      used_order_id: orderId,
    })
    .eq("customer_id", customerId)
    .eq("reservation_token", reservationToken)
    .is("used_at", null)
    .gt("reservation_expires_at", nowIso)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    throw new Error("Failed to confirm signup voucher redemption", {
      cause: error,
    });
  }
}

export async function releaseCustomerSignupVoucherReservation({
  customerId,
  reservationToken,
}: {
  customerId: string;
  reservationToken: string;
}) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("customer_promotion_vouchers")
    .update({
      reservation_expires_at: null,
      reservation_token: null,
      reserved_at: null,
    })
    .eq("customer_id", customerId)
    .eq("reservation_token", reservationToken)
    .is("used_at", null);

  if (error) {
    throw new Error("Failed to release signup voucher reservation", {
      cause: error,
    });
  }
}

async function ensureSignupVoucherPromotions(
  now = new Date(),
): Promise<BookPromotion[]> {
  const supabase = createSupabaseAdminClient();
  const rows: TableInsert<"book_promotions">[] =
    SIGNUP_VOUCHER_CAMPAIGNS.map((campaign) => ({
      amount_vnd: campaign.amountVnd,
      code: campaign.code,
      discount_type: "fixed-vnd",
      ends_at: null,
      is_active: true,
      name: campaign.name,
      percentage_basis_points: null,
      starts_at: "2026-01-01T00:00:00+00:00",
    }));

  const { error } = await supabase
    .from("book_promotions")
    .upsert(rows, { onConflict: "code" });

  if (error) {
    throw new Error("Failed to ensure signup voucher campaigns", {
      cause: error,
    });
  }

  const { data, error: readError } = await supabase
    .from("book_promotions")
    .select("*")
    .in("code", [...SIGNUP_VOUCHER_CODES]);

  if (readError || !data) {
    throw new Error("Failed to read signup voucher campaigns", {
      cause: readError,
    });
  }

  const nowMs = now.getTime();

  return data
    .map(mapBookPromotionRowToDomain)
    .filter(
      (promotion) =>
        promotion.isActive &&
        Date.parse(promotion.startsAt) <= nowMs &&
        (promotion.endsAt === null || Date.parse(promotion.endsAt) > nowMs),
    )
    .sort(
      (a, b) =>
        SIGNUP_VOUCHER_CODES.indexOf(a.code as SignupVoucherCode) -
        SIGNUP_VOUCHER_CODES.indexOf(b.code as SignupVoucherCode),
    );
}

function mapCustomerVoucher(
  row: CustomerVoucherRow,
  promotion: BookPromotion | undefined,
  now: Date,
): CustomerSignupVoucher | null {
  if (!promotion) {
    return null;
  }

  return {
    id: row.id,
    customerId: row.customer_id,
    promotionId: row.promotion_id,
    code: row.code,
    name: promotion.name,
    discountType: promotion.discountType,
    amountVnd: promotion.amountVnd,
    percentageBasisPoints: promotion.percentageBasisPoints,
    issuedAt: row.issued_at as ISODateTimeString,
    activatedAt: row.activated_at as ISODateTimeString,
    expiresAt: row.expires_at as ISODateTimeString,
    usedAt: row.used_at as ISODateTimeString | null,
    usedOrderId: row.used_order_id,
    status: getVoucherStatus(row, now),
  };
}

function getVoucherStatus(
  row: CustomerVoucherRow,
  now: Date,
): CustomerSignupVoucherStatus {
  const nowMs = now.getTime();

  if (row.used_at !== null) {
    return "used";
  }

  if (Date.parse(row.expires_at) <= nowMs) {
    return "expired";
  }

  if (
    row.reservation_token !== null &&
    row.reservation_expires_at !== null &&
    Date.parse(row.reservation_expires_at) > nowMs
  ) {
    return "reserved";
  }

  return "available";
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}
