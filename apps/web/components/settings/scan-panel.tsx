import { isScanRunning } from "@/lib/scan-core";
import type { RunRow, SourceRow } from "@/lib/settings-data";

import { ScanNowButton } from "./scan-now-button";

const IST = { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false } as const;
const fmt = (iso: string) => new Intl.DateTimeFormat("en-GB", IST).format(new Date(iso));

function duration(run: RunRow): string {
  if (!run.finished_at) return run.status === "running" ? "running" : "–";
  const s = Math.max(0, Math.round((new Date(run.finished_at).getTime() - new Date(run.started_at).getTime()) / 1000));
  return s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`;
}

const statusTone: Record<string, string> = { success: "text-accent-fg", partial: "text-warning", failed: "text-danger", running: "text-info", disabled: "text-muted", skipped: "text-muted" };

function num(stats: Record<string, unknown>, key: string): string {
  const v = stats[key];
  return typeof v === "number" ? String(v) : "–";
}

export function ScanPanel({ runs, sources, now }: { runs: RunRow[]; sources: SourceRow[]; now: Date }) {
  const running = isScanRunning(runs[0], now);
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 rounded-lg bg-surface-2 p-6 sm:flex-row sm:items-center">
        <div>
          <p className="text-headline-sm text-text-strong">Every 3 hours · watched companies hourly</p>
          <p className="text-body-sm text-muted">Scheduled in GitHub Actions (UTC cron, shown here in IST). GitHub can delay scheduled runs by several minutes.</p>
        </div>
        <ScanNowButton running={running} />
      </div>

      <section aria-labelledby="runs-heading" className="flex flex-col gap-3">
        <h3 id="runs-heading" className="text-headline-sm text-text-strong">
          {runs.length <= 1 ? "Last run" : `Last ${runs.length} runs`}
        </h3>
        {runs.length === 0 ? (
          <p className="rounded-lg bg-surface-2 p-4 text-body-sm text-muted">No scans have run yet. Press Scan now, or wait for the next scheduled run.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg bg-surface-2">
            <table className="w-full min-w-[34rem] text-left text-body-sm">
              <thead>
                <tr className="bg-surface-lowest font-mono text-mono-label uppercase tracking-wider text-muted">
                  <th className="px-4 py-3 font-normal">Started (IST)</th>
                  <th className="px-4 py-3 font-normal">Kind</th>
                  <th className="px-4 py-3 font-normal">Status</th>
                  <th className="px-4 py-3 font-normal">Duration</th>
                  <th className="px-4 py-3 text-right font-normal">New jobs</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((r) => (
                  <tr key={r.id} className="hover:bg-surface-3">
                    <td className="px-4 py-2.5 font-mono text-mono-micro text-text">{fmt(r.started_at)}</td>
                    <td className="px-4 py-2.5 text-secondary">{r.kind}</td>
                    <td className={`px-4 py-2.5 font-mono text-mono-label uppercase ${statusTone[r.status] ?? "text-text"}`}>{r.status}</td>
                    <td className="px-4 py-2.5 font-mono text-mono-micro text-muted">{duration(r)}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-mono-micro text-text">{num(r.stats, "new_jobs")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section aria-labelledby="sources-heading" className="flex flex-col gap-3">
        <h3 id="sources-heading" className="text-headline-sm text-text-strong">
          Sources in the latest run
        </h3>
        {sources.length === 0 ? (
          <p className="rounded-lg bg-surface-2 p-4 text-body-sm text-muted">Sources appear here after the first scan.</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {sources.map((s) => (
              <li key={s.source} className="flex flex-col gap-1 rounded-lg bg-surface-2 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-mono-label uppercase text-text">{s.source}</span>
                  <span className={`font-mono text-mono-micro uppercase ${statusTone[s.status] ?? "text-text"}`}>{s.status}</span>
                </div>
                <span className="font-mono text-mono-micro text-muted">
                  {s.fetched} fetched · {s.new_jobs} new
                </span>
                {s.error ? <span className="line-clamp-2 text-body-sm text-muted">{s.error}</span> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
