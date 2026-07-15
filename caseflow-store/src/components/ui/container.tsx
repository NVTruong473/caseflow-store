import * as React from "react";

import { cn } from "@/lib/utils/cn";

type ContainerElement = "div" | "main" | "section";
type ContainerMaxWidth = "sm" | "md" | "lg" | "xl" | "full";
type ContainerPadding = "none" | "sm" | "md" | "lg";

const maxWidthClasses: Record<ContainerMaxWidth, string> = {
  sm: "max-w-3xl",
  md: "max-w-5xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
  full: "max-w-none",
};

const paddingClasses: Record<ContainerPadding, string> = {
  none: "",
  sm: "px-4",
  md: "px-4 sm:px-6",
  lg: "px-4 sm:px-6 lg:px-8",
};

export interface ContainerProps extends React.HTMLAttributes<HTMLElement> {
  as?: ContainerElement;
  maxWidth?: ContainerMaxWidth;
  padding?: ContainerPadding;
}

export function Container({
  as: Component = "div",
  className,
  maxWidth = "lg",
  padding = "lg",
  ...props
}: ContainerProps) {
  return (
    <Component
      className={cn(
        "mx-auto w-full min-w-0",
        maxWidthClasses[maxWidth],
        paddingClasses[padding],
        className,
      )}
      {...props}
    />
  );
}
