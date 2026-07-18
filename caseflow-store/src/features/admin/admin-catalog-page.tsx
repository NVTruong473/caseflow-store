"use client";

import * as React from "react";

import { Badge, Button, ErrorMessage, Input } from "@/components/ui";
import type {
  AdminBookEditionApiItem,
  AdminBookWorkOptionApiItem,
} from "@/lib/api/admin-book-catalog";
import type { AdminMerchandisingShelfApiItem } from "@/lib/api/admin-merchandising";
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
  reasonToReadEn: string;
  reasonToReadVi: string;
  slug: string;
  stockQuantity: string;
  subtitle: string;
  summaryEn: string;
  summaryVi: string;
  workId: string;
};

type CatalogFilterState = {
  active: "active" | "all" | "inactive";
  cover: "all" | "missing" | "placeholder" | "ready";
  language: "all" | EditionLanguage;
  quality: "all" | "needs-work" | "ready" | "unchecked";
  shelf: "all" | string;
  sourceReview:
    | "all"
    | "approved"
    | "draft"
    | "missing"
    | "needs-review"
    | "rejected";
};

type ShelfDraft = {
  isActive: boolean;
  sortOrder: string;
};

type AdminBadgeVariant = "error" | "neutral" | "primary" | "success" | "warning";

type SaveState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

const defaultFilters: CatalogFilterState = {
  active: "all",
  cover: "all",
  language: "all",
  quality: "all",
  shelf: "all",
  sourceReview: "all",
};

