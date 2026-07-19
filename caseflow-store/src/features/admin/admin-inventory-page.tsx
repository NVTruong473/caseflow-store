"use client";

import * as React from "react";

import { Badge, Button, ErrorMessage, Input } from "@/components/ui";
import type {
  AdminInventoryAdjustmentApiItem,
  AdminInventoryEditionApiItem,
} from "@/lib/api/admin-inventory";
import type {
  AdminPermission,
  AdminWorkspaceRole,
} from "@/lib/auth/admin";
import type { Language } from "@/lib/i18n/language";
import { cn } from "@/lib/utils/cn";
import type { InventoryStatus } from "@/types/domain";

import { AdminShellPage } from "./admin-shell-page";

type ApiResponse<TData> = {
  data: TData | null;
  error: { code: string; message: string } | null;
  meta: Record<string, unknown> | null;
};

type InventoryAdjustResponse = {
  adjustment: AdminInventoryAdjustmentApiItem;
  item: AdminInventoryEditionApiItem;
};

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

const statusVariants: Record<
  InventoryStatus,
  "neutral" | "primary" | "success" | "warning" | "error"
> = {
  discontinued: "neutral",
  "in-stock": "success",
  "low-stock": "warning",
  "out-of-stock": "error",
  preorder: "primary",
};

const inventoryCopy = {
  en: {
    adjustmentSaved: "Inventory adjustment saved.",
    adjustments: "Recent adjustments",
    badge: "Inventory",
    currentStock: "Current stock",
    description:
      "Adjust sellable edition stock with a reason and keep an audit trail for operations review.",
    lowStockThreshold: "Low-stock threshold",
    metrics: {
      low: "Low stock",
      out: "Out of stock",
      total: "Tracked editions",
    },
    noResults: "No inventory item matches this search.",
    quantityDelta: "Quantity delta",
    reason: "Reason",
    save: "Save adjustment",
    search: "Search title, slug, or author",
    selected: "Selected edition",
    title: "Inventory adjustments",
  },
  vi: {
    adjustmentSaved: "Đã lưu điều chỉnh tồn kho.",
    adjustments: "Điều chỉnh gần đây",
    badge: "Tồn kho",
    currentStock: "Tồn hiện tại",
    description:
      "Điều chỉnh tồn kho của ấn bản bán được kèm lý do và lưu audit trail cho vận hành.",
    lowStockThreshold: "Ngưỡng tồn kho thấp",
    metrics: {
      low: "Tồn thấp",
      out: "Hết hàng",
      total: "Ấn bản theo dõi",
    },
    noResults: "Không có mục tồn kho khớp tìm kiếm.",
    quantityDelta: "Số lượng điều chỉnh",
    reason: "Lý do",
    save: "Lưu điều chỉnh",
    search: "Tìm tên, slug hoặc tác giả",
    selected: "Ấn bản đang chọn",
    title: "Điều chỉnh tồn kho",
  },
} as const;

