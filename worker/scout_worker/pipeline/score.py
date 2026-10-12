"""Gemini job scoring (ARCHITECTURE.md §8.3): batched prompts, pydantic validation, grounded post-checks."""

import json
import re
from pathlib import Path
from typing import Any

from pydantic import BaseModel, Field, field_validator

from scout_worker.llm import LlmClient

PROMPT_FILE = Path(__file__).resolve().parents[1] / "prompts" / "score.md"
MAX_JOB_CHARS = 2500


class EligibilityItem(BaseModel):
    label: str = Field(max_length=120)
    status: str = "unknown"

    @field_validator("status")
    @classmethod
    def _status(cls, v: str) -> str:
        return v if v in {"pass", "fail", "unknown"} else "unknown"


class ScoreItem(BaseModel):
    job_id: str
    score: int
    skills_score: int = 0
    reason: str = ""
    missing_skills: list[str] = Field(default_factory=list)
    eligibility: list[EligibilityItem] = Field(default_factory=list)
    scam_signals: list[str] = Field(default_factory=list)

    @field_validator("score", "skills_score", mode="before")
    @classmethod
    def _clamp(cls, v: Any) -> int:
        return max(0, min(100, int(round(float(v)))))

    @field_validator("reason")
    @classmethod
    def _reason(cls, v: str) -> str:
        return v.strip()[:140]


def system_prompt() -> str:
    return PROMPT_FILE.read_text(encoding="utf-8")


def _safe(text: str | None, limit: int = MAX_JOB_CHARS) -> str:
    """Job text is untrusted: neutralize any tag-like sequences so it cannot close/open our delimiters."""
    return (text or "")[:limit].replace("<", "‹").replace(">", "›")


def build_prompt(profile: dict[str, Any], jobs: list[dict[str, Any]]) -> str:
    blocks = []
    for j in jobs:
        blocks.append(
            f'<job id="{j["job_id"]}">\ntitle: {_safe(j.get("title"), 200)}\ncompany: {_safe(j.get("company"), 120)}\n'
            f"location: {_safe(j.get('location'), 120)}\ndescription: {_safe(j.get('description'))}\n</job>"
        )
    return (
        f"<candidate_profile>\n{json.dumps(profile, ensure_ascii=False)}\n</candidate_profile>\n\n<jobs>\n"
        + "\n".join(blocks)
        + "\n</jobs>"
    )


def _word_in(skill: str, text: str) -> bool:
    return bool(
        re.search(r"(?<![a-z0-9])" + re.escape(skill.lower()) + r"(?![a-z0-9])", text.lower())
    )


def filter_missing_skills(
    missing: list[str], job_text: str, profile_skills: list[str]
) -> list[str]:
    """F5: only skills the JD actually mentions and the resume lacks, max 4."""
    have = {s.lower() for s in profile_skills}
    out: list[str] = []
    for skill in missing:
        s = skill.strip()
        if s and s.lower() not in have and _word_in(s, job_text) and s not in out:
            out.append(s)
    return out[:4]


def grounded_scam_signals(signals: list[str], job_text: str) -> list[str]:
    """Keep only signals quoted from the job text (whitespace/case-insensitive)."""
    norm = re.sub(r"\s+", " ", job_text.lower())
    out: list[str] = []
    for s in signals:
        q = re.sub(r"\s+", " ", s.lower()).strip(" .\"'")
        if len(q) >= 6 and q in norm:
            out.append(s.strip()[:120])
    return out


def validate_scores(raw: Any, expected_ids: set[str]) -> list[ScoreItem]:
    """Parse the model output; drop malformed items and unknown job ids; keep the first item per id."""
    if not isinstance(raw, list):
        return []
    items: dict[str, ScoreItem] = {}
    for entry in raw:
        try:
            item = ScoreItem.model_validate(entry)
        except Exception:  # noqa: BLE001 - one bad item must not discard the batch
            continue
        if item.job_id in expected_ids and item.job_id not in items:
            items[item.job_id] = item
    return list(items.values())


async def score_batch(
    llm: LlmClient, profile: dict[str, Any], jobs: list[dict[str, Any]]
) -> list[ScoreItem]:
    raw = await llm.generate_json(
        "score", system_prompt(), build_prompt(profile, jobs), list[ScoreItem]
    )
    return validate_scores(raw, {str(j["job_id"]) for j in jobs})
