"""Why-was-this-filtered counters (EXTRA 2), stored per profile in `scan_runs.stats.filter[<slug>]`.

Snapshot over the profile's matches inside the matching lookback window (the same jobs the feed shows), so the
Settings panel can explain what a user does NOT see: ineligible (split by reason), high scam risk, scored below
the profile's minimum score, plus scored vs not-yet-scored eligible matches.
"""

from datetime import datetime, timedelta
from typing import Any

ELIGIBILITY_REASONS = ("senior_title", "experience", "batch_year", "job_type", "location", "other")


def failed_reason(label: str) -> str:
    """Map a failed eligibility check label (pipeline/eligibility.py) to a reason bucket."""
    low = label.lower()
    if "entry-level" in low or "senior" in low:
        return "senior_title"
    if "experience" in low or "years" in low:
        return "experience"
    if "batch" in low:
        return "batch_year"
    if "job type" in low:
        return "job_type"
    if "location" in low:
        return "location"
    return "other"


def empty_stats() -> dict[str, Any]:
    return {
        "eligibility": dict.fromkeys(ELIGIBILITY_REASONS, 0),
        "ineligible": 0,
        "scam_high": 0,
        "low_score": 0,
        "scored": 0,
        "unscored": 0,
        "total": 0,
    }


def aggregate(rows: list[dict[str, Any]], min_score: int) -> dict[str, Any]:
    """rows: {eligible, eligibility (list of {label, status}), scam_risk, score}. A job dropped for several
    eligibility reasons counts once per reason (the panel says so); `ineligible` counts jobs."""
    out = empty_stats()
    for r in rows:
        out["total"] += 1
        if r["scam_risk"] == "high":
            out["scam_high"] += 1
            continue
        if not r["eligible"]:
            out["ineligible"] += 1
            reasons = {
                failed_reason(c.get("label", ""))
                for c in (r.get("eligibility") or [])
                if isinstance(c, dict) and c.get("status") == "fail"
            }
            for reason in reasons or {"other"}:
                out["eligibility"][reason] += 1
            continue
        if r["score"] is None:
            out["unscored"] += 1
        else:
            out["scored"] += 1
            if r["score"] < min_score:
                out["low_score"] += 1
    return out


SELECT_ROWS = """
select m.eligible, m.eligibility, j.scam_risk::text as scam_risk, m.score
from job_matches m join jobs j on j.id = m.job_id
where m.profile_id = %s and j.is_active and j.first_seen_at > %s
"""


async def profile_filter_stats(
    pool, profile_id: str, min_score: int, now: datetime, lookback: timedelta
) -> dict[str, Any]:
    async with pool.connection() as conn:
        cur = await conn.execute(SELECT_ROWS, (profile_id, now - lookback))
        rows = await cur.fetchall()
    return aggregate(rows, min_score)
