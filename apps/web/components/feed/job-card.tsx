"use client";

import { ArrowRight, ArrowUpRight, BadgeCheck, Bookmark, Check, CircleAlert, ShieldX, TriangleAlert, X } from "lucide-react";
import type { KeyboardEvent } from "react";

import { CompanyLogo } from "@/components/ui/company-logo";
import { FreshBadge } from "@/components/ui/fresh-badge";
import { MatchRing } from "@/components/ui/match-ring";
import { cn } from "@/lib/cn";
import type { MatchCard } from "@/lib/match-view";

export type CardActions = {
  onSelect: (card: MatchCard) => void;
  onSave: (card: MatchCard) => void;
  onSkip: (card: MatchCard) => void;
  onApply: (card: MatchCard) => void;
};

const btn = "inline-flex h-7 items-center gap-1 rounded-md px-2.5 text-body-sm font-medium transition-transform duration-150 active:scale-[0.97]";

/** Job Feed card (DESIGN §4.3). Selected: accent ring + 6px left bar. Scam (only when Hide Scam is off): danger variant. */
export function JobCard({ card, selected, gradYear, index, actions }: { card: MatchCard; selected: boolean; gradYear: number | null; index: number } & { actions: CardActions }) {
  const scam = card.scamRisk === "high";
  const saved = card.status === "saved";
  const onKey = (e: KeyboardEvent<HTMLElement>) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      actions.onSelect(card);
    }
  };

  return (
    <article
      tabIndex={0}
      onClick={() => actions.onSelect(card)}
      onKeyDown={onKey}
      aria-label={`${card.title} at ${card.company}`}
      aria-current={selected ? "true" : undefined}
      className={cn(
        "group relative cursor-pointer overflow-hidden rounded-lg shadow-card outline-none focus-visible:ring-2 focus-visible:ring-accent-tint",
        scam ? "bg-linear-to-br from-danger-container/20 to-surface" : "bg-surface hover:bg-surface-2",
        selected && "ring-1 ring-accent/40",
      )}
    >
      {selected ? <span className="absolute inset-y-0 left-0 w-1.5 bg-accent" aria-hidden /> : null}
      <div className={cn("flex gap-4 p-4", selected && "pl-6")}>
        {scam ? (
          <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-danger-container/40 text-danger">
            <ShieldX size={22} strokeWidth={1.5} aria-hidden />
          </span>
        ) : (
          <CompanyLogo name={card.company} size={48} tone="strong" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className={cn("font-mono text-mono-label font-bold uppercase tracking-wider", scam ? "text-danger" : "text-text-strong")}>{card.company}</span>
            <span className="font-mono text-mono-micro text-muted">· {card.location}</span>
            {card.fresh && !scam ? <FreshBadge hours={card.hoursOld} /> : null}
            {card.ats ? <span className="rounded-sm bg-surface-2 px-1.5 py-0.5 font-mono text-mono-micro uppercase text-text">{card.ats} ATS</span> : null}
            {scam ? (
              <span className="inline-flex items-center gap-1 rounded-sm bg-danger-container px-1.5 py-0.5 font-mono text-mono-micro font-bold uppercase text-on-danger-container">
                <TriangleAlert size={12} strokeWidth={1.5} aria-hidden /> SCAM / FEE RISK
              </span>
            ) : card.scamRisk === "low" ? (
              <span className="inline-flex items-center gap-1 rounded-sm bg-warning/15 px-1.5 py-0.5 font-mono text-mono-micro font-bold uppercase text-warning" title={card.scamReasons.join(" · ")}>
                <TriangleAlert size={12} strokeWidth={1.5} aria-hidden /> CHECK EMPLOYER
              </span>
            ) : null}
          </div>
          <h3 className={cn("mt-1 truncate text-headline-md", scam ? "text-text-strong/75 line-through" : "text-text-strong")}>{card.title}</h3>
          {scam ? (
            <div className="mt-2 flex gap-2 rounded-md bg-surface-lowest p-3 font-mono text-mono-micro text-danger">
              <CircleAlert size={14} strokeWidth={1.5} className="mt-0.5 shrink-0" aria-hidden />
              <span>{card.scamReasons.length ? card.scamReasons.join(" · ") : "Flagged as a likely scam."}</span>
            </div>
          ) : (
            <div className="mt-1.5 flex flex-col gap-1 font-mono text-mono-micro">
              {card.eligible && gradYear ? (
                <span className="flex items-center gap-1.5 text-accent-hover">
                  <BadgeCheck size={14} strokeWidth={1.5} aria-hidden /> Open to {gradYear} Batch Graduates
                </span>
              ) : !card.eligible ? (
                <span className="flex items-center gap-1.5 text-muted">
                  <CircleAlert size={14} strokeWidth={1.5} aria-hidden /> Not eligible: {card.checks.filter((c) => c.status === "fail").map((c) => c.label).join(", ") || "see details"}
                </span>
              ) : null}
              {card.scored ? (
                card.missingSkills.length === 0 ? (
                  <span className="flex items-center gap-1.5 text-muted">
                    <Check size={14} strokeWidth={2} className="text-accent-fg" aria-hidden /> MISSING: None
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-danger">
                    <TriangleAlert size={14} strokeWidth={1.5} aria-hidden /> MISSING: {card.missingSkills.join(", ")}
                  </span>
                )
              ) : null}
            </div>
          )}
        </div>
        <div className="flex w-16 shrink-0 flex-col items-center gap-1">
          {scam ? (
            <span className="flex size-14 flex-col items-center justify-center rounded-lg bg-danger-container/30 text-danger">
              <span className="text-headline-sm font-bold">0%</span>
              <span className="font-mono text-[9px] uppercase">BLOCKED</span>
            </span>
          ) : card.scored ? (
            <MatchRing score={card.score ?? 0} caption delay={Math.min(index, 8) * 0.04} />
          ) : (
            <span className="mt-2 text-center font-mono text-mono-micro uppercase leading-tight text-muted">Not scored yet</span>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 bg-surface-2/50 px-4 py-2">
        <div className="flex min-w-0 flex-wrap gap-1.5">
          {card.tags.map((t) => (
            <span key={t} className="rounded-sm bg-surface-3 px-2 py-0.5 font-mono text-mono-micro text-muted">
              {t}
            </span>
          ))}
        </div>
        {!scam ? (
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <button type="button" className={cn(btn, saved ? "bg-surface-3 text-accent-fg" : "bg-surface-3 text-text hover:bg-surface-4")} onClick={() => actions.onSave(card)} aria-pressed={saved}>
              <Bookmark size={14} strokeWidth={1.5} className={saved ? "fill-current" : undefined} aria-hidden /> {saved ? "Saved" : "Save"}
            </button>
            {selected ? (
              <>
                <button type="button" className={cn(btn, "bg-surface-3 text-text hover:bg-surface-4")} onClick={() => actions.onSkip(card)}>
                  <X size={14} strokeWidth={1.5} aria-hidden /> Skip
                </button>
                <button type="button" className={cn(btn, "bg-accent font-semibold text-accent-ink hover:bg-accent-hover")} onClick={() => actions.onApply(card)}>
                  Apply <ArrowUpRight size={15} strokeWidth={1.5} aria-hidden />
                </button>
              </>
            ) : (
              <button type="button" className={cn(btn, "bg-surface-4 font-semibold text-text-strong hover:bg-surface-bright")} onClick={() => actions.onSelect(card)}>
                Inspect <ArrowRight size={14} strokeWidth={1.5} aria-hidden />
              </button>
            )}
          </div>
        ) : null}
      </div>
    </article>
  );
}
