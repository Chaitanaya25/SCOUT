"use client";

import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { cn } from "@/lib/cn";
import { DISCOVER, PIPELINE } from "@/lib/nav";

type Hit = { id: string; label: string; sub: string; href: string };
type Results = { jobs: Hit[]; companies: Hit[]; programs: Hit[] };

const EMPTY: Results = { jobs: [], companies: [], programs: [] };

const PAGES: Hit[] = [
  ...DISCOVER.map((n) => ({ id: n.href, label: n.label, sub: "Page", href: n.href })),
  ...PIPELINE.map((n) => ({ id: n.href, label: n.label, sub: "Page", href: n.href })),
  { id: "settings-profile", label: "Settings · Profile", sub: "Page", href: "/settings/profile" },
  { id: "settings-resume", label: "Settings · Resume", sub: "Page", href: "/settings/resume" },
  { id: "settings-preferences", label: "Settings · Preferences", sub: "Page", href: "/settings/preferences" },
  { id: "settings-telegram", label: "Settings · Telegram", sub: "Page", href: "/settings/telegram" },
  { id: "settings-scan", label: "Settings · Scan Settings", sub: "Page", href: "/settings/scan" },
];

const groupClass =
  "px-2 py-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-mono-micro [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted";
const itemClass =
  "flex cursor-pointer items-center justify-between gap-3 rounded-md px-2 py-2 text-body-base text-text data-[selected=true]:bg-surface-3 data-[selected=true]:text-text-strong";

/** ⌘K palette: pages (static) plus this profile's jobs, watched companies and programs (via /api/search). */
export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Results>(EMPTY);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  useEffect(() => {
    const q = query.trim();
    if (!open || q.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: controller.signal, cache: "no-store" });
        if (res.ok) setResults((await res.json()) as Results);
      } catch {
        /* aborted or offline: keep previous results */
      }
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, open]);

  const q = query.trim().toLowerCase();
  const pages = q ? PAGES.filter((p) => p.label.toLowerCase().includes(q)) : PAGES;
  const remote = q.length >= 2 ? results : EMPTY;

  function go(href: string) {
    onOpenChange(false);
    setQuery("");
    router.push(href);
  }

  const renderGroup = (heading: string, hits: Hit[]) =>
    hits.length ? (
      <Command.Group heading={heading} className={groupClass}>
        {hits.map((h) => (
          <Command.Item key={`${heading}-${h.id}`} value={`${heading}-${h.id}`} onSelect={() => go(h.href)} className={itemClass}>
            <span className="truncate">{h.label}</span>
            <span className="shrink-0 font-mono text-mono-micro text-muted">{h.sub}</span>
          </Command.Item>
        ))}
      </Command.Group>
    ) : null;

  return (
    <Command.Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setQuery("");
      }}
      label="Search SCOUT"
      shouldFilter={false}
      overlayClassName="fixed inset-0 z-50 bg-bg/70"
      contentClassName="fixed left-1/2 top-24 z-50 w-[min(560px,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-lg bg-surface shadow-raised"
    >
      <Command.Input
        value={query}
        onValueChange={setQuery}
        placeholder="Search jobs, companies, programs, pages…"
        className={cn("h-12 w-full bg-surface-lowest px-4 text-body-base text-text placeholder:text-muted focus:outline-none")}
      />
      <Command.List className="max-h-80 overflow-y-auto p-1">
        <Command.Empty className="px-4 py-6 text-center text-body-sm text-muted">No results.</Command.Empty>
        {renderGroup("Pages", pages)}
        {renderGroup("Jobs", remote.jobs)}
        {renderGroup("Watched companies", remote.companies)}
        {renderGroup("Programs", remote.programs)}
      </Command.List>
    </Command.Dialog>
  );
}
