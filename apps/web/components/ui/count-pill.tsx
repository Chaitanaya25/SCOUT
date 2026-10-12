import { cn } from "@/lib/cn";

/** `3 OPEN ROLES` / `1 OPEN ROLE` / `NO OPENINGS` (PRD C5). `highlight` = has new roles (accent fill). */
export function CountPill({ count, highlight = false, className }: { count: number; highlight?: boolean; className?: string }) {
  const empty = count <= 0;
  const label = empty ? "NO OPENINGS" : `${count} OPEN ROLE${count === 1 ? "" : "S"}`;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 font-mono text-mono-label font-bold uppercase",
        empty ? "bg-surface-3 font-medium text-muted" : highlight ? "bg-accent text-accent-ink" : "bg-surface-3 font-medium text-text",
        className,
      )}
    >
      {highlight && !empty ? <span className="size-1.5 rounded-full bg-accent-ink" aria-hidden /> : null}
      {label}
    </span>
  );
}
