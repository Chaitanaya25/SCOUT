"use client";

import * as m from "motion/react-m";

import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/cn";
import { ease } from "@/lib/motion";

const BAR = 3;
const GAP = 2;

/** 7–12 thin vertical bars (3px wide, 2px gap), last bar full strength. Bars grow scaleY 0 → 1, staggered 20ms. */
export function Sparkline({ values, height = 24, className, label }: { values: number[]; height?: number; className?: string; label?: string }) {
  const reduced = useReducedMotion();
  const max = Math.max(1, ...values);
  const width = values.length * (BAR + GAP) - GAP;
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("shrink-0", className)}
      role="img"
      aria-label={label ?? `Trend: ${values.join(", ")}`}
    >
      {values.map((v, i) => {
        const h = Math.max(2, (v / max) * height);
        const last = i === values.length - 1;
        return (
          <m.rect
            key={i}
            x={i * (BAR + GAP)}
            y={height - h}
            width={BAR}
            height={h}
            rx={1}
            className="fill-accent-tint"
            fillOpacity={last ? 1 : 0.8}
            style={{ originY: 1 }}
            initial={{ scaleY: reduced ? 1 : 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: reduced ? 0 : 0.4, ease: ease.out, delay: reduced ? 0 : i * 0.02 }}
          />
        );
      })}
    </svg>
  );
}
