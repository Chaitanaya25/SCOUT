// Scan-now helpers (pure): in-flight detection and workflow_dispatch request building.

/** A scan counts as running if it is `running` and started less than 40 minutes ago (older rows are crashed runs). */
export const STALE_RUN_MS = 40 * 60 * 1000;

export function isScanRunning(run: { status: string; started_at: string } | null | undefined, now: Date = new Date()): boolean {
  if (!run || run.status !== "running") return false;
  return now.getTime() - new Date(run.started_at).getTime() < STALE_RUN_MS;
}

export const REPO_RE = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

export function dispatchRequest(repo: string, ref = "main"): { url: string; body: string } | null {
  if (!REPO_RE.test(repo)) return null;
  return { url: `https://api.github.com/repos/${repo}/actions/workflows/full_scan.yml/dispatches`, body: JSON.stringify({ ref }) };
}
