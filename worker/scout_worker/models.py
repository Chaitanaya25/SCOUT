"""Pydantic models at the worker's boundaries."""

from datetime import UTC, datetime, timedelta
from typing import Any, Literal

from pydantic import BaseModel, Field

JobType = Literal["internship", "full_time", "unknown"]
ScamRisk = Literal["none", "low", "high"]
SourceKind = Literal["aggregator", "remote", "ats", "scrape"]
SourceStatus = Literal["success", "failed", "disabled", "skipped"]


class RawJob(BaseModel):
    """A job exactly as a source adapter saw it (before normalization)."""

    source: str
    source_id: str
    title: str
    company: str
    location: str | None = None
    description: str | None = None  # may be HTML or HTML-escaped HTML
    url: str
    posted_at: Any = None  # epoch s/ms, ISO string, "3 days ago", datetime, or None
    is_remote: bool | None = None
    job_type_hint: str | None = None
    ats: str | None = None  # set by ATS adapters
    company_token: str | None = None
    extra: dict[str, Any] = Field(default_factory=dict)


class Job(BaseModel):
    """A normalized job, ready for dedupe/upsert (maps to the `jobs` table)."""

    dedupe_key: str
    sources: list[str]
    source_ids: dict[str, str]
    company_name: str
    title: str
    location: str | None = None
    is_remote: bool = False
    job_type: JobType = "unknown"
    description: str | None = None
    apply_url: str
    posted_at: datetime | None = None
    ats: str | None = None
    company_token: str | None = None
    scam_risk: ScamRisk = "none"
    scam_reasons: list[str] = Field(default_factory=list)


class FetchContext(BaseModel):
    """What adapters need to query: union of both profiles' roles/locations/types."""

    roles: list[str]
    locations: list[str]
    job_types: list[str] = Field(default_factory=lambda: ["internship", "full_time"])
    since: datetime | None = None
    now: datetime = Field(default_factory=lambda: datetime.now(UTC))
    results_per_query: int = 15

    def role_terms(self, limit: int = 3) -> list[str]:
        return self.roles[:limit]


class SourceResult(BaseModel):
    source: str
    status: SourceStatus
    jobs: list[RawJob] = Field(default_factory=list)
    error: str | None = None
    duration_seconds: float = 0.0
    notes: list[str] = Field(default_factory=list)

    @property
    def fetched(self) -> int:
        return len(self.jobs)


DEFAULT_ROLES = ["machine learning intern", "backend engineer intern", "software engineer intern"]
DEFAULT_LOCATIONS = ["India", "Bangalore", "Remote"]

ZERO = timedelta(0)
