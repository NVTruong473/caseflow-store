"use client";

import * as React from "react";

import { Badge, Button, ErrorMessage, Input } from "@/components/ui";
import type { AdminPromotionApiItem } from "@/lib/api/admin-promotions";
import type {
  AdminPermission,
  AdminWorkspaceRole,
} from "@/lib/auth/admin";
import { formatVnd } from "@/lib/format/currency";
import type { Language } from "@/lib/i18n/language";
import { cn } from "@/lib/utils/cn";

import { AdminShellPage } from "./admin-shell-page";

type ApiResponse<TData> = {
  data: TData | null;
  error: { code: string; message: string } | null;
  meta: Record<string, unknown> | null;
};

type PromotionDraft = {
  amountVnd: string;
  code: string;
  discountType: AdminPromotionApiItem["discountType"];
  endsAt: string;
  isActive: boolean;
  nameEn: string;
  nameVi: string;
  percentage: string;
  startsAt: string;
};

type SaveState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

const promotionCopy = {
  en: {
    active: "Active",
    activeState: "Can be applied at checkout",
    amountVnd: "Fixed discount",
    badge: "Promotions",
    cancel: "Cancel",
    code: "Code",
    createNew: "New promotion",
    createTitle: "Create promotion",
    deactivate: "Deactivate",
    description:
      "Create promotion codes while checkout validation and order totals remain server-owned.",
    discountType: "Discount type",
    editTitle: "Edit promotion",
    eligibility:
      "Eligibility: code must exist, be active, be inside the validity window, and discount is capped at the order subtotal.",
    endsAt: "Ends at",
    expired: "Expired",
    fixedVnd: "Fixed VND",
    inactive: "Inactive",
    metrics: {
      active: "Active codes",
      expired: "Expired",
      total: "Total codes",
    },
    nameEn: "English name",
    nameVi: "Vietnamese name",
    noEndDate: "No end date",
    noResults: "No promotion matches this search.",
    percentage: "Percentage",
    percentageLabel: "Percent off",
    promotionSaved: "Promotion saved.",
    save: "Save promotion",
    scheduled: "Scheduled",
    search: "Search code or name",
    selectPromotion: "Select a promotion to edit.",
    startsAt: "Starts at",
    title: "Promotion management",
    toggleFailed: "Promotion active state could not be changed.",
    updated: "Updated",
  },
  vi: {
    active: "Đang áp dụng",
    activeState: "Có thể dùng khi thanh toán",
    amountVnd: "Giảm cố định",
    badge: "Khuyến mãi",
    cancel: "Hủy",
    code: "Mã",
    createNew: "Mã mới",
    createTitle: "Tạo khuyến mãi",
    deactivate: "Tắt",
    description:
      "Tạo mã khuyến mãi trong khi kiểm tra checkout và tổng đơn vẫn do server tính.",
    discountType: "Kiểu giảm giá",
    editTitle: "Sửa khuyến mãi",
    eligibility:
      "Điều kiện áp dụng: mã phải tồn tại, đang bật, nằm trong thời gian hiệu lực, và mức giảm được giới hạn theo tạm tính đơn hàng.",
    endsAt: "Kết thúc",
    expired: "Hết hạn",
    fixedVnd: "Giảm VND",
    inactive: "Đã tắt",
    metrics: {
      active: "Mã đang bật",
      expired: "Hết hạn",
      total: "Tổng mã",
    },
    nameEn: "Tên tiếng Anh",
    nameVi: "Tên tiếng Việt",
    noEndDate: "Không có ngày kết thúc",
    noResults: "Không có mã khuyến mãi khớp tìm kiếm.",
    percentage: "Phần trăm",
    percentageLabel: "Phần trăm giảm",
    promotionSaved: "Đã lưu khuyến mãi.",
    save: "Lưu khuyến mãi",
    scheduled: "Sắp diễn ra",
    search: "Tìm mã hoặc tên",
    selectPromotion: "Chọn một mã để sửa.",
    startsAt: "Bắt đầu",
    title: "Quản lý khuyến mãi",
    toggleFailed: "Không thể đổi trạng thái mã khuyến mãi.",
    updated: "Cập nhật",
  },
} as const;

