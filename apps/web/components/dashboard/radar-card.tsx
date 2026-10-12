"use client";

import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";

import { Radar, type RadarBlip } from "@/components/radar/radar";

const NARROW = "(max-width: 420px)";
function subscribeNarrow(cb: () => void) {
  const mq = window.matchMedia(NARROW);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

/** Radar card (DESIGN §4.2): top bar, scope with real blips (best matches near the centre), readout strip. */
export function RadarCard({
  blips,
  greetingLine,
  sector,
  sourcesActive,
  scannedToday,
  passed,
}: {
  blips: RadarBlip[];
  greetingLine: string;
  sector: string;
  sourcesActive: number;
  scannedToday: number;
  passed: number;
}) {
  const router = useRouter();
  const narrow = useSyncExternalStore(subscribeNarrow, () => window.matchMedia(NARROW).matches, () => false);
  const size = narrow ? 272 : 340;
  return (
    <div className="relative flex flex-col justify-between overflow-hidden rounded-lg bg-surface p-6 shadow-raised lg:col-span-7">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(var(--text-strong)_1px,transparent_1px)] bg-size-[24px_24px] opacity-[0.03]" aria-hidden />
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="size-2 animate-live-ping rounded-full bg-accent" aria-hidden />
          <span className="font-mono text-mono-micro uppercase tracking-widest text-text">TARGET RADAR CORE</span>
          <span className="font-mono text-mono-micro text-outline-variant">/</span>
          <span className="truncate font-mono text-mono-micro uppercase text-muted">SECTOR: {sector}</span>
        </div>
        <span className="flex items-center gap-2 rounded-pill bg-surface-2 px-2.5 py-1">
          <span className="size-1.5 rounded-full bg-accent-tint" aria-hidden />
          <span className="font-mono text-mono-micro font-bold tracking-wider text-accent-tint">LIVE TELEMETRY</span>
        </span>
      </div>
      <p className="relative z-10 mt-2 font-mono text-mono-micro uppercase tracking-widest text-secondary">{greetingLine}</p>

      <div className="relative z-10 my-4 flex items-center justify-center py-4">
        <Radar blips={blips} size={size} onBlipClick={(b) => router.push(`/jobs?job=${encodeURIComponent(b.id)}`)} />
      </div>

      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 pt-2">
        <div className="flex items-center gap-2 rounded-md bg-surface-2 px-3 py-1.5">
          <span className="font-mono text-mono-micro uppercase tracking-wider text-muted">CENTER FREQ:</span>
          <span className="font-mono text-mono-label font-semibold uppercase text-accent-fg">
            3H · {sourcesActive} {sourcesActive === 1 ? "SOURCE" : "SOURCES"} ACTIVE
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-baseline gap-1.5">
            <span className="font-mono text-mono-metric font-semibold text-text-strong">{scannedToday.toLocaleString("en-IN")}</span>
            <span className="font-mono text-mono-micro text-muted">SCANNED TODAY</span>
          </span>
          <span className="text-surface-4" aria-hidden>
            /
          </span>
          <span className="flex items-baseline gap-1.5">
            <span className="font-mono text-mono-metric font-semibold text-accent-fg">{passed}</span>
            <span className="font-mono text-mono-micro text-muted">MATCHES PASSED CRITERIA</span>
          </span>
        </div>
      </div>
    </div>
  );
}
