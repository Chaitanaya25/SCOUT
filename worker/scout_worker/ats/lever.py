"""Lever — GET api.lever.co/v0/postings/{company}?mode=json (list already includes plain-text descriptions)."""

from typing import Any

import httpx

from scout_worker.ats.base import MAX_PER_COMPANY, AtsCompany, AtsSource
from scout_worker.http import get_json
from scout_worker.models import FetchContext, RawJob
from scout_worker.relevance import ats_prefilter

API = "https://api.lever.co/v0/postings"


def _location(job: dict[str, Any]) -> str | None:
    cats = job.get("categories") or {}
    locations = cats.get("allLocations") or ([cats["location"]] if cats.get("location") else [])
    text = " / ".join(locations)
    workplace = job.get("workplaceType")
    return f"{text} ({workplace})" if text and workplace else (text or workplace)


def parse_lever(data: list[dict[str, Any]], company: AtsCompany, ctx: FetchContext) -> list[RawJob]:
    jobs: list[RawJob] = []
    for job in data:
        location = _location(job)
        if not ats_prefilter(job.get("text", ""), location, ctx.roles, ctx.locations):
            continue
        lists_text = "\n".join(
            f"{item.get('text', '')}\n{item.get('content', '')}" for item in job.get("lists") or []
        )
        description = "\n\n".join(
            part
            for part in (
                job.get("descriptionPlain"),
                lists_text,
                job.get("additionalPlain"),
                job.get("descriptionBodyPlain"),
            )
            if part
        )
        jobs.append(
            RawJob(
                source="lever",
                source_id=f"{company.token}:{job['id']}",
                title=job.get("text", ""),
                company=company.name,
                location=location,
                description=description,
                url=job.get("hostedUrl") or job.get("applyUrl") or "",
                posted_at=job.get("createdAt"),
                is_remote=(job.get("workplaceType") == "remote") or None,
                job_type_hint=(job.get("categories") or {}).get("commitment"),
                ats="lever",
                company_token=company.token,
            )
        )
        if len(jobs) >= MAX_PER_COMPANY:
            break
    return jobs


class Lever(AtsSource):
    name = "lever"
    ats = "lever"

    async def fetch_company(
        self, client: httpx.AsyncClient, company: AtsCompany, ctx: FetchContext
    ) -> list[RawJob]:
        data = await get_json(
            client, f"{API}/{company.token}", params={"mode": "json"}, throttle=self.throttle
        )
        return parse_lever(data, company, ctx)
