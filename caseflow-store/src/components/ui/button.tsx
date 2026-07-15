import * as React from "react";

import { cn } from "@/lib/utils/cn";

type ButtonVariant = "primary" | "secondary" | "destructive" | "ghost";
type ButtonSize = "sm" | "md" | "lg" | "icon";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border-primary bg-primary text-surface hover:border-primary-hover hover:bg-primary-hover",
  secondary:
    "border-border bg-surface text-foreground hover:border-primary hover:text-primary",
  destructive:
    "border-error bg-error text-surface hover:border-error hover:bg-error/90",
  ghost:
    "border-transparent bg-transparent text-foreground hover:bg-surface-muted",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-9 px-3 py-2 text-small",
  md: "min-h-11 px-4 py-2 text-body",
  lg: "min-h-12 px-5 py-3 text-body",
  icon: "h-10 w-10 p-0",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      disabled,
      isLoading = false,
      leftIcon,
      rightIcon,
      size = "md",
      type = "button",
      variant = "primary",
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={isLoading || undefined}
        className={cn(
          "inline-flex min-w-0 items-center justify-center gap-2 rounded-md border font-medium transition-colors",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
          "disabled:cursor-not-allowed disabled:opacity-60",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {isLoading ? (
          <span
            aria-hidden="true"
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading ? rightIcon : null}
      </button>
    );
  },
);

Button.displayName = "Button";
