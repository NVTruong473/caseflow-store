import * as React from "react";

import { cn } from "@/lib/utils/cn";

type CardVariant = "default" | "muted" | "interactive";
type CardPadding = "none" | "sm" | "md" | "lg";

const variantClasses: Record<CardVariant, string> = {
  default: "border-border bg-surface",
  muted: "border-border bg-surface-muted",
  interactive:
    "border-border bg-surface transition-colors hover:border-primary",
};

const paddingClasses: Record<CardPadding, string> = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    { className, padding = "md", variant = "default", ...props },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "min-w-0 rounded-lg border",
          variantClasses[variant],
          paddingClasses[padding],
          className,
        )}
        {...props}
      />
    );
  },
);

Card.displayName = "Card";

export const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex min-w-0 flex-col gap-1.5", className)}
    {...props}
  />
));

CardHeader.displayName = "CardHeader";

export const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-heading-3 font-semibold text-foreground", className)}
    {...props}
  />
));

CardTitle.displayName = "CardTitle";

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-small leading-6 text-text-muted", className)}
    {...props}
  />
));

CardDescription.displayName = "CardDescription";

export const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("mt-4 min-w-0", className)} {...props} />
));

CardContent.displayName = "CardContent";

export const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("mt-4 flex min-w-0 items-center gap-3", className)}
    {...props}
  />
));

CardFooter.displayName = "CardFooter";
