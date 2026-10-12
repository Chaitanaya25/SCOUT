import type { InputHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

export const inputClass =
  "h-10 w-full rounded-md bg-surface-2 px-3 text-body-base text-text placeholder:text-outline outline-none focus-visible:ring-2 focus-visible:ring-accent-tint disabled:opacity-50";

export function Field({ label, hint, htmlFor, children, className }: { label: string; hint?: string; htmlFor?: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="font-mono text-mono-label uppercase tracking-wider text-muted">
        {label}
      </label>
      {children}
      {hint ? <p className="text-body-sm text-muted">{hint}</p> : null}
    </div>
  );
}

export function TextInput({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputClass, className)} {...rest} />;
}
