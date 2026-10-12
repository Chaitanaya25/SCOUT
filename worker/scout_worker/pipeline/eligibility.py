"""Rule-based eligibility per profile (ARCHITECTURE.md §7.3 / PRD F3). Pure functions, no I/O.

A job is ineligible when any hard rule fails. Ineligible jobs still get a job_matches row (eligible=false) but are
never scored or notified.
"""

import re
from dataclasses import dataclass, field

from scout_worker.relevance import INDIA_RE, REMOTE_RE, SENIOR_RE

Check = dict[str, str]  # {"label": ..., "status": "pass" | "fail" | "unknown"}


@dataclass
class Prefs:
    grad_year: int | None = None
    max_experience_years: int = 1
    job_types: list[str] = field(default_factory=lambda: ["internship", "full_time"])
    locations: list[str] = field(default_factory=list)
    remote_ok: bool = True
    degree: str | None = None
    has_active_backlogs: bool | None = None


@dataclass
class JobView:
    title: str
    description: str | None = None
    location: str | None = None
    is_remote: bool = False
    job_type: str = "unknown"


@dataclass
class EligibilityResult:
    eligible: bool
    checks: list[Check]
    reasons: list[str]


_YEARS = re.compile(r"(\d{1,2})\s*(?:\+|-|–|to)?\s*(\d{1,2})?\s*\+?\s*(?:years?|yrs?)\b", re.I)
_BATCH = re.compile(
    r"(?:batch(?:es)?|graduat(?:es|ing|ion|ed)|pass(?:ing)?[\s-]?outs?|class of)\s*(?:of|in|from|year|:|-|–)?\s*((?:20\d{2}[\s,/&]*(?:and|or)?[\s,/&]*)+)",
    re.I,
)
_BATCH_AFTER = re.compile(
    r"((?:20\d{2}[\s,/&]*(?:and|or)?[\s,/&]*)+)\s*(?:batch(?:es)?|graduates?|grads?|pass(?:ing)?[\s-]?outs?)\b",
    re.I,
)
_YEAR = re.compile(r"20\d{2}")
_BACKLOG = re.compile(r"no\s+(active\s+|standing\s+)?(backlogs?|arrears?)", re.I)
_DEGREE = re.compile(r"\b(b\.?\s?tech|b\.?\s?e\.?|bachelor|b\.?\s?sc|computer science|cse)\b", re.I)


def min_experience_years(description: str | None) -> int | None:
    """Smallest 'N years' figure mentioned near the word 'experience' (None when there is none)."""
    if not description:
        return None
    lows: list[int] = []
    for m in _YEARS.finditer(description):
        window = description[max(0, m.start() - 60) : m.end() + 60].lower()
        if "experience" in window or "exp" in window:
            lows.append(int(m.group(1)))
    return min(lows) if lows else None


def batch_years(description: str | None) -> set[int]:
    """Graduation years a posting restricts itself to ('2025 and 2026 batch', 'graduating in 2026')."""
    years: set[int] = set()
    for pattern in (_BATCH, _BATCH_AFTER):
        for m in pattern.finditer(description or ""):
            years.update(int(y) for y in _YEAR.findall(m.group(1)))
    return years


def _location_ok(job: JobView, prefs: Prefs) -> bool | None:
    loc = job.location or ""
    if not loc and not job.is_remote:
        return None  # unknown
    if job.is_remote or REMOTE_RE.search(loc):
        return True if prefs.remote_ok else bool(INDIA_RE.search(loc))
    wanted = [p.lower() for p in prefs.locations if p]
    if "india" in wanted and INDIA_RE.search(loc):
        return True
    return any(p in loc.lower() for p in wanted if p != "remote")


def check_eligibility(job: JobView, prefs: Prefs) -> EligibilityResult:
    checks: list[Check] = []
    reasons: list[str] = []

    if SENIOR_RE.search(job.title):
        reasons.append("Senior/lead title")
        checks.append({"label": "Entry-level title", "status": "fail"})
    else:
        checks.append({"label": "Entry-level title", "status": "pass"})

    exp = min_experience_years(job.description)
    if exp is None:
        checks.append(
            {"label": f"Experience within {prefs.max_experience_years}y", "status": "unknown"}
        )
    elif exp > prefs.max_experience_years:
        reasons.append(f"Requires {exp}+ years of experience")
        checks.append({"label": f"Requires {exp}+ years of experience", "status": "fail"})
    else:
        checks.append(
            {"label": f"Experience within {prefs.max_experience_years}y", "status": "pass"}
        )

    years = batch_years(job.description)
    if prefs.grad_year and years:
        if prefs.grad_year in years:
            checks.append({"label": f"{prefs.grad_year} batch eligible", "status": "pass"})
        else:
            reasons.append(f"Restricted to {', '.join(map(str, sorted(years)))} batch")
            checks.append({"label": f"{prefs.grad_year} batch eligible", "status": "fail"})
    elif prefs.grad_year:
        checks.append(
            {
                "label": f"{prefs.grad_year} batch eligible",
                "status": "unknown" if not years else "pass",
            }
        )

    if job.job_type != "unknown" and job.job_type not in prefs.job_types:
        reasons.append(f"Job type {job.job_type} not wanted")
        checks.append({"label": "Job type matches", "status": "fail"})
    else:
        checks.append(
            {
                "label": "Job type matches",
                "status": "pass" if job.job_type != "unknown" else "unknown",
            }
        )

    loc = _location_ok(job, prefs)
    if loc is False:
        reasons.append("Location not in your preferences")
    checks.append(
        {
            "label": "Location matches",
            "status": "unknown" if loc is None else "pass" if loc else "fail",
        }
    )

    if job.description and _DEGREE.search(job.description) and prefs.degree:
        checks.append(
            {
                "label": "B.Tech/B.E. CS or related",
                "status": "pass" if _DEGREE.search(prefs.degree) else "unknown",
            }
        )
    if job.description and _BACKLOG.search(job.description):
        status = (
            "unknown"
            if prefs.has_active_backlogs is None
            else ("fail" if prefs.has_active_backlogs else "pass")
        )
        checks.append({"label": "No active backlogs", "status": status})
        if status == "fail":
            reasons.append("Requires no active backlogs")

    return EligibilityResult(eligible=not reasons, checks=checks, reasons=reasons)
