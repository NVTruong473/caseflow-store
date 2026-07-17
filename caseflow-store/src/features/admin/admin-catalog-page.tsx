"use client";

import * as React from "react";

import { Badge, Button, ErrorMessage, Input } from "@/components/ui";
import type {
  AdminBookEditionApiItem,
  AdminBookWorkOptionApiItem,
} from "@/lib/api/admin-book-catalog";
import type {
  AdminPermission,
  AdminWorkspaceRole,
} from "@/lib/auth/admin";
import { formatVnd } from "@/lib/format/currency";
import type { Language } from "@/lib/i18n/language";
import { cn } from "@/lib/utils/cn";
import {
  BOOK_FORMATS,
  EDITION_LANGUAGES,
  INVENTORY_STATUSES,
  type BookFormat,
  type EditionLanguage,
  type InventoryStatus,
} from "@/types/domain";

import { AdminShellPage } from "./admin-shell-page";

type ApiErrorBody = {
  code: string;
  message: string;
};

type ApiResponse<TData> = {
  data: TData | null;
  error: ApiErrorBody | null;
  meta: Record<string, unknown> | null;
};

type CatalogDraft = {
  compareAtPriceVnd: string;
  displayTitle: string;
  format: BookFormat;
  inventoryStatus: InventoryStatus;
  isActive: boolean;
  isFeatured: boolean;
  language: EditionLanguage;
  localizedTitleEn: string;
  localizedTitleVi: string;
  lowStockThreshold: string;
  priceVnd: string;
  sampleExcerptPolicy: string;
  slug: string;
  stockQuantity: string;
  subtitle: string;
  summaryEn: string;
  summaryVi: string;
  workId: string;
};

type SaveState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

const catalogCopy = {
  en: {
    active: "Active",
    activeState: "Active in storefront",
    badge: "Catalog",
    cancel: "Cancel",
    compareAtPrice: "Compare-at price",
    createNew: "New edition",
    createTitle: "Create book edition",
    deactivate: "Deactivate",
    description:
      "Manage sellable book editions without changing the frozen public catalog contract.",
    displayTitle: "Display title",
    editTitle: "Edit book edition",
    editionSaved: "Book edition saved.",
    featured: "Featured",
    format: "Format",
    inactive: "Inactive",
    inventoryStatus: "Inventory status",
    language: "Language",
    localizedTitleEn: "English title",
    localizedTitleVi: "Vietnamese title",
    lowStockThreshold: "Low-stock threshold",
    metrics: {
      active: "Active editions",
      inactive: "Inactive editions",
      total: "Total editions",
    },
    noResults: "No editions match this search.",
    price: "Price",
    refresh: "Refresh",
    samplePolicy: "Sample/excerpt policy",
    save: "Save edition",
    search: "Search title, slug, author, or category",
    selectEdition: "Select an edition to edit.",
    slug: "Slug",
    stock: "Stock",
    subtitle: "Subtitle",
    summaryEn: "English summary",
    summaryVi: "Vietnamese summary",
    title: "Book catalog management",
    toggleFailed: "Book edition active state could not be changed.",
    updated: "Updated",
    work: "Book work",
  },
  vi: {
    active: "Đang bán",
    activeState: "Hiển thị ở storefront",
    badge: "Danh mục",
    cancel: "Hủy",
    compareAtPrice: "Giá so sánh",
    createNew: "Ấn bản mới",
    createTitle: "Tạo ấn bản sách",
    deactivate: "Ẩn",
    description:
      "Quản lý ấn bản sách có thể bán mà không đổi hợp đồng catalog public đã freeze.",
    displayTitle: "Tên hiển thị",
    editTitle: "Sửa ấn bản sách",
    editionSaved: "Đã lưu ấn bản sách.",
    featured: "Đề xuất",
    format: "Định dạng",
    inactive: "Đã ẩn",
    inventoryStatus: "Trạng thái tồn kho",
    language: "Ngôn ngữ",
    localizedTitleEn: "Tên tiếng Anh",
    localizedTitleVi: "Tên tiếng Việt",
    lowStockThreshold: "Ngưỡng tồn kho thấp",
    metrics: {
      active: "Ấn bản đang bán",
      inactive: "Ấn bản đã ẩn",
      total: "Tổng ấn bản",
    },
    noResults: "Không có ấn bản khớp tìm kiếm.",
    price: "Giá bán",
    refresh: "Tải lại",
    samplePolicy: "Chính sách trích đọc thử",
    save: "Lưu ấn bản",
    search: "Tìm tên, slug, tác giả hoặc danh mục",
    selectEdition: "Chọn một ấn bản để sửa.",
    slug: "Slug",
    stock: "Tồn kho",
    subtitle: "Phụ đề",
    summaryEn: "Tóm tắt tiếng Anh",
    summaryVi: "Tóm tắt tiếng Việt",
    title: "Quản lý catalog sách",
    toggleFailed: "Không thể đổi trạng thái hiển thị ấn bản.",
    updated: "Cập nhật",
    work: "Tác phẩm",
  },
} as const;

