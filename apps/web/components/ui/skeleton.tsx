import type { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

/** Block with a single transform-only shimmer sweep (CSS, 1.4s). */
export function Skeleton({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn(
        "skeleton relative overflow-hidden rounded-md bg-surface-2 before:absolute before:inset-0 before:-translate-x-full before:bg-linear-to-r before:from-transparent before:via-surface-3 before:to-transparent before:content-[''] before:animate-[scout-shimmer_1.4s_ease-in-out_infinite]",
        className,
      )}
      {...rest}
    />
  );
}
