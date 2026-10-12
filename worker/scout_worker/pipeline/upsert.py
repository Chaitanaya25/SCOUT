"""Upsert normalized jobs (ARCHITECTURE.md §7.2): conflict on dedupe_key merges sources, keeps the ATS apply URL and
the longest description, and refreshes last_seen_at / is_active."""

from datetime import datetime

from psycopg import AsyncConnection

from scout_worker.ats.base import AtsCompany
from scout_worker.models import Job
from scout_worker.pipeline.dedupe import ATS_SOURCES

UPSERT_SQL = """
insert into jobs (dedupe_key, sources, source_ids, company_id, company_name, title, location, is_remote,
                  job_type, description, apply_url, posted_at, first_seen_at, last_seen_at, is_active,
                  scam_risk, scam_reasons)
values (%(dedupe_key)s, %(sources)s, %(source_ids)s, %(company_id)s, %(company_name)s, %(title)s, %(location)s,
        %(is_remote)s, %(job_type)s, %(description)s, %(apply_url)s, %(posted_at)s, %(now)s, %(now)s, true,
        %(scam_risk)s::scam_risk, %(scam_reasons)s)
on conflict (dedupe_key) do update set
  sources = (select coalesce(array_agg(distinct s), '{}') from unnest(jobs.sources || excluded.sources) as s),
  source_ids = jobs.source_ids || excluded.source_ids,
  company_id = coalesce(jobs.company_id, excluded.company_id),
  apply_url = case when excluded.sources && %(ats_sources)s::text[] and not jobs.sources && %(ats_sources)s::text[]
                   then excluded.apply_url else jobs.apply_url end,
  description = case when length(coalesce(excluded.description, '')) > length(coalesce(jobs.description, ''))
                     then excluded.description else jobs.description end,
  last_seen_at = excluded.last_seen_at,
  is_active = true,
  scam_risk = greatest(jobs.scam_risk, excluded.scam_risk),
  scam_reasons = (select coalesce(array_agg(distinct r), '{}') from unnest(jobs.scam_reasons || excluded.scam_reasons) as r)
returning (xmax = 0) as inserted, id
"""


async def ensure_companies(
    conn: AsyncConnection, companies: list[AtsCompany]
) -> dict[tuple[str, str], str]:
    """Upsert the curated ATS companies; returns (ats, token) → companies.id."""
    ids: dict[tuple[str, str], str] = {}
    for c in companies:
        cur = await conn.execute(
            """insert into companies (name, ats, ats_token) values (%s, %s::ats_type, %s)
               on conflict (ats, ats_token) do update set name = excluded.name returning id""",
            (c.name, c.ats, c.token),
        )
        row = await cur.fetchone()
        ids[(c.ats, c.token)] = str(row["id"])  # type: ignore[index]
    await conn.commit()
    return ids


async def upsert_jobs(
    conn: AsyncConnection,
    jobs: list[Job],
    now: datetime,
    company_ids: dict[tuple[str, str], str] | None = None,
) -> dict[str, int]:
    """Upsert all jobs; returns {source: new_job_count} (a new job is counted for its first source)."""
    import json

    new_by_source: dict[str, int] = {}
    for job in jobs:
        company_id = (company_ids or {}).get((job.ats or "", job.company_token or ""))
        cur = await conn.execute(
            UPSERT_SQL,
            {
                "dedupe_key": job.dedupe_key,
                "sources": job.sources,
                "source_ids": json.dumps(job.source_ids),
                "company_id": company_id,
                "company_name": job.company_name,
                "title": job.title,
                "location": job.location,
                "is_remote": job.is_remote,
                "job_type": job.job_type,
                "description": job.description,
                "apply_url": job.apply_url,
                "posted_at": job.posted_at or now,
                "now": now,
                "scam_risk": job.scam_risk,
                "scam_reasons": job.scam_reasons,
                "ats_sources": sorted(ATS_SOURCES),
            },
        )
        row = await cur.fetchone()
        if row and row["inserted"]:
            new_by_source[job.sources[0]] = new_by_source.get(job.sources[0], 0) + 1
    await conn.commit()
    return new_by_source
