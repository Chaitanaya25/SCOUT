"use client";

import { useNow } from "@/hooks/use-now";
import { cn } from "@/lib/cn";
import { formatCountdown, msUntilNextScan } from "@/lib/scan-schedule";

/** `● NEXT SCAN  HH:MM:SS` — countdown to the next 3-hour scan (approximate; GitHub cron can be delayed). */
export function NextScan({ collapsed = false, className }: { collapsed?: boolean; className?: string }) {
  const now = useNow(1000);
  const text = now === 0 ? "--:--:--" : formatCountdown(msUntilNextScan(new Date(now)));
  return (
    <div className={cn("flex items-center justify-between px-2 py-1 font-mono text-mono-micro text-muted", collapsed && "justify-center px-0", className)} title={`Next scan in ${text}`}>
      <span className="flex items-center gap-1.5">
        <span className="size-1.5 rounded-full bg-accent-tint" aria-hidden />
        {collapsed ? <span className="sr-only">NEXT SCAN</span> : <span>NEXT SCAN</span>}
      </span>
      {collapsed ? null : <span className="text-text-strong">{text}</span>}
    </div>
  );
}
