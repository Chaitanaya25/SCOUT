"""Dedupe (ARCHITECTURE.md §7.2): one row per role, with every source recorded."""

import hashlib
import re

from scout_worker.models import Job

ATS_SOURCES = frozenset({"greenhouse", "lever", "ashby", "workday", "smartrecruiters"})

_COMPANY_SUFFIX = re.compile(
    r"\b(inc|incorporated|ltd|limited|llc|llp|pvt|private|technologies|technology|labs|corp|corporation|co|gmbh|software|solutions)\b"
)
_BRACKETS = re.compile(r"[\(\[\{][^)\]}]*[\)\]\}]")
_GENDER = re.compile(r"\b(m\s*/\s*[fwd]\s*/\s*[dxwm]|f\s*/\s*m\s*/\s*[dxw]|w\s*/\s*m\s*/\s*d)\b")
_CITY_ALIASES = {
    "bengaluru": "bangalore",
    "gurugram": "gurgaon",
    "bombay": "mumbai",
    "new delhi": "delhi",
    "calcutta": "kolkata",
    "madras": "chennai",
}


def _alnum(s: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9 ]+", " ", s.lower())).strip()


def norm_company(name: str) -> str:
    return re.sub(r"\s+", " ", _COMPANY_SUFFIX.sub(" ", _alnum(name))).strip()


def norm_title(title: str) -> str:
    """Lowercase, drop bracketed notes and (m/f/d) tags, punctuation and extra spaces. Seniority words are KEPT:
    "Senior X" and "X" are different roles."""
    t = _GENDER.sub(" ", _BRACKETS.sub(" ", title.lower()))
    return _alnum(t)


def location_key(location: str | None, is_remote: bool) -> str:
    """First place name of the location (city or country), aliases unified; `remote` when there is no place."""
    if not location:
        return "remote" if is_remote else "unknown"
    first = re.split(r"[,/;|\-–(]", location, maxsplit=1)[0]
    key = _alnum(first)
    key = _CITY_ALIASES.get(key, key)
    if not key or key in {"remote", "anywhere", "worldwide", "work from home"}:
        return "remote"
    return key


def dedupe_key(company: str, title: str, location: str | None, is_remote: bool) -> str:
    raw = "|".join((norm_company(company), norm_title(title), location_key(location, is_remote)))
    return hashlib.sha1(raw.encode("utf-8")).hexdigest()


def _is_ats(job: Job) -> bool:
    return bool(job.ats) or any(s in ATS_SOURCES for s in job.sources)


def merge_jobs(a: Job, b: Job) -> Job:
    """Combine two sightings of the same role: union sources/ids, prefer the ATS apply URL, keep the longest description."""
    sources = list(dict.fromkeys([*a.sources, *b.sources]))
    source_ids = {**b.source_ids, **a.source_ids}
    apply_url = b.apply_url if (_is_ats(b) and not _is_ats(a)) else a.apply_url
    desc_a, desc_b = a.description or "", b.description or ""
    description = (desc_a if len(desc_a) >= len(desc_b) else desc_b) or None
    posted = [p for p in (a.posted_at, b.posted_at) if p]
    return a.model_copy(
        update={
            "sources": sources,
            "source_ids": source_ids,
            "apply_url": apply_url,
            "description": description,
            "posted_at": min(posted) if posted else None,
            "ats": a.ats or b.ats,
            "company_token": a.company_token or b.company_token,
        }
    )


def dedupe_batch(jobs: list[Job]) -> list[Job]:
    merged: dict[str, Job] = {}
    for job in jobs:
        merged[job.dedupe_key] = (
            merge_jobs(merged[job.dedupe_key], job) if job.dedupe_key in merged else job
        )
    return list(merged.values())
