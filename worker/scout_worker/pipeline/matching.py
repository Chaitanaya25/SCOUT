"""Per-profile matching (ARCHITECTURE.md §7.3, §7.6, §8.3).

For each profile with an active resume: (1) rule-based eligibility for every unseen recent job (ineligible jobs get
a job_matches row with eligible=false), (2) vector-rank the top-K unscored eligible jobs, (3) Gemini-score them in
batches, (4) freshness / rank_score / breakdown. Every query is filtered by this profile's id. If Gemini is
unavailable the rows keep similarity-only rank scores and are never notified (no score).
"""

import json
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any

from pgvector import Vector

from scout_worker.config import Settings
from scout_worker.llm import LlmClient, LlmError
from scout_worker.logging import get_logger
from scout_worker.pipeline.eligibility import JobView, Prefs, check_eligibility
from scout_worker.pipeline.embed import resume_embed_text
from scout_worker.pipeline.rank import build_breakdown, freshness, rank_score, similarity_rank_score
from scout_worker.pipeline.scam import raise_risk
from scout_worker.pipeline.score import (
    ScoreItem,
    filter_missing_skills,
    grounded_scam_signals,
    score_batch,
)

log = get_logger("matching")
LOOKBACK = timedelta(days=7)


@dataclass
class ProfileCtx:
    profile_id: str
    slug: str
    display_name: str
    prefs: Prefs
    min_score: int
    roles: list[str]
    resume_id: str
    resume_embedding: list[float] | None
    parsed: dict[str, Any]
    skills: list[str]
    telegram_chat_id: int | None = None
    watched_company_ids: set[str] = field(default_factory=set)

    def candidate_json(self) -> dict[str, Any]:
        return {
            "name": self.display_name,
            "skills": self.skills,
            "summary": self.parsed.get("summary"),
            "education": {
                "degree": self.prefs.degree,
                "grad_year": self.prefs.grad_year,
                "college": self.parsed.get("college"),
            },
            "experience": self.parsed.get("experience") or [],
            "projects": self.parsed.get("projects") or [],
            "target_roles": self.roles,
            "max_experience_years": self.prefs.max_experience_years,
        }


async def load_profiles(pool) -> list[ProfileCtx]:
    """Profiles that have an active, parsed resume (a resume still `pending` AI parsing cannot be matched yet)."""
    async with pool.connection() as conn:
        cur = await conn.execute(
            """select p.id, p.slug, p.display_name, pr.roles, pr.locations, pr.remote_ok, pr.job_types::text[] as job_types, pr.grad_year, pr.degree,
                      pr.max_experience_years, pr.has_active_backlogs, pr.min_score, pr.telegram_chat_id,
                      r.id as resume_id, r.embedding, r.parsed, r.skills
               from profiles p
               join preferences pr on pr.profile_id = p.id
               join lateral (select * from resumes where profile_id = p.id and is_active and parse_status = 'done' order by created_at desc limit 1) r on true
               order by p.slug"""
        )
        rows = await cur.fetchall()
        profiles: list[ProfileCtx] = []
        for r in rows:
            wc = await conn.execute(
                "select company_id from watched_companies where profile_id = %s", (r["id"],)
            )
            profiles.append(
                ProfileCtx(
                    profile_id=str(r["id"]),
                    slug=r["slug"],
                    display_name=r["display_name"],
                    prefs=Prefs(
                        grad_year=r["grad_year"],
                        max_experience_years=r["max_experience_years"],
                        job_types=[str(t) for t in r["job_types"]],
                        locations=list(r["locations"]),
                        remote_ok=r["remote_ok"],
                        degree=r["degree"],
                        has_active_backlogs=r["has_active_backlogs"],
                    ),
                    min_score=r["min_score"],
                    roles=list(r["roles"]),
                    resume_id=str(r["resume_id"]),
                    resume_embedding=r["embedding"].to_list()
                    if r["embedding"] is not None
                    else None,
                    parsed=r["parsed"] or {},
                    skills=list(r["skills"]),
                    telegram_chat_id=r["telegram_chat_id"],
                    watched_company_ids={str(w["company_id"]) for w in await wc.fetchall()},
                )
            )
    return profiles


