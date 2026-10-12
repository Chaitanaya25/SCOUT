"use client";

import * as m from "motion/react-m";

import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/cn";
import { ease, dur } from "@/lib/motion";
import { ringCaption, scoreTone, type Tone } from "@/lib/score";

const strokeClass: Record<Tone, string> = {
  accent: "stroke-accent",
  info: "stroke-info",
  warning: "stroke-warning",
  danger: "stroke-danger",
  tint: "stroke-accent-tint",
  muted: "stroke-muted",
};

/**
 * Circular match score. The arc animates strokeDashoffset 0 → value (900ms, ease.out); `delay` staggers rings
 * (index × 0.04s). Renders at its final value under prefers-reduced-motion.
 */
export function MatchRing({
  score,
  size = 56,
  caption,
  delay = 0,
  blocked = false,
  className,
}: {
  score: number;
  size?: number;
  /** `true` → auto caption (BEST FIT…); a string → that text; omitted → none. */
  caption?: boolean | string;
  delay?: number;
  /** Scam-blocked job: shows `0% BLOCKED` on a danger tile instead of a ring. */
  blocked?: boolean;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const clamped = Math.min(100, Math.max(0, Math.round(score)));
  const stroke = size >= 48 ? 4 : 3;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const target = circumference * (1 - clamped / 100);
  const tone = scoreTone(clamped);
  const captionText = caption === true ? ringCaption(clamped) : typeof caption === "string" ? caption : null;

  if (blocked) {
    return (
      <div className={cn("flex flex-col items-center", className)}>
        <div
          style={{ width: size, height: size }}
          className="flex flex-col items-center justify-center rounded-full bg-danger-container/30 text-center text-danger"
          role="img"
          aria-label="Blocked: flagged as scam risk"
        >
          <span className="text-headline-sm leading-none">0%</span>
          <span className="font-mono text-[9px] uppercase">BLOCKED</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${clamped} percent match`}>
          <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} className="stroke-surface-3" />
            <m.circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              className={strokeClass[tone]}
              initial={{ strokeDashoffset: reduced ? target : circumference }}
              animate={{ strokeDashoffset: target }}
              transition={{ duration: reduced ? 0 : dur.count, ease: ease.out, delay: reduced ? 0 : delay }}
            />
          </g>
        </svg>
        <span
          className={cn(
            "absolute inset-0 flex items-center justify-center leading-none text-text-strong",
            size >= 48 ? "text-headline-sm" : "font-mono text-mono-micro font-bold",
          )}
        >
          {clamped}
          {size >= 48 ? "%" : ""}
        </span>
      </div>
      {captionText ? (
        <span className={cn("mt-1 font-mono text-mono-micro uppercase", tone === "accent" ? "font-semibold text-accent-fg" : "text-muted")}>
          {captionText}
        </span>
      ) : null}
    </div>
  );
}
