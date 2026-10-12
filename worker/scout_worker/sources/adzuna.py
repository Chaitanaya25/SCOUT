"""Adzuna (India) — https://api.adzuna.com/v1/api/jobs/in/search/{page}. Needs ADZUNA_APP_ID / ADZUNA_APP_KEY.

UNVERIFIED LIVE: no keys were available when this was written; the parser follows Adzuna's documented response shape
and tests/fixtures/adzuna.json is hand-written from those docs (not a live capture).
"""

from typing import Any

import httpx

from scout_worker.http import get_json
from scout_worker.models import FetchContext, RawJob
from scout_worker.relevance import feed_prefilter
from scout_worker.sources.base import Source

URL = "https://api.adzuna.com/v1/api/jobs/in/search/1"


def parse_adzuna(data: dict[str, Any], ctx: FetchContext) -> list[RawJob]:
    jobs: list[RawJob] = []
    for item in data.get("results", []):
        title = item.get("title", "")
        location = (item.get("location") or {}).get("display_name")
        if not feed_prefilter(title, location or "India", ctx.roles, ctx.locations):
            continue
        jobs.append(
            RawJob(
                source="adzuna",
                source_id=str(item.get("id")),
                title=title,
                company=(item.get("company") or {}).get("display_name", ""),
                location=location,
                description=item.get("description"),
                url=item.get("redirect_url", ""),
                posted_at=item.get("created"),
                job_type_hint=item.get("contract_time"),
                extra={"salary_min": item.get("salary_min"), "salary_max": item.get("salary_max")},
            )
        )
    return jobs


class Adzuna(Source):
    name = "adzuna"
    kind = "aggregator"

    def unavailable_reason(self) -> str | None:
        if not (self.settings.adzuna_app_id and self.settings.adzuna_app_key):
            return "ADZUNA_APP_ID / ADZUNA_APP_KEY not set"
        return None

    async def fetch(self, ctx: FetchContext, client: httpx.AsyncClient) -> list[RawJob]:
        jobs: list[RawJob] = []
        for role in ctx.role_terms(3):
            params = {
                "app_id": self.settings.adzuna_app_id,
                "app_key": self.settings.adzuna_app_key,
                "results_per_page": ctx.results_per_query,
                "what": role,
                "max_days_old": 3,
                "sort_by": "date",
                "content-type": "application/json",
            }
            jobs.extend(
                parse_adzuna(
                    await get_json(client, URL, params=params, throttle=self.throttle), ctx
                )
            )
        return jobs
