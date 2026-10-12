"""Cheap pre-filters used by adapters to avoid fetching/embedding obviously irrelevant jobs.

These are NOT the eligibility rules (pipeline/eligibility.py, per profile). They only keep volume sane."""

import re

SENIOR_RE = re.compile(
    r"\b(senior|sr\.?|lead|staff|principal|manager|head|director|architect|vp|vice president|chief)\b",
    re.I,
)
ENTRY_RE = re.compile(
    r"\b(intern(ship)?s?|trainee|graduate|new grad|campus|apprentice|junior|jr\.?|entry[- ]level|associate|early career|sde[- ]?(1|i)|engineer (i|1)|fresher|university)\b",
    re.I,
)
INDIA_RE = re.compile(
    r"\b(india|bangalore|bengaluru|hyderabad|pune|mumbai|delhi|gurgaon|gurugram|noida|chennai|kolkata|ahmedabad)\b",
    re.I,
)
REMOTE_RE = re.compile(r"\b(remote|anywhere|worldwide|work from home|wfh)\b", re.I)
TECH_RE = re.compile(
    r"\b(engineer|engineering|developer|software|data|machine learning|ml|ai|analyst|scientist|backend|back-end|frontend|front-end|full[- ]?stack|devops|sre|platform|research|python|java|cloud|security|qa|sdet|mobile|android|ios|programmer|swe|sde)\b",
    re.I,
)
NOISE_RE = re.compile(
    r"\b(sales|marketing|recruiter|recruiting|legal|counsel|accountant|accounting|payroll|customer success|account executive|support specialist|copywriter|designer|content writer|business development|talent|hr)\b",
    re.I,
)
_STOP = {
    "intern",
    "internship",
    "interns",
    "engineer",
    "developer",
    "entry",
    "level",
    "junior",
    "senior",
    "the",
    "and",
    "a",
    "of",
}


def role_keywords(roles: list[str]) -> set[str]:
    words: set[str] = set()
    for role in roles:
        words.update(w for w in re.findall(r"[a-z][a-z+#.]{1,}", role.lower()) if w not in _STOP)
    return words


def keyword_overlap(title: str, roles: list[str]) -> bool:
    kws = role_keywords(roles)
    return bool(kws and kws & set(re.findall(r"[a-z][a-z+#.]{1,}", title.lower())))


def is_tech_relevant(title: str) -> bool:
    return bool(TECH_RE.search(title)) and not NOISE_RE.search(title)


def location_ok(
    location: str | None, locations: list[str], remote_flag: bool | None = None
) -> bool:
    """India, remote, or one of the profiles' locations."""
    if remote_flag:
        return True
    loc = location or ""
    if INDIA_RE.search(loc) or REMOTE_RE.search(loc):
        return True
    return any(p.lower() in loc.lower() for p in locations if p and p.lower() not in {"remote"})


_GLOBAL_RE = re.compile(r"\b(worldwide|anywhere|global|international|asia|apac)\b", re.I)
_RESTRICTED_RE = re.compile(
    r"\b(us|usa|u\.s\.|united states|canada|uk|united kingdom|europe|eu|emea|americas|latam)\s+only\b",
    re.I,
)


def remote_region_ok(text: str | None) -> bool:
    """For remote feeds: can someone in India take this job? Empty/worldwide/India/Asia yes; 'USA Only', 'Europe' no."""
    if not text or not text.strip():
        return True
    if _RESTRICTED_RE.search(text):
        return False
    return bool(INDIA_RE.search(text) or _GLOBAL_RE.search(text))


def feed_prefilter(
    title: str,
    location: str | None,
    roles: list[str],
    locations: list[str],
    remote_flag: bool | None = None,
) -> bool:
    """For aggregator/remote feeds: tech-relevant, not senior, and in an acceptable location."""
    return (
        is_tech_relevant(title)
        and not SENIOR_RE.search(title)
        and location_ok(location, locations, remote_flag)
    )


def ats_prefilter(title: str, location: str | None, roles: list[str], locations: list[str]) -> bool:
    """For ATS boards (whole company boards): feed rules AND an entry-level marker or a role-keyword match."""
    return feed_prefilter(title, location, roles, locations) and bool(
        ENTRY_RE.search(title) or keyword_overlap(title, roles)
    )
