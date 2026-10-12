import { cn } from "@/lib/cn";

/** `GREENHOUSE ATS` — mono, uppercase, under/next to the company name. */
export function AtsBadge({ ats, className }: { ats: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-sm bg-surface-2 px-1.5 py-0.5 font-mono text-mono-micro uppercase text-text", className)}>
      {ats} ATS
    </span>
  );
}