const catalogCopy = {
  en: {
    active: "Active",
    activeState: "Active in storefront",
    badge: "Catalog",
    cancel: "Cancel",
    compareAtPrice: "Compare-at price",
    clearFilters: "Clear filters",
    contentFilters: "Content filters",
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
    filterLabels: {
      active: "Active state",
      cover: "Cover status",
      language: "Language",
      quality: "Completeness",
      shelf: "Shelf membership",
      sourceReview: "Source review",
    },
    filterOptions: {
      active: {
        active: "Active",
        all: "All states",
        inactive: "Inactive",
      },
      all: "All",
      cover: {
        missing: "Missing",
        placeholder: "Placeholder",
        ready: "Ready",
      },
      quality: {
        "needs-work": "Needs work",
        ready: "Ready",
        unchecked: "Unchecked",
      },
      sourceReview: {
        approved: "Approved",
        draft: "Draft",
        missing: "Missing",
        "needs-review": "Needs review",
        rejected: "Rejected",
      },
    },
    inactive: "Inactive",
    inventoryStatus: "Inventory status",
    language: "Language",
    localizedTitleEn: "English title",
    localizedTitleVi: "Vietnamese title",
    lowStockThreshold: "Low-stock threshold",
    metrics: {
      active: "Active editions",
      inactive: "Inactive editions",
      qualityReady: "Quality ready",
      shelfMember: "In shelves",
      sourceApproved: "Source approved",
      total: "Total editions",
    },
    merchandising: {
      active: "Active",
      activeSlots: "active slots",
      description:
        "Control approved shelf visibility and storefront order without editing shelf rules or source data.",
      empty: "No merchandising shelves are configured.",
      error: "Merchandising shelf could not be saved.",
      inactive: "Inactive",
      items: "items",
      save: "Save shelf",
      saved: "Merchandising shelf saved.",
      sortOrder: "Sort order",
      title: "Merchandising operations",
      warnings: "Warnings",
    },
    noResults: "No editions match this search.",
    operationsSummary: {
      cover: "Cover",
      quality: "Quality",
      shelf: "Shelf",
      source: "Source",
      title: "Content operations",
    },
    price: "Price",
    reasonToReadEn: "English reason to read",
    reasonToReadVi: "Vietnamese reason to read",
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
    clearFilters: "Xóa lọc",
    contentFilters: "Bộ lọc nội dung",
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
    filterLabels: {
      active: "Trạng thái hiển thị",
      cover: "Trạng thái bìa",
      language: "Ngôn ngữ",
      quality: "Độ hoàn chỉnh",
      shelf: "Thuộc shelf",
      sourceReview: "Duyệt nguồn",
    },
    filterOptions: {
      active: {
        active: "Đang bán",
        all: "Tất cả trạng thái",
        inactive: "Đã ẩn",
      },
      all: "Tất cả",
      cover: {
        missing: "Thiếu bìa",
        placeholder: "Bìa placeholder",
        ready: "Bìa sẵn sàng",
      },
      quality: {
        "needs-work": "Cần xử lý",
        ready: "Sẵn sàng",
        unchecked: "Chưa kiểm",
      },
      sourceReview: {
        approved: "Đã duyệt",
        draft: "Nháp",
        missing: "Thiếu trạng thái",
        "needs-review": "Cần duyệt",
        rejected: "Từ chối",
      },
    },
    inactive: "Đã ẩn",
    inventoryStatus: "Trạng thái tồn kho",
    language: "Ngôn ngữ",
    localizedTitleEn: "Tên tiếng Anh",
    localizedTitleVi: "Tên tiếng Việt",
    lowStockThreshold: "Ngưỡng tồn kho thấp",
    metrics: {
      active: "Ấn bản đang bán",
      inactive: "Ấn bản đã ẩn",
      qualityReady: "Nội dung sẵn sàng",
      shelfMember: "Có trong shelf",
      sourceApproved: "Nguồn đã duyệt",
      total: "Tổng ấn bản",
    },
    merchandising: {
      active: "Đang bật",
      activeSlots: "slot đang bật",
      description:
        "Điều khiển trạng thái và thứ tự shelf đã duyệt mà không sửa rule hoặc dữ liệu nguồn.",
      empty: "Chưa có shelf merchandising nào.",
      error: "Không thể lưu shelf merchandising.",
      inactive: "Đã tắt",
      items: "sản phẩm",
      save: "Lưu shelf",
      saved: "Đã lưu shelf merchandising.",
      sortOrder: "Thứ tự hiển thị",
      title: "Vận hành merchandising",
      warnings: "Cảnh báo",
    },
    noResults: "Không có ấn bản khớp tìm kiếm.",
    operationsSummary: {
      cover: "Bìa",
      quality: "Chất lượng",
      shelf: "Shelf",
      source: "Nguồn",
      title: "Vận hành nội dung",
    },
    price: "Giá bán",
    reasonToReadEn: "Lý do đọc tiếng Anh",
    reasonToReadVi: "Lý do đọc tiếng Việt",
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

type CatalogCopy = (typeof catalogCopy)[keyof typeof catalogCopy];
type MerchandisingCopy = CatalogCopy["merchandising"];

export function AdminCatalogPage({
  adminName,
  adminPermissions,
  adminRole,
  initialEditions,
  initialMerchandisingShelves,
  initialWorkOptions,
  language,
}: {
  adminName: string;
  adminPermissions: AdminPermission[];
  adminRole: AdminWorkspaceRole;
  initialEditions: AdminBookEditionApiItem[];
  initialMerchandisingShelves: AdminMerchandisingShelfApiItem[];
  initialWorkOptions: AdminBookWorkOptionApiItem[];
  language: Language;
}) {
  const copy = catalogCopy[language];
  const [editions, setEditions] = React.useState(initialEditions);
  const [merchandisingShelves, setMerchandisingShelves] = React.useState(
    initialMerchandisingShelves,
  );
  const [query, setQuery] = React.useState("");
  const [filters, setFilters] =
    React.useState<CatalogFilterState>(defaultFilters);
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
  const [merchandisingDrafts, setMerchandisingDrafts] = React.useState<
    Record<string, ShelfDraft>
  >(() => createShelfDrafts(initialMerchandisingShelves));
  const [merchandisingSaveState, setMerchandisingSaveState] =
    React.useState<SaveState>({
      status: "idle",
    });

  const filteredEditions = React.useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();

    return editions.filter((item) =>
      matchesQuery(item, normalizedQuery) && matchesFilters(item, filters),
    );
  }, [editions, filters, query]);

  const activeCount = editions.filter((item) => item.edition.isActive).length;
  const inactiveCount = editions.length - activeCount;
  const qualityReadyCount = editions.filter(
    (item) => item.operations.contentQuality.state === "ready",
  ).length;
  const sourceApprovedCount = editions.filter(
    (item) => item.edition.sourceReviewStatus === "approved",
  ).length;
  const shelfMemberCount = editions.filter(
    (item) => item.operations.shelfSlugs.length > 0,
  ).length;
  const metrics = [
    { label: copy.metrics.total, value: String(editions.length) },
    { label: copy.metrics.active, value: String(activeCount) },
    { label: copy.metrics.inactive, value: String(inactiveCount) },
    { label: copy.metrics.qualityReady, value: String(qualityReadyCount) },
    { label: copy.metrics.sourceApproved, value: String(sourceApprovedCount) },
    { label: copy.metrics.shelfMember, value: String(shelfMemberCount) },
  ];
  const selectedEdition =
    editions.find((edition) => edition.id === selectedId) ?? null;
  const hasMerchandisingPermission = adminPermissions.includes(
    "merchandising:manage",
  );

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

  const updateShelfDraft = (
    shelfId: string,
    update: Partial<ShelfDraft>,
  ) => {
    setMerchandisingDrafts((current) => ({
      ...current,
      [shelfId]: {
        ...(current[shelfId] ?? { isActive: false, sortOrder: "0" }),
        ...update,
      },
    }));
    setMerchandisingSaveState({ status: "idle" });
  };

  const saveMerchandisingShelf = async (shelfId: string) => {
    const shelfDraft = merchandisingDrafts[shelfId];

    if (!shelfDraft) return;

    setMerchandisingSaveState({ status: "submitting" });
    const response = await fetch("/api/admin/merchandising/shelves", {
      body: JSON.stringify({
        isActive: shelfDraft.isActive,
        shelfId,
        sortOrder: Number(shelfDraft.sortOrder),
      }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    });
    const payload = (await response.json()) as ApiResponse<
      AdminMerchandisingShelfApiItem[]
    >;

    if (!response.ok || payload.error || !payload.data) {
      setMerchandisingSaveState({
        status: "error",
        message: payload.error?.message ?? copy.merchandising.error,
      });
      return;
    }

    setMerchandisingShelves(payload.data);
    setMerchandisingDrafts(createShelfDrafts(payload.data));
    setMerchandisingSaveState({
      status: "success",
      message: copy.merchandising.saved,
    });
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
      <div className="flex flex-col gap-case-lg">
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
            <div className="flex flex-wrap gap-case-sm">
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

          <div
            className="mt-case-md grid gap-case-sm md:grid-cols-2 xl:grid-cols-3"
            data-admin-content-filters
          >
            <SelectField
              label={copy.filterLabels.quality}
              value={filters.quality}
              onChange={(value) =>
                setFilters((current) => ({
                  ...current,
                  quality: value as CatalogFilterState["quality"],
                }))
              }
              dataAttr="data-admin-quality-filter"
              options={[
                { label: copy.filterOptions.all, value: "all" },
                {
                  label: copy.filterOptions.quality.ready,
                  value: "ready",
                },
                {
                  label: copy.filterOptions.quality["needs-work"],
                  value: "needs-work",
                },
                {
                  label: copy.filterOptions.quality.unchecked,
                  value: "unchecked",
                },
              ]}
            />
            <SelectField
              label={copy.filterLabels.sourceReview}
              value={filters.sourceReview}
              onChange={(value) =>
                setFilters((current) => ({
                  ...current,
                  sourceReview:
                    value as CatalogFilterState["sourceReview"],
                }))
              }
              dataAttr="data-admin-source-filter"
              options={[
                { label: copy.filterOptions.all, value: "all" },
                {
                  label: copy.filterOptions.sourceReview.approved,
                  value: "approved",
                },
                {
                  label: copy.filterOptions.sourceReview["needs-review"],
                  value: "needs-review",
                },
                { label: copy.filterOptions.sourceReview.draft, value: "draft" },
                {
                  label: copy.filterOptions.sourceReview.rejected,
                  value: "rejected",
                },
                {
                  label: copy.filterOptions.sourceReview.missing,
                  value: "missing",
                },
              ]}
            />
            <SelectField
              label={copy.filterLabels.cover}
              value={filters.cover}
              onChange={(value) =>
                setFilters((current) => ({
                  ...current,
                  cover: value as CatalogFilterState["cover"],
                }))
              }
              dataAttr="data-admin-cover-filter"
              options={[
                { label: copy.filterOptions.all, value: "all" },
                { label: copy.filterOptions.cover.ready, value: "ready" },
                {
                  label: copy.filterOptions.cover.placeholder,
                  value: "placeholder",
                },
                { label: copy.filterOptions.cover.missing, value: "missing" },
              ]}
            />
            <SelectField
              label={copy.filterLabels.language}
              value={filters.language}
              onChange={(value) =>
                setFilters((current) => ({
                  ...current,
                  language: value as CatalogFilterState["language"],
                }))
              }
              dataAttr="data-admin-language-filter"
              options={[
                { label: copy.filterOptions.all, value: "all" },
                ...EDITION_LANGUAGES.map((item) => ({
                  label: item.toUpperCase(),
                  value: item,
                })),
              ]}
            />
            <SelectField
              label={copy.filterLabels.active}
              value={filters.active}
              onChange={(value) =>
                setFilters((current) => ({
                  ...current,
                  active: value as CatalogFilterState["active"],
                }))
              }
              dataAttr="data-admin-active-filter"
              options={[
                { label: copy.filterOptions.active.all, value: "all" },
                { label: copy.filterOptions.active.active, value: "active" },
                {
                  label: copy.filterOptions.active.inactive,
                  value: "inactive",
                },
              ]}
            />
            <SelectField
              label={copy.filterLabels.shelf}
              value={filters.shelf}
              onChange={(value) =>
                setFilters((current) => ({
                  ...current,
                  shelf: value,
                }))
              }
              dataAttr="data-admin-shelf-filter"
              options={[
                { label: copy.filterOptions.all, value: "all" },
                ...merchandisingShelves.map((shelf) => ({
                  label: shelf.labels[language],
                  value: shelf.slug,
                })),
              ]}
            />
          </div>

          <div className="mt-case-sm">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setQuery("");
                setFilters(defaultFilters);
              }}
            >
              {copy.clearFilters}
            </Button>
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
                      <Badge variant="neutral">
                        {item.edition.language.toUpperCase()}
                      </Badge>
                      <Badge
                        variant={qualityBadgeVariant(
                          item.operations.contentQuality.state,
                        )}
                      >
                        {
                          copy.filterOptions.quality[
                            item.operations.contentQuality.state
                          ]
                        }
                        {" "}
                        {item.operations.contentQuality.qualityScore}%
                      </Badge>
                      <Badge
                        variant={sourceReviewBadgeVariant(
                          item.edition.sourceReviewStatus,
                        )}
                      >
                        {sourceReviewLabel(item, copy)}
                      </Badge>
                      <Badge
                        variant={coverBadgeVariant(item.operations.coverStatus)}
                      >
                        {copy.filterOptions.cover[item.operations.coverStatus]}
                      </Badge>
                      {item.operations.shelfSlugs.length > 0 ? (
                        <Badge variant="primary">
                          {item.operations.shelfSlugs.length} shelf
                        </Badge>
                      ) : null}
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

          {selectedEdition && !isCreating ? (
            <div className="mt-case-md rounded-md border border-border bg-surface-muted p-case-md">
              <h3 className="text-small font-semibold uppercase text-text-muted">
                {copy.operationsSummary.title}
              </h3>
              <dl className="mt-case-sm grid gap-case-sm sm:grid-cols-2">
                <StatusSummaryItem
                  label={copy.operationsSummary.quality}
                  value={`${copy.filterOptions.quality[selectedEdition.operations.contentQuality.state]} - ${selectedEdition.operations.contentQuality.qualityScore}%`}
                />
                <StatusSummaryItem
                  label={copy.operationsSummary.source}
                  value={sourceReviewLabel(selectedEdition, copy)}
                />
                <StatusSummaryItem
                  label={copy.operationsSummary.cover}
                  value={
                    copy.filterOptions.cover[
                      selectedEdition.operations.coverStatus
                    ]
                  }
                />
                <StatusSummaryItem
                  label={copy.operationsSummary.shelf}
                  value={
                    selectedEdition.operations.shelfSlugs.length > 0
                      ? selectedEdition.operations.shelfSlugs.join(", ")
                      : copy.filterOptions.all
                  }
                />
              </dl>
            </div>
          ) : null}

          <div className="mt-case-lg grid gap-case-md">
            <label className="flex min-w-0 flex-col gap-2 text-small font-medium text-foreground">
              {copy.work}
              <select
                className="min-h-11 w-full min-w-0 rounded-md border border-border bg-surface px-3 py-2 text-body text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
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
              <label className="flex min-w-0 flex-col gap-2 text-small font-medium text-foreground">
                {copy.language}
                <select
                  className="min-h-11 w-full min-w-0 rounded-md border border-border bg-surface px-3 py-2 text-body text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
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
              <label className="flex min-w-0 flex-col gap-2 text-small font-medium text-foreground">
                {copy.format}
                <select
                  className="min-h-11 w-full min-w-0 rounded-md border border-border bg-surface px-3 py-2 text-body text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
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

            <label className="flex min-w-0 flex-col gap-2 text-small font-medium text-foreground">
              {copy.inventoryStatus}
              <select
                className="min-h-11 w-full min-w-0 rounded-md border border-border bg-surface px-3 py-2 text-body text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
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
            <TextAreaField
              label={copy.reasonToReadEn}
              value={draft.reasonToReadEn}
              onChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  reasonToReadEn: value,
                }))
              }
              dataAttr="data-admin-catalog-reason-en"
            />
            <TextAreaField
              label={copy.reasonToReadVi}
              value={draft.reasonToReadVi}
              onChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  reasonToReadVi: value,
                }))
              }
              dataAttr="data-admin-catalog-reason-vi"
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

        {hasMerchandisingPermission ? (
          <MerchandisingOperationsPanel
            copy={copy.merchandising}
            drafts={merchandisingDrafts}
            language={language}
            onSave={(shelfId) => void saveMerchandisingShelf(shelfId)}
            onUpdateDraft={updateShelfDraft}
            saveState={merchandisingSaveState}
            shelves={merchandisingShelves}
          />
        ) : null}
      </div>
    </AdminShellPage>
  );
}

