"use client";

import { ArrowDownWideNarrow, CircleCheck, RotateCcw, Search, Shield } from "lucide-react";
import { useEffect, useState } from "react";

import { Tabs } from "@/components/ui/tabs";
import { cn } from "@/lib/cn";
import { DEFAULT_FILTERS, type FeedFilters, type FeedType } from "@/lib/feed-params";

const chip = "inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-mono-micro";

function FilterChip({ on, onClick, icon, children }: { on: boolean; onClick: () => void; icon: "check" | "dot" | "shield"; children: React.ReactNode }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick} className={cn(chip, on ? "bg-surface-3 text-text-strong hover:bg-surface-bright" : "bg-surface-2 text-muted hover:text-text")}>
      {icon === "dot" ? (
        <span className={cn("size-2 rounded-full", on ? "bg-accent" : "bg-surface-4")} aria-hidden />
      ) : icon === "shield" ? (
        <Shield size={14} strokeWidth={1.5} className={on ? "text-accent-fg" : undefined} aria-hidden />
      ) : (
        <CircleCheck size={14} strokeWidth={1.5} className={on ? "text-accent-fg" : undefined} aria-hidden />
      )}
      {children}
    </button>
  );
}

/** Sticky filter hub (DESIGN §4.3): type segments with counts, search, sort, filter chips, reset. */
export function FilterHub({ filters, counts, gradYear, onChange }: { filters: FeedFilters; counts: { all: number; internship: number; full_time: number }; gradYear: number | null; onChange: (next: FeedFilters) => void }) {
  const [q, setQ] = useState(filters.q);
  // Debounce typing into the URL.
  useEffect(() => {
    if (q.trim() === filters.q) return;
    const id = window.setTimeout(() => onChange({ ...filters, q: q.trim() }), 350);
    return () => window.clearTimeout(id);
  }, [q, filters, onChange]);

  const set = (patch: Partial<FeedFilters>) => onChange({ ...filters, ...patch });
  const isDefault = JSON.stringify({ ...filters, q: "" }) === JSON.stringify({ ...DEFAULT_FILTERS, q: "" }) && !filters.q;

  return (
    <div className="sticky top-16 z-20 flex flex-col gap-3 rounded-lg bg-surface/95 p-4 shadow-raised backdrop-blur-md">
      <div className="flex flex-wrap items-center gap-3">
        <Tabs
          layoutId="feed-type"
          variant="accent"
          ariaLabel="Job type"
          value={filters.type}
          onValueChange={(v) => set({ type: v as FeedType })}
          items={[
            { value: "all", label: "All", count: counts.all },
            { value: "internship", label: "Internship", count: counts.internship },
            { value: "full_time", label: "Full-time", count: counts.full_time },
          ]}
        />
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Filter by company or keywords</span>
          <Search size={16} strokeWidth={1.5} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter company, keywords, stack..."
            maxLength={60}
            className="h-10 w-full rounded-md bg-surface-lowest pl-9 pr-3 text-body-base text-text placeholder:text-outline outline-none focus-visible:ring-2 focus-visible:ring-accent-tint"
          />
        </label>
        <label className="relative flex items-center">
          <span className="sr-only">Sort</span>
          <ArrowDownWideNarrow size={14} strokeWidth={1.5} className="pointer-events-none absolute left-3 text-muted" aria-hidden />
          <select
            value={filters.sort}
            onChange={(e) => set({ sort: e.target.value === "newest" ? "newest" : "match" })}
            className="h-10 appearance-none rounded-md bg-surface-lowest pl-8 pr-8 font-mono text-mono-label text-text outline-none focus-visible:ring-2 focus-visible:ring-accent-tint"
          >
            <option value="match">Match (High → Low)</option>
            <option value="newest">Newest</option>
          </select>
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <FilterChip icon="check" on={filters.remote} onClick={() => set({ remote: !filters.remote })}>
          Remote Only
        </FilterChip>
        <FilterChip icon="check" on={filters.india} onClick={() => set({ india: !filters.india })}>
          India Hubs
        </FilterChip>
        <FilterChip icon="dot" on={filters.fresh} onClick={() => set({ fresh: !filters.fresh })}>
          Fresh &lt; 24h
        </FilterChip>
        <FilterChip icon="check" on={filters.eligible} onClick={() => set({ eligible: !filters.eligible })}>
          Eligible Only{gradYear ? ` (Batch ${gradYear})` : ""}
        </FilterChip>
        <FilterChip icon="shield" on={filters.hideScam} onClick={() => set({ hideScam: !filters.hideScam })}>
          Hide Scam Risk
        </FilterChip>
        <button
          type="button"
          disabled={isDefault}
          onClick={() => {
            setQ("");
            onChange(DEFAULT_FILTERS);
          }}
          className={cn(chip, "ml-auto bg-surface-2 text-muted hover:text-text disabled:opacity-40")}
        >
          <RotateCcw size={13} strokeWidth={1.5} aria-hidden /> Reset
        </button>
      </div>
    </div>
  );
}
