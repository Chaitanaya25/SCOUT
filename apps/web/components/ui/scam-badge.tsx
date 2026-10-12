import { TriangleAlert } from "lucide-react";

import { cn } from "@/lib/cn";

import { Tooltip } from "./tooltip";

/** `SCAM RISK` badge; the tooltip lists the reasons (PRD F4). Always has text, never colour alone. */
export function ScamBadge({ reasons = [], label = "SCAM RISK", className }: { reasons?: string[]; label?: string; className?: string }) {
  const badge = (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm bg-danger-container px-1.5 py-0.5 font-mono text-mono-micro font-bold uppercase text-on-danger-container",
        className,
      )}
    >
      <TriangleAlert size={12} strokeWidth={1.5} aria-hidden />
      {label}
    </span>
  );
  if (reasons.length === 0) return badge;
  return (
    <Tooltip
      content={
        <ul className="list-disc space-y-0.5 pl-3 text-left">
          {reasons.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      }
    >
      {badge}
    </Tooltip>
  );
}
