"""Arbeitnow — https://www.arbeitnow.com/api/job-board-api (page 1 only; mostly Europe, so only remote/India roles are kept)."""

from typing import Any

import httpx

from scout_worker.http import get_json
from scout_worker.models import FetchContext, RawJob
from scout_worker.relevance import INDIA_RE, REMOTE_RE, feed_prefilter, remote_region_ok
from scout_worker.sources.base import Source

URL = "https://www.arbeitnow.com/api/job-board-api"


def parse_arbeitnow(data: dict[str, Any], ctx: FetchContext) -> list[RawJob]:
    jobs: list[RawJob] = []
    for item in data.get("data", []):
        location = item.get("location") or ""
        remote = bool(item.get("remote"))
        title = item.get("title", "")
        in_scope = bool(INDIA_RE.search(location)) or (
            remote and (not location or REMOTE_RE.search(location) or remote_region_ok(location))
        )
        if not in_scope or not feed_prefilter(
            title, location or "Remote", ctx.roles, ctx.locations, remote
        ):
            continue
        jobs.append(
            RawJob(
                source="arbeitnow",
                source_id=str(item.get("slug")),
                title=title,
                company=item.get("company_name", ""),
                location=location or ("Remote" if remote else None),
                description=item.get("description"),
                url=item.get("url", ""),
                posted_at=item.get("created_at"),
                is_remote=remote,
                job_type_hint=", ".join(item.get("job_types") or []),
                extra={"tags": item.get("tags", [])},
            )
        )
    return jobs


class Arbeitnow(Source):
    name = "arbeitnow"
    kind = "remote"

    async def fetch(self, ctx: FetchContext, client: httpx.AsyncClient) -> list[RawJob]:
        return parse_arbeitnow(await get_json(client, URL, throttle=self.throttle), ctx)
