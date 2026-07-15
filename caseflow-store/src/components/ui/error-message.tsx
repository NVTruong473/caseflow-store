import * as React from "react";

import { cn } from "@/lib/utils/cn";

export interface ErrorMessageProps
  extends React.HTMLAttributes<HTMLParagraphElement> {
  children?: React.ReactNode;
}

export const ErrorMessage = React.forwardRef<
  HTMLParagraphElement,
  ErrorMessageProps
>(({ children, className, role = "alert", ...props }, ref) => {
  if (!children) {
    return null;
  }

  return (
    <p
      ref={ref}
      role={role}
      className={cn(
        "flex min-w-0 items-start gap-2 text-small font-medium text-error",
        className,
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-error text-[11px] leading-none"
      >
        !
      </span>
      <span className="min-w-0">{children}</span>
    </p>
  );
});

ErrorMessage.displayName = "ErrorMessage";
