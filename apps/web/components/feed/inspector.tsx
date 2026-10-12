"use client";

import { ArrowUpRight, Check, CircleAlert, CircleCheck, CircleHelp, Copy, ExternalLink, PanelRightClose, RefreshCw, Send, Share2, Sparkles, TriangleAlert, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { CompanyLogo } from "@/components/ui/company-logo";
import { MatchRing } from "@/components/ui/match-ring";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs } from "@/components/ui/tabs";
import { sendJson } from "@/lib/client-api";
import { cn } from "@/lib/cn";
import type { JobDetail, TailoredView } from "@/lib/job-detail";
import { postedLabel, safeHref, type MatchCard } from "@/lib/match-view";

type Tab = "overview" | "tailor" | "referrals";

function matchHeadline(score: number | null): string {
  if (score === null) return "NOT SCORED YET";
  if (score >= 90) return "PRIME MATCH CONFIRMED";
  if (score >= 75) return "STRONG MATCH";
  if (score >= 60) return "PARTIAL MATCH";
  return "WEAK MATCH";
}

async function copy(text: string, what: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${what} copied`);
  } catch {
    toast.error("Copy failed. Select the text and copy it manually.");
  }
}

function Panel({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("flex flex-col gap-3 rounded-lg bg-surface-lowest p-4", className)}>
      <h3 className="font-mono text-mono-label uppercase tracking-widest text-muted">{title}</h3>
      {children}
    </section>
  );
}

function CheckIcon({ status }: { status: "pass" | "fail" | "unknown" }) {
  if (status === "pass") return <CircleCheck size={15} strokeWidth={1.5} className="text-accent-fg" aria-label="pass" />;
  if (status === "fail") return <CircleAlert size={15} strokeWidth={1.5} className="text-danger" aria-label="fail" />;
  return <CircleHelp size={15} strokeWidth={1.5} className="text-muted" aria-label="unknown" />;
}

function Overview({ d }: { d: JobDetail }) {
  const m = d.match;
  const bars: { label: string; value: number | null }[] = [
    { label: "Skills Compatibility", value: m.breakdown.skills },
    { label: `Batch Eligibility${d.profile.gradYear ? ` (${d.profile.gradYear} Batch)` : ""}`, value: m.breakdown.eligibility },
    { label: `Signal Freshness (${postedLabel(m.hoursOld).toLowerCase()})`, value: m.breakdown.freshness },
  ];
  return (
    <div className="flex flex-col gap-6">
      <Panel title="AI Match Telemetry Vector">
        {m.scored ? (
          bars.map((b, i) => (
            <div key={b.label} className="flex flex-col gap-1.5">
              <div className="flex justify-between font-mono text-mono-micro text-text">
                <span>{b.label}</span>
                <span className={(b.value ?? 0) >= 90 ? "text-accent-fg" : "text-secondary"}>{b.value === null ? "–" : `${b.value}%`}</span>
              </div>
              <ProgressBar value={b.value ?? 0} tone={(b.value ?? 0) >= 90 ? "accent" : "muted"} size="md" delay={i * 0.05} label={b.label} />
            </div>
          ))
        ) : (
          <p className="text-body-sm text-muted">Not scored yet. It is ranked by resume similarity ({m.similarityPct}%) until a scan scores it.</p>
        )}
        {m.reason ? <p className="text-body-sm text-secondary">{m.reason}</p> : null}
      </Panel>

      {m.tags.length ? (
        <section className="flex flex-col gap-2">
          <h3 className="font-mono text-mono-label uppercase tracking-widest text-muted">Required Technical Stack</h3>
          <div className="flex flex-wrap gap-2">
            {m.tags.map((t) => (
              <span key={t} className="rounded-md bg-surface-2 px-2.5 py-1 font-mono text-mono-micro text-text-strong">
                {t}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      <Panel title="Eligibility Check">
        {m.checks.length === 0 ? (
          <p className="text-body-sm text-muted">No eligibility details recorded.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {m.checks.map((c) => (
              <li key={c.label} className="flex items-center gap-2 text-body-sm text-text">
                <CheckIcon status={c.status} /> {c.label}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {m.scored ? (
        <Panel title="Missing Skills">
          {m.missingSkills.length === 0 ? (
            <p className="flex items-center gap-2 text-body-sm text-accent-fg">
              <Check size={15} strokeWidth={2} aria-hidden /> None — your resume covers what this posting asks for.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {m.missingSkills.map((s) => (
                <span key={s} className="inline-flex items-center gap-1 rounded-md bg-danger/10 px-2.5 py-1 font-mono text-mono-micro text-danger">
                  <TriangleAlert size={12} strokeWidth={1.5} aria-hidden /> {s}
                </span>
              ))}
            </div>
          )}
        </Panel>
      ) : null}

      <Panel title="Role Overview & Responsibilities">
        {d.description ? (
          <p className="whitespace-pre-line text-body-sm text-text">{d.description}</p>
        ) : (
          <p className="text-body-sm text-muted">The source did not include a description. Open the posting for details.</p>
        )}
      </Panel>

      {d.similar.length ? (
        <section className="flex flex-col gap-2">
          <h3 className="font-mono text-mono-label uppercase tracking-widest text-muted">Similar Roles</h3>
          <ul className="flex flex-col gap-1.5">
            {d.similar.map((s) => (
              <li key={s.id}>
                <a href={`/jobs?job=${encodeURIComponent(s.id)}`} className="flex items-center justify-between gap-3 rounded-md bg-surface-2 px-3 py-2 hover:bg-surface-3">
                  <span className="min-w-0">
                    <span className="block truncate text-body-sm font-medium text-text-strong">{s.title}</span>
                    <span className="block truncate font-mono text-mono-micro text-muted">
                      {s.company}
                      {s.location ? ` · ${s.location}` : ""}
                    </span>
                  </span>
                  <span className="shrink-0 font-mono text-mono-micro text-muted">{s.similarityPct}% similar</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function TailorPanel({ d, onTailored }: { d: JobDetail; onTailored: (t: TailoredView) => void }) {
  const [busy, setBusy] = useState(false);
  const t = d.tailored;

  async function run(regenerate: boolean) {
    setBusy(true);
    const res = await sendJson<{ tailored: TailoredView; removed: number }>(`/api/jobs/${d.match.jobId}/tailor`, "POST", { regenerate });
    setBusy(false);
    if (!res.ok) return void toast.error(res.error);
    onTailored(res.data.tailored);
    if (res.data.removed > 0) toast.message(`${res.data.removed} suggestion${res.data.removed === 1 ? " was" : "s were"} dropped for mentioning things that are not in your resume.`);
  }

  if (!d.resumeReady) return <p className="rounded-lg bg-surface-lowest p-4 text-body-sm text-muted">Upload and parse your resume in Settings → Resume to tailor it to this job.</p>;

  if (!t) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-lg bg-surface-lowest p-4">
        <h3 className="font-mono text-mono-label uppercase tracking-widest text-muted">AI Resume Alignment</h3>
        <p className="text-body-sm text-secondary">Three bullets rewritten from your real experience for this role, plus a short cover note. Nothing is invented: suggestions that mention tools, employers or numbers not in your resume are dropped.</p>
        <Button disabled={busy} onClick={() => void run(false)} leadingIcon={<Sparkles size={16} strokeWidth={1.5} className={busy ? "animate-spin" : undefined} aria-hidden />}>
          {busy ? "Generating…" : "Generate with AI"}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4" aria-busy={busy}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-mono text-mono-label uppercase tracking-widest text-muted">AI Resume Alignment</h3>
        <Button variant="secondary" size="sm" disabled={busy} onClick={() => void run(true)} leadingIcon={<RefreshCw size={14} strokeWidth={1.5} className={busy ? "animate-spin" : undefined} aria-hidden />}>
          {busy ? "Regenerating…" : "Regenerate"}
        </Button>
      </div>
      {t.bullets.map((b, i) => (
        <div key={i} className="flex flex-col gap-2 rounded-lg bg-surface-lowest p-4">
          <span className="font-mono text-mono-micro uppercase text-accent-fg">TARGET: {t.atsKeywords[i] ?? d.match.title}</span>
          <p className="text-body-sm italic text-text">{b}</p>
          <button type="button" onClick={() => void copy(b, "Bullet")} className="inline-flex w-fit items-center gap-1.5 rounded-md bg-surface-2 px-2.5 py-1 text-body-sm text-text hover:bg-surface-3">
            <Copy size={13} strokeWidth={1.5} aria-hidden /> Copy
          </button>
        </div>
      ))}
      <div className="flex flex-col gap-2 rounded-lg bg-surface-lowest p-4">
        <span className="font-mono text-mono-label uppercase tracking-widest text-muted">Cover Note</span>
        <p className="whitespace-pre-line text-body-sm text-text">{t.coverNote}</p>
        <button type="button" onClick={() => void copy(t.coverNote, "Cover note")} className="inline-flex w-fit items-center gap-1.5 rounded-md bg-surface-2 px-2.5 py-1 text-body-sm text-text hover:bg-surface-3">
          <Copy size={13} strokeWidth={1.5} aria-hidden /> Copy Draft
        </button>
      </div>
      {t.atsKeywords.length ? (
        <div className="flex flex-wrap gap-1.5">
          {t.atsKeywords.map((k) => (
            <span key={k} className="rounded-sm bg-surface-3 px-2 py-0.5 font-mono text-mono-micro text-muted">
              {k}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Referrals({ d }: { d: JobDetail }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="font-mono text-mono-label uppercase tracking-widest text-muted">Find referrals</h3>
      <p className="text-body-sm text-secondary">LinkedIn searches only: SCOUT never scrapes profiles or messages anyone.</p>
      <ul className="flex flex-col gap-2">
        {d.referrals.map((r) => (
          <li key={r.url}>
            <a href={r.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-3 rounded-md bg-surface-2 px-4 py-3 hover:bg-surface-3">
              <span className="min-w-0">
                <span className="block truncate text-body-base font-medium text-text-strong">{r.label}</span>
                <span className="block font-mono text-mono-micro text-muted">{r.description}</span>
              </span>
              <ArrowUpRight size={16} strokeWidth={1.5} className="shrink-0 text-muted" aria-hidden />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Inspector drawer body (DESIGN §4.3): header + match summary, Overview / Tailor Resume / Referrals, sticky footer.
 * Loads `/api/jobs/[id]` for the selected job; the list card is shown immediately while details load.
 */
export function Inspector({ card, onClose, onApply, onApplied, variant }: { card: MatchCard; onClose: () => void; onApply: (c: MatchCard) => void; onApplied: (c: MatchCard) => void; variant: "inline" | "overlay" }) {
  const [state, setState] = useState<{ jobId: string; detail: JobDetail | null; error: string | null } | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    fetch(`/api/jobs/${encodeURIComponent(card.jobId)}`, { signal: ctrl.signal, cache: "no-store" })
      .then(async (r) => {
        const body = await r.json().catch(() => ({}));
        setState({ jobId: card.jobId, detail: r.ok ? (body as JobDetail) : null, error: r.ok ? null : (body as { error?: string }).error ?? "Could not load this job." });
      })
      .catch((e: unknown) => {
        if ((e as { name?: string }).name !== "AbortError") setState({ jobId: card.jobId, detail: null, error: "Network error. Check your connection." });
      });
    return () => ctrl.abort();
  }, [card.jobId]);

  const detail = state?.jobId === card.jobId ? state.detail : null;
  const error = state?.jobId === card.jobId ? state.error : null;
  const m = { ...(detail?.match ?? card), status: card.status };
  const apply = safeHref(m.applyUrl);

  async function syncTelegram() {
    setSyncing(true);
    const res = await sendJson(`/api/jobs/${card.jobId}/telegram`, "POST");
    setSyncing(false);
    if (res.ok) toast.success("Alert sent to Telegram");
    else toast.error(res.error);
  }

  async function shareLink() {
    await copy(`${window.location.origin}/jobs?job=${encodeURIComponent(card.jobId)}`, "Link");
  }

  return (
    <div className={cn("flex h-full flex-col overflow-hidden bg-surface shadow-2xl", variant === "inline" ? "rounded-lg" : "")} aria-label={`Details: ${m.title} at ${m.company}`} role="region">
      <header className="flex flex-col gap-4 bg-surface-2/80 p-6">
        <div className="flex items-start gap-4">
          <CompanyLogo name={m.company} size={48} tone="accent" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 font-mono text-mono-label uppercase">
              <span className="truncate tracking-wider text-text">{m.company}</span>
              <span className="size-1.5 rounded-full bg-accent-hover" aria-hidden />
              <span className="text-accent-hover">FOUND {postedLabel(m.hoursOld)}</span>
            </div>
            <h2 className="mt-1 text-headline-lg text-text-strong">{m.title}</h2>
            <p className="text-body-sm text-secondary">
              {m.jobType === "internship" ? "Internship" : m.jobType === "full_time" ? "Full-time" : "Role"} · {m.location}
            </p>
          </div>
          <div className="flex shrink-0 gap-1">
            <button type="button" onClick={() => void shareLink()} aria-label="Copy link to this job" className="rounded-md p-1.5 text-muted hover:bg-surface-3 hover:text-text">
              <Share2 size={18} strokeWidth={1.5} aria-hidden />
            </button>
            <button type="button" onClick={onClose} aria-label="Close details" className="rounded-md p-1.5 text-muted hover:bg-surface-3 hover:text-text">
              {variant === "inline" ? <PanelRightClose size={18} strokeWidth={1.5} aria-hidden /> : <X size={18} strokeWidth={1.5} aria-hidden />}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-md bg-surface-lowest p-2">
          {m.scored ? <MatchRing score={m.score ?? 0} size={36} /> : <span className="flex size-9 items-center justify-center rounded-full bg-surface-3 font-mono text-[9px] text-muted">N/S</span>}
          <div className="min-w-0 flex-1">
            <p className={cn("font-mono text-mono-label font-bold uppercase", m.scored && (m.score ?? 0) >= 90 ? "text-accent-fg" : "text-text")}>{matchHeadline(m.score)}</p>
            <p className="truncate font-mono text-mono-micro text-muted">
              Profile aligned with {detail?.profile.displayName ?? "you"}
              {detail?.profile.gradYear ? ` (${detail.profile.gradYear}${detail.profile.degree ? ` ${detail.profile.degree}` : ""})` : ""}
            </p>
          </div>
          <span className="hidden shrink-0 rounded-sm bg-surface-3 px-2 py-0.5 font-mono text-mono-micro text-text sm:inline">{m.location}</span>
        </div>
        <Tabs
          layoutId={`inspector-tabs-${variant}`}
          ariaLabel="Job details"
          value={tab}
          onValueChange={(v) => setTab(v as Tab)}
          className="w-full [&>button]:flex-1 [&>button]:justify-center"
          items={[
            { value: "overview", label: "Overview" },
            { value: "tailor", label: "Tailor Resume" },
            { value: "referrals", label: "Referrals", count: detail?.referrals.length },
          ]}
        />
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-6" role="tabpanel">
        {error ? (
          <p className="rounded-lg bg-danger-container/30 p-4 text-body-sm text-danger">{error}</p>
        ) : !detail ? (
          <div className="flex flex-col gap-3" aria-busy>
            <Skeleton className="h-32" />
            <Skeleton className="h-16" />
            <Skeleton className="h-48" />
          </div>
        ) : tab === "overview" ? (
          <Overview d={detail} />
        ) : tab === "tailor" ? (
          <TailorPanel d={detail} onTailored={(t) => setState((s) => (s && s.detail ? { ...s, detail: { ...s.detail, tailored: t } } : s))} />
        ) : (
          <Referrals d={detail} />
        )}
      </div>

      <footer className="flex flex-col gap-2 bg-surface-3/90 p-4 backdrop-blur-md">
        <div className="flex gap-2">
          {apply ? (
            <Button size="lg" className="flex-1" onClick={() => onApply(m)} trailingIcon={<ExternalLink size={16} strokeWidth={1.5} aria-hidden />}>
              {m.ats ? `Direct ${m.ats.charAt(0).toUpperCase()}${m.ats.slice(1)} Apply` : "Apply"}
            </Button>
          ) : null}
          <Button variant="secondary" size="lg" disabled={m.status === "applied"} onClick={() => onApplied(m)} leadingIcon={<CircleCheck size={16} strokeWidth={1.5} aria-hidden />}>
            {m.status === "applied" ? "Applied" : "Mark applied"}
          </Button>
        </div>
        <div className="flex items-center justify-between font-mono text-mono-micro text-muted">
          <button type="button" disabled={syncing} onClick={() => void syncTelegram()} className="inline-flex items-center gap-1.5 hover:text-text disabled:opacity-50">
            <Send size={12} strokeWidth={1.5} aria-hidden /> {syncing ? "Sending…" : "Sync alert to Telegram"}
          </button>
          {detail?.applicationStage ? <span className="uppercase">Tracker: {detail.applicationStage}</span> : null}
        </div>
      </footer>
    </div>
  );
}
