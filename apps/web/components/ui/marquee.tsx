"use client";

import { Fragment, type ReactNode } from "react";

import { useLoopPause } from "@/hooks/use-loop-pause";
import { cn } from "@/lib/cn";

/**
 * Continuous marquee (DESIGN.md §5.3): two copies in a flex track, CSS `scout-marquee` 40s linear infinite,
 * edges faded with a mask. Pauses on hover, when off-screen and when the tab is hidden; static under
 * prefers-reduced-motion (rules live in styles/tokens.css).
 */
export function Marquee({ items, separator = "·", className }: { items: ReactNode[]; separator?: ReactNode; className?: string }) {
  const ref = useLoopPause<HTMLDivElement>();
  const copy = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center gap-3 pr-3" aria-hidden={hidden || undefined}>
      {items.map((item, i) => (
        <Fragment key={i}>
          <li className="whitespace-nowrap">{item}</li>
          <li aria-hidden className="text-surface-4">
            {separator}
          </li>
        </Fragment>
      ))}
    </ul>
  );
  return (
    <div
      ref={ref}
      className={cn(
        "group/marquee relative overflow-hidden font-mono text-mono-micro uppercase tracking-widest [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]",
        className,
      )}
    >
      <div className="flex w-max animate-marquee group-hover/marquee:[animation-play-state:paused]">
        {copy(false)}
        {copy(true)}
      </div>
    </div>
  );
}
