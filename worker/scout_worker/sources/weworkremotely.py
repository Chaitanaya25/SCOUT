"""We Work Remotely — RSS feeds per category (https://weworkremotely.com/categories/<slug>.rss)."""

import xml.etree.ElementTree as ET

import httpx

from scout_worker.http import get_text
from scout_worker.models import FetchContext, RawJob
from scout_worker.relevance import feed_prefilter, remote_region_ok
from scout_worker.sources.base import Source

FEEDS = (
    "https://weworkremotely.com/categories/remote-programming-jobs.rss",
    "https://weworkremotely.com/categories/remote-devops-sysadmin-jobs.rss",
)


def parse_wwr(xml_text: str, ctx: FetchContext) -> list[RawJob]:
    root = ET.fromstring(xml_text)
    jobs: list[RawJob] = []
    for item in root.iter("item"):
        raw_title = (item.findtext("title") or "").strip()
        company, _, title = raw_title.partition(": ")
        if not title:  # no "Company: Role" shape
            company, title = "", raw_title
        region = (item.findtext("region") or "").strip() or "Anywhere in the World"
        if not remote_region_ok(region) or not feed_prefilter(
            title, region, ctx.roles, ctx.locations, True
        ):
            continue
        link = (item.findtext("link") or item.findtext("guid") or "").strip()
        jobs.append(
            RawJob(
                source="weworkremotely",
                source_id=(item.findtext("guid") or link).strip(),
                title=title,
                company=company,
                location=f"Remote - {region}",
                description=item.findtext("description"),
                url=link,
                posted_at=item.findtext("pubDate"),
                is_remote=True,
                job_type_hint=item.findtext("type"),
                extra={"category": item.findtext("category")},
            )
        )
    return jobs


class WeWorkRemotely(Source):
    name = "weworkremotely"
    kind = "remote"

    async def fetch(self, ctx: FetchContext, client: httpx.AsyncClient) -> list[RawJob]:
        jobs: list[RawJob] = []
        for feed in FEEDS:
            jobs.extend(
                parse_wwr(await get_text(client, feed, throttle=self.throttle, interval=1.0), ctx)
            )
        return jobs
