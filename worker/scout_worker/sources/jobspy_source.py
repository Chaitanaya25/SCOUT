"""python-jobspy aggregator: LinkedIn / Indeed / Google / Naukri / Glassdoor public job listings.

Rules: public listings only — no profiles, no login, no messaging; LinkedIn descriptions are NOT fetched (that would
mean one extra request per job). Low volume: few results per query and ONE call per role term per scan covering all
sites. A site that returns nothing for every role term is reported as blocked/empty for the run and the scan goes on.
"""

import asyncio
from typing import Any

import httpx

from scout_worker.models import FetchContext, RawJob
from scout_worker.relevance import feed_prefilter
from scout_worker.sources.base import Source

RESULTS_PER_QUERY = 8
HOURS_OLD = 72


def _clean(value: Any) -> Any:
    """pandas NaN/NaT/None → None."""
    try:
        if value is None or value != value:
            return None
    except (TypeError, ValueError):
        return value
    return value


def parse_jobspy_rows(
    rows: list[dict[str, Any]], ctx: FetchContext
) -> tuple[list[RawJob], dict[str, int]]:
    """Convert jobspy DataFrame rows (as dicts) to RawJobs; also returns per-site raw counts."""
    jobs: list[RawJob] = []
    per_site: dict[str, int] = {}
    for row in rows:
        site = str(_clean(row.get("site")) or "jobspy")
        per_site[site] = per_site.get(site, 0) + 1
        title = _clean(row.get("title")) or ""
        company = _clean(row.get("company")) or ""
        location = _clean(row.get("location"))
        url = _clean(row.get("job_url_direct")) or _clean(row.get("job_url")) or ""
        remote = _clean(row.get("is_remote"))
        if not (title and company and url) or not feed_prefilter(
            title, location or "India", ctx.roles, ctx.locations, bool(remote) or None
        ):
            continue
        job_type = _clean(row.get("job_type"))
        jobs.append(
            RawJob(
                source="jobspy",
                source_id=f"{site}:{_clean(row.get('id')) or url}",
                title=title,
                company=company,
                location=location,
                description=_clean(row.get("description")),
                url=url,
                posted_at=str(_clean(row.get("date_posted")))
                if _clean(row.get("date_posted"))
                else None,
                is_remote=bool(remote) if remote is not None else None,
                job_type_hint=str(job_type) if job_type else None,
                extra={"site": site},
            )
        )
    return jobs, per_site


class JobSpy(Source):
    name = "jobspy"
    kind = "aggregator"

    def _sites(self) -> list[str]:
        return [s.strip() for s in self.settings.jobspy_sites.split(",") if s.strip()]

    def _scrape(self, role: str, ctx: FetchContext) -> list[dict[str, Any]]:
        from jobspy import (
            scrape_jobs,
        )  # imported lazily: heavy (pandas) and not needed by other commands

        frame = scrape_jobs(
            site_name=self._sites(),
            search_term=role,
            google_search_term=f"{role} jobs in India since yesterday",
            location="India",
            results_wanted=min(RESULTS_PER_QUERY, ctx.results_per_query),
            hours_old=HOURS_OLD,
            country_indeed="India",
            linkedin_fetch_description=False,
            description_format="plain",
            verbose=0,
        )
        return frame.to_dict(orient="records")

    async def fetch(self, ctx: FetchContext, client: httpx.AsyncClient) -> list[RawJob]:
        jobs: list[RawJob] = []
        totals: dict[str, int] = {}
        for role in ctx.role_terms(3):
            rows = await asyncio.to_thread(self._scrape, role, ctx)
            parsed, per_site = parse_jobspy_rows(rows, ctx)
            jobs.extend(parsed)
            for site, n in per_site.items():
                totals[site] = totals.get(site, 0) + n
        for site in self._sites():
            key = "google" if site == "google" else site
            if totals.get(key, 0) == 0:
                self.notes.append(
                    f"{site}: no results this run (blocked, rate-limited or nothing matched); skipped"
                )
        return jobs
