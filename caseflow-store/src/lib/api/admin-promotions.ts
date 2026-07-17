import type { BookPromotion } from "@/types/domain";

export type AdminPromotionApiItem = {
  id: string;
  code: string;
  name: BookPromotion["name"];
  discountType: BookPromotion["discountType"];
  amountVnd: number | null;
  percentageBasisPoints: number | null;
  startsAt: string;
  endsAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export function toAdminPromotionApiItem(
  promotion: BookPromotion,
): AdminPromotionApiItem {
  return {
    id: promotion.id,
    code: promotion.code,
    name: promotion.name,
    discountType: promotion.discountType,
    amountVnd: promotion.amountVnd,
    percentageBasisPoints: promotion.percentageBasisPoints,
    startsAt: promotion.startsAt,
    endsAt: promotion.endsAt,
    isActive: promotion.isActive,
    createdAt: promotion.createdAt,
    updatedAt: promotion.updatedAt,
  };
}
