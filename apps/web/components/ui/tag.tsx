import type { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

/** Meta tag: tech stack, location, job type. */
export function Tag({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn("inline-flex items-center rounded-sm bg-surface-3 px-2 py-0.5 font-mono text-mono-micro text-muted", className)}
      {...rest}
    />
  );
}
