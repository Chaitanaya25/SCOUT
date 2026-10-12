"use client";

import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/ui/empty-state";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { useShellLayout } from "@/hooks/use-breakpoint";
import { sendJson } from "@/lib/client-api";
import { filtersToParams, type FeedFilters } from "@/lib/feed-params";
import type { MatchCard } from "@/lib/match-view";
import { dur, ease, spring } from "@/lib/motion";

import { FilterHub } from "./filter-hub";
import { Inspector } from "./inspector";
import { JobCard, type CardActions } from "./job-card";

const VIRTUALIZE_AFTER = 60;

export type FeedInitial = {
  items: MatchCard[];
  total: number;
  counts: { all: number; internship: number; full_time: number };
  filters: FeedFilters;
  gradYear: number | null;
};

/**
 * Job Feed client (DESIGN §4.3): URL-driven filters, infinite scroll by 30 (virtualised after 60 rows),
 * inspector inline at ≥ 1280px and as an overlay sheet below. `?job=<id>` selects; ←/→ move; Esc closes.
 */
export function JobFeed({ initial }: { initial: FeedInitial }) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const layout = useShellLayout();
  const selectedId = search.get("job");

  const [items, setItems] = useState(initial.items);
  const [total, setTotal] = useState(initial.total);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  // A job opened by URL that is not in the loaded pages (e.g. from the dashboard or a shared link).
  const [extra, setExtra] = useState<MatchCard | null>(null);

  const filterKey = filtersToParams(initial.filters).toString();
  const [seenKey, setSeenKey] = useState(filterKey);
  if (seenKey !== filterKey) {
    // New server render for new filters: reset the list (render-time state reset, no effect needed).
    setSeenKey(filterKey);
    setItems(initial.items);
    setTotal(initial.total);
    setLoadError(null);
  }

  const setUrl = useCallback(
    (filters: FeedFilters, job: string | null) => {
      const qs = filtersToParams(filters, { job }).toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router],
  );

  const select = useCallback((card: MatchCard | null) => setUrl(initial.filters, card?.jobId ?? null), [initial.filters, setUrl]);

  const selected = useMemo(() => items.find((c) => c.jobId === selectedId) ?? (extra?.jobId === selectedId ? extra : null), [items, extra, selectedId]);

  // Load a URL-selected job that is not in the list so the inspector can show it.
  useEffect(() => {
    if (!selectedId || items.some((c) => c.jobId === selectedId) || extra?.jobId === selectedId) return;
    const ctrl = new AbortController();
    fetch(`/api/jobs/${encodeURIComponent(selectedId)}`, { signal: ctrl.signal, cache: "no-store" })
      .then(async (r) => (r.ok ? setExtra(((await r.json()) as { match: MatchCard }).match) : toast.error("That job is no longer in your feed.")))
      .catch(() => undefined);
    return () => ctrl.abort();
  }, [selectedId, items, extra]);

  const loadMore = useCallback(async () => {
    if (loadingMore || items.length >= total) return;
    setLoadingMore(true);
    try {
      const qs = filtersToParams(initial.filters, { offset: String(items.length) }).toString();
      const res = await fetch(`/api/jobs?${qs}`, { cache: "no-store" });
      const body = (await res.json()) as { items?: MatchCard[]; total?: number; error?: string };
      if (!res.ok || !body.items) throw new Error(body.error ?? "Could not load more jobs.");
      setItems((prev) => {
        const seen = new Set(prev.map((p) => p.matchId));
        return [...prev, ...body.items!.filter((i) => !seen.has(i.matchId))];
      });
      setTotal(body.total ?? total);
      setLoadError(null);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Could not load more jobs.");
    } finally {
      setLoadingMore(false);
    }
  }, [initial.filters, items.length, loadingMore, total]);

  // Infinite scroll sentinel.
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el || loadError) return;
    const io = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && void loadMore(), { rootMargin: "800px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [loadMore, loadError]);

  const patchStatus = useCallback(
    async (card: MatchCard, status: "saved" | "skipped" | "applied" | "new") => {
      const before = items;
      setItems((prev) => (status === "skipped" ? prev.filter((c) => c.matchId !== card.matchId) : prev.map((c) => (c.matchId === card.matchId ? { ...c, status } : c))));
      if (extra?.matchId === card.matchId) setExtra({ ...extra, status });
      if (status === "skipped") setTotal((t) => Math.max(0, t - 1));
      const res = await sendJson(`/api/matches/${card.matchId}`, "PATCH", { status });
      return { res, before };
    },
    [items, extra],
  );

  const actions: CardActions = useMemo(
    () => ({
      onSelect: (c) => select(c),
      onSave: async (c) => {
        const next = c.status === "saved" ? "new" : "saved";
        const { res, before } = await patchStatus(c, next);
        if (!res.ok) {
          setItems(before);
          return void toast.error(res.error);
        }
        toast.success(next === "saved" ? "Saved to your tracker" : "Removed from saved");
      },
      onSkip: async (c) => {
        const { res, before } = await patchStatus(c, "skipped");
        if (!res.ok) {
          setItems(before);
          setTotal((t) => t + 1);
          return void toast.error(res.error);
        }
        if (selectedId === c.jobId) select(null);
        toast("Skipped", { action: { label: "Undo", onClick: () => void patchStatus(c, "new").then(({ res: r }) => (r.ok ? router.refresh() : toast.error(r.error))) } });
      },
      onApply: (c) => {
        window.open(c.applyUrl, "_blank", "noopener,noreferrer");
        toast("Mark as applied?", {
          description: `${c.title} · ${c.company}`,
          duration: 10_000,
          action: {
            label: "Mark applied",
            onClick: () =>
              void patchStatus(c, "applied").then(({ res, before }) => {
                if (res.ok) toast.success("Marked as applied. It is in your tracker.");
                else {
                  setItems(before);
                  toast.error(res.error);
                }
              }),
          },
        });
      },
    }),
    [patchStatus, router, select, selectedId],
  );

  const markApplied = useCallback(
    async (c: MatchCard) => {
      const { res, before } = await patchStatus(c, "applied");
      if (res.ok) toast.success("Marked as applied. It is in your tracker.");
      else {
        setItems(before);
        toast.error(res.error);
      }
    },
    [patchStatus],
  );

  // Keyboard: ←/→ previous/next job, Esc closes (ignored while typing).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      if (!selected) return;
      if (e.key === "Escape") return select(null);
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const idx = items.findIndex((c) => c.jobId === selected.jobId);
      const next = items[idx + (e.key === "ArrowRight" ? 1 : -1)];
      if (next) {
        e.preventDefault();
        select(next);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [items, select, selected]);

  const inline = layout === "full";

  return (
    <div className="flex items-start gap-6">
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <FilterHub filters={initial.filters} counts={initial.counts} gradYear={initial.gradYear} onChange={(f) => setUrl(f, null)} />
        <div className="flex items-center justify-between gap-2 px-1 font-mono text-mono-micro uppercase tracking-wider">
          <span className="text-muted" aria-live="polite">
            Displaying {total} priority telemetry {total === 1 ? "dispatch" : "dispatches"}
          </span>
          {selected ? <span className="text-accent-fg">1 Active In Right Inspector</span> : null}
        </div>

        {items.length === 0 ? (
          <EmptyState title="No jobs match these filters" description="Turn off a filter or reset them. New matches arrive with every scan." />
        ) : items.length > VIRTUALIZE_AFTER ? (
          <VirtualList items={items} selectedId={selectedId} gradYear={initial.gradYear} actions={actions} />
        ) : (
          <ul className="flex flex-col gap-4">
            <AnimatePresence mode="popLayout" initial={false}>
              {items.map((card, i) => (
                <m.li
                  key={card.matchId}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0, transition: { duration: dur.slow, ease: ease.out, delay: Math.min(i, 8) * 0.04 } }}
                  exit={{ opacity: 0, transition: { duration: dur.fast } }}
                >
                  <JobCard card={card} index={i} selected={card.jobId === selectedId} gradYear={initial.gradYear} actions={actions} />
                </m.li>
              ))}
            </AnimatePresence>
          </ul>
        )}

        <div ref={sentinel} className="h-px" aria-hidden />
        {loadingMore ? <p className="py-4 text-center font-mono text-mono-micro uppercase text-muted">Loading more…</p> : null}
        {loadError ? (
          <div className="flex items-center justify-center gap-3 py-4 text-body-sm text-danger">
            {loadError}
            <button type="button" className="rounded-md bg-surface-3 px-3 py-1 text-text hover:bg-surface-4" onClick={() => void loadMore()}>
              Retry
            </button>
          </div>
        ) : null}
        {!loadingMore && items.length > 0 && items.length >= total ? <p className="py-4 text-center font-mono text-mono-micro uppercase text-muted">End of feed · {total} jobs</p> : null}
      </div>

      {inline ? (
        <aside className="sticky top-20 hidden h-[calc(100vh-6rem)] w-[520px] shrink-0 xl:block">
          {selected ? (
            <m.div key={selected.jobId} className="h-full" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: dur.fast } }}>
              <Inspector card={selected} variant="inline" onClose={() => select(null)} onApply={actions.onApply} onApplied={markApplied} />
            </m.div>
          ) : (
            <div className="flex h-full items-center justify-center rounded-lg bg-surface p-8 text-center shadow-card">
              <p className="max-w-xs text-body-sm text-muted">Select a job to inspect its match, tailor your resume and find referrals. Use ← → to move between jobs.</p>
            </div>
          )}
        </aside>
      ) : (
        <AnimatePresence>{selected ? <OverlaySheet key="sheet" card={selected} onClose={() => select(null)} onApply={actions.onApply} onApplied={markApplied} /> : null}</AnimatePresence>
      )}
    </div>
  );
}

