"use client";

import Image from "next/image";
import { useState } from "react";

import { cn } from "@/lib/cn";
import { monogram } from "@/lib/format";

const sizes = {
  20: "size-5 text-[9px]",
  32: "size-8 text-mono-label",
  40: "size-10 text-mono-metric",
} as const;

/** Profile avatar: uploaded image when available, otherwise initials. Circular. */
export function Avatar({
  name,
  src,
  size = 32,
  tone = "strong",
  letters = 2,
  className,
}: {
  name: string;
  src?: string | null;
  size?: keyof typeof sizes;
  tone?: "strong" | "accent" | "muted";
  letters?: 1 | 2;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full font-mono font-bold",
        sizes[size],
        tone === "accent" ? "bg-accent text-accent-ink" : tone === "muted" ? "bg-secondary-container text-text" : "bg-surface-4 text-text-strong",
        className,
      )}
      aria-hidden
    >
      {showImage ? (
        <Image src={src as string} alt="" width={size} height={size} unoptimized loading="lazy" onError={() => setFailed(true)} className="size-full object-cover" />
      ) : (
        monogram(name, letters)
      )}
    </span>
  );
}
