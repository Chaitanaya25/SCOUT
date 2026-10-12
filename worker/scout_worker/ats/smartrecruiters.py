"""SmartRecruiters — GET api.smartrecruiters.com/v1/companies/{id}/postings (+ /postings/{id} for candidates).

Company identifiers are case-sensitive (e.g. `BoschGroup`, `Ubisoft2`). The list is filtered with country=in.
"""

from typing import Any

import httpx

from scout_worker.ats.base import MAX_PER_COMPANY, AtsCompany, AtsSource
from scout_worker.http import get_json
from scout_worker.models import FetchContext, RawJob
from scout_worker.relevance import ats_prefilter

API = "https://api.smartrecruiters.com/v1/companies"


def _location(posting: dict[str, Any]) -> str | None:
    loc = posting.get("location") or {}
    text = loc.get("fullLocation") or ", ".join(
        filter(None, [loc.get("city"), (loc.get("country") or "").upper()])
    )
    return f"{text} (Remote)" if text and loc.get("remote") else text or None


def parse_smartrecruiters_list(data: dict[str, Any], ctx: FetchContext) -> list[dict[str, Any]]:
    out = [
        p
        for p in data.get("content", [])
        if ats_prefilter(p.get("name", ""), _location(p), ctx.roles, ctx.locations)
    ]
    return out[:MAX_PER_COMPANY]


def to_raw_job(
    posting: dict[str, Any], company: AtsCompany, detail: dict[str, Any] | None = None
) -> RawJob:
    sections = ((detail or {}).get("jobAd") or {}).get("sections") or {}
    description = "\n".join(
        (sections.get(k) or {}).get("text", "")
        for k in ("jobDescription", "qualifications", "additionalInformation")
    )
    src = detail or posting
    return RawJob(
        source="smartrecruiters",
        source_id=f"{company.token}:{posting['id']}",
        title=posting.get("name", ""),
        company=(posting.get("company") or {}).get("name") or company.name,
        location=_location(posting),
        description=description,
        url=src.get("postingUrl")
        or f"https://jobs.smartrecruiters.com/{company.token}/{posting['id']}",
        posted_at=posting.get("releasedDate"),
        is_remote=bool((posting.get("location") or {}).get("remote")) or None,
        job_type_hint=(posting.get("typeOfEmployment") or {}).get("label"),
        ats="smartrecruiters",
        company_token=company.token,
    )


class SmartRecruiters(AtsSource):
    name = "smartrecruiters"
    ats = "smartrecruiters"

    async def fetch_company(
        self, client: httpx.AsyncClient, company: AtsCompany, ctx: FetchContext
    ) -> list[RawJob]:
        data = await get_json(
            client,
            f"{API}/{company.token}/postings",
            params={"limit": 100, "country": "in"},
            throttle=self.throttle,
        )
        jobs: list[RawJob] = []
        for posting in parse_smartrecruiters_list(data, ctx):
            try:
                detail = await get_json(
                    client,
                    f"{API}/{company.token}/postings/{posting['id']}",
                    throttle=self.throttle,
                    attempts=2,
                )
            except httpx.HTTPError:
                detail = None
            jobs.append(to_raw_job(posting, company, detail))
        return jobs
