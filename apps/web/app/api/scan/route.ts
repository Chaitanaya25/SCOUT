import type { NextRequest } from "next/server";

import { json, sessionOr401 } from "@/lib/api";
import { db } from "@/lib/db";
import { dispatchRequest, isScanRunning } from "@/lib/scan-core";

/**
 * "Scan now": triggers the full_scan workflow through GitHub's workflow_dispatch API. Needs a session and refuses
 * while a scan is already running (the workflows also share one concurrency group, so overlap is impossible anyway).
 */
export async function POST(request: NextRequest) {
  const auth = await sessionOr401(request);
  if ("response" in auth) return auth.response;

  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO ?? "";
  const req = dispatchRequest(repo, process.env.GITHUB_REF_NAME || "main");
  if (!token || !req) return json({ error: "Scan now is not configured (GITHUB_TOKEN / GITHUB_REPO)." }, 501);

  const { data: latest } = await db().from("scan_runs").select("status, started_at").order("started_at", { ascending: false }).limit(1).maybeSingle();
  if (isScanRunning(latest)) return json({ error: "A scan is already running." }, 409);

  const res = await fetch(req.url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "Content-Type": "application/json", "User-Agent": "scout-web" },
    body: req.body,
    signal: AbortSignal.timeout(10_000),
    cache: "no-store",
  }).catch(() => null);
  if (!res) return json({ error: "Could not reach GitHub." }, 502);
  if (res.status !== 204) return json({ error: res.status === 401 || res.status === 403 || res.status === 404 ? "GitHub rejected the request. Check GITHUB_TOKEN (Actions: write) and GITHUB_REPO." : "GitHub could not start the scan." }, 502);
  return json({ ok: true }, 202);
}
