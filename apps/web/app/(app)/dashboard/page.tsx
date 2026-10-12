import { BadgeCheck, TrendingUp, Zap } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { RadarCard } from "@/components/dashboard/radar-card";
import { DeadlinesCard, TelegramCard, WatchedAlertsCard } from "@/components/dashboard/side-cards";
import { TopMatchCard } from "@/components/dashboard/top-match-card";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Marquee } from "@/components/ui/marquee";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkline } from "@/components/ui/sparkline";
import { StatTile } from "@/components/ui/stat-tile";
import { loadDashboard } from "@/lib/dashboard-data";
import { monogram } from "@/lib/format";
import { greeting, istClock } from "@/lib/greeting";
import { requireProfile } from "@/lib/session";

export const metadata = { title: "Dashboard — SCOUT" };

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Dashboard />
    </Suspense>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 pt-6" aria-busy aria-label="Loading dashboard">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Skeleton className="h-[520px] lg:col-span-7" />
        <div className="grid grid-cols-2 gap-4 lg:col-span-5">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
          <Skeleton className="col-span-2 h-20" />
        </div>
      </div>
      <Skeleton className="h-9" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="flex flex-col gap-4 lg:col-span-7">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
        <Skeleton className="h-96 lg:col-span-5" />
      </div>
    </div>
  );
}


