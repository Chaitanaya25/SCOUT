import "server-only";

import type { AppStage, MatchStatus } from "./database.types";
import { db } from "./db";

/** IST calendar date (YYYY-MM-DD) used for applied_at. */
export function todayIst(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(now);
}

/** Stage order for "never demote": a Save must not move an Interview back to Saved. */
const STAGE_RANK: Record<AppStage, number> = { saved: 0, applied: 1, oa: 2, interview: 3, offer: 4, rejected: 5 };

/**
 * Sets a match's status for one profile and keeps the tracker in step (PRD F6):
 * saved → application in Saved (created if missing); applied → Applied with today's date (only promotes);
 * skipped / new → the application, if any, is left alone. Returns null when the match is not this profile's.
 */
export async function setMatchStatus(profileId: string, matchId: string, status: MatchStatus): Promise<{ jobId: string } | null> {
  const client = db();
  const { data: match } = await client.from("job_matches").select("id, job_id").eq("id", matchId).eq("profile_id", profileId).maybeSingle();
  if (!match) return null;
  const { error } = await client.from("job_matches").update({ status }).eq("id", match.id).eq("profile_id", profileId);
  if (error) throw new Error("Could not update the match.");
  if (status === "saved" || status === "applied") await upsertApplication(profileId, match.job_id, status);
  return { jobId: match.job_id };
}

async function upsertApplication(profileId: string, jobId: string, stage: "saved" | "applied") {
  const client = db();
  const { data: job } = await client.from("jobs").select("company_name, title, apply_url").eq("id", jobId).maybeSingle();
  if (!job) return;
  const { data: existing } = await client.from("applications").select("id, stage").eq("profile_id", profileId).eq("job_id", jobId).maybeSingle();
  if (!existing) {
    const { data: last } = await client
      .from("applications")
      .select("position")
      .eq("profile_id", profileId)
      .eq("stage", stage)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();
    await client.from("applications").insert({
      profile_id: profileId,
      job_id: jobId,
      company_name: job.company_name,
      role: job.title,
      apply_url: job.apply_url,
      stage,
      position: (last?.position ?? -1) + 1,
      applied_at: stage === "applied" ? todayIst() : null,
    });
    return;
  }
  if (STAGE_RANK[stage] > STAGE_RANK[existing.stage as AppStage]) {
    await client.from("applications").update({ stage, applied_at: todayIst() }).eq("id", existing.id).eq("profile_id", profileId);
  }
}

/** Tracker → feed: moving an application keeps its match status consistent (Saved ↔ saved, later stages ↔ applied). */
export async function syncMatchFromStage(profileId: string, jobId: string | null, stage: AppStage): Promise<void> {
  if (!jobId) return;
  const status: MatchStatus = stage === "saved" ? "saved" : "applied";
  await db().from("job_matches").update({ status }).eq("profile_id", profileId).eq("job_id", jobId);
}
