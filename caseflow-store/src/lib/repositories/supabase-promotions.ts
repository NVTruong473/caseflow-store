import { mapBookPromotionRowToDomain } from "@/lib/supabase/book-mappers";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  findCustomerSignupVoucherForCode,
  isSignupVoucherCode,
} from "@/lib/repositories/supabase-customer-vouchers";
import type {
  AdminBookPromotionCreateInput,
  AdminBookPromotionUpdateInput,
} from "@/lib/validation/books";
import type { BookPromotion } from "@/types/domain";
import type { Json, TableInsert, TableUpdate } from "@/types/supabase";

export type PromotionEvaluationResult =
  | {
      success: true;
      discountTotalVnd: number;
      isCustomerSignupVoucher: boolean;
      promotion: BookPromotion;
    }
  | {
      success: false;
      code: "PROMOTION_INVALID";
      message: string;
    };

export async function listSupabaseAdminBookPromotions(): Promise<
  BookPromotion[]
> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("book_promotions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Failed to list book promotions", { cause: error });
  }

  return (data ?? []).map(mapBookPromotionRowToDomain);
}

export async function createSupabaseAdminBookPromotion(
  input: AdminBookPromotionCreateInput,
): Promise<BookPromotion> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("book_promotions")
    .insert(toPromotionInsertRow(input))
    .select("*")
    .single();

  if (error || !data) {
    throw new Error("Failed to create book promotion", { cause: error });
  }

  return mapBookPromotionRowToDomain(data);
}

export async function updateSupabaseAdminBookPromotion(
  promotionId: string,
  input: AdminBookPromotionUpdateInput,
): Promise<BookPromotion | null> {
  const supabase = createSupabaseAdminClient();
  const updateRow = toPromotionUpdateRow(input);

  if (Object.keys(updateRow).length === 0) {
    const { data, error } = await supabase
      .from("book_promotions")
      .select("*")
      .eq("id", promotionId)
      .maybeSingle();

    if (error) {
      throw new Error("Failed to read book promotion", { cause: error });
    }

    return data ? mapBookPromotionRowToDomain(data) : null;
  }

  const { data, error } = await supabase
    .from("book_promotions")
    .update(updateRow)
    .eq("id", promotionId)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error("Failed to update book promotion", { cause: error });
  }

  return data ? mapBookPromotionRowToDomain(data) : null;
}

export async function evaluateSupabaseBookPromotion({
  code,
  customerId,
  now = new Date(),
  subtotalVnd,
}: {
  code: string;
  customerId?: string;
  now?: Date;
  subtotalVnd: number;
}): Promise<PromotionEvaluationResult> {
  const supabase = createSupabaseAdminClient();
  const normalizedCode = code.trim().toUpperCase();
  const { data, error } = await supabase
    .from("book_promotions")
    .select("*")
    .eq("code", normalizedCode)
    .maybeSingle();

  if (error) {
    throw new Error("Failed to evaluate promotion", { cause: error });
  }

  if (!data) {
    return {
      success: false,
      code: "PROMOTION_INVALID",
      message: "Promotion code is not valid",
    };
  }

  const promotion = mapBookPromotionRowToDomain(data);
  const nowMs = now.getTime();

  if (
    !promotion.isActive ||
    Date.parse(promotion.startsAt) > nowMs ||
    (promotion.endsAt !== null && Date.parse(promotion.endsAt) <= nowMs)
  ) {
    return {
      success: false,
      code: "PROMOTION_INVALID",
      message: "Promotion code is not active",
    };
  }

  if (isSignupVoucherCode(promotion.code)) {
    if (!customerId) {
      return {
        success: false,
        code: "PROMOTION_INVALID",
        message: "Sign in with the account that received this voucher",
      };
    }

    const voucher = await findCustomerSignupVoucherForCode({
      code: promotion.code,
      customerId,
      now,
    });

    if (!voucher) {
      return {
        success: false,
        code: "PROMOTION_INVALID",
        message: "This voucher was not issued to this account",
      };
    }

    if (voucher.status === "used") {
      return {
        success: false,
        code: "PROMOTION_INVALID",
        message: "This account voucher has already been used",
      };
    }

    if (voucher.status === "expired") {
      return {
        success: false,
        code: "PROMOTION_INVALID",
        message: "This account voucher has expired",
      };
    }

    if (voucher.status === "reserved") {
      return {
        success: false,
        code: "PROMOTION_INVALID",
        message: "This voucher is already reserved by another checkout attempt",
      };
    }
  }

  return {
    success: true,
    discountTotalVnd: calculatePromotionDiscount(promotion, subtotalVnd),
    isCustomerSignupVoucher: isSignupVoucherCode(promotion.code),
    promotion,
  };
}

function calculatePromotionDiscount(
  promotion: BookPromotion,
  subtotalVnd: number,
) {
  if (subtotalVnd <= 0) {
    return 0;
  }

  if (promotion.discountType === "fixed-vnd") {
    return Math.min(promotion.amountVnd ?? 0, subtotalVnd);
  }

  return Math.min(
    Math.round((subtotalVnd * (promotion.percentageBasisPoints ?? 0)) / 10_000),
    subtotalVnd,
  );
}

function toPromotionInsertRow(
  input: AdminBookPromotionCreateInput,
): TableInsert<"book_promotions"> {
  return {
    amount_vnd: input.discountType === "fixed-vnd" ? input.amountVnd : null,
    code: input.code,
    discount_type: input.discountType,
    ends_at: input.endsAt,
    is_active: input.isActive,
    name: input.name as Json,
    percentage_basis_points:
      input.discountType === "percentage" ? input.percentageBasisPoints : null,
    starts_at: input.startsAt,
  };
}

function toPromotionUpdateRow(
  input: AdminBookPromotionUpdateInput,
): TableUpdate<"book_promotions"> {
  const update: TableUpdate<"book_promotions"> = {};

  if (input.code !== undefined) update.code = input.code;
  if (input.name !== undefined) update.name = input.name as Json;
  if (input.discountType !== undefined) update.discount_type = input.discountType;
  if (input.startsAt !== undefined) update.starts_at = input.startsAt;
  if (input.endsAt !== undefined) update.ends_at = input.endsAt;
  if (input.isActive !== undefined) update.is_active = input.isActive;

  if (input.discountType === "fixed-vnd") {
    update.amount_vnd = input.amountVnd ?? null;
    update.percentage_basis_points = null;
  } else if (input.discountType === "percentage") {
    update.amount_vnd = null;
    update.percentage_basis_points = input.percentageBasisPoints ?? null;
  } else {
    if (input.amountVnd !== undefined) update.amount_vnd = input.amountVnd;
    if (input.percentageBasisPoints !== undefined) {
      update.percentage_basis_points = input.percentageBasisPoints;
    }
  }

  return update;
}
