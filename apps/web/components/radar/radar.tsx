"use client";

import { Radar as RadarIcon } from "lucide-react";
import type { CSSProperties } from "react";

import { useLoopPause } from "@/hooks/use-loop-pause";
import { cn } from "@/lib/cn";
import { blipPosition, blipTone, type BlipTone } from "@/lib/radar";

export type RadarBlip = {
  id: string;
  label: string;
  score: number;
  hoursOld: number;
  /** Score used for the radius only (0–100, higher = nearer the centre); defaults to `score`. */
  position?: number;
};

const REFERENCE = 340;
const DISCS: { diameter: number; className: string }[] = [
  { diameter: 280, className: "bg-surface/40" },
  { diameter: 200, className: "bg-surface-2/30" },
  { diameter: 120, className: "bg-surface-3/40" },
  { diameter: 40, className: "bg-accent/20" },
];

const dotClass: Record<BlipTone, string> = {
  fresh: "size-2.5 bg-accent shadow-[0_0_10px_var(--accent)]",
  recent: "size-2 bg-info shadow-[0_0_4px_var(--info)]",
  older: "size-1.5 bg-secondary",
};

/**
 * Radar scope (DESIGN.md §5.3). The beam is a CSS-rotating element (6s, `will-change: transform` on it only) that
 * pauses off-screen / on hidden tabs and is static under reduced motion. Blips: radius = (100 − score)/100 × R,
 * angle = hash(id). Fresh (< 4h) glow and pulse; hover/focus shows `COMPANY · 96%`.
 */
export function Radar({
  blips,
  size = REFERENCE,
  onBlipClick,
  className,
}: {
  blips: RadarBlip[];
  size?: number;
  onBlipClick?: (blip: RadarBlip) => void;
  className?: string;
}) {
  const ref = useLoopPause<HTMLDivElement>();
  const scale = size / REFERENCE;
  const maxRadius = size / 2 - 14;
  const shown = blips.slice(0, 24);

  return (
    <div
      ref={ref}
      role="group"
      aria-label={`Radar: ${shown.length} recent matches`}
      className={cn("relative shrink-0 overflow-hidden rounded-full bg-surface-lowest shadow-raised", className)}
      style={{ width: size, height: size }}
    >
      <div className="pointer-events-none absolute inset-2 rounded-full opacity-10 bg-[radial-gradient(circle_at_center,transparent_40%,var(--text-strong)_100%)]" />
      {DISCS.map((d) => (
        <div
          key={d.diameter}
          className={cn("pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full", d.className)}
          style={{ width: d.diameter * scale, height: d.diameter * scale }}
        />
      ))}
      <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-outline-variant/40" />
      <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px bg-outline-variant/40" />
      <span className="pointer-events-none absolute left-1/2 top-2 -translate-x-1/2 font-mono text-[9px] text-muted">000° N</span>
      <span className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 font-mono text-[9px] text-muted">180° S</span>
      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 font-mono text-[9px] text-muted">090° E</span>
      <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 font-mono text-[9px] text-muted">270° W</span>

      <div className="pointer-events-none absolute inset-0 animate-radar-beam will-change-transform" aria-hidden>
        <div className="absolute left-0 top-0 h-1/2 w-1/2 rounded-tl-full bg-linear-to-br from-accent/25 via-accent/5 to-transparent" />
        <div className="absolute left-0 top-1/2 h-px w-1/2 bg-accent shadow-[0_0_8px_var(--accent)]" />
      </div>

      {shown.map((blip, i) => {
        const { x, y } = blipPosition(blip.id, blip.position ?? blip.score, maxRadius);
        const tone = blipTone(blip.hoursOld);
        const style: CSSProperties = {
          left: "50%",
          top: "50%",
          transform: `translate(calc(-50% + ${x.toFixed(1)}px), calc(-50% + ${y.toFixed(1)}px))`,
          animationDelay: `${i * 40}ms`,
        };
        return (
          <button
            key={blip.id}
            type="button"
            onClick={() => onBlipClick?.(blip)}
            aria-label={`${blip.label}, ${blip.score} percent match`}
            className="group/blip absolute z-10 flex items-center animate-fade-in"
            style={style}
          >
            <span className={cn("block rounded-full", dotClass[tone], tone === "fresh" && "animate-live-pulse")} />
            <span className="pointer-events-none absolute left-full top-1/2 z-20 ml-1 -translate-y-1/2 whitespace-nowrap rounded-sm bg-surface-4 px-1.5 py-0.5 font-mono text-[9px] uppercase text-text-strong opacity-0 shadow-card transition-opacity duration-150 group-hover/blip:opacity-100 group-focus-visible/blip:opacity-100">
              {blip.label} · {blip.score}%
            </span>
          </button>
        );
      })}

      <div className="absolute left-1/2 top-1/2 z-20 flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-surface-4 text-accent shadow-card">
        <RadarIcon size={16} strokeWidth={1.5} aria-hidden />
      </div>
    </div>
  );
}
