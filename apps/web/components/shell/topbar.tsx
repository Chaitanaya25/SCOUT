"use client";

import { Bell, Menu, Search, Send } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Avatar } from "@/components/ui/avatar";
import { Kbd } from "@/components/ui/kbd";
import { cn } from "@/lib/cn";
import { breadcrumbFor } from "@/lib/nav";

import { CommandPalette } from "./command-palette";
import { ScanStatusPill, type ScanRunData } from "./scan-status-pill";

function AvatarMenu({ displayName, avatarUrl }: { displayName: string; avatarUrl: string | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-haspopup="menu" aria-expanded={open} aria-label="Account menu" className="relative block rounded-full">
        <Avatar name={displayName} src={avatarUrl} size={32} />
        <span className="absolute bottom-0 right-0 size-2 rounded-full bg-accent-tint ring-2 ring-surface-lowest" aria-hidden />
      </button>
      <div
        role="menu"
        className={cn(
          "absolute right-0 top-full mt-2 w-44 rounded-lg bg-surface p-1 shadow-raised transition-opacity duration-150",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        aria-hidden={!open}
      >
        <div className="px-2 py-1.5 font-mono text-mono-micro uppercase tracking-wider text-muted">{displayName}</div>
        <button type="button" role="menuitem" tabIndex={open ? 0 : -1} onClick={signOut} className="w-full rounded-md px-2 py-1.5 text-left text-body-sm text-text hover:bg-surface-3">
          Sign out
        </button>
      </div>
    </div>
  );
}

/** Topbar (DESIGN.md §2.2): breadcrumb, ⌘K search, scan pill, Telegram pill, bell, avatar. No theme toggle (it's in the sidebar). */
export function Topbar({
  leftOffset,
  showMenuButton,
  onMenu,
  displayName,
  avatarUrl,
  telegramLinked,
  initialRun,
  serverNow,
}: {
  leftOffset: number;
  showMenuButton: boolean;
  onMenu: () => void;
  displayName: string;
  avatarUrl: string | null;
  telegramLinked: boolean;
  initialRun: ScanRunData;
  serverNow: number;
}) {
  const pathname = usePathname();
  const crumbs = breadcrumbFor(pathname);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header
      className="fixed right-0 top-0 z-40 flex h-16 items-center justify-between gap-3 bg-surface-lowest/80 px-4 backdrop-blur-xl md:px-6"
      style={{ left: leftOffset }}
    >
      <div className="flex min-w-0 items-center gap-3">
        {showMenuButton ? (
          <button type="button" onClick={onMenu} aria-label="Open navigation" className="rounded-md p-1.5 text-muted hover:bg-surface-3 hover:text-text">
            <Menu size={20} strokeWidth={1.5} />
          </button>
        ) : null}
        <nav aria-label="Breadcrumb" className="hidden items-center gap-2 whitespace-nowrap font-mono uppercase sm:flex">
          <span className="text-mono-micro tracking-wider text-muted">SCOUT RADAR</span>
          {crumbs.map((c, i) => (
            <span key={c} className="flex items-center gap-2">
              <span className="text-mono-micro text-muted" aria-hidden>
                /
              </span>
              <span className={cn("text-mono-label", i === crumbs.length - 1 ? "text-text-strong" : "text-muted")}>{c}</span>
            </span>
          ))}
        </nav>
      </div>

      <button
        type="button"
        onClick={() => setSearchOpen(true)}
        aria-label="Search"
        className="flex items-center gap-2 rounded-md bg-surface text-muted hover:bg-surface-2 max-lg:p-2 lg:w-[380px] lg:px-4 lg:py-1.5"
      >
        <Search size={16} strokeWidth={1.5} aria-hidden />
        <span className="hidden flex-1 text-left text-body-sm lg:block">Quick search jobs, companies, tags...</span>
        <Kbd className="hidden lg:inline">⌘K</Kbd>
      </button>
      <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} />

      <div className="flex items-center gap-3">
        <div className="hidden md:block">
          <ScanStatusPill initialRun={initialRun} serverNow={serverNow} />
        </div>
        <Link
          href="/settings/telegram"
          className="hidden items-center gap-1 whitespace-nowrap rounded-sm bg-surface px-2 py-1 font-mono text-mono-micro text-text hover:bg-surface-2 lg:flex"
          title={telegramLinked ? "Telegram is linked" : "Telegram is not linked yet"}
        >
          <Send size={14} strokeWidth={1.5} className={telegramLinked ? "text-accent-tint" : "text-muted"} aria-hidden />
          {telegramLinked ? "Telegram Active" : "Telegram not linked"}
        </Link>
        <button type="button" aria-label="Notifications (none yet)" title="No notifications yet" className="rounded-md p-1 text-muted hover:bg-surface-2 hover:text-text">
          <Bell size={20} strokeWidth={1.5} />
        </button>
        <AvatarMenu displayName={displayName} avatarUrl={avatarUrl} />
      </div>
    </header>
  );
}
