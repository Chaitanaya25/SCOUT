"""Ranking math (ARCHITECTURE.md §7.6). Pure functions."""

from datetime import datetime
from typing import Any

FRESH_HOURS = 24
DECAY_DAYS = 14
WATCHED_BONUS = 5.0


def freshness(posted_at: datetime | None, now: datetime) -> int:
    """100 when posted < 24h ago, decaying linearly to 0 at 14 days; unknown dates count as stale (0)."""
    if posted_at is None:
        return 0
    hours = max(0.0, (now - posted_at).total_seconds() / 3600)
    if hours < FRESH_HOURS:
        return 100
    span = DECAY_DAYS * 24 - FRESH_HOURS
    return max(0, round(100 * (1 - (hours - FRESH_HOURS) / span)))


def is_fresh(posted_at: datetime | None, now: datetime) -> bool:
    return posted_at is not None and (now - posted_at).total_seconds() < FRESH_HOURS * 3600


def rank_score(score: float, fresh: int, watched: bool = False) -> float:
    return round(0.75 * score + 0.25 * fresh + (WATCHED_BONUS if watched else 0.0), 2)


def similarity_rank_score(similarity: float, fresh: int, watched: bool = False) -> float:
    """Fallback when Gemini scoring is unavailable (budget/outage): same formula with similarity × 100 as the score."""
    return rank_score(max(0.0, min(1.0, similarity)) * 100, fresh, watched)


def eligibility_percent(checks: list[dict[str, str]]) -> int:
    """% of eligibility checks passing (unknown counts as not passing); 100 when there are no checks."""
    if not checks:
        return 100
    return round(100 * sum(1 for c in checks if c.get("status") == "pass") / len(checks))


def build_breakdown(skills_score: int, checks: list[dict[str, str]], fresh: int) -> dict[str, Any]:
    return {
        "skills": int(skills_score),
        "eligibility": eligibility_percent(checks),
        "freshness": int(fresh),
    }