function SelectField({
  dataAttr,
  label,
  onChange,
  options,
  value,
}: {
  dataAttr?: string;
  label: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  value: string;
}) {
  const id = React.useId();

  return (
    <label htmlFor={id} className="flex min-w-0 flex-col gap-2 text-small font-medium text-foreground">
      {label}
      <select
        id={id}
        className="min-h-11 w-full min-w-0 rounded-md border border-border bg-surface px-3 py-2 text-body text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        {...(dataAttr ? { [dataAttr]: true } : {})}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function StatusSummaryItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <dt className="text-small text-text-muted">{label}</dt>
      <dd className="mt-1 break-words text-small font-medium text-foreground">
        {value}
      </dd>
    </div>
  );
}

function MerchandisingOperationsPanel({
  copy,
  drafts,
  language,
  onSave,
  onUpdateDraft,
  saveState,
  shelves,
}: {
  copy: MerchandisingCopy;
  drafts: Record<string, ShelfDraft>;
  language: Language;
  onSave: (shelfId: string) => void;
  onUpdateDraft: (shelfId: string, update: Partial<ShelfDraft>) => void;
  saveState: SaveState;
  shelves: AdminMerchandisingShelfApiItem[];
}) {
  return (
    <section
      className="rounded-lg border border-border bg-surface p-case-lg"
      data-admin-merchandising-panel
    >
      <div className="flex flex-col gap-case-sm lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-heading-3 font-semibold text-foreground">
            {copy.title}
          </h2>
          <p className="mt-case-xs max-w-3xl text-small leading-6 text-text-muted">
            {copy.description}
          </p>
        </div>
        {saveState.status === "success" ? (
          <Badge variant="success" data-admin-merchandising-state="success">
            {saveState.message}
          </Badge>
        ) : null}
      </div>

      {saveState.status === "error" ? (
        <ErrorMessage
          className="mt-case-md"
          data-admin-merchandising-state="error"
        >
          {saveState.message}
        </ErrorMessage>
      ) : null}

      <div className="mt-case-lg grid gap-case-sm lg:grid-cols-2">
        {shelves.length > 0 ? (
          shelves.map((shelf) => {
            const draft = drafts[shelf.id] ?? {
              isActive: shelf.isActive,
              sortOrder: String(shelf.sortOrder),
            };

            return (
              <article
                key={shelf.id}
                className="rounded-md border border-border bg-surface-muted p-case-md"
                data-admin-merchandising-shelf={shelf.slug}
              >
                <div className="flex flex-col gap-case-sm sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="text-body font-semibold text-foreground">
                      {shelf.labels[language]}
                    </h3>
                    <p className="mt-case-xs break-words text-small text-text-muted">
                      {shelf.slug} · {shelf.ruleKind} · {shelf.sourceKind}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-case-xs">
                    <Badge variant={shelf.isActive ? "success" : "neutral"}>
                      {shelf.isActive ? copy.active : copy.inactive}
                    </Badge>
                    <Badge variant="primary">
                      {shelf.resolvedEditionCount} {copy.items}
                    </Badge>
                  </div>
                </div>

                <p className="mt-case-sm text-small leading-6 text-text-muted">
                  {shelf.description[language]}
                </p>

                <div className="mt-case-md grid gap-case-sm sm:grid-cols-[minmax(0,1fr)_160px_auto] sm:items-end">
                  <CheckboxField
                    checked={draft.isActive}
                    label={copy.active}
                    onChange={(checked) =>
                      onUpdateDraft(shelf.id, { isActive: checked })
                    }
                    dataAttr="data-admin-merchandising-active"
                  />
                  <Input
                    label={copy.sortOrder}
                    type="number"
                    min={0}
                    value={draft.sortOrder}
                    onChange={(event) =>
                      onUpdateDraft(shelf.id, {
                        sortOrder: event.target.value,
                      })
                    }
                    data-admin-merchandising-sort
                  />
                  <Button
                    type="button"
                    size="sm"
                    isLoading={saveState.status === "submitting"}
                    onClick={() => onSave(shelf.id)}
                    data-admin-merchandising-save={shelf.slug}
                  >
                    {copy.save}
                  </Button>
                </div>

                <div className="mt-case-sm flex flex-wrap gap-case-xs">
                  <Badge variant="neutral">
                    {shelf.activeManualSlotCount}/{shelf.manualSlotCount}{" "}
                    {copy.activeSlots}
                  </Badge>
                  {shelf.usedFallback ? (
                    <Badge variant="warning">fallback</Badge>
                  ) : null}
                  {shelf.warnings.map((warning) => (
                    <Badge key={warning} variant="warning">
                      {copy.warnings}: {warning}
                    </Badge>
                  ))}
                </div>
              </article>
            );
          })
        ) : (
          <p className="rounded-md border border-border bg-surface-muted p-case-md text-body text-text-muted">
            {copy.empty}
          </p>
        )}
      </div>
    </section>
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
    <label htmlFor={id} className="flex min-w-0 flex-col gap-2 text-small font-medium text-foreground">
      {label}
      <textarea
        id={id}
        rows={4}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-28 w-full min-w-0 rounded-md border border-border bg-surface px-3 py-2 text-body text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
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
    reasonToReadEn: item.edition.reasonToRead?.en ?? "",
    reasonToReadVi: item.edition.reasonToRead?.vi ?? "",
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
    reasonToReadEn:
      "A clear fit for readers who want a well-positioned bookstore edition.",
    reasonToReadVi:
      "Phu hop voi doc gia can mot an ban sach duoc gioi thieu ro rang.",
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
    reasonToRead:
      draft.reasonToReadEn.trim() || draft.reasonToReadVi.trim()
        ? {
            en: draft.reasonToReadEn.trim(),
            vi: draft.reasonToReadVi.trim(),
          }
        : null,
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

function matchesQuery(item: AdminBookEditionApiItem, normalizedQuery: string) {
  if (!normalizedQuery) return true;

  return [
    item.edition.displayTitle,
    item.edition.slug,
    item.authors.map((author) => author.name).join(" "),
    item.categories.map((category) => category.labels.en).join(" "),
    item.categories.map((category) => category.labels.vi).join(" "),
    item.operations.shelfSlugs.join(" "),
  ]
    .join(" ")
    .toLocaleLowerCase()
    .includes(normalizedQuery);
}

function matchesFilters(
  item: AdminBookEditionApiItem,
  filters: CatalogFilterState,
) {
  if (
    filters.quality !== "all" &&
    item.operations.contentQuality.state !== filters.quality
  ) {
    return false;
  }

  const sourceReviewStatus = item.edition.sourceReviewStatus ?? "missing";

  if (
    filters.sourceReview !== "all" &&
    sourceReviewStatus !== filters.sourceReview
  ) {
    return false;
  }

  if (
    filters.cover !== "all" &&
    item.operations.coverStatus !== filters.cover
  ) {
    return false;
  }

  if (
    filters.language !== "all" &&
    item.edition.language !== filters.language
  ) {
    return false;
  }

  if (filters.active === "active" && !item.edition.isActive) {
    return false;
  }

  if (filters.active === "inactive" && item.edition.isActive) {
    return false;
  }

  if (
    filters.shelf !== "all" &&
    !item.operations.shelfSlugs.includes(filters.shelf)
  ) {
    return false;
  }

  return true;
}

function qualityBadgeVariant(
  state: AdminBookEditionApiItem["operations"]["contentQuality"]["state"],
): AdminBadgeVariant {
  if (state === "ready") return "success";
  if (state === "needs-work") return "warning";
  return "neutral";
}

function sourceReviewBadgeVariant(
  status: AdminBookEditionApiItem["edition"]["sourceReviewStatus"],
): AdminBadgeVariant {
  if (status === "approved") return "success";
  if (status === "rejected") return "error";
  if (status === "needs-review") return "warning";
  return "neutral";
}

function coverBadgeVariant(
  status: AdminBookEditionApiItem["operations"]["coverStatus"],
): AdminBadgeVariant {
  if (status === "ready") return "success";
  if (status === "placeholder") return "warning";
  return "error";
}

function sourceReviewLabel(
  item: AdminBookEditionApiItem,
  copy: CatalogCopy,
) {
  const status = item.edition.sourceReviewStatus ?? "missing";

  return copy.filterOptions.sourceReview[status];
}

function createShelfDrafts(shelves: AdminMerchandisingShelfApiItem[]) {
  return Object.fromEntries(
    shelves.map((shelf) => [
      shelf.id,
      {
        isActive: shelf.isActive,
        sortOrder: String(shelf.sortOrder),
      },
    ]),
  ) as Record<string, ShelfDraft>;
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