export function AdminPromotionsPage({
  adminName,
  adminPermissions,
  adminRole,
  initialPromotions,
  language,
}: {
  adminName: string;
  adminPermissions: AdminPermission[];
  adminRole: AdminWorkspaceRole;
  initialPromotions: AdminPromotionApiItem[];
  language: Language;
}) {
  const copy = promotionCopy[language];
  const [promotions, setPromotions] = React.useState(initialPromotions);
  const [query, setQuery] = React.useState("");
  const [selectedId, setSelectedId] = React.useState<string | null>(
    initialPromotions[0]?.id ?? null,
  );
  const [isCreating, setIsCreating] = React.useState(
    initialPromotions.length === 0,
  );
  const [draft, setDraft] = React.useState<PromotionDraft>(() =>
    initialPromotions[0]
      ? draftFromPromotion(initialPromotions[0])
      : createEmptyDraft(),
  );
  const [saveState, setSaveState] = React.useState<SaveState>({
    status: "idle",
  });

  const filteredPromotions = React.useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();

    if (!normalizedQuery) {
      return promotions;
    }

    return promotions.filter((promotion) =>
      [promotion.code, promotion.name.en, promotion.name.vi]
        .join(" ")
        .toLocaleLowerCase()
        .includes(normalizedQuery),
    );
  }, [promotions, query]);
  const activeCount = promotions.filter((promotion) => promotion.isActive).length;
  const expiredCount = promotions.filter((promotion) =>
    getPromotionStatus(promotion) === "expired",
  ).length;
  const metrics = [
    { label: copy.metrics.total, value: String(promotions.length) },
    { label: copy.metrics.active, value: String(activeCount) },
    { label: copy.metrics.expired, value: String(expiredCount) },
  ];

  const selectPromotion = (promotion: AdminPromotionApiItem) => {
    setSelectedId(promotion.id);
    setIsCreating(false);
    setDraft(draftFromPromotion(promotion));
    setSaveState({ status: "idle" });
  };

  const startCreate = () => {
    setSelectedId(null);
    setIsCreating(true);
    setDraft(createEmptyDraft());
    setSaveState({ status: "idle" });
  };

  const savePromotion = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaveState({ status: "submitting" });

    const response = await fetch(
      isCreating || !selectedId
        ? "/api/admin/promotions"
        : `/api/admin/promotions/${selectedId}`,
      {
        body: JSON.stringify(draftToPayload(draft)),
        headers: { "Content-Type": "application/json" },
        method: isCreating || !selectedId ? "POST" : "PATCH",
      },
    );
    const payload = (await response.json()) as ApiResponse<AdminPromotionApiItem>;

    if (!response.ok || payload.error || !payload.data) {
      setSaveState({
        status: "error",
        message: payload.error?.message ?? "Promotion could not be saved.",
      });
      return;
    }

    const savedPromotion = payload.data;

    setPromotions((current) => upsertPromotion(current, savedPromotion));
    setSelectedId(savedPromotion.id);
    setIsCreating(false);
    setDraft(draftFromPromotion(savedPromotion));
    setSaveState({ status: "success", message: copy.promotionSaved });
  };

  const toggleActive = async (promotion: AdminPromotionApiItem) => {
    setSaveState({ status: "submitting" });
    const response = await fetch(`/api/admin/promotions/${promotion.id}`, {
      body: JSON.stringify({ isActive: !promotion.isActive }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    });
    const payload = (await response.json()) as ApiResponse<AdminPromotionApiItem>;

    if (!response.ok || payload.error || !payload.data) {
      setSaveState({
        status: "error",
        message: payload.error?.message ?? copy.toggleFailed,
      });
      return;
    }

    const savedPromotion = payload.data;

    setPromotions((current) => upsertPromotion(current, savedPromotion));
    setSelectedId(savedPromotion.id);
    setDraft(draftFromPromotion(savedPromotion));
    setSaveState({ status: "success", message: copy.promotionSaved });
  };

  return (
    <AdminShellPage
      active="promotions"
      badge={copy.badge}
      description={copy.description}
      language={language}
      metrics={metrics}
      permissions={adminPermissions}
      role={adminRole}
      title={copy.title}
      userName={adminName}
    >
      <section
        className="grid gap-case-lg xl:grid-cols-[minmax(0,1fr)_minmax(360px,440px)]"
        data-admin-promotions-page
      >
        <div className="min-w-0 rounded-lg border border-border bg-surface p-case-lg">
          <div className="flex flex-col gap-case-sm sm:flex-row sm:items-end sm:justify-between">
            <Input
              label={copy.search}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              data-admin-promotions-search
            />
            <Button
              type="button"
              onClick={startCreate}
              data-admin-promotions-new
            >
              {copy.createNew}
            </Button>
          </div>

          <div
            className="mt-case-lg grid gap-case-sm"
            data-admin-promotions-list
          >
            {filteredPromotions.length > 0 ? (
              filteredPromotions.map((promotion) => {
                const status = getPromotionStatus(promotion);

                return (
                  <button
                    key={promotion.id}
                    type="button"
                    onClick={() => selectPromotion(promotion)}
                    className={cn(
                      "rounded-md border p-case-md text-left transition-colors",
                      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                      selectedId === promotion.id
                        ? "border-primary bg-surface-muted"
                        : "border-border bg-surface hover:border-primary",
                    )}
                    data-admin-promotion-item={promotion.code}
                  >
                    <div className="flex flex-col gap-case-sm sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <h2 className="text-body font-semibold text-foreground">
                          {promotion.code}
                        </h2>
                        <p className="mt-case-xs break-words text-small text-text-muted">
                          {promotion.name[language]} ·{" "}
                          {formatPromotionDiscount(promotion)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-case-xs">
                        <Badge variant={getStatusBadgeVariant(status)}>
                          {copy[status]}
                        </Badge>
                        <Badge variant="neutral">
                          {copy.updated}: {formatDate(promotion.updatedAt)}
                        </Badge>
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <p className="rounded-md border border-border bg-surface-muted p-case-md text-body text-text-muted">
                {copy.noResults}
              </p>
            )}
          </div>
        </div>

        <form
          onSubmit={savePromotion}
          className="rounded-lg border border-border bg-surface p-case-lg"
          data-admin-promotions-form
        >
          <div className="flex flex-col gap-case-sm sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-heading-3 font-semibold text-foreground">
                {isCreating ? copy.createTitle : copy.editTitle}
              </h2>
              <p className="mt-case-xs break-words text-small text-text-muted">
                {selectedId || isCreating
                  ? draft.code || copy.selectPromotion
                  : copy.selectPromotion}
              </p>
            </div>
            {selectedId && !isCreating ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  const promotion = promotions.find(
                    (item) => item.id === selectedId,
                  );
                  if (promotion) void toggleActive(promotion);
                }}
                data-admin-promotions-toggle
              >
                {draft.isActive ? copy.deactivate : copy.active}
              </Button>
            ) : null}
          </div>

          <p className="mt-case-md rounded-md border border-border bg-surface-muted p-case-sm text-small leading-6 text-text-muted">
            {copy.eligibility}
          </p>

          <div className="mt-case-lg grid gap-case-md">
            <Input
              label={copy.code}
              value={draft.code}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  code: event.target.value.toUpperCase(),
                }))
              }
              data-admin-promotions-code
            />
            <Input
              label={copy.nameEn}
              value={draft.nameEn}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  nameEn: event.target.value,
                }))
              }
              data-admin-promotions-name-en
            />
            <Input
              label={copy.nameVi}
              value={draft.nameVi}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  nameVi: event.target.value,
                }))
              }
              data-admin-promotions-name-vi
            />

            <label className="flex flex-col gap-2 text-small font-medium text-foreground">
              {copy.discountType}
              <select
                className="min-h-11 rounded-md border border-border bg-surface px-3 py-2 text-body text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                value={draft.discountType}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    discountType: event.target
                      .value as PromotionDraft["discountType"],
                  }))
                }
                data-admin-promotions-discount-type
              >
                <option value="fixed-vnd">{copy.fixedVnd}</option>
                <option value="percentage">{copy.percentage}</option>
              </select>
            </label>

            {draft.discountType === "fixed-vnd" ? (
              <Input
                label={copy.amountVnd}
                type="number"
                min={1000}
                step={1000}
                value={draft.amountVnd}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    amountVnd: event.target.value,
                  }))
                }
                data-admin-promotions-amount
              />
            ) : (
              <Input
                label={copy.percentageLabel}
                type="number"
                min={0.01}
                max={100}
                step={0.01}
                value={draft.percentage}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    percentage: event.target.value,
                  }))
                }
                data-admin-promotions-percentage
              />
            )}

            <div className="grid gap-case-md sm:grid-cols-2">
              <Input
                label={copy.startsAt}
                type="datetime-local"
                value={draft.startsAt}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    startsAt: event.target.value,
                  }))
                }
                data-admin-promotions-starts-at
              />
              <Input
                label={copy.endsAt}
                type="datetime-local"
                value={draft.endsAt}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    endsAt: event.target.value,
                  }))
                }
                hint={copy.noEndDate}
                data-admin-promotions-ends-at
              />
            </div>

            <label className="flex items-start gap-case-sm rounded-md border border-border bg-surface-muted p-case-sm text-small text-foreground">
              <input
                type="checkbox"
                checked={draft.isActive}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    isActive: event.target.checked,
                  }))
                }
                className="mt-1 h-4 w-4 shrink-0 accent-primary"
                data-admin-promotions-active
              />
              <span>
                <span className="block font-medium">{copy.activeState}</span>
              </span>
            </label>

            <div className="grid gap-case-sm sm:grid-cols-2">
              <Button
                type="submit"
                isLoading={saveState.status === "submitting"}
                data-admin-promotions-save
              >
                {copy.save}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={startCreate}
              >
                {copy.cancel}
              </Button>
            </div>

            {saveState.status === "success" ? (
              <p
                className="rounded-md border border-success bg-success/10 p-case-sm text-small font-medium text-success"
                data-admin-promotions-save-state="success"
              >
                {saveState.message}
              </p>
            ) : null}
            {saveState.status === "error" ? (
              <ErrorMessage data-admin-promotions-save-state="error">
                {saveState.message}
              </ErrorMessage>
            ) : null}
          </div>
        </form>
      </section>
    </AdminShellPage>
  );
}

