"""Workday — POST https://{tenant}.wd{n}.myworkdayjobs.com/wday/cxs/{tenant}/{site}/jobs (+ GET .../job/... for detail).

Tokens in ats_companies.yaml are `tenant|wdN|site`. Workday boards are huge (hundreds to thousands of postings), so we
search for entry-level terms only (`intern`, `graduate`), read one page of 20 per term, and detail-fetch at most 8.
"""

from typing import Any

import httpx

from scout_worker.ats.base import AtsCompany, AtsSource
from scout_worker.http import get_json, request
from scout_worker.models import FetchContext, RawJob
from scout_worker.relevance import ats_prefilter

SEARCH_TERMS = ("intern", "graduate")
MAX_DETAILS = 8


def split_token(token: str) -> tuple[str, str, str]:
    tenant, wd, site = token.split("|")
    return tenant, wd, site


def parse_workday_list(data: dict[str, Any], ctx: FetchContext) -> list[dict[str, Any]]:
    return [
        p
        for p in data.get("jobPostings", [])
        if ats_prefilter(p.get("title", ""), p.get("locationsText"), ctx.roles, ctx.locations)
    ]


def to_raw_job(
    posting: dict[str, Any], company: AtsCompany, detail: dict[str, Any] | None
) -> RawJob:
    info = (detail or {}).get("jobPostingInfo") or {}
    tenant, wd, site = split_token(company.token)
    path = posting.get("externalPath", "")
    return RawJob(
        source="workday",
        source_id=f"{tenant}:{info.get('jobReqId') or path}",
        title=info.get("title") or posting.get("title", ""),
        company=company.name,
        location=info.get("location") or posting.get("locationsText"),
        description=info.get("jobDescription"),
        url=info.get("externalUrl") or f"https://{tenant}.{wd}.myworkdayjobs.com/{site}{path}",
        posted_at=info.get("startDate") or posting.get("postedOn"),
        job_type_hint=info.get("timeType"),
        ats="workday",
        company_token=company.token,
    )


class Workday(AtsSource):
    name = "workday"
    ats = "workday"

    async def fetch_company(
        self, client: httpx.AsyncClient, company: AtsCompany, ctx: FetchContext
    ) -> list[RawJob]:
        tenant, wd, site = split_token(company.token)
        base = f"https://{tenant}.{wd}.myworkdayjobs.com/wday/cxs/{tenant}/{site}"
        seen: dict[str, dict[str, Any]] = {}
        for term in SEARCH_TERMS:
            body = {"appliedFacets": {}, "limit": 20, "offset": 0, "searchText": term}
            data = (
                await request(client, "POST", f"{base}/jobs", json=body, throttle=self.throttle)
            ).json()
            for posting in parse_workday_list(data, ctx):
                seen.setdefault(posting["externalPath"], posting)
        jobs: list[RawJob] = []
        for posting in list(seen.values())[:MAX_DETAILS]:
            try:
                detail = await get_json(
                    client, f"{base}{posting['externalPath']}", throttle=self.throttle, attempts=2
                )
            except httpx.HTTPError:
                detail = None
            jobs.append(to_raw_job(posting, company, detail))
        return jobs
