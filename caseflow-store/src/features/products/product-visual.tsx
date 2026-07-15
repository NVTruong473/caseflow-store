import type { CategorySlug } from "@/types/domain";

export function ProductVisual({ categorySlug }: { categorySlug: CategorySlug }) {
  if (categorySlug === "chargers") {
    return (
      <div className="flex h-full items-center justify-center rounded-md border border-border bg-surface-muted p-case-lg">
        <div className="relative h-28 w-24 rounded-lg border border-border bg-surface shadow-sm">
          <div className="absolute left-1/2 top-[-14px] h-5 w-8 -translate-x-1/2 rounded-sm border border-border bg-surface" />
          <div className="mx-auto mt-9 h-3 w-10 rounded-sm bg-primary" />
          <div className="mx-auto mt-3 h-2 w-8 rounded-sm bg-border" />
        </div>
      </div>
    );
  }

  if (categorySlug === "cables-adapters") {
    return (
      <div className="flex h-full items-center justify-center rounded-md border border-border bg-surface-muted p-case-lg">
        <div className="relative h-28 w-32">
          <div className="absolute left-2 top-11 h-5 w-24 rounded-full border-4 border-primary" />
          <div className="absolute left-0 top-10 h-7 w-7 rounded-sm border border-border bg-surface" />
          <div className="absolute right-0 top-10 h-7 w-7 rounded-sm border border-border bg-surface" />
        </div>
      </div>
    );
  }

  if (categorySlug === "stands-mounts") {
    return (
      <div className="flex h-full items-center justify-center rounded-md border border-border bg-surface-muted p-case-lg">
        <div className="flex flex-col items-center gap-case-sm">
          <div className="h-24 w-20 rounded-lg border border-border bg-surface shadow-sm" />
          <div className="h-2 w-24 rounded-sm bg-primary" />
          <div className="h-2 w-32 rounded-sm bg-border" />
        </div>
      </div>
    );
  }

  if (categorySlug === "screen-protectors") {
    return (
      <div className="flex h-full items-center justify-center rounded-md border border-border bg-surface-muted p-case-lg">
        <div className="h-32 w-20 rounded-lg border-2 border-primary bg-surface/70 shadow-sm">
          <div className="mx-auto mt-3 h-1.5 w-8 rounded-full bg-border" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full items-center justify-center rounded-md border border-border bg-surface-muted p-case-lg">
      <div className="h-32 w-20 rounded-lg border border-border bg-surface shadow-sm">
        <div className="mx-auto mt-3 h-1.5 w-8 rounded-full bg-border" />
        <div className="mx-auto mt-9 h-12 w-12 rounded-lg border border-primary" />
      </div>
    </div>
  );
}