async def ensure_resume_embedding(pool, llm: LlmClient, profile: ProfileCtx) -> bool:
    """The web upload normally stores the resume embedding; if it is missing (quota hiccup) compute it here once."""
    if profile.resume_embedding is not None:
        return True
    text = resume_embed_text(profile.parsed, profile.roles)
    try:
        (vec,) = await llm.embed([text], "RETRIEVAL_QUERY")
    except LlmError as exc:
        log.warning("resume_embedding_unavailable", profile=profile.slug, reason=type(exc).__name__)
        return False
    async with pool.connection() as conn:
        await conn.execute(
            "update resumes set embedding = %s where id = %s and profile_id = %s",
            (Vector(vec), profile.resume_id, profile.profile_id),
        )
        await conn.commit()
    profile.resume_embedding = vec
    return True


async def evaluate_eligibility(pool, profile: ProfileCtx, now: datetime) -> int:
    """Insert a job_matches row (with eligibility checks + similarity) for every recent embedded job this profile has no row for."""
    assert profile.resume_embedding is not None
    async with pool.connection() as conn:
        cur = await conn.execute(
            """select j.id, j.title, j.description, j.location, j.is_remote, j.job_type, 1 - (j.embedding <=> %s) as similarity
               from jobs j
               where j.is_active and j.embedding is not null and j.first_seen_at > %s
                 and not exists (select 1 from job_matches m where m.job_id = j.id and m.profile_id = %s)""",
            (Vector(profile.resume_embedding), now - LOOKBACK, profile.profile_id),
        )
        rows = await cur.fetchall()
        for r in rows:
            res = check_eligibility(
                JobView(
                    r["title"], r["description"], r["location"], r["is_remote"], str(r["job_type"])
                ),
                profile.prefs,
            )
            await conn.execute(
                """insert into job_matches (profile_id, job_id, similarity, eligible, eligibility)
                   values (%s, %s, %s, %s, %s::jsonb) on conflict (profile_id, job_id) do nothing""",
                (
                    profile.profile_id,
                    r["id"],
                    float(r["similarity"]),
                    res.eligible,
                    json.dumps(res.checks),
                ),
            )
        await conn.commit()
    return len(rows)


async def top_candidates(pool, profile: ProfileCtx, now: datetime, k: int) -> list[dict[str, Any]]:
    assert profile.resume_embedding is not None
    async with pool.connection() as conn:
        cur = await conn.execute(
            """select j.id as job_id, j.title, j.company_name, j.company_id, j.location, j.description, j.posted_at, j.scam_risk,
                      c.similarity, m.eligibility
               from match_candidates_v2(%s, %s, %s, %s) c
               join jobs j on j.id = c.job_id
               join job_matches m on m.job_id = j.id and m.profile_id = %s""",
            (
                profile.profile_id,
                Vector(profile.resume_embedding),
                now - LOOKBACK,
                k,
                profile.profile_id,
            ),
        )
        return await cur.fetchall()


def merge_checks(
    rule_checks: list[dict[str, str]], model_checks: list[dict[str, str]]
) -> list[dict[str, str]]:
    """Rule results win; model checks are added when their label is new."""
    merged = list(rule_checks)
    seen = {c["label"].lower() for c in rule_checks}
    for c in model_checks:
        if c["label"].lower() not in seen:
            merged.append({"label": c["label"], "status": c["status"]})
            seen.add(c["label"].lower())
    return merged


