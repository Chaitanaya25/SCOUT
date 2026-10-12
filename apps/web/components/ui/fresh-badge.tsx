import { cn } from "@/lib/cn";

/** `FRESH · 2H` for jobs posted < 24h (PRD F1). */
export function FreshBadge({ hours, className }: { hours: number; className?: string }) {
  const h = Math.max(1, Math.round(hours));
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm bg-accent/15 px-1.5 py-0.5 font-mono text-mono-micro font-semibold uppercase text-accent-fg",
        className,
      )}
    >
      FRESH · {h}H
    </span>
  );
}
