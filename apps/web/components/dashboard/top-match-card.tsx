import { ArrowUpRight, Check } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { CompanyLogo } from "@/components/ui/company-logo";
import { cn } from "@/lib/cn";
import { postedLabel, safeHref, type MatchCard } from "@/lib/match-view";
import { scoreTone } from "@/lib/score";

const chipTone = {
  accent: "bg-accent-soft text-accent-fg",
  info: "bg-info/15 text-info",
  warning: "bg-warning/15 text-warning",
  danger: "bg-danger/15 text-danger",
} as const;

/** Dashboard top-match card (DESIGN §4.2 workbench). Click-through opens the job in the feed inspector. */
export function TopMatchCard({ match, gradYear }: { match: MatchCard; gradYear: number | null }) {
  const score = match.score ?? 0;
  const href = safeHref(match.applyUrl);
  return (
    <article className="flex flex-col gap-4 rounded-lg bg-surface p-4 shadow-card hover:bg-surface-2">
      <div className="flex items-start gap-3">
        <CompanyLogo name={match.company} size={40} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-headline-sm text-text-strong">{match.company}</span>
            <span className="rounded-pill bg-surface-3 px-2 py-0.5 font-mono text-mono-micro text-muted">{match.location}</span>
            {match.eligible && gradYear ? (
              <span className="inline-flex items-center gap-1 rounded-pill bg-accent-soft px-2 py-0.5 font-mono text-mono-micro text-accent-fg">
                <Check size={12} strokeWidth={2} aria-hidden /> {gradYear} eligible
              </span>
            ) : null}
          </div>
          <Link href={`/jobs?job=${encodeURIComponent(match.jobId)}`} className="mt-0.5 block truncate text-body-lg font-semibold text-text hover:text-text-strong">
            {match.title}
          </Link>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className={cn("rounded-md px-2.5 py-1 font-mono text-mono-label font-bold", chipTone[scoreTone(score)])}>{score}% MATCH</span>
          <span className={cn("font-mono text-mono-micro", match.fresh ? "text-accent-tint" : "text-muted")}>POSTED {postedLabel(match.hoursOld)}</span>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="font-mono text-mono-micro text-muted">MISSING:</span>
          {match.missingSkills.length === 0 ? (
            <span className="rounded-sm bg-surface-3 px-2 py-0.5 font-mono text-mono-micro text-accent-tint">None — Exact Match</span>
          ) : (
            <span className="truncate rounded-sm bg-surface-3 px-2 py-0.5 font-mono text-mono-micro text-text">{match.missingSkills.join(" / ")}</span>
          )}
        </div>
        <div className="flex gap-2">
          <Link href={`/jobs?job=${encodeURIComponent(match.jobId)}`} className={buttonVariants({ variant: "secondary", size: "md" })}>
            Inspect Fit
          </Link>
          {href ? (
            <a href={href} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: score >= 90 ? "primary" : "ghost", size: "md" })}>
              {score >= 90 ? "Apply" : "View Source"} <ArrowUpRight size={15} strokeWidth={1.5} aria-hidden />
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}
