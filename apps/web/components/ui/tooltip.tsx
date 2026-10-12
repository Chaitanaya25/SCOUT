"use client";

import { useId, type ReactNode } from "react";

import { cn } from "@/lib/cn";

/** CSS-only tooltip (opacity fade). Shows on hover and keyboard focus within the wrapper. */
export function Tooltip({
  content,
  children,
  side = "top",
  className,
}: {
  content: ReactNode;
  children: ReactNode;
  side?: "top" | "right" | "bottom";
  className?: string;
}) {
  const id = useId();
  const position =
    side === "top"
      ? "bottom-full left-1/2 mb-1.5 -translate-x-1/2"
      : side === "bottom"
        ? "top-full left-1/2 mt-1.5 -translate-x-1/2"
        : "left-full top-1/2 ml-1.5 -translate-y-1/2";
  return (
    <span className="group/tip relative inline-flex" aria-describedby={id}>
      {children}
      <span
        role="tooltip"
        id={id}
        className={cn(
          "pointer-events-none absolute z-50 w-max max-w-64 rounded-md bg-surface-4 px-2 py-1 font-mono text-mono-micro normal-case tracking-normal text-text-strong opacity-0 shadow-card transition-opacity duration-150 group-focus-within/tip:opacity-100 group-hover/tip:opacity-100",
          position,
          className,
        )}
      >
        {content}
      </span>
    </span>
  );
}
