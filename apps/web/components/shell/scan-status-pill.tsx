"use client";

import { useEffect, useRef, useState } from "react";

import { useNow } from "@/hooks/use-now";
import { cn } from "@/lib/cn";
import { scanPillState } from "@/lib/scan-schedule";

export type ScanRunData = {
  id?: string;
  status: string;
  started_at: string;
  finished_at: string | null;
  sources: unknown[];
} | null;

const RUNNING_POLL_MS = 5000;
const IDLE_POLL_MS = 60_000;

/**
 * Topbar scan pill. Polls /api/scan/status every 5s while a run is `running`, every 60s otherwise.
 * Dot: accent (pulsing) while running, success when idle, danger when the last run failed.
 */
export function ScanStatusPill({ initialRun, serverNow }: { initialRun: ScanRunData; serverNow: number }) {
  const [run, setRun] = useState<ScanRunData>(initialRun);
  const initialStatus = useRef(initialRun?.status);
  const now = useNow(30_000);

  useEffect(() => {
    let stopped = false;
    let delay = initialStatus.current === "running" ? RUNNING_POLL_MS : IDLE_POLL_MS;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const tick = async () => {
      try {
        const res = await fetch("/api/scan/status", { cache: "no-store" });
        if (res.ok) {
          const body = (await res.json()) as { run: ScanRunData };
          if (!stopped) setRun(body.run);
          delay = body.run?.status === "running" ? RUNNING_POLL_MS : IDLE_POLL_MS;
        }
      } catch {
        /* keep the last known state and try again */
      }
      if (!stopped) timer = setTimeout(tick, delay);
    };
    timer = setTimeout(tick, delay);
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    };
  }, []);

  const state = scanPillState(run, run?.sources.length ?? 0, new Date(now || serverNow));

  return (
    <div className="flex items-center gap-1.5 whitespace-nowrap rounded-sm bg-surface px-2 py-1 font-mono text-mono-micro text-text" role="status" aria-live="polite">
      <span
        className={cn(
          "size-1.5 rounded-full",
          state.kind === "running" && "animate-live-pulse bg-accent-tint",
          state.kind === "idle" && "bg-success",
          state.kind === "failed" && "bg-danger",
          state.kind === "none" && "bg-surface-4",
        )}
        aria-hidden
      />
      {state.kind === "running" ? (
        <span>
          Scanning {state.sources || ""} {state.sources === 1 ? "source" : "sources"}
          <span aria-hidden>
            {[0, 1, 2].map((i) => (
              <span key={i} className="animate-scan-dots" style={{ animationDelay: `${i * 200}ms` }}>
                .
              </span>
            ))}
          </span>
        </span>
      ) : state.kind === "none" ? (
        <span className="text-muted">No scans yet</span>
      ) : (
        <span className={state.kind === "failed" ? "text-danger" : undefined}>{state.label}</span>
      )}
    </div>
  );
}
