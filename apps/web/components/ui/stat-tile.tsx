import type { ReactNode } from "react";

import { cn } from "@/lib/cn";
import type { Tone } from "@/lib/score";

import { CountUp } from "./count-up";
import { ProgressBar } from "./progress-bar";

/**
 * Stat tile (DESIGN.md §3): mono-micro label (+ optional top-right slot), numeral, mono-micro caption,
 * optional 4px bar. `size="display"` is the Dashboard KPI (display-hero); `"headline"` the Watched/Programs tiles.
 */
export function StatTile({
  label,
  value,
  padTo,
  size = "display",
  valueTone,
  caption,
  trailing,
  bar,
  className,
}: {
  label: string;
  value: number | string;
  /** Zero-pad numeric values (`09`). */
  padTo?: number;
  size?: "display" | "headline";
  valueTone?: "accent" | "danger";
  caption?: ReactNode;
  trailing?: ReactNode;
  bar?: { value: number; tone?: Tone };
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col justify-between gap-2 rounded-lg bg-surface p-4 shadow-card hover:bg-surface-2", className)}>
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-mono-micro uppercase tracking-wider text-muted">{label}</span>
        {trailing}
      </div>
      <div className="flex items-baseline justify-between gap-2">
        <span
          className={cn(
            size === "display" ? "text-display-hero" : "text-headline-lg font-bold",
            valueTone === "accent" ? "text-accent-fg" : valueTone === "danger" ? "text-danger" : "text-text-strong",
          )}
        >
          {typeof value === "number" ? <CountUp value={value} padTo={padTo} /> : value}
        </span>
        {caption ? <span className="font-mono text-mono-micro text-muted">{caption}</span> : null}
      </div>
      {bar ? <ProgressBar value={bar.value} tone={bar.tone ?? "accent"} /> : null}
    </div>
  );
}
