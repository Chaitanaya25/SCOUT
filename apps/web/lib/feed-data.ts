import "server-only";

import { db } from "./db";
import { INDIA_TERMS, PAGE_SIZE, type FeedFilters } from "./feed-params";
import { MATCH_SELECT } from "./match-query";
import { toMatchCard, type MatchCard, type MatchRow } from "./match-view";

/** The filter methods used below; PostgrestFilterBuilder satisfies this structurally. */
interface Filterable<T> {
  eq(column: string, value: string | boolean): T;
  neq(column: string, value: string): T;
  or(filters: string, options?: { referencedTable?: string }): T;
}

/** Every filter the feed supports, applied to a job_matches query that already embeds `jobs!inner`. */
function applyFilters<Q extends Filterable<Q>>(q: Q, profileId: string, f: FeedFilters, now: Date, opts: { ignoreType?: boolean } = {}): Q {
  let out = q.eq("profile_id", profileId).neq("status", "skipped").eq("jobs.is_active", true);
  if (f.eligible) out = out.eq("eligible", true);
  if (f.hideScam) out = out.neq("jobs.scam_risk", "high");
  if (f.remote) out = out.eq("jobs.is_remote", true);
  if (!opts.ignoreType && f.type !== "all") out = out.eq("jobs.job_type", f.type);
  if (f.india) out = out.or(INDIA_TERMS.map((t) => `location.ilike.*${t}*`).join(","), { referencedTable: "jobs" });
  if (f.fresh) {
    const t24 = new Date(now.getTime() - 86_400_000).toISOString();
    out = out.or(`posted_at.gte.${t24},and(posted_at.is.null,first_seen_at.gte.${t24})`, { referencedTable: "jobs" });
  }
  if (f.q) out = out.or(`title.ilike.*${f.q}*,company_name.ilike.*${f.q}*`, { referencedTable: "jobs" });
  return out;
}

/**
 * One page of the feed. Best match: scored first by score, then unscored by their similarity-based rank;
 * Newest: most recently matched first.
 */
export async function loadFeedPage(profileId: string, f: FeedFilters, offset: number, now: Date, limit = PAGE_SIZE): Promise<{ items: MatchCard[]; total: number }> {
  let q = applyFilters(db().from("job_matches").select(MATCH_SELECT, { count: "exact" }), profileId, f, now);
  q =
    f.sort === "newest"
      ? q.order("created_at", { ascending: false })
      : q.order("score", { ascending: false, nullsFirst: false }).order("rank_score", { ascending: false, nullsFirst: false }).order("similarity", { ascending: false });
  const { data, count, error } = await q.range(offset, offset + limit - 1);
  if (error) throw new Error("Could not load the feed.");
  const items = ((data ?? []) as unknown as MatchRow[]).map((r) => toMatchCard(r, now)).filter((c): c is MatchCard => c !== null);
  return { items, total: count ?? items.length };
}

/** Counts for the All / Internship / Full-time segments (every other active filter applied). */
export async function loadFeedCounts(profileId: string, f: FeedFilters, now: Date): Promise<{ all: number; internship: number; full_time: number }> {
  const count = async (type: FeedFilters["type"]) => {
    const { count: c } = await applyFilters(db().from("job_matches").select("id, jobs!inner(id)", { count: "exact", head: true }), profileId, { ...f, type }, now);
    return c ?? 0;
  };
  const [all, internship, full_time] = await Promise.all([count("all"), count("internship"), count("full_time")]);
  return { all, internship, full_time };
}

export async function loadFeedTelemetry(profileId: string) {
  const client = db();
  const [{ data: profile }, { data: prefs }, { data: run }] = await Promise.all([
    client.from("profiles").select("display_name, college").eq("id", profileId).maybeSingle(),
    client.from("preferences").select("grad_year, degree, telegram_chat_id").eq("profile_id", profileId).maybeSingle(),
    client.from("scan_runs").select("id").order("started_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  const { data: sources } = run ? await client.from("source_runs").select("status").eq("scan_run_id", run.id) : { data: [] as { status: string }[] };
  const list = sources ?? [];
  return {
    displayName: profile?.display_name ?? "",
    college: profile?.college ?? null,
    gradYear: prefs?.grad_year ?? null,
    degree: prefs?.degree ?? null,
    telegramLinked: prefs?.telegram_chat_id != null,
    sourcesOk: list.filter((s) => s.status === "success").length,
    sourcesTotal: list.filter((s) => s.status !== "disabled").length,
  };
}
