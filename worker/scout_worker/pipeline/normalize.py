"""RawJob → Job (ARCHITECTURE.md §7.1): HTML → text, relative dates, job type, remote flag, canonical URL."""

import html as html_lib
import re
from datetime import UTC, datetime, timedelta
from email.utils import parsedate_to_datetime
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from selectolax.lexbor import LexborHTMLParser as HTMLParser

from scout_worker.models import Job, JobType, RawJob
from scout_worker.pipeline.dedupe import dedupe_key

MAX_DESCRIPTION_CHARS = 8000

_TRACKING = {
    "ref", "referrer", "source", "src", "fbclid", "gclid", "trk", "trackingid", "lever-source",
    "lever-origin", "gh_src", "mc_cid", "mc_eid", "campaign", "cmpid", "icid", "gclsrc",
}  # fmt: skip
_REMOTE_RE = re.compile(r"\b(remote|anywhere|work from home|wfh|worldwide|work-from-home)\b", re.I)
_INTERN_TITLE_RE = re.compile(
    r"\b(intern|interns|internship|internships|trainee|trainees|apprentice|apprenticeship)\b", re.I
)
_INTERN_DESC_RE = re.compile(
    r"\b(this is an? internship|internship (position|role|opportunity|program(me)?))\b", re.I
)
_RELATIVE_RE = re.compile(r"(\d+)\s*\+?\s*(minute|min|hour|hr|day|week|month)s?\s*ago", re.I)
_UNITS = {
    "minute": "minutes",
    "min": "minutes",
    "hour": "hours",
    "hr": "hours",
    "day": "days",
    "week": "weeks",
    "month": "days",
}


def canonicalize_url(url: str) -> str:
    """Strip utm_*, ref and other tracking params and the fragment (keeps params like gh_jid that identify the job)."""
    parts = urlsplit(url.strip())
    kept = [
        (k, v)
        for k, v in parse_qsl(parts.query, keep_blank_values=True)
        if not k.lower().startswith("utm_") and k.lower() not in _TRACKING
    ]
    return urlunsplit((parts.scheme, parts.netloc, parts.path, urlencode(kept), ""))


def html_to_text(raw: str | None, max_chars: int = MAX_DESCRIPTION_CHARS) -> str:
    """Visible text of (possibly HTML-escaped) HTML, whitespace-collapsed and truncated. Never returns markup."""
    if not raw:
        return ""
    text = raw
    if "<" not in text and ("&lt;" in text or "&amp;lt;" in text):
        text = html_lib.unescape(text)  # Greenhouse/Arbeitnow ship escaped HTML
    if "<" in text:
        tree = HTMLParser(text)
        for node in tree.css("script, style, noscript"):
            node.decompose()
        body = tree.body or tree.root
        text = body.text(separator="\n", strip=True) if body else ""
    text = html_lib.unescape(text)
    text = re.sub(r"[ \t ​]+", " ", text)
    text = re.sub(r"\n\s*\n+", "\n\n", text).strip()
    return text[:max_chars]


def parse_posted_at(value: object, now: datetime) -> datetime | None:
    """Epoch seconds/ms, ISO 8601, RFC 2822, datetime, or relative strings ("3 days ago", "Posted Today")."""
    if value is None or value == "":
        return None
    if isinstance(value, datetime):
        dt = value if value.tzinfo else value.replace(tzinfo=UTC)
    elif isinstance(value, (int, float)) or (isinstance(value, str) and value.strip().isdigit()):
        number = float(value)
        dt = datetime.fromtimestamp(number / 1000 if number > 1e11 else number, tz=UTC)
    elif isinstance(value, str):
        s = value.strip()
        low = s.lower()
        if "just now" in low or "today" in low or low in {"new", "now"}:
            dt = now
        elif "yesterday" in low:
            dt = now - timedelta(days=1)
        elif m := _RELATIVE_RE.search(low):
            n, unit = int(m.group(1)), _UNITS[m.group(2).lower()]
            dt = now - (
                timedelta(days=30 * n) if m.group(2).lower() == "month" else timedelta(**{unit: n})
            )
        else:
            try:
                dt = datetime.fromisoformat(s.replace("Z", "+00:00"))
            except ValueError:
                try:
                    dt = parsedate_to_datetime(s)
                except (TypeError, ValueError):
                    return None
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=UTC)
    else:
        return None
    dt = dt.astimezone(UTC)
    return min(dt, now)  # never in the future


def infer_job_type(title: str, description: str | None, hint: str | None) -> JobType:
    if _INTERN_TITLE_RE.search(title):
        return "internship"
    h = (hint or "").lower()
    if "intern" in h or "trainee" in h:
        return "internship"
    if description and _INTERN_DESC_RE.search(description[:1500]):
        return "internship"
    if any(w in h for w in ("full", "permanent", "regular")):
        return "full_time"
    return "unknown"


def infer_remote(location: str | None, title: str, flag: bool | None) -> bool:
    if flag:
        return True
    return bool(_REMOTE_RE.search(f"{location or ''} {title}"))


def normalize(raw: RawJob, now: datetime) -> Job | None:
    """Normalize one RawJob. Returns None when it lacks a title, company or URL (nothing useful to store)."""
    title = re.sub(r"\s+", " ", html_lib.unescape(raw.title or "")).strip()
    company = re.sub(r"\s+", " ", html_lib.unescape(raw.company or "")).strip()
    if not title or not company or not raw.url:
        return None
    location = re.sub(r"\s+", " ", html_lib.unescape(raw.location or "")).strip() or None
    description = html_to_text(raw.description) or None
    is_remote = infer_remote(location, title, raw.is_remote)
    return Job(
        dedupe_key=dedupe_key(company, title, location, is_remote),
        sources=[raw.source],
        source_ids={raw.source: str(raw.source_id)},
        company_name=company,
        title=title,
        location=location,
        is_remote=is_remote,
        job_type=infer_job_type(title, description, raw.job_type_hint),
        description=description,
        apply_url=canonicalize_url(raw.url),
        posted_at=parse_posted_at(raw.posted_at, now),
        ats=raw.ats,
        company_token=raw.company_token,
    )
