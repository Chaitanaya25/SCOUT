import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

/** Filter chip: mono-micro, instant colour swap. `active` shows the selected state. */
export function Chip({
  active = false,
  icon,
  className,
  children,
  type = "button",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean; icon?: ReactNode }) {
  return (
    <button
      type={type}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-1 font-mono text-mono-micro",
        active ? "bg-surface-3 text-text-strong hover:bg-surface-bright" : "bg-surface-2 text-muted hover:text-text",
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}