async function Dashboard() {
  const { profileId } = await requireProfile();
  const now = new Date();
  const d = await loadDashboard(profileId, now);
  const name = d.displayName;
  const sinceLabel = d.newSinceRun.at ? istClock(new Date(d.newSinceRun.at)) : null;
  const sector = d.regions.length ? `${d.regions.slice(0, 3).join(" · ")}${d.regions.length > 3 ? " +" : ""} & REMOTE` : "ALL REGIONS";
  const runOk = d.scan.run ? d.scan.run.status !== "failed" : false;
  const runTime = d.scan.run ? new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(d.scan.run.started_at)) : null;

  const marquee = [
    <span key="s" className={runOk ? "text-accent-fg" : "text-danger"}>● RADAR STATUS: {d.scan.run ? (runOk ? "NOMINAL" : "DEGRADED") : "NO SCANS YET"}</span>,
    <span key="n" className="text-text">{d.scan.okSources} SOURCES SCANNED</span>,
    <span key="t" className={d.telegramLinked ? "text-text" : "text-muted"}>{d.telegramLinked ? "TELEGRAM DISPATCH VERIFIED" : "TELEGRAM NOT LINKED"}</span>,
    d.gradYear ? <span key="e" className="text-accent-tint">ELIGIBILITY FILTER: {d.gradYear} BATCH ACTIVE</span> : null,
    runTime ? (
      <span key="x" className={d.scan.scamFlagged > 0 ? "text-danger" : "text-text"}>
        {d.scan.scamFlagged > 0 ? `${d.scan.scamFlagged} SCAM RISKS FLAGGED IN LAST RUN` : "NO SCAM DETECTED IN LAST RUN"} ({runTime} UTC)
      </span>
    ) : null,
    ...d.companies.slice(0, 8).map((c) => (
      <span key={`c-${c}`} className="text-muted">
        NEW AT {c}
      </span>
    )),
  ].filter(Boolean);

  const series = (v: number[] | null | undefined) => (v && v.length ? v : [0, 0, 0, 0, 0, 0, 0]);

  return (
    <div className="flex flex-col gap-6 pt-6">
      <section className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12">
        <RadarCard
          blips={d.blips}
          greetingLine={`${greeting(name, now)} · ${istClock(now)} IST`}
          sector={sector}
          sourcesActive={d.scan.okSources}
          scannedToday={d.scan.scannedToday}
          passed={d.scan.passed}
        />
        <div className="flex flex-col justify-between gap-4 lg:col-span-5">
          <div className="grid flex-1 grid-cols-2 gap-4">
            <StatTile
              label="New matches"
              value={d.kpi.new_today}
              padTo={2}
              caption={name}
              trailing={
                sinceLabel ? (
                  <span className="inline-flex items-center gap-1 rounded-sm bg-accent/10 px-1.5 py-0.5 font-mono text-mono-micro font-semibold text-accent-fg">
                    <TrendingUp size={11} strokeWidth={2} aria-hidden /> +{d.newSinceRun.count} since {sinceLabel}
                  </span>
                ) : null
              }
              footer={<Sparkline values={series(d.kpi.new_series)} label="New matches, last 7 days" />}
            />
            <StatTile
              label="Fresh < 24h"
              value={d.kpi.fresh_24h}
              padTo={2}
              valueTone="accent"
              caption={<span className="text-accent-tint">PRIORITY RADAR</span>}
              trailing={<span className="size-2 animate-live-pulse rounded-full bg-accent" aria-hidden />}
              footer={<Sparkline values={series(d.kpi.fresh_series)} label="Fresh matches, last 7 days" />}
            />
            <StatTile
              label="Applied (week)"
              value={d.kpi.applied_week}
              padTo={2}
              footer={<Sparkline values={series(d.kpi.applied_series)} label="Applications, last 7 days" />}
            />
            <StatTile
              label="Interviews active"
              value={d.kpi.interviews}
              padTo={2}
              trailing={<BadgeCheck size={18} strokeWidth={1.5} className="text-accent-fg" aria-hidden />}
              caption={
                d.interviewCompanies.length ? (
                  <span className="flex -space-x-1" aria-hidden>
                    {d.interviewCompanies.slice(0, 3).map((c) => (
                      <span key={c} className="flex size-4 items-center justify-center rounded-full bg-surface-4 text-[8px] font-bold text-text-strong ring-1 ring-surface">
                        {monogram(c, 1)}
                      </span>
                    ))}
                  </span>
                ) : undefined
              }
              footer={
                <>
                  <Sparkline values={series(d.kpi.interviews_series)} label="Interview moves, last 7 days" />
                  {d.interviewCompanies.length ? <span className="truncate font-mono text-mono-micro text-muted">{d.interviewCompanies.slice(0, 3).join(" · ")}</span> : null}
                </>
              }
            />
          </div>
          <TelegramCard linked={d.telegramLinked} notified={d.notified} botUsername={process.env.TELEGRAM_BOT_USERNAME ?? null} now={now} />
        </div>
      </section>

      <Marquee items={marquee} separator="///" className="rounded-md bg-surface-lowest px-4 py-2" />

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="flex flex-col gap-4 lg:col-span-7">
          <div className="flex items-center justify-between gap-2 rounded-md bg-surface px-4 py-2 shadow-card">
            <h2 className="flex items-center gap-2 text-headline-sm text-text-strong">
              <Zap size={18} strokeWidth={1.5} className="text-accent-fg" aria-hidden /> Top Matches (Scored for {name})
            </h2>
            <span className="flex items-center gap-2 font-mono text-mono-micro uppercase tracking-wider text-muted">
              SORT BY: <span className="rounded-sm bg-surface-3 px-2 py-0.5 text-text">MATCH % DESC</span>
            </span>
          </div>
          {!d.hasResume ? (
            <EmptyState
              title="Upload your resume to start matching"
              description="SCOUT scores jobs against your resume. Add it once and the next scan ranks everything for you."
              action={
                <Link href="/settings/resume" className={buttonVariants({ size: "md" })}>
                  Go to Settings → Resume
                </Link>
              }
            />
          ) : d.top.length === 0 ? (
            <EmptyState
              title={d.resumePending ? "Resume parsing is pending" : "No scored matches yet"}
              description={d.resumePending ? "AI parsing was busy. Retry parsing in Settings → Resume." : "Scored matches appear here after the next scan."}
              action={
                <Link href={d.resumePending ? "/settings/resume" : "/jobs"} className={buttonVariants({ variant: "secondary", size: "md" })}>
                  {d.resumePending ? "Retry parsing" : "Open Job Feed"}
                </Link>
              }
            />
          ) : (
            d.top.map((m) => <TopMatchCard key={m.matchId} match={m} gradYear={d.gradYear} />)
          )}
        </div>
        <div className="flex flex-col gap-6 lg:col-span-5">
          <WatchedAlertsCard total={d.watched.total} detectedToday={d.watched.detectedToday} alerts={d.watched.alerts} now={now} />
          <DeadlinesCard items={d.deadlines} />
        </div>
      </section>
    </div>
  );
}
