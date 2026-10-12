"use client";

import * as m from "motion/react-m";
import type { KeyboardEvent, ReactNode } from "react";

import { cn } from "@/lib/cn";
import { spring } from "@/lib/motion";

export type TabItem = { value: string; label: ReactNode; count?: number; dot?: boolean };

/**
 * Segmented control with a sliding active background (`layoutId`, spring.snappy).
 * `accent` = filled lime active segment (job-feed type filter); `surface` = --surface-3 (drawer tabs, programs).
 * `layoutId` must be unique per control on the page.
 */
export function Tabs({
  items,
  value,
  onValueChange,
  layoutId,
  variant = "surface",
  ariaLabel,
  className,
}: {
  items: TabItem[];
  value: string;
  onValueChange: (value: string) => void;
  layoutId: string;
  variant?: "accent" | "surface";
  ariaLabel: string;
  className?: string;
}) {
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const idx = items.findIndex((i) => i.value === value);
    const next = items[(idx + (e.key === "ArrowRight" ? 1 : items.length - 1)) % items.length];
    onValueChange(next.value);
    e.preventDefault();
  };

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
      className={cn("inline-flex items-center rounded-md bg-surface-lowest p-0.5", className)}
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onValueChange(item.value)}
            className={cn(
              "relative inline-flex items-center gap-1.5 rounded-md px-3 py-1.5",
              active
                ? variant === "accent"
                  ? "text-headline-sm text-accent-ink"
                  : "font-mono text-mono-label uppercase tracking-wider text-text-strong"
                : "font-mono text-mono-label uppercase tracking-wider text-muted hover:text-text",
            )}
          >
            {active ? (
              <m.span
                layoutId={layoutId}
                className={cn("absolute inset-0 rounded-md", variant === "accent" ? "bg-accent" : "bg-surface-3")}
                transition={spring.snappy}
              />
            ) : null}
            <span className="relative z-10">{item.label}</span>
            {item.count !== undefined ? (
              <span
                className={cn(
                  "relative z-10 rounded-pill px-1.5 font-mono text-mono-micro",
                  active && variant === "accent" ? "bg-accent-ink/20 text-accent-ink" : "bg-surface-2 text-muted",
                )}
              >
                {item.count}
              </span>
            ) : null}
            {item.dot && active ? <span className="relative z-10 size-1.5 rounded-full bg-accent-tint" aria-hidden /> : null}
          </button>
        );
      })}
    </div>
  );
}
