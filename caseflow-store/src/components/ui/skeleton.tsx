import * as React from "react";

import { cn } from "@/lib/utils/cn";

type SkeletonShape = "block" | "circle";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  shape?: SkeletonShape;
}

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, shape = "block", ...props }, ref) => {
    return (
      <div
        ref={ref}
        aria-hidden="true"
        className={cn(
          "animate-pulse bg-surface-muted",
          shape === "circle" ? "rounded-full" : "rounded-md",
          className,
        )}
        {...props}
      />
    );
  },
);

Skeleton.displayName = "Skeleton";