function OverlaySheet({ card, onClose, onApply, onApplied }: { card: MatchCard; onClose: () => void; onApply: (c: MatchCard) => void; onApplied: (c: MatchCard) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, true, onClose);
  return (
    <div className="fixed inset-0 z-50">
      <m.button type="button" aria-label="Close details" className="absolute inset-0 bg-black" initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} onClick={onClose} />
      <m.div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={`${card.title} at ${card.company}`}
        className="absolute inset-y-0 right-0 w-full max-w-[520px]"
        initial={{ x: "100%" }}
        animate={{ x: 0, transition: spring.drawer }}
        exit={{ x: "100%", transition: { duration: dur.base, ease: ease.inOut } }}
      >
        <Inspector card={card} variant="overlay" onClose={onClose} onApply={onApply} onApplied={onApplied} />
      </m.div>
    </div>
  );
}

function VirtualList({ items, selectedId, gradYear, actions }: { items: MatchCard[]; selectedId: string | null; gradYear: number | null; actions: CardActions }) {
  const listRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    const update = () => setOffset((listRef.current?.getBoundingClientRect().top ?? 0) + window.scrollY);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  const v = useWindowVirtualizer({ count: items.length, estimateSize: () => 220, overscan: 6, scrollMargin: offset, gap: 16 });
  return (
    <div ref={listRef} style={{ height: v.getTotalSize(), position: "relative" }}>
      {v.getVirtualItems().map((row) => {
        const card = items[row.index];
        return (
          <div key={card.matchId} data-index={row.index} ref={v.measureElement} className="absolute inset-x-0 top-0" style={{ transform: `translateY(${row.start - v.options.scrollMargin}px)` }}>
            <JobCard card={card} index={row.index} selected={card.jobId === selectedId} gradYear={gradYear} actions={actions} />
          </div>
        );
      })}
    </div>
  );
}