export function AdminCatalogPage({
  adminName,
  adminPermissions,
  adminRole,
  initialEditions,
  initialWorkOptions,
  language,
}: {
  adminName: string;
  adminPermissions: AdminPermission[];
  adminRole: AdminWorkspaceRole;
  initialEditions: AdminBookEditionApiItem[];
  initialWorkOptions: AdminBookWorkOptionApiItem[];
  language: Language;
}) {
  const copy = catalogCopy[language];
  const [editions, setEditions] = React.useState(initialEditions);
  const [query, setQuery] = React.useState("");
  const [selectedId, setSelectedId] = React.useState<string | null>(
    initialEditions[0]?.id ?? null,
  );
  const [isCreating, setIsCreating] = React.useState(initialEditions.length === 0);
  const [draft, setDraft] = React.useState<CatalogDraft>(() =>
    initialEditions[0]
      ? draftFromEdition(initialEditions[0])
      : createEmptyDraft(initialWorkOptions[0]?.id ?? ""),
  );
  const [saveState, setSaveState] = React.useState<SaveState>({
    status: "idle",
  });

  const filteredEditions = React.useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();

    if (!normalizedQuery) {
      return editions;
    }

    return editions.filter((item) =>
      [
        item.edition.displayTitle,
        item.edition.slug,
        item.authors.map((author) => author.name).join(" "),
        item.categories.map((category) => category.labels.en).join(" "),
        item.categories.map((category) => category.labels.vi).join(" "),
      ]
        .join(" ")
        .toLocaleLowerCase()
        .includes(normalizedQuery),
    );
  }, [editions, query]);

  const activeCount = editions.filter((item) => item.edition.isActive).length;
  const inactiveCount = editions.length - activeCount;
  const metrics = [
    { label: copy.metrics.total, value: String(editions.length) },
    { label: copy.metrics.active, value: String(activeCount) },
    { label: copy.metrics.inactive, value: String(inactiveCount) },
  ];

  const selectEdition = (item: AdminBookEditionApiItem) => {
    setSelectedId(item.id);
    setIsCreating(false);
    setDraft(draftFromEdition(item));
    setSaveState({ status: "idle" });
  };

  const startCreate = () => {
    setSelectedId(null);
    setIsCreating(true);
    setDraft(createEmptyDraft(initialWorkOptions[0]?.id ?? ""));
    setSaveState({ status: "idle" });
  };

  const saveEdition = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaveState({ status: "submitting" });

    const response = await fetch(
      isCreating || !selectedId
        ? "/api/admin/books/editions"
        : `/api/admin/books/editions/${selectedId}`,
      {
        body: JSON.stringify(draftToPayload(draft)),
        headers: { "Content-Type": "application/json" },
        method: isCreating || !selectedId ? "POST" : "PATCH",
      },
    );
    const payload = (await response.json()) as ApiResponse<AdminBookEditionApiItem>;

    if (!response.ok || payload.error || !payload.data) {
      setSaveState({
        status: "error",
        message: payload.error?.message ?? "Book edition could not be saved.",
      });
      return;
    }

    const savedEdition = payload.data;

    setEditions((current) => upsertEdition(current, savedEdition));
    setSelectedId(savedEdition.id);
    setIsCreating(false);
    setDraft(draftFromEdition(savedEdition));
    setSaveState({ status: "success", message: copy.editionSaved });
  };

  const toggleActive = async (item: AdminBookEditionApiItem) => {
    setSaveState({ status: "submitting" });
    const response = await fetch(`/api/admin/books/editions/${item.id}`, {
      body: JSON.stringify({ isActive: !item.edition.isActive }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    });
    const payload = (await response.json()) as ApiResponse<AdminBookEditionApiItem>;

    if (!response.ok || payload.error || !payload.data) {
      setSaveState({
        status: "error",
        message: payload.error?.message ?? copy.toggleFailed,
      });
      return;
    }

    const savedEdition = payload.data;

    setEditions((current) => upsertEdition(current, savedEdition));
    setSelectedId(savedEdition.id);
    setDraft(draftFromEdition(savedEdition));
    setSaveState({ status: "success", message: copy.editionSaved });
  };

  return (
    <AdminShellPage
      active="catalog"
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
        data-admin-catalog-page
      >
        <div className="min-w-0 rounded-lg border border-border bg-surface p-case-lg">
          <div className="flex flex-col gap-case-sm sm:flex-row sm:items-end sm:justify-between">
            <Input
              label={copy.search}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              data-admin-catalog-search
            />
            <div className="flex gap-case-sm">
              <Button
                type="button"
                variant="secondary"
                onClick={() => window.location.reload()}
              >
                {copy.refresh}
              </Button>
              <Button
                type="button"
                onClick={startCreate}
                data-admin-catalog-new
              >
                {copy.createNew}
              </Button>
            </div>
          </div>

          <div className="mt-case-lg grid gap-case-sm" data-admin-catalog-list>
            {filteredEditions.length > 0 ? (
              filteredEditions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectEdition(item)}
                  className={cn(
                    "rounded-md border p-case-md text-left transition-colors",
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                    selectedId === item.id
                      ? "border-primary bg-surface-muted"
                      : "border-border bg-surface hover:border-primary",
                  )}
                  data-admin-catalog-item={item.edition.slug}
                >
                  <div className="flex flex-col gap-case-sm sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h2 className="text-body font-semibold text-foreground">
                        {item.edition.displayTitle}
                      </h2>
                      <p className="mt-case-xs break-words text-small text-text-muted">
                        {item.edition.slug} · {item.authors.map((author) => author.name).join(", ")}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-case-xs">
                      <Badge variant={item.edition.isActive ? "success" : "neutral"}>
                        {item.edition.isActive ? copy.active : copy.inactive}
                      </Badge>
                      <Badge variant="primary">
                        {formatVnd(item.edition.priceVnd)}
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

        <form
          onSubmit={saveEdition}
          className="rounded-lg border border-border bg-surface p-case-lg"
          data-admin-catalog-form
        >
          <div className="flex flex-col gap-case-sm sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-heading-3 font-semibold text-foreground">
                {isCreating ? copy.createTitle : copy.editTitle}
              </h2>
              <p className="mt-case-xs text-small text-text-muted">
                {selectedId || isCreating ? draft.slug || copy.selectEdition : copy.selectEdition}
              </p>
            </div>
            {selectedId && !isCreating ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  const item = editions.find((edition) => edition.id === selectedId);
                  if (item) void toggleActive(item);
                }}
                data-admin-catalog-toggle
              >
                {draft.isActive ? copy.deactivate : copy.active}
              </Button>
            ) : null}
          </div>

          <div className="mt-case-lg grid gap-case-md">
            <label className="flex flex-col gap-2 text-small font-medium text-foreground">
              {copy.work}
              <select
                className="min-h-11 rounded-md border border-border bg-surface px-3 py-2 text-body text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                value={draft.workId}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    workId: event.target.value,
                  }))
                }
                data-admin-catalog-work
              >
                {initialWorkOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <Input
              label={copy.slug}
              value={draft.slug}
              onChange={(event) =>
                setDraft((current) => ({ ...current, slug: event.target.value }))
              }
              data-admin-catalog-slug
            />
            <Input
              label={copy.displayTitle}
              value={draft.displayTitle}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  displayTitle: event.target.value,
                }))
              }
              data-admin-catalog-display-title
            />
            <Input
              label={copy.localizedTitleEn}
              value={draft.localizedTitleEn}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  localizedTitleEn: event.target.value,
                }))
              }
              data-admin-catalog-localized-en
            />
            <Input
              label={copy.localizedTitleVi}
              value={draft.localizedTitleVi}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  localizedTitleVi: event.target.value,
                }))
              }
              data-admin-catalog-localized-vi
            />
            <Input
              label={copy.subtitle}
              value={draft.subtitle}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  subtitle: event.target.value,
                }))
              }
            />

            <div className="grid gap-case-md sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-small font-medium text-foreground">
                {copy.language}
                <select
                  className="min-h-11 rounded-md border border-border bg-surface px-3 py-2 text-body text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  value={draft.language}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      language: event.target.value as EditionLanguage,
                    }))
                  }
                  data-admin-catalog-language
                >
                  {EDITION_LANGUAGES.map((item) => (
                    <option key={item} value={item}>
                      {item.toUpperCase()}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-2 text-small font-medium text-foreground">
                {copy.format}
                <select
                  className="min-h-11 rounded-md border border-border bg-surface px-3 py-2 text-body text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  value={draft.format}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      format: event.target.value as BookFormat,
                    }))
                  }
                  data-admin-catalog-format
                >
                  {BOOK_FORMATS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-case-md sm:grid-cols-2">
              <Input
                label={copy.price}
                type="number"
                min={0}
                step={1000}
                value={draft.priceVnd}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    priceVnd: event.target.value,
                  }))
                }
                data-admin-catalog-price
              />
              <Input
                label={copy.compareAtPrice}
                type="number"
                min={0}
                step={1000}
                value={draft.compareAtPriceVnd}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    compareAtPriceVnd: event.target.value,
                  }))
                }
              />
            </div>

            <div className="grid gap-case-md sm:grid-cols-2">
              <Input
                label={copy.stock}
                type="number"
                min={0}
                value={draft.stockQuantity}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    stockQuantity: event.target.value,
                  }))
                }
                data-admin-catalog-stock
              />
              <Input
                label={copy.lowStockThreshold}
                type="number"
                min={0}
                value={draft.lowStockThreshold}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    lowStockThreshold: event.target.value,
                  }))
                }
              />
            </div>

            <label className="flex flex-col gap-2 text-small font-medium text-foreground">
              {copy.inventoryStatus}
              <select
                className="min-h-11 rounded-md border border-border bg-surface px-3 py-2 text-body text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                value={draft.inventoryStatus}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    inventoryStatus: event.target.value as InventoryStatus,
                  }))
                }
                data-admin-catalog-inventory-status
              >
                {INVENTORY_STATUSES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <TextAreaField
              label={copy.summaryEn}
              value={draft.summaryEn}
              onChange={(value) =>
                setDraft((current) => ({ ...current, summaryEn: value }))
              }
              dataAttr="data-admin-catalog-summary-en"
            />
            <TextAreaField
              label={copy.summaryVi}
              value={draft.summaryVi}
              onChange={(value) =>
                setDraft((current) => ({ ...current, summaryVi: value }))
              }
              dataAttr="data-admin-catalog-summary-vi"
            />
            <Input
              label={copy.samplePolicy}
              value={draft.sampleExcerptPolicy}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  sampleExcerptPolicy: event.target.value,
                }))
              }
            />

            <div className="grid gap-case-sm sm:grid-cols-2">
              <CheckboxField
                checked={draft.isActive}
                label={copy.activeState}
                onChange={(checked) =>
                  setDraft((current) => ({ ...current, isActive: checked }))
                }
                dataAttr="data-admin-catalog-active"
              />
              <CheckboxField
                checked={draft.isFeatured}
                label={copy.featured}
                onChange={(checked) =>
                  setDraft((current) => ({ ...current, isFeatured: checked }))
                }
                dataAttr="data-admin-catalog-featured"
              />
            </div>
          </div>

          <div className="mt-case-lg flex flex-col gap-case-sm sm:flex-row sm:items-center">
            <Button
              type="submit"
              isLoading={saveState.status === "submitting"}
              data-admin-catalog-save
            >
              {copy.save}
            </Button>
            {isCreating ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  const item = editions.find((edition) => edition.id === selectedId);
                  if (item) selectEdition(item);
                }}
              >
                {copy.cancel}
              </Button>
            ) : null}
          </div>

          {saveState.status === "success" ? (
            <p
              className="mt-case-md rounded-md border border-success bg-success/10 p-case-sm text-small font-medium text-success"
              data-admin-catalog-save-state="success"
            >
              {saveState.message}
            </p>
          ) : null}
          {saveState.status === "error" ? (
            <ErrorMessage
              className="mt-case-md"
              data-admin-catalog-save-state="error"
            >
              {saveState.message}
            </ErrorMessage>
          ) : null}
        </form>
      </section>
    </AdminShellPage>
  );
}

