import { cn } from "@/lib/cn";

/**
 * SCOUT radar glyph: circle + inner ring + crosshair + a 60° accent arc. `spin` rotates the arc (12s/turn,
 * CSS loop — login wordmark only). Static everywhere else (empty states, brand row).
 */
export function RadarMark({ size = 24, spin = false, className }: { size?: number; spin?: boolean; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden className={cn("shrink-0", className)}>
      <circle cx="12" cy="12" r="10" strokeWidth="1.5" className="stroke-outline" />
      <circle cx="12" cy="12" r="5" strokeWidth="1.5" className="stroke-outline" />
      <path d="M12 2v20M2 12h20" strokeWidth="1" className="stroke-outline-variant" />
      <g className={spin ? "animate-logo-sweep" : undefined} style={{ transformOrigin: "12px 12px" }}>
        <path d="M12 12V2a10 10 0 0 1 8.66 5Z" strokeWidth="1" className="fill-accent/25 stroke-accent" />
      </g>
      <circle cx="12" cy="12" r="1.5" className="fill-accent" />
    </svg>
  );
}
