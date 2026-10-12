"""Himalayas — public jobs API: https://himalayas.app/jobs/api/search?q=... (feed at /jobs/api uses cursor pagination)."""

from typing import Any

import httpx

from scout_worker.http import get_json
from scout_worker.models import FetchContext, RawJob
from scout_worker.relevance import feed_prefilter, remote_region_ok
from scout_worker.sources.base import Source

URL = "https://himalayas.app/jobs/api/search"


def parse_himalayas(data: dict[str, Any], ctx: FetchContext) -> list[RawJob]:
    jobs: list[RawJob] = []
    for item in data.get("jobs", []):
        restrictions = item.get("locationRestrictions") or []
        location_text = ", ".join(restrictions)
        title = item.get("title", "")
        if restrictions and not remote_region_ok(location_text):
            continue
        if not feed_prefilter(title, location_text or "Worldwide", ctx.roles, ctx.locations, True):
            continue
        jobs.append(
            RawJob(
                source="himalayas",
                source_id=str(item.get("guid") or item.get("applicationLink")),
                title=title,
                company=item.get("companyName", ""),
                location=f"Remote - {location_text}" if location_text else "Remote - Worldwide",
                description=item.get("description") or item.get("excerpt"),
                url=item.get("applicationLink") or item.get("guid") or "",
                posted_at=item.get("pubDate"),
                is_remote=True,
                job_type_hint=item.get("employmentType"),
                extra={"seniority": item.get("seniority", [])},
            )
        )
    return jobs


class Himalayas(Source):
    name = "himalayas"
    kind = "remote"

    async def fetch(self, ctx: FetchContext, client: httpx.AsyncClient) -> list[RawJob]:
        jobs: list[RawJob] = []
        for role in ctx.role_terms(3):
            data = await get_json(
                client, URL, params={"q": role, "limit": 20}, throttle=self.throttle, interval=1.0
            )
            jobs.extend(parse_himalayas(data, ctx))
        return jobs
