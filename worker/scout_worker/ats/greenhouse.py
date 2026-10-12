"""Greenhouse — GET boards-api.greenhouse.io/v1/boards/{token}/jobs (list, no content) then /jobs/{id} for candidates only.

ARCHITECTURE.md used `?content=true` on the list; that returns the whole company board with every description
(5 MB for Stripe), so we list lightly, pre-filter, and fetch details for at most MAX_PER_COMPANY roles.
"""

from typing import Any

import httpx

from scout_worker.ats.base import MAX_PER_COMPANY, AtsCompany, AtsSource
from scout_worker.http import get_json
from scout_worker.models import FetchContext, RawJob
from scout_worker.relevance import ats_prefilter

API = "https://boards-api.greenhouse.io/v1/boards"


def parse_greenhouse_list(
    data: dict[str, Any], company: AtsCompany, ctx: FetchContext
) -> list[dict[str, Any]]:
    """Candidate postings from the board list (pre-filtered)."""
    out: list[dict[str, Any]] = []
    for job in data.get("jobs", []):
        location = (job.get("location") or {}).get("name")
        if ats_prefilter(job.get("title", ""), location, ctx.roles, ctx.locations):
            out.append(job)
    return out[:MAX_PER_COMPANY]


def to_raw_job(
    job: dict[str, Any], company: AtsCompany, detail: dict[str, Any] | None = None
) -> RawJob:
    src = detail or job
    return RawJob(
        source="greenhouse",
        source_id=f"{company.token}:{job['id']}",
        title=job.get("title", ""),
        company=job.get("company_name") or company.name,
        location=(job.get("location") or {}).get("name"),
        description=src.get("content"),
        url=job.get("absolute_url", ""),
        posted_at=job.get("first_published") or job.get("updated_at"),
        ats="greenhouse",
        company_token=company.token,
    )


class Greenhouse(AtsSource):
    name = "greenhouse"
    ats = "greenhouse"

    async def fetch_company(
        self, client: httpx.AsyncClient, company: AtsCompany, ctx: FetchContext
    ) -> list[RawJob]:
        data = await get_json(client, f"{API}/{company.token}/jobs", throttle=self.throttle)
        jobs: list[RawJob] = []
        for job in parse_greenhouse_list(data, company, ctx):
            try:
                detail = await get_json(
                    client,
                    f"{API}/{company.token}/jobs/{job['id']}",
                    throttle=self.throttle,
                    attempts=2,
                )
            except httpx.HTTPError:
                detail = None  # keep the posting with a title only; scoring will treat it as thin
            jobs.append(to_raw_job(job, company, detail))
        return jobs
