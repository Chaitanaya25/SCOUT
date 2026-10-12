"use client";

import { ChevronsLeft, ChevronsRight } from "lucide-react";
import * as m from "motion/react-m";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { RadarMark } from "@/components/ui/radar-mark";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";
import { DISCOVER, isActive, PIPELINE, SETTINGS_ITEM, type NavItem } from "@/lib/nav";
import { spring } from "@/lib/motion";

import { NavGlyph } from "./nav-icons";
import { NextScan } from "./next-scan";
import { ProfileSwitcher, type ShellProfile } from "./profile-switcher";
import { ThemeToggle } from "./theme-toggle";

function NavLink({ item, collapsed, onNavigate }: { item: NavItem; collapsed: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = isActive(item, pathname);
  const link = (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex items-center gap-2 rounded-md px-2 py-1.5 text-body-base",
        collapsed && "justify-center px-0",
        active ? "text-text-strong" : "text-muted hover:bg-surface-3 hover:text-text",
      )}
    >
      {active ? <m.span layoutId="nav-active" className="absolute inset-0 rounded-md bg-surface-3" transition={spring.snappy} /> : null}
      <span className="relative z-10 flex items-center gap-2">
        <NavGlyph name={item.icon} />
        {collapsed ? <span className="sr-only">{item.label}</span> : item.label}
      </span>
    </Link>
  );
  return collapsed ? (
    <Tooltip content={item.label} side="right" className="font-sans text-body-sm">
      {link}
    </Tooltip>
  ) : (
    link
  );
}

function Group({ label, items, collapsed, onNavigate }: { label: string; items: NavItem[]; collapsed: boolean; onNavigate?: () => void }) {
  return (
    <div className="flex flex-col gap-1">
      {collapsed ? <div className="mx-2 my-1 h-px bg-surface-3" aria-hidden /> : <span className="px-2 font-mono text-mono-label uppercase tracking-wider text-muted">{label}</span>}
      <nav aria-label={label} className="flex flex-col gap-0.5">
        {items.map((item) => (
          <NavLink key={item.href} item={item} collapsed={collapsed} onNavigate={onNavigate} />
        ))}
      </nav>
    </div>
  );
}

/** Sidebar (DESIGN.md §2.1): brand, DISCOVER / PIPELINE, Settings + theme toggle, profile switcher, next scan, collapse. */
export function Sidebar({
  collapsed,
  profiles,
  activeSlug,
  version,
  onToggleCollapse,
  onNavigate,
  className,
}: {
  collapsed: boolean;
  profiles: ShellProfile[];
  activeSlug: string;
  version: string;
  /** Omit in the mobile sheet (no collapse control there). */
  onToggleCollapse?: () => void;
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <aside className={cn("flex h-screen select-none flex-col justify-between bg-surface-lowest", className)} aria-label="Sidebar">
      <div className="flex min-h-0 flex-col">
        <div className={cn("flex h-16 items-center gap-2 px-6", collapsed && "justify-center px-0")}>
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface">
            <RadarMark size={20} />
          </span>
          {collapsed ? null : (
            <span className="flex flex-col">
              <span className="text-headline-sm tracking-tight text-text-strong">SCOUT</span>
              <span className="font-mono text-mono-micro tracking-widest text-accent-fg">AI RADAR v{version}</span>
            </span>
          )}
        </div>
        <div className="flex flex-col gap-4 px-4 py-2">
          <Group label="DISCOVER" items={DISCOVER} collapsed={collapsed} onNavigate={onNavigate} />
          <Group label="PIPELINE" items={PIPELINE} collapsed={collapsed} onNavigate={onNavigate} />
        </div>
      </div>

      <div className="flex flex-col gap-2 p-4">
        <div className={cn("flex items-center justify-between gap-1", collapsed && "flex-col")}>
          <div className="min-w-0 flex-1 self-stretch">
            <NavLink item={SETTINGS_ITEM} collapsed={collapsed} onNavigate={onNavigate} />
          </div>
          <ThemeToggle />
        </div>
        <ProfileSwitcher profiles={profiles} activeSlug={activeSlug} collapsed={collapsed} />
        <NextScan collapsed={collapsed} />
        {onToggleCollapse ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="flex items-center justify-center rounded-md py-1 text-muted hover:bg-surface-3 hover:text-text"
          >
            {collapsed ? <ChevronsRight size={16} strokeWidth={1.5} /> : <ChevronsLeft size={16} strokeWidth={1.5} />}
          </button>
        ) : null}
      </div>
    </aside>
  );
}
