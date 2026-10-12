"use client";

import * as m from "motion/react-m";

import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/cn";
import { ease } from "@/lib/motion";
import type { Tone } from "@/lib/score";

const fillClass: Record<Tone, string> = {
  accent: "bg-accent",
  tint: "bg-accent-tint",
  info: "bg-info",
  warning: "bg-warning",
  danger: "bg-danger",
  muted: "bg-surface-bright",
};

/** Progress / breakdown bar. Fill animates scaleX 0 → value (origin left, 600ms). */
export function ProgressBar({
  value,
  tone = "accent",
  size = "sm",
  delay = 0,
  label,
  trackClassName,
  className,
}: {
  value: number;
  tone?: Tone;
  size?: "sm" | "md";
  delay?: number;
  label?: string;
  trackClassName?: string;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped)}
      aria-label={label}
      className={cn("w-full overflow-hidden rounded-full bg-surface-3", size === "sm" ? "h-1" : "h-1.5", trackClassName, className)}
    >
      <m.div
        className={cn("h-full origin-left rounded-full", fillClass[tone])}
        initial={{ scaleX: reduced ? clamped / 100 : 0 }}
        animate={{ scaleX: clamped / 100 }}
        transition={{ duration: reduced ? 0 : 0.6, ease: ease.out, delay: reduced ? 0 : delay }}
      />
    </div>
  );
}
