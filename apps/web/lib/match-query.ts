import "server-only";

/** Columns for match cards (feed, dashboard). The job description is long, so only the drawer loads it. */
export const MATCH_SELECT =
  "id, status, score, similarity, rank_score, eligible, missing_skills, breakdown, eligibility, reason, created_at, jobs!inner(id, title, company_name, company_id, location, is_remote, job_type, posted_at, first_seen_at, apply_url, scam_risk, scam_reasons, sources)";

export const MATCH_SELECT_WITH_DESCRIPTION = MATCH_SELECT.replace("sources)", "sources, description)");

/** The matching lookback (worker `LOOKBACK`): the feed and dashboard show jobs first seen in the last 7 days... */
export const LOOKBACK_DAYS = 7;
/** ...but keep anything the user saved or applied to, however old. */
export const FEED_LOOKBACK_DAYS = 14;
