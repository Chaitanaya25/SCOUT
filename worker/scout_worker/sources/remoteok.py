"""RemoteOK — https://remoteok.com/api (first element is a legal notice). Terms: link back and name Remote OK."""

from typing import Any

import httpx

from scout_worker.http import get_json
from scout_worker.models import FetchContext, RawJob
from scout_worker.relevance import feed_prefilter, remote_region_ok
from scout_worker.sources.base import Source

URL = "https://remoteok.com/api"


def parse_remoteok(data: list[dict[str, Any]], ctx: FetchContext) -> list[RawJob]:
    jobs: list[RawJob] = []
    for item in data:
        if "legal" in item or not item.get("position"):
            continue  # the first element is the legal notice
        location = item.get("location") or "Worldwide"
        if not remote_region_ok(location) or not feed_prefilter(
            item["position"], location, ctx.roles, ctx.locations, True
        ):
            continue
        jobs.append(
            RawJob(
                source="remoteok",
                source_id=str(item.get("id") or item.get("slug")),
                title=item["position"],
                company=item.get("company", ""),
                location=f"Remote - {location}",
                description=item.get("description"),
                url=item.get("apply_url") or item.get("url") or "",
                posted_at=item.get("date") or item.get("epoch"),
                is_remote=True,
                extra={"tags": item.get("tags", []), "attribution": "Remote OK"},
            )
        )
    return jobs


class RemoteOk(Source):
    name = "remoteok"
    kind = "remote"

    async def fetch(self, ctx: FetchContext, client: httpx.AsyncClient) -> list[RawJob]:
        data = await get_json(
            client, URL, throttle=self.throttle, interval=1.0
        )  # robots.txt: Crawl-delay 1
        return parse_remoteok(data, ctx)
