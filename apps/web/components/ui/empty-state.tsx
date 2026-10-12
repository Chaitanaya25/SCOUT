import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

import { RadarMark } from "./radar-mark";

/** One specific line, one action (DESIGN.md §8). Static radar glyph. */
export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center gap-3 rounded-lg bg-surface px-6 py-12 text-center shadow-card", className)}>
      <RadarMark size={40} />
      <h3 className="text-headline-sm text-text-strong">{title}</h3>
      {description ? <p className="max-w-sm text-body-base text-muted">{description}</p> : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
