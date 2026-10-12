import { cn } from "@/lib/cn";

/** `+2 NEW` / `NO CHANGE` / `PENDING DIFF` (PRD C5). */
export function DiffPill({ newCount, pending = false, className }: { newCount?: number | null; pending?: boolean; className?: string }) {
  const base = "inline-flex items-center rounded-pill px-2.5 py-1 font-mono text-mono-label uppercase";
  if (pending || newCount == null) {
    return <span className={cn(base, "bg-surface-3 font-medium text-muted", className)}>PENDING DIFF</span>;
  }
  if (newCount > 0) {
    return <span className={cn(base, "bg-accent/10 font-semibold text-accent-fg", className)}>+{newCount} NEW</span>;
  }
  return <span className={cn(base, "bg-surface-3 font-medium text-muted", className)}>NO CHANGE</span>;
}