async def apply_scores(
    pool, profile: ProfileCtx, rows: list[dict[str, Any]], items: list[ScoreItem], now: datetime
) -> int:
    by_id = {str(r["job_id"]): r for r in rows}
    applied = 0
    async with pool.connection() as conn:
        for item in items:
            row = by_id.get(item.job_id)
            if not row:
                continue
            text = f"{row['title']}\n{row['description'] or ''}"
            fresh = freshness(row["posted_at"], now)
            checks = merge_checks(
                row["eligibility"] or [], [e.model_dump() for e in item.eligibility]
            )
            watched = (
                str(row["company_id"]) in profile.watched_company_ids
                if row["company_id"]
                else False
            )
            await conn.execute(
                """update job_matches set score = %s, rank_score = %s, breakdown = %s::jsonb, eligibility = %s::jsonb,
                          missing_skills = %s, reason = %s
                   where profile_id = %s and job_id = %s""",
                (
                    item.score,
                    rank_score(item.score, fresh, watched),
                    json.dumps(build_breakdown(item.skills_score, checks, fresh)),
                    json.dumps(checks),
                    filter_missing_skills(item.missing_skills, text, profile.skills),
                    item.reason or None,
                    profile.profile_id,
                    row["job_id"],
                ),
            )
            signals = grounded_scam_signals(item.scam_signals, text)
            if signals:
                risk, _ = raise_risk(row["scam_risk"], signals)
                await conn.execute(
                    """update jobs set scam_risk = greatest(scam_risk, %s::scam_risk),
                              scam_reasons = (select coalesce(array_agg(distinct r), '{}') from unnest(scam_reasons || %s::text[]) as r)
                       where id = %s""",
                    (risk, signals, row["job_id"]),
                )
            applied += 1
        await conn.commit()
    return applied


async def apply_similarity_only(
    pool, profile: ProfileCtx, rows: list[dict[str, Any]], now: datetime
) -> None:
    """Graceful degradation: order unscored rows by similarity + freshness. No `score`, so they are never notified."""
    async with pool.connection() as conn:
        for r in rows:
            watched = (
                str(r["company_id"]) in profile.watched_company_ids if r["company_id"] else False
            )
            await conn.execute(
                "update job_matches set rank_score = %s where profile_id = %s and job_id = %s and score is null",
                (
                    similarity_rank_score(
                        float(r["similarity"]), freshness(r["posted_at"], now), watched
                    ),
                    profile.profile_id,
                    r["job_id"],
                ),
            )
        await conn.commit()


async def score_profile(
    pool, llm: LlmClient, settings: Settings, profile: ProfileCtx, now: datetime
) -> dict[str, int]:
    """Run steps 2-4 for one profile. Returns counts for the scan stats."""
    stats = {"eligibility_rows": 0, "candidates": 0, "scored": 0, "degraded": 0}
    if not await ensure_resume_embedding(pool, llm, profile):
        return stats
    stats["eligibility_rows"] = await evaluate_eligibility(pool, profile, now)
    rows = await top_candidates(pool, profile, now, settings.score_top_k)
    stats["candidates"] = len(rows)
    scored_ids: set[str] = set()
    size = max(1, settings.score_batch_size)
    for i in range(0, len(rows), size):
        chunk = rows[i : i + size]
        payload = [
            {
                "job_id": str(r["job_id"]),
                "title": r["title"],
                "company": r["company_name"],
                "location": r["location"],
                "description": r["description"],
            }
            for r in chunk
        ]
        try:
            items = await score_batch(llm, profile.candidate_json(), payload)
        except LlmError as exc:
            log.warning("scoring_degraded", profile=profile.slug, reason=type(exc).__name__)
            break
        stats["scored"] += await apply_scores(pool, profile, chunk, items, now)
        scored_ids.update(i.job_id for i in items)
    unscored = [r for r in rows if str(r["job_id"]) not in scored_ids]
    if unscored:
        await apply_similarity_only(pool, profile, unscored, now)
        stats["degraded"] = len(unscored)
    return stats
