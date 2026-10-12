// Scan schedule helpers (ARCHITECTURE.md §10.2). The full scan runs on a GitHub Actions cron at minute 7 of every
// 3rd UTC hour (off the hour to avoid congestion). GitHub may delay runs, so the countdown is approximate.
// Everything is computed in UTC; display formatting is timezone-free (durations only).

export const SCAN_INTERVAL_HOURS = 3;
/** Minute past the hour the cron fires (every 3rd UTC hour). Pass 0 for a pure 3-hour boundary. */
export const SCAN_CRON_MINUTE = 7;

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

/** The next scan time strictly after `now`: the next UTC hour divisible by 3, at `minute` past. */
export function nextScanAt(now: Date, minute: number = SCAN_CRON_MINUTE): Date {
  const startOfHour = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours());
  let candidate = startOfHour;
  // Walk back to the most recent boundary hour (hour % 3 === 0), then step forward until strictly after now.
  candidate -= (now.getUTCHours() % SCAN_INTERVAL_HOURS) * HOUR;
  candidate += minute * MINUTE;
  while (candidate <= now.getTime()) candidate += SCAN_INTERVAL_HOURS * HOUR;
  return new Date(candidate);
}

export function msUntilNextScan(now: Date, minute: number = SCAN_CRON_MINUTE): number {
  return nextScanAt(now, minute).getTime() - now.getTime();
}

/** `HH:MM:SS` for a duration in ms (clamped at 0). */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

/** Relative time for the scan pill: `just now`, `42m ago`, `3h ago`, `2d ago`. */
export function relativeAgo(from: Date | string | number, now: Date = new Date()): string {
  const diff = Math.max(0, now.getTime() - new Date(from).getTime());
  if (diff < MINUTE) return "just now";
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}m ago`;
  if (diff < 24 * HOUR) return `${Math.floor(diff / HOUR)}h ago`;
  return `${Math.floor(diff / (24 * HOUR))}d ago`;
}

export type ScanRunLike = { status: string; started_at: string; finished_at: string | null };

export type ScanPillState =
  | { kind: "none" }
  | { kind: "running"; sources: number }
  | { kind: "idle"; label: string }
  | { kind: "failed"; label: string };

/** Maps the latest scan run to what the topbar pill shows. */
export function scanPillState(run: ScanRunLike | null, sourceCount: number, now: Date = new Date()): ScanPillState {
  if (!run) return { kind: "none" };
  if (run.status === "running") return { kind: "running", sources: sourceCount };
  const when = relativeAgo(run.finished_at ?? run.started_at, now);
  if (run.status === "failed") return { kind: "failed", label: `Last scan failed ${when}` };
  return { kind: "idle", label: `Last scan ${when}` };
}