function TextAreaField({
  dataAttr,
  label,
  onChange,
  value,
}: {
  dataAttr?: string;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  const id = React.useId();

  return (
    <label htmlFor={id} className="flex flex-col gap-2 text-small font-medium text-foreground">
      {label}
      <textarea
        id={id}
        rows={4}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-28 rounded-md border border-border bg-surface px-3 py-2 text-body text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        {...(dataAttr ? { [dataAttr]: true } : {})}
      />
    </label>
  );
}

function CheckboxField({
  checked,
  dataAttr,
  label,
  onChange,
}: {
  checked: boolean;
  dataAttr?: string;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex min-h-11 items-center gap-case-sm rounded-md border border-border bg-surface px-3 py-2 text-small font-medium text-foreground">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-primary"
        {...(dataAttr ? { [dataAttr]: true } : {})}
      />
      {label}
    </label>
  );
}

function draftFromEdition(item: AdminBookEditionApiItem): CatalogDraft {
  return {
    compareAtPriceVnd:
      item.edition.compareAtPriceVnd === null
        ? ""
        : String(item.edition.compareAtPriceVnd),
    displayTitle: item.edition.displayTitle,
    format: item.edition.format,
    inventoryStatus: item.edition.inventoryStatus,
    isActive: item.edition.isActive,
    isFeatured: item.edition.isFeatured,
    language: item.edition.language,
    localizedTitleEn: item.edition.localizedDisplayTitle.en ?? "",
    localizedTitleVi: item.edition.localizedDisplayTitle.vi ?? "",
    lowStockThreshold: String(item.edition.lowStockThreshold),
    priceVnd: String(item.edition.priceVnd),
    sampleExcerptPolicy: item.edition.sampleExcerptPolicy ?? "",
    slug: item.edition.slug,
    stockQuantity: String(item.edition.stockQuantity),
    subtitle: item.edition.subtitle ?? "",
    summaryEn: item.edition.summary.en,
    summaryVi: item.edition.summary.vi,
    workId: item.edition.workId,
  };
}

function createEmptyDraft(workId: string): CatalogDraft {
  return {
    compareAtPriceVnd: "",
    displayTitle: "",
    format: "paperback",
    inventoryStatus: "in-stock",
    isActive: true,
    isFeatured: false,
    language: "en",
    localizedTitleEn: "",
    localizedTitleVi: "",
    lowStockThreshold: "2",
    priceVnd: "199000",
    sampleExcerptPolicy: "No excerpt is displayed for this managed edition.",
    slug: "",
    stockQuantity: "5",
    subtitle: "",
    summaryEn: "Internal bookstore summary for this managed edition.",
    summaryVi: "Tom tat noi bo cho an ban sach duoc quan ly nay.",
    workId,
  };
}

function draftToPayload(draft: CatalogDraft) {
  return {
    compareAtPriceVnd: draft.compareAtPriceVnd
      ? Number(draft.compareAtPriceVnd)
      : null,
    displayTitle: draft.displayTitle,
    format: draft.format,
    inventoryStatus: draft.inventoryStatus,
    isActive: draft.isActive,
    isFeatured: draft.isFeatured,
    language: draft.language,
    localizedDisplayTitle: {
      ...(draft.localizedTitleEn.trim()
        ? { en: draft.localizedTitleEn.trim() }
        : {}),
      ...(draft.localizedTitleVi.trim()
        ? { vi: draft.localizedTitleVi.trim() }
        : {}),
    },
    lowStockThreshold: Number(draft.lowStockThreshold),
    priceVnd: Number(draft.priceVnd),
    sampleExcerptPolicy: draft.sampleExcerptPolicy.trim() || null,
    slug: draft.slug,
    stockQuantity: Number(draft.stockQuantity),
    subtitle: draft.subtitle.trim() || null,
    summary: {
      en: draft.summaryEn,
      vi: draft.summaryVi,
    },
    workId: draft.workId,
  };
}

function upsertEdition(
  current: AdminBookEditionApiItem[],
  next: AdminBookEditionApiItem,
) {
  const index = current.findIndex((item) => item.id === next.id);

  if (index === -1) {
    return [next, ...current];
  }

  return current.map((item) => (item.id === next.id ? next : item));
}
