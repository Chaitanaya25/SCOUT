import { ArrowUpRight, BellRing, Send, SlidersHorizontal, Timer } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { CompanyLogo } from "@/components/ui/company-logo";
import { ProgressBar } from "@/components/ui/progress-bar";
import { cn } from "@/lib/cn";
import { relativeAgo } from "@/lib/scan-schedule";
import { deadlineTone } from "@/lib/score";

export function TelegramCard({ linked, notified, botUsername, now }: { linked: boolean; notified: { at: string; title: string; company: string } | null; botUsername: string | null; now: Date }) {
  const open = linked && botUsername ? `https://t.me/${encodeURIComponent(botUsername.replace(/^@/, ""))}` : "/settings/telegram";
  return (
    <div className="flex items-center gap-4 rounded-lg bg-surface p-4 shadow-card">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-surface-3 text-accent-fg">
        <Send size={18} strokeWidth={1.5} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-3 font-mono text-mono-micro uppercase">
          <span className="tracking-wider text-accent-fg">TELEGRAM DISPATCH CHANNEL</span>
          {notified ? <span className="text-muted">{relativeAgo(notified.at, now)}</span> : null}
        </div>
        <p className="truncate text-body-sm text-text">
          {!linked ? "Telegram is not linked. Link it in Settings to get alerts." : notified ? `${notified.company} · ${notified.title}` : "No alerts sent yet."}
        </p>
      </div>
      {open.startsWith("https://") ? (
        <a href={open} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "secondary", size: "sm" })}>
          OPEN <ArrowUpRight size={14} strokeWidth={1.5} aria-hidden />
        </a>
      ) : (
        <Link href={open} className={buttonVariants({ variant: "secondary", size: "sm" })}>
          LINK
        </Link>
      )}
    </div>
  );
}

export function WatchedAlertsCard({ total, detectedToday, alerts, now }: { total: number; detectedToday: number; alerts: { companyId: string; name: string; newCount: number; role: string | null; checkedAt: string | null }[]; now: Date }) {
  return (
    <section className="flex flex-col gap-4 rounded-lg bg-surface p-5 shadow-card" aria-labelledby="watched-alerts">
      <div className="flex items-center justify-between gap-2">
        <h2 id="watched-alerts" className="flex items-center gap-2 text-headline-sm text-text-strong">
          <BellRing size={18} strokeWidth={1.5} className="text-accent-fg" aria-hidden /> Watched Company Alerts
        </h2>
        <span className="font-mono text-mono-micro uppercase tracking-wider text-muted">{detectedToday} DETECTED TODAY</span>
      </div>
      {alerts.length === 0 ? (
        <p className="rounded-md bg-surface-2 p-3 text-body-sm text-muted">{total === 0 ? "No companies watched yet." : "No new roles at your watched companies since the last check."}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {alerts.map((a) => (
            <li key={a.companyId} className="flex items-center gap-3 rounded-md bg-surface-2 p-3 hover:bg-surface-3">
              <CompanyLogo name={a.name} size={32} tone="strong" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-body-base font-semibold text-text-strong">{a.name}</span>
                  <span className="rounded-sm bg-accent/15 px-1.5 py-0.5 font-mono text-mono-micro font-bold uppercase text-accent-fg">
                    +{a.newCount} NEW {a.newCount === 1 ? "ROLE" : "ROLES"}
                  </span>
                </div>
                {a.role ? <p className="truncate font-mono text-mono-micro text-muted">{a.role}</p> : null}
              </div>
              {a.checkedAt ? <span className="shrink-0 font-mono text-mono-micro text-accent-tint">{relativeAgo(a.checkedAt, now)}</span> : null}
            </li>
          ))}
        </ul>
      )}
      <Link href="/watched" className={cn(buttonVariants({ variant: "secondary", size: "md" }), "w-full font-mono text-mono-micro uppercase tracking-wider")}>
        MANAGE {total} WATCHED {total === 1 ? "DOMAIN" : "DOMAINS"} <SlidersHorizontal size={14} strokeWidth={1.5} aria-hidden />
      </Link>
    </section>
  );
}

const dotTone = { danger: "bg-danger", tint: "bg-accent-tint", muted: "bg-info" } as const;
const barTone = { danger: "danger", tint: "accent", muted: "info" } as const;

export function DeadlinesCard({ items }: { items: { id: string; name: string; organizer: string | null; description: string | null; daysLeft: number; elapsedPct: number }[] }) {
  return (
    <section className="flex flex-col gap-4 rounded-lg bg-surface p-5 shadow-card" aria-labelledby="deadlines">
      <div className="flex items-center justify-between gap-2">
        <h2 id="deadlines" className="flex items-center gap-2 text-headline-sm text-text-strong">
          <Timer size={18} strokeWidth={1.5} className="text-accent-fg" aria-hidden /> Upcoming Deadlines
        </h2>
        <Link href="/programs" className="font-mono text-mono-micro uppercase tracking-wider text-muted hover:text-text">
          PROGRAMS
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="rounded-md bg-surface-2 p-3 text-body-sm text-muted">No upcoming program deadlines.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((p) => {
            const tone = deadlineTone(p.daysLeft);
            return (
              <li key={p.id} className="flex flex-col gap-2 rounded-md bg-surface-2 p-4">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2 text-body-base font-semibold text-text-strong">
                    <span className={cn("size-2 shrink-0 rounded-full", dotTone[tone])} aria-hidden />
                    <span className="truncate">{p.name}</span>
                  </span>
                  <span className={cn("shrink-0 rounded-sm px-2 py-0.5 font-mono text-mono-micro", tone === "danger" ? "bg-danger-container text-on-danger-container" : "bg-surface-3 text-text")}>
                    {p.daysLeft === 0 ? "due today" : `${p.daysLeft}d left`}
                  </span>
                </div>
                {p.organizer || p.description ? <p className="line-clamp-2 font-mono text-mono-micro text-muted">{p.description || p.organizer}</p> : null}
                <ProgressBar value={p.elapsedPct} tone={barTone[tone]} size="md" label={`${p.elapsedPct}% of the application window elapsed`} />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
