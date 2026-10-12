import type { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

export function Kbd({ className, ...rest }: HTMLAttributes<HTMLElement>) {
  return <kbd className={cn("rounded-sm bg-surface-3 px-1 py-0.5 font-mono text-mono-micro text-text", className)} {...rest} />;
}