function createEmptyDraft(): PromotionDraft {
  return {
    amountVnd: "10000",
    code: "",
    discountType: "fixed-vnd",
    endsAt: "",
    isActive: true,
    nameEn: "",
    nameVi: "",
    percentage: "10",
    startsAt: toDateTimeInputValue(new Date().toISOString()),
  };
}

function draftFromPromotion(promotion: AdminPromotionApiItem): PromotionDraft {
  return {
    amountVnd: promotion.amountVnd === null ? "" : String(promotion.amountVnd),
    code: promotion.code,
    discountType: promotion.discountType,
    endsAt:
      promotion.endsAt === null ? "" : toDateTimeInputValue(promotion.endsAt),
    isActive: promotion.isActive,
    nameEn: promotion.name.en,
    nameVi: promotion.name.vi,
    percentage:
      promotion.percentageBasisPoints === null
        ? ""
        : String(promotion.percentageBasisPoints / 100),
    startsAt: toDateTimeInputValue(promotion.startsAt),
  };
}

function draftToPayload(draft: PromotionDraft) {
  const isFixedDiscount = draft.discountType === "fixed-vnd";

  return {
    amountVnd: isFixedDiscount ? Number(draft.amountVnd) : null,
    code: draft.code.trim().toUpperCase(),
    discountType: draft.discountType,
    endsAt: draft.endsAt ? toIsoString(draft.endsAt) : null,
    isActive: draft.isActive,
    name: {
      en: draft.nameEn.trim(),
      vi: draft.nameVi.trim(),
    },
    percentageBasisPoints: isFixedDiscount
      ? null
      : Math.round(Number(draft.percentage) * 100),
    startsAt: toIsoString(draft.startsAt),
  };
}

