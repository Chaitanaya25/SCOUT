import type { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  padding?: "none" | "sm" | "md" | "lg";
  /** Hover swaps to --surface-2 (instant colour step, DESIGN.md §3). */
  interactive?: boolean;
  /** 1px hairline — only the Tracker uses borders (DESIGN.md §4.5). */
  bordered?: boolean;
};

const paddings = { none: "", sm: "p-3", md: "p-4", lg: "p-6" } as const;

export function Card({ padding = "md", interactive = false, bordered = false, className, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg bg-surface shadow-card",
        paddings[padding],
        interactive && "cursor-pointer hover:bg-surface-2",
        bordered && "border border-surface-3",
        className,
      )}
      {...rest}
    />
  );
}
