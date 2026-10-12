import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * Page header (DESIGN.md §3): eyebrow row (dot + mono-micro) or a breadcrumb line, H1, description, actions on the right.
 * Used by Watched, Tracker, Programs (eyebrow) and Settings (breadcrumb). Dashboard and Job Feed have no header in the design.
 */
export function PageHeader({
  title,
  description,
  eyebrow,
  breadcrumb,
  actions,
  rule = false,
  className,
}: {
  title: string;
  description?: ReactNode;
  eyebrow?: string;
  /** Segments of a breadcrumb line; the last segment is accented. */
  breadcrumb?: string[];
  actions?: ReactNode;
  /** 1px bottom rule (Tracker). */
  rule?: boolean;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 pb-6 pt-2 md:flex-row md:items-end md:justify-between",
        rule && "border-b border-surface-3",
        className,
      )}
    >
      <div className="flex max-w-2xl flex-col gap-1.5">
        {eyebrow ? (
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-accent" aria-hidden />
            <span className="font-mono text-mono-micro uppercase tracking-widest text-muted">{eyebrow}</span>
          </div>
        ) : null}
        {breadcrumb ? (
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 font-mono text-mono-micro uppercase tracking-wider text-muted">
            {breadcrumb.map((segment, i) => (
              <span key={segment} className="flex items-center gap-2">
                {i > 0 ? <span aria-hidden>/</span> : null}
                <span className={i === breadcrumb.length - 1 ? "text-accent-fg" : undefined}>{segment}</span>
              </span>
            ))}
          </nav>
        ) : null}
        <h1 className="text-headline-lg text-text-strong">{title}</h1>
        {description ? <p className="text-body-base text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}
