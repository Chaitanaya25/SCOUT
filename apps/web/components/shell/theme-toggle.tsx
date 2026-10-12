"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { useIsClient } from "@/hooks/use-is-client";
import { cn } from "@/lib/cn";

/** Dark/light pill that lives beside Settings in the sidebar (DESIGN.md §2.1). The active mode's icon is accented. */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const client = useIsClient();
  const dark = client ? resolvedTheme !== "light" : true;
  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      className={cn("flex items-center gap-1 rounded-sm bg-surface-2 px-1.5 py-0.5 hover:bg-surface-3", className)}
    >
      <Moon size={13} strokeWidth={1.5} className={dark ? "text-accent-tint" : "text-muted"} aria-hidden />
      <Sun size={13} strokeWidth={1.5} className={dark ? "text-muted" : "text-accent-tint"} aria-hidden />
    </button>
  );
}
