import "server-only";

import { avatarUrl } from "./avatars";
import { db } from "./db";

/** Every query here filters by the profile id from `requireProfile()`; per-user tables are never read without it. */

export async function loadProfile(profileId: string) {
  const { data } = await db().from("profiles").select("display_name, college, avatar_path, slug").eq("id", profileId).maybeSingle();
  return {
    displayName: data?.display_name ?? "",
    college: data?.college ?? "",
    slug: data?.slug ?? "",
    avatarUrl: await avatarUrl(data?.avatar_path ?? null),
  };
}

export async function loadResume(profileId: string) {
  const { data } = await db()
    .from("resumes")
    .select("id, file_path, skills, created_at, parsed")
    .eq("profile_id", profileId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  const { data: info } = await db().storage.from("resumes").info(data.file_path);
  return {
    id: data.id,
    ext: data.file_path.split(".").pop() ?? "pdf",
    skills: data.skills ?? [],
    uploadedAt: data.created_at,
    size: typeof info?.size === "number" ? info.size : null,
    summary: typeof (data.parsed as { summary?: unknown } | null)?.summary === "string" ? ((data.parsed as { summary: string }).summary) : "",
  };
}

export async function loadPreferences(profileId: string) {
  const { data } = await db()
    .from("preferences")
    .select("roles, locations, remote_ok, job_types, grad_year, degree, max_experience_years, has_active_backlogs, min_score, telegram_chat_id, telegram_linked_at")
    .eq("profile_id", profileId)
    .maybeSingle();
  return data;
}

export type SourceRow = { source: string; status: string; fetched: number; new_jobs: number; error: string | null };
export type RunRow = { id: string; kind: string; status: string; started_at: string; finished_at: string | null; stats: Record<string, unknown> };

/** Scan history is global (not per profile): the worker scans once for both profiles. */
export async function loadScanOverview(): Promise<{ runs: RunRow[]; sources: SourceRow[] }> {
  const client = db();
  const { data: runs } = await client.from("scan_runs").select("id, kind, status, started_at, finished_at, stats").order("started_at", { ascending: false }).limit(10);
  const latest = runs?.[0];
  const { data: sourceRuns } = latest
    ? await client.from("source_runs").select("source, status, fetched, new_jobs, error").eq("scan_run_id", latest.id)
    : { data: [] };
  return { runs: (runs ?? []) as RunRow[], sources: (sourceRuns ?? []) as SourceRow[] };
}
