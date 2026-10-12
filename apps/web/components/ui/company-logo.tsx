"use client";

import Image from "next/image";
import { useState } from "react";

import { cn } from "@/lib/cn";
import { monogram } from "@/lib/format";

const sizes = {
  24: "size-6 text-[10px] rounded-sm",
  32: "size-8 text-mono-label rounded-md",
  40: "size-10 text-mono-metric rounded-lg",
  44: "size-11 text-mono-metric rounded-lg",
  48: "size-12 text-headline-sm rounded-lg",
} as const;

const tones = {
  default: "bg-surface-3 text-text-strong",
  strong: "bg-surface-4 text-text-strong",
  accent: "bg-accent text-accent-ink",
  scam: "bg-danger-container/40 text-danger",
  muted: "bg-surface-3 text-muted",
} as const;

/**
 * Company tile: neutral monogram (no brand colours, no emoji — DESIGN.md §4.5). If `src` loads it is shown,
 * otherwise (or on error) the monogram is the fallback.
 */
export function CompanyLogo({
  name,
  src,
  size = 40,
  tone = "default",
  letters = 2,
  className,
}: {
  name: string;
  src?: string | null;
  size?: keyof typeof sizes;
  tone?: keyof typeof tones;
  letters?: 1 | 2;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;
  return (
    <div
      className={cn(
        "relative flex shrink-0 select-none items-center justify-center overflow-hidden font-mono font-bold",
        sizes[size],
        tones[tone],
        className,
      )}
      aria-hidden
    >
      {showImage ? (
        <Image src={src as string} alt="" width={size} height={size} unoptimized loading="lazy" onError={() => setFailed(true)} className="size-full object-cover" />
      ) : (
        monogram(name, letters)
      )}
    </div>
  );
}