function upsertPromotion(
  promotions: AdminPromotionApiItem[],
  promotion: AdminPromotionApiItem,
) {
  const existingIndex = promotions.findIndex((item) => item.id === promotion.id);

  if (existingIndex === -1) {
    return [promotion, ...promotions];
  }

  return promotions.map((item) => (item.id === promotion.id ? promotion : item));
}

function getPromotionStatus(promotion: AdminPromotionApiItem) {
  if (!promotion.isActive) {
    return "inactive";
  }

  const now = Date.now();

  if (Date.parse(promotion.startsAt) > now) {
    return "scheduled";
  }

  if (promotion.endsAt !== null && Date.parse(promotion.endsAt) <= now) {
    return "expired";
  }

  return "active";
}

function getStatusBadgeVariant(
  status: ReturnType<typeof getPromotionStatus>,
) {
  switch (status) {
    case "active":
      return "success";
    case "expired":
      return "warning";
    case "inactive":
      return "neutral";
    case "scheduled":
      return "primary";
  }
}

function formatPromotionDiscount(promotion: AdminPromotionApiItem) {
  if (promotion.discountType === "fixed-vnd") {
    return formatVnd(promotion.amountVnd ?? 0);
  }

  return `${((promotion.percentageBasisPoints ?? 0) / 100).toLocaleString(
    "vi-VN",
    {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    },
  )}%`;
}

function toDateTimeInputValue(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 16);
}

function toIsoString(value: string) {
  return new Date(value).toISOString();
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}