export function AdminInventoryPage({
  adminName,
  adminPermissions,
  adminRole,
  initialAdjustments,
  initialItems,
  language,
}: {
  adminName: string;
  adminPermissions: AdminPermission[];
  adminRole: AdminWorkspaceRole;
  initialAdjustments: AdminInventoryAdjustmentApiItem[];
  initialItems: AdminInventoryEditionApiItem[];
  language: Language;
}) {
  const copy = inventoryCopy[language];
  const [items, setItems] = React.useState(initialItems);
  const [adjustments, setAdjustments] = React.useState(initialAdjustments);
  const [query, setQuery] = React.useState("");
  const [selectedId, setSelectedId] = React.useState<string | null>(
    initialItems[0]?.id ?? null,
  );
  const [quantityDelta, setQuantityDelta] = React.useState("1");
  const [reason, setReason] = React.useState("");
  const [submitState, setSubmitState] = React.useState<SubmitState>({
    status: "idle",
  });
  const selectedItem = items.find((item) => item.id === selectedId) ?? null;
  const filteredItems = React.useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();

    if (!normalizedQuery) {
      return items;
    }

    return items.filter((item) =>
      [
        item.title,
        item.slug,
        item.authors.map((author) => author.name).join(" "),
      ]
        .join(" ")
        .toLocaleLowerCase()
        .includes(normalizedQuery),
    );
  }, [items, query]);
  const lowStockCount = items.filter(
    (item) =>
      item.inventoryStatus === "low-stock" ||
      item.stockQuantity <= item.lowStockThreshold,
  ).length;
  const outOfStockCount = items.filter(
    (item) =>
      item.inventoryStatus === "out-of-stock" || item.stockQuantity === 0,
  ).length;
  const metrics = [
    { label: copy.metrics.total, value: String(items.length) },
    { label: copy.metrics.low, value: String(lowStockCount) },
    { label: copy.metrics.out, value: String(outOfStockCount) },
  ];

  const submitAdjustment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedItem) {
      return;
    }

    setSubmitState({ status: "submitting" });
    const response = await fetch("/api/admin/inventory/adjustments", {
      body: JSON.stringify({
        editionId: selectedItem.id,
        quantityDelta: Number(quantityDelta),
        reason,
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const payload = (await response.json()) as ApiResponse<InventoryAdjustResponse>;

    if (!response.ok || payload.error || !payload.data) {
      setSubmitState({
        status: "error",
        message: payload.error?.message ?? "Inventory adjustment failed.",
      });
      return;
    }

    const saved = payload.data;

    setItems((current) =>
      current.map((item) => (item.id === saved.item.id ? saved.item : item)),
    );
    setAdjustments((current) => [saved.adjustment, ...current].slice(0, 20));
    setQuantityDelta("1");
    setReason("");
    setSubmitState({ status: "success", message: copy.adjustmentSaved });
  };

  return (
    <AdminShellPage
      active="inventory"
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
        className="grid gap-case-lg xl:grid-cols-[minmax(0,1fr)_minmax(340px,420px)]"
        data-admin-inventory-page
      >
        <div className="min-w-0 rounded-lg border border-admin/20 bg-surface p-case-lg shadow-[var(--case-shadow-soft)]">
          <Input
            label={copy.search}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            data-admin-inventory-search
          />

          <div className="mt-case-lg grid gap-case-sm" data-admin-inventory-list>
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={cn(
                    "rounded-md border p-case-md text-left transition-colors",
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                    selectedId === item.id
                      ? "border-admin bg-admin-muted"
                      : "border-border bg-surface hover:border-admin",
                  )}
                  data-admin-inventory-item={item.slug}
                >
                  <div className="flex flex-col gap-case-sm sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h2 className="text-body font-semibold text-foreground">
                        {item.title}
                      </h2>
                      <p className="mt-case-xs break-words text-small text-text-muted">
                        {item.slug} · {item.authors.map((author) => author.name).join(", ")}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-case-xs">
                      <Badge variant={statusVariants[item.inventoryStatus]}>
                        {item.inventoryStatus}
                      </Badge>
                      <Badge variant="neutral">
                        {copy.currentStock}: {item.stockQuantity}
                      </Badge>
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <p className="rounded-md border border-border bg-surface-muted p-case-md text-body text-text-muted">
                {copy.noResults}
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-case-lg">
          <form
            onSubmit={submitAdjustment}
            className="rounded-lg border border-operations/25 bg-operations-muted p-case-lg shadow-[var(--case-shadow-soft)]"
            data-admin-inventory-adjust-form
          >
            <h2 className="text-heading-3 font-semibold text-foreground">
              {copy.selected}
            </h2>
            {selectedItem ? (
              <div className="mt-case-md rounded-md border border-border bg-surface-muted p-case-md">
                <p className="text-body font-semibold text-foreground">
                  {selectedItem.title}
                </p>
                <p className="mt-case-xs text-small text-text-muted">
                  {copy.currentStock}:{" "}
                  <span data-admin-inventory-selected-stock>
                    {selectedItem.stockQuantity}
                  </span>
                </p>
                <p className="mt-case-xs text-small text-text-muted">
                  {copy.lowStockThreshold}: {selectedItem.lowStockThreshold}
                </p>
              </div>
            ) : null}

            <div className="mt-case-md grid gap-case-md">
              <Input
                label={copy.quantityDelta}
                type="number"
                value={quantityDelta}
                onChange={(event) => setQuantityDelta(event.target.value)}
                data-admin-inventory-delta
              />
              <Input
                label={copy.reason}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                data-admin-inventory-reason
              />
              <Button
                type="submit"
                disabled={!selectedItem}
                isLoading={submitState.status === "submitting"}
                data-admin-inventory-submit
              >
                {copy.save}
              </Button>
            </div>

            {submitState.status === "success" ? (
              <p
                className="mt-case-md rounded-md border border-success bg-success/10 p-case-sm text-small font-medium text-success"
                data-admin-inventory-submit-state="success"
              >
                {submitState.message}
              </p>
            ) : null}
            {submitState.status === "error" ? (
              <ErrorMessage
                className="mt-case-md"
                data-admin-inventory-submit-state="error"
              >
                {submitState.message}
              </ErrorMessage>
            ) : null}
          </form>

          <section
            className="rounded-lg border border-border bg-surface p-case-lg"
            data-admin-inventory-adjustments
          >
            <h2 className="text-heading-3 font-semibold text-foreground">
              {copy.adjustments}
            </h2>
            <div className="mt-case-md grid gap-case-sm">
              {adjustments.slice(0, 8).map((adjustment) => (
                <div
                  key={adjustment.id}
                  className="rounded-md border border-admin/20 bg-admin-muted p-case-sm"
                  data-admin-inventory-adjustment={adjustment.id}
                >
                  <p className="text-small font-semibold text-foreground">
                    {adjustment.quantityDelta > 0 ? "+" : ""}
                    {adjustment.quantityDelta}
                  </p>
                  <p className="mt-case-xs text-small text-text-muted">
                    {adjustment.reason}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>
    </AdminShellPage>
  );
}
