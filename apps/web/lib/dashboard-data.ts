import "server-only";

import { db } from "./db";
import { MATCH_SELECT } from "./match-query";
import { hoursSince, toMatchCard, type MatchCard, type MatchRow } from "./match-view";

const DAY = 86_400_000;

export type DashboardData = Awaited<ReturnType<typeof loadDashboard>>;

/** Everything the dashboard shows for one profile. Per-user tables are always filtered by `profileId`. */
export async function loadDashboard(profileId: string, now: Date) {
  const client = db();
  const since7 = new Date(now.getTime() - 7 * DAY).toISOString();

  const [profileRes, prefsRes, resumeRes, kpisRes, topRes, blipRes, runRes, notifiedRes, watchedRes, programsRes, interviewsRes, companiesRes] = await Promise.all([
    client.from("profiles").select("display_name").eq("id", profileId).maybeSingle(),
    client.from("preferences").select("grad_year, min_score, telegram_chat_id, locations").eq("profile_id", profileId).maybeSingle(),
    client.from("resumes").select("id, parse_status").eq("profile_id", profileId).eq("is_active", true).limit(1).maybeSingle(),
    client.rpc("dashboard_kpis", { p_profile: profileId }),
    client
      .from("job_matches")
      .select(MATCH_SELECT)
      .eq("profile_id", profileId)
      .eq("eligible", true)
      .neq("status", "skipped")
      .not("score", "is", null)
      .neq("jobs.scam_risk", "high")
      .eq("jobs.is_active", true)
      .order("score", { ascending: false })
      .order("rank_score", { ascending: false, nullsFirst: false })
      .limit(4),
    client
      .from("job_matches")
      .select("id, score, similarity, jobs!inner(id, company_name, posted_at, first_seen_at, scam_risk, is_active)")
      .eq("profile_id", profileId)
      .eq("eligible", true)
      .neq("status", "skipped")
      .neq("jobs.scam_risk", "high")
      .eq("jobs.is_active", true)
      .gte("created_at", since7)
      .order("score", { ascending: false, nullsFirst: false })
      .order("similarity", { ascending: false })
      .limit(24),
    client.from("scan_runs").select("id, kind, status, started_at, finished_at, stats").order("started_at", { ascending: false }).limit(1).maybeSingle(),
    client
      .from("job_matches")
      .select("notified_at, jobs!inner(title, company_name)")
      .eq("profile_id", profileId)
      .not("notified_at", "is", null)
      .order("notified_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    client
      .from("watched_companies")
      .select("company_id, last_new_count, last_checked_at, companies!inner(name)")
      .eq("profile_id", profileId)
      .order("last_new_count", { ascending: false, nullsFirst: false }),
    client.from("programs").select("id, name, organizer, description, deadline_at, opens_at, created_at").gte("deadline_at", isoDate(now)).order("deadline_at").limit(3),
    client.from("applications").select("company_name").eq("profile_id", profileId).eq("stage", "interview").limit(6),
    client.from("jobs").select("company_name").eq("is_active", true).order("first_seen_at", { ascending: false }).limit(60),
  ]);

  const run = runRes.data;
  const [sourcesRes, todayRes, sinceRunRes, passedRes] = await Promise.all([
    run ? client.from("source_runs").select("source, status").eq("scan_run_id", run.id) : Promise.resolve({ data: [] as { source: string; status: string }[] }),
    client.from("scan_runs").select("stats").gte("started_at", istMidnight(now).toISOString()),
    run
      ? client.from("job_matches").select("id", { count: "exact", head: true }).eq("profile_id", profileId).eq("eligible", true).gte("created_at", run.started_at)
      : Promise.resolve({ count: 0 }),
    client
      .from("job_matches")
      .select("id, jobs!inner(id)", { count: "exact", head: true })
      .eq("profile_id", profileId)
      .eq("eligible", true)
      .gte("score", prefsRes.data?.min_score ?? 60)
      .eq("jobs.is_active", true),
  ]);

  const sources = sourcesRes.data ?? [];
  const okSources = sources.filter((s) => s.status === "success").length;
  const scannedToday = (todayRes.data ?? []).reduce((sum, r) => sum + numberAt(r.stats, "fetched"), 0);

  const kpi = kpisRes.data?.[0] ?? { new_today: 0, fresh_24h: 0, applied_week: 0, interviews: 0, new_series: [], fresh_series: [], applied_series: [], interviews_series: [] };

  const watched = (watchedRes.data ?? []) as unknown as { company_id: string; last_new_count: number | null; last_checked_at: string | null; companies: { name: string } | null }[];
  const alertRows = watched.filter((w) => (w.last_new_count ?? 0) > 0).slice(0, 3);
  const latestRoles = alertRows.length
    ? await client.from("jobs").select("company_id, title, first_seen_at").in("company_id", alertRows.map((w) => w.company_id)).eq("is_active", true).order("first_seen_at", { ascending: false }).limit(30)
    : { data: [] as { company_id: string | null; title: string; first_seen_at: string }[] };

  const top: MatchCard[] = ((topRes.data ?? []) as unknown as MatchRow[]).map((r) => toMatchCard(r, now)).filter((c): c is MatchCard => c !== null);

  const blips = ((blipRes.data ?? []) as unknown as { id: string; score: number | null; similarity: number; jobs: { id: string; company_name: string; posted_at: string | null; first_seen_at: string } }[]).map((b) => ({
    id: b.jobs.id,
    label: b.jobs.company_name,
    score: b.score ?? Math.round(b.similarity * 100),
    hoursOld: hoursSince(b.jobs.posted_at ?? b.jobs.first_seen_at, now),
  }));
  // Real scores cluster at 85–98, which would pile every blip on the centre. Spread them by rank instead:
  // the best match sits nearest the centre, the 24th near the edge; tooltips still show the real score.
  const ranked = [...blips].sort((a, b) => b.score - a.score);
  const positioned = blips.map((b) => ({ ...b, position: radarPosition(ranked.indexOf(b), ranked.length) }));

  const notified = notifiedRes.data as unknown as { notified_at: string; jobs: { title: string; company_name: string } } | null;

  const companies = [...new Set(((companiesRes.data ?? []) as { company_name: string }[]).map((c) => c.company_name))].slice(0, 12);

  return {
    displayName: profileRes.data?.display_name ?? "",
    gradYear: prefsRes.data?.grad_year ?? null,
    regions: prefsRes.data?.locations ?? [],
    hasResume: Boolean(resumeRes.data),
    resumePending: resumeRes.data?.parse_status === "pending",
    telegramLinked: prefsRes.data?.telegram_chat_id != null,
    kpi,
    newSinceRun: { count: sinceRunRes.count ?? 0, at: run?.started_at ?? null },
    interviewCompanies: [...new Set((interviewsRes.data ?? []).map((a) => a.company_name))],
    top,
    blips: positioned,
    scan: {
      run,
      sourceCount: sources.length,
      okSources,
      scannedToday,
      passed: passedRes.count ?? 0,
      scamFlagged: run ? numberAt(run.stats, "scam_flagged") : 0,
    },
    notified: notified ? { at: notified.notified_at, title: notified.jobs.title, company: notified.jobs.company_name } : null,
    watched: {
      total: watched.length,
      detectedToday: watched.filter((w) => w.last_checked_at && new Date(w.last_checked_at).getTime() >= istMidnight(now).getTime()).reduce((s, w) => s + (w.last_new_count ?? 0), 0),
      alerts: alertRows.map((w) => ({
        companyId: w.company_id,
        name: w.companies?.name ?? "Company",
        newCount: w.last_new_count ?? 0,
        role: (latestRoles.data ?? []).find((j) => j.company_id === w.company_id)?.title ?? null,
        checkedAt: w.last_checked_at,
      })),
    },
    deadlines: (programsRes.data ?? []).map((p) => ({ ...p, ...deadlineProgress(p, now) })),
    companies,
  };
}

/** Rank 0 → 92 (near the centre), last → 12 (near the edge). */
export function radarPosition(rank: number, count: number): number {
  if (count <= 1) return 92;
  return Math.round(92 - (80 * rank) / (count - 1));
}

function numberAt(obj: unknown, key: string): number {
  const v = typeof obj === "object" && obj !== null ? (obj as Record<string, unknown>)[key] : undefined;
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

export function isoDate(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(d);
}

/** Midnight today in Asia/Kolkata, as a Date. */
export function istMidnight(now: Date): Date {
  return new Date(`${isoDate(now)}T00:00:00+05:30`);
}

/** Days left (ceil, IST end of day) and % of the window elapsed (opens_at or row creation → deadline). */
export function deadlineProgress(p: { deadline_at: string; opens_at: string | null; created_at: string }, now: Date): { daysLeft: number; elapsedPct: number } {
  const end = new Date(`${p.deadline_at}T23:59:59+05:30`).getTime();
  const start = p.opens_at ? new Date(`${p.opens_at}T00:00:00+05:30`).getTime() : new Date(p.created_at).getTime();
  const daysLeft = Math.max(0, Math.ceil((end - now.getTime()) / DAY));
  const span = Math.max(DAY, end - start);
  const elapsedPct = Math.round(Math.min(100, Math.max(0, ((now.getTime() - start) / span) * 100)));
  return { daysLeft, elapsedPct };
}
