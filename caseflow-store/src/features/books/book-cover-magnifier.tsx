"use client";

import Image from "next/image";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";

import { cn } from "@/lib/utils/cn";

type LensPosition = {
  height: number;
  width: number;
  x: number;
  y: number;
};

type BookCoverMagnifierProps = {
  alt: string;
  className?: string;
  priority?: boolean;
  sizes: string;
  src: string;
};

const LENS_SIZE_PX = 112;
const ZOOM = 2.15;

export function BookCoverMagnifier({
  alt,
  className,
  priority = false,
  sizes,
  src,
}: BookCoverMagnifierProps) {
  const rootRef = useRef<HTMLElement>(null);
  const [lens, setLens] = useState<LensPosition | null>(null);

  useEffect(() => {
    rootRef.current?.setAttribute("data-origin-magnifier-ready", "true");
  }, []);

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (
      event.pointerType === "touch" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setLens(null);
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();

    setLens({
      height: bounds.height,
      width: bounds.width,
      x: clamp(event.clientX - bounds.left, 0, bounds.width),
      y: clamp(event.clientY - bounds.top, 0, bounds.height),
    });
  }

  const lensStyle = lens
    ? ({
        backgroundImage: `url("${src}")`,
        backgroundPosition: `${-(lens.x * ZOOM - LENS_SIZE_PX / 2)}px ${
          -(lens.y * ZOOM - LENS_SIZE_PX / 2)
        }px`,
        backgroundSize: `${lens.width * ZOOM}px ${lens.height * ZOOM}px`,
        height: LENS_SIZE_PX,
        left: lens.x - LENS_SIZE_PX / 2,
        top: lens.y - LENS_SIZE_PX / 2,
        width: LENS_SIZE_PX,
      } satisfies CSSProperties)
    : undefined;

  return (
    <figure
      className={cn("min-w-0", className)}
      data-origin-effect="image-magnifier"
      data-origin-magnifier-active={lens ? "true" : "false"}
      data-origin-magnifier-ready="false"
      ref={rootRef}
    >
      <div
        className="case-book-cover-object case-origin-magnifier-surface relative aspect-[2/3] overflow-hidden rounded-sm border border-border p-1"
        data-origin-magnifier-surface
        onPointerEnter={handlePointerMove}
        onPointerLeave={() => setLens(null)}
        onPointerMove={handlePointerMove}
      >
        <Image
          alt={alt}
          className="object-contain"
          fill
          loading={priority ? "eager" : undefined}
          priority={priority}
          sizes={sizes}
          src={src}
        />
        {lens ? (
          <span
            aria-hidden="true"
            className="case-origin-magnifier-lens pointer-events-none absolute z-10 rounded-full border-2 border-surface"
            style={lensStyle}
          />
        ) : null}
      </div>
    </figure>
  );
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}
