"use client";

import { useState, type ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

type SwitchProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange" | "role" | "aria-checked"> & {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  /** Required: describes what the switch controls (e.g. "Toggle instant alerts"). */
  "aria-label": string;
};

/** 36×20 switch. Track colour swaps instantly; only the knob animates (transform). */
export function Switch({ checked, defaultChecked = false, onCheckedChange, disabled, className, ...rest }: SwitchProps) {
  const [inner, setInner] = useState(defaultChecked);
  const on = checked ?? inner;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={() => {
        if (checked === undefined) setInner(!on);
        onCheckedChange?.(!on);
      }}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-pill p-0.5 disabled:opacity-50",
        on ? "bg-accent" : "bg-surface-4",
        className,
      )}
      {...rest}
    >
      <span className={cn("block size-4 rounded-full transition-transform duration-150", on ? "translate-x-4 bg-accent-ink" : "translate-x-0 bg-muted")} />
    </button>
  );
}
