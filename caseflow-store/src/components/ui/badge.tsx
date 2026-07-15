import * as React from "react";

import { cn } from "@/lib/utils/cn";

type BadgeVariant = "neutral" | "primary" | "success" | "warning" | "error";
type BadgeSize = "sm" | "md";

const variantClasses: Record<BadgeVariant, string> = {
  neutral: "border-border bg-surface-muted text-foreground",
  primary: "border-primary bg-primary/10 text-primary",
  success: "border-success bg-success/10 text-success",
  warning: "border-warning bg-warning/10 text-warning",
  error: "border-error bg-error/10 text-error",
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-small",
  md: "px-2.5 py-1 text-small",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    { children, className, size = "sm", variant = "neutral", ...props },
    ref,
  ) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex w-fit items-center rounded-sm border font-medium",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {children}
      </span>
    );
  },
);

Badge.displayName = "Badge";
