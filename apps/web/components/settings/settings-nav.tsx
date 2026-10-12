import { ArrowLeftRight, Brain, IdCard, RadioTower, SlidersHorizontal, type LucideIcon } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/cn";
import type { SettingsSection } from "@/lib/nav";

// Labels follow the Stitch sub-nav (DESIGN.md §4.7); there is no `API & Webhooks` item.
const ITEMS: { section: SettingsSection; label: string; icon: LucideIcon }[] = [
  { section: "profile", label: "Profile & Identities", icon: IdCard },
  { section: "resume", label: "Resume Intelligence", icon: Brain },
  { section: "preferences", label: "Match Preferences", icon: SlidersHorizontal },
  { section: "telegram", label: "Telegram Dispatch", icon: RadioTower },
  { section: "scan", label: "Scan & Frequencies", icon: ArrowLeftRight },
];

/** Settings sub-nav card (DESIGN.md §4.7). Active item: --surface-3, 4px accent bar, accent icon, `ACTIVE`. */
export function SettingsNav({ active, telegramLinked }: { active: SettingsSection; telegramLinked: boolean }) {
  return (
    <nav aria-label="Settings sections" className="flex flex-col gap-1 rounded-lg bg-surface p-3 shadow-card">
      <div className="px-3 py-2 font-mono text-mono-micro uppercase tracking-widest text-muted">NAVIGATION PROTOCOL</div>
      {ITEMS.map(({ section, label, icon: Icon }) => {
        const isActive = section === active;
        return (
          <Link
            key={section}
            href={`/settings/${section}`}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "group relative flex items-center justify-between gap-2 overflow-hidden rounded-md px-3 py-2.5",
              isActive ? "bg-surface-3 text-text-strong" : "text-secondary hover:bg-surface-2 hover:text-text-strong",
            )}
          >
            {isActive ? <span className="absolute inset-y-0 left-0 w-1 bg-accent" aria-hidden /> : null}
            <span className={cn("flex items-center gap-2.5", isActive && "pl-1")}>
              <Icon size={18} strokeWidth={1.5} className={isActive ? "text-accent-fg" : "text-muted group-hover:text-text-strong"} aria-hidden />
              <span className={cn("text-body-base", isActive && "font-semibold")}>{label}</span>
            </span>
            {isActive ? (
              <span className="font-mono text-mono-micro uppercase text-accent-fg">ACTIVE</span>
            ) : section === "telegram" && !telegramLinked ? (
              <span className="rounded-sm bg-danger-container px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-on-danger-container">UNPAIRED</span>
            ) : section === "scan" ? (
              <span className="font-mono text-mono-micro uppercase text-muted">3H CYCLE</span>
            ) : section === "profile" ? (
              <span className="size-1.5 rounded-full bg-secondary-container" aria-hidden />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
