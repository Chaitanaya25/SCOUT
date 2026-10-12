"""Remotive — https://remotive.com/api/remote-jobs. Terms: max ~4 requests/day, jobs delayed 24h, link back and name Remotive."""

from datetime import timedelta
from typing import Any

import httpx

from scout_worker.http import get_json
from scout_worker.models import FetchContext, RawJob
from scout_worker.relevance import feed_prefilter, remote_region_ok
from scout_worker.sources.base import Source

URL = "https://remotive.com/api/remote-jobs"


def parse_remotive(data: dict[str, Any], ctx: FetchContext) -> list[RawJob]:
    jobs: list[RawJob] = []
    for item in data.get("jobs", []):
        location = item.get("candidate_required_location") or "Worldwide"
        title = item.get("title", "")
        if not remote_region_ok(location) or not feed_prefilter(
            title, location, ctx.roles, ctx.locations, True
        ):
            continue
        jobs.append(
            RawJob(
                source="remotive",
                source_id=str(item["id"]),
                title=title,
                company=item.get("company_name", ""),
                location=f"Remote - {location}",
                description=item.get("description"),
                url=item.get("url", ""),
                posted_at=item.get("publication_date"),
                is_remote=True,
                job_type_hint=item.get("job_type"),
                extra={"attribution": "Remotive", "tags": item.get("tags", [])},
            )
        )
    return jobs


class Remotive(Source):
    name = "remotive"
    kind = "remote"
    min_interval = timedelta(hours=6)  # 4 requests/day at most, as Remotive asks

    async def fetch(self, ctx: FetchContext, client: httpx.AsyncClient) -> list[RawJob]:
        data = await get_json(
            client, URL, params={"category": "software-dev", "limit": 100}, throttle=self.throttle
        )
        return parse_remotive(data, ctx)
