"use client";

import { useEffect, useRef } from "react";

import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { pad } from "@/lib/format";
import { dur } from "@/lib/motion";

function format(n: number, padTo: number): string {
  return padTo > 0 ? pad(n, padTo) : String(Math.round(n));
}

/**
 * KPI number: counts 0 → value over 900ms once per mount. Text is written straight to the DOM node
 * (no React state per frame); under reduced motion the final value is shown immediately.
 */
export function CountUp({
  value,
  padTo = 0,
  duration = dur.count,
  className,
}: {
  value: number;
  padTo?: number;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduced || duration <= 0) {
      el.textContent = format(value, padTo);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / (duration * 1000));
      el.textContent = format(value * (1 - Math.pow(1 - t, 4)), padTo);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, padTo, duration, reduced]);

  return (
    <span ref={ref} className={className}>
      {format(value, padTo)}
    </span>
  );
}
