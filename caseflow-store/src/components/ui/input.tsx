import * as React from "react";

import { ErrorMessage } from "@/components/ui/error-message";
import { cn } from "@/lib/utils/cn";

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "id"> {
  id?: string;
  label: React.ReactNode;
  error?: React.ReactNode;
  hint?: React.ReactNode;
  wrapperClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      "aria-describedby": ariaDescribedBy,
      "aria-invalid": ariaInvalid,
      className,
      error,
      hint,
      id,
      label,
      wrapperClassName,
      ...props
    },
    ref,
  ) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const hintId = hint ? `${inputId}-hint` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;
    const describedBy = [ariaDescribedBy, hintId, errorId]
      .filter(Boolean)
      .join(" ");

    return (
      <div className={cn("flex w-full flex-col gap-2", wrapperClassName)}>
        <label
          htmlFor={inputId}
          className="text-small font-medium text-foreground"
        >
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          aria-describedby={describedBy || undefined}
          aria-invalid={error ? true : ariaInvalid}
          className={cn(
            "min-h-11 w-full rounded-md border border-border bg-surface px-3 py-2 text-body text-foreground transition-colors",
            "placeholder:text-text-muted",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
            "disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-text-muted disabled:opacity-70",
            error ? "border-2 border-error" : "hover:border-primary",
            className,
          )}
          {...props}
        />
        {hint ? (
          <p id={hintId} className="text-small text-text-muted">
            {hint}
          </p>
        ) : null}
        <ErrorMessage id={errorId}>{error}</ErrorMessage>
      </div>
    );
  },
);

Input.displayName = "Input";
