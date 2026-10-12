"""Ashby — GET api.ashbyhq.com/posting-api/job-board/{board} (list includes plain-text descriptions)."""

from typing import Any

import httpx

from scout_worker.ats.base import MAX_PER_COMPANY, AtsCompany, AtsSource
from scout_worker.http import get_json
from scout_worker.models import FetchContext, RawJob
from scout_worker.relevance import ats_prefilter

API = "https://api.ashbyhq.com/posting-api/job-board"


def parse_ashby(data: dict[str, Any], company: AtsCompany, ctx: FetchContext) -> list[RawJob]:
    jobs: list[RawJob] = []
    for job in data.get("jobs", []):
        if job.get("isListed") is False:
            continue
        secondary = [
            s.get("location", "")
            for s in job.get("secondaryLocations") or []
            if isinstance(s, dict)
        ]
        location = " / ".join(filter(None, [job.get("location"), *secondary]))
        if job.get("isRemote") and "remote" not in location.lower():
            location = f"{location} (Remote)".strip()
        if not ats_prefilter(job.get("title", "").strip(), location, ctx.roles, ctx.locations):
            continue
        jobs.append(
            RawJob(
                source="ashby",
                source_id=f"{company.token}:{job['id']}",
                title=job.get("title", "").strip(),
                company=company.name,
                location=location or None,
                description=job.get("descriptionPlain") or job.get("descriptionHtml"),
                url=job.get("jobUrl") or job.get("applyUrl") or "",
                posted_at=job.get("publishedAt"),
                is_remote=bool(job.get("isRemote")) or None,
                job_type_hint=job.get("employmentType"),
                ats="ashby",
                company_token=company.token,
            )
        )
        if len(jobs) >= MAX_PER_COMPANY:
            break
    return jobs


class Ashby(AtsSource):
    name = "ashby"
    ats = "ashby"

    async def fetch_company(
        self, client: httpx.AsyncClient, company: AtsCompany, ctx: FetchContext
    ) -> list[RawJob]:
        data = await get_json(client, f"{API}/{company.token}", throttle=self.throttle)
        return parse_ashby(data, company, ctx)
