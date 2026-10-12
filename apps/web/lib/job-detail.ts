import "server-only";

import { db } from "./db";
import { MATCH_SELECT_WITH_DESCRIPTION } from "./match-query";
import { toMatchCard, type MatchCard, type MatchRow } from "./match-view";
import { referralLinks, type ReferralLink } from "./referrals";

export type TailoredView = { bullets: string[]; coverNote: string; atsKeywords: string[]; createdAt: string };

export type JobDetail = {
  match: MatchCard;
  description: string;
  similar: { id: string; title: string; company: string; location: string | null; similarityPct: number }[];
  referrals: ReferralLink[];
  tailored: TailoredView | null;
  resumeReady: boolean;
  applicationStage: string | null;
  profile: { displayName: string; gradYear: number | null; degree: string | null };
};

export function toTailoredView(row: { bullets: unknown; cover_note: string; ats_keywords: string[] | null; created_at: string }): TailoredView {
  return {
    bullets: Array.isArray(row.bullets) ? row.bullets.filter((b): b is string => typeof b === "string") : [],
    coverNote: row.cover_note,
    atsKeywords: row.ats_keywords ?? [],
    createdAt: row.created_at,
  };
}

/** Drawer data for one job and the signed-in profile. Null when this profile has no match for the job. */
export async function loadJobDetail(profileId: string, jobId: string, now: Date): Promise<JobDetail | null> {
  const client = db();
  const { data: row } = await client.from("job_matches").select(MATCH_SELECT_WITH_DESCRIPTION).eq("profile_id", profileId).eq("job_id", jobId).maybeSingle();
  const match = row ? toMatchCard(row as unknown as MatchRow, now) : null;
  if (!match) return null;

  const [{ data: profile }, { data: prefs }, { data: resume }, { data: similar }, { data: app }] = await Promise.all([
    client.from("profiles").select("display_name, college").eq("id", profileId).maybeSingle(),
    client.from("preferences").select("grad_year, degree").eq("profile_id", profileId).maybeSingle(),
    client.from("resumes").select("id, parse_status").eq("profile_id", profileId).eq("is_active", true).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    client.rpc("similar_jobs", { p_job_id: jobId, p_k: 5 }),
    client.from("applications").select("stage").eq("profile_id", profileId).eq("job_id", jobId).maybeSingle(),
  ]);
  const { data: tailored } = resume
    ? await client.from("tailored_outputs").select("bullets, cover_note, ats_keywords, created_at").eq("profile_id", profileId).eq("job_id", jobId).eq("resume_id", resume.id).maybeSingle()
    : { data: null };

  return {
    match,
    description: ((row as unknown as { jobs: { description: string | null } }).jobs.description ?? "").slice(0, 12_000),
    similar: (similar ?? []).map((s) => ({ id: s.id, title: s.title, company: s.company_name, location: s.location, similarityPct: Math.round(s.similarity * 100) })),
    referrals: referralLinks({ company: match.company, title: match.title, college: profile?.college ?? null }),
    tailored: tailored ? toTailoredView(tailored) : null,
    resumeReady: resume?.parse_status === "done",
    applicationStage: app?.stage ?? null,
    profile: { displayName: profile?.display_name ?? "", gradYear: prefs?.grad_year ?? null, degree: prefs?.degree ?? null },
  };
}
