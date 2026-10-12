"""Telegram message formatting (ARCHITECTURE.md §9). Pure functions; all job text is HTML-escaped (it is untrusted)."""

import html
from datetime import datetime
from typing import Any

MAX_MESSAGE_CHARS = 4000  # Telegram's hard limit is 4096
DIGEST_LIMIT = 10


def esc(value: object) -> str:
    return html.escape(str(value or ""), quote=False)


def posted_ago(posted_at: datetime | None, now: datetime) -> str:
    if posted_at is None:
        return "recently"
    hours = max(0, int((now - posted_at).total_seconds() // 3600))
    if hours < 1:
        return "just now"
    if hours < 24:
        return f"{hours}h ago"
    return f"{hours // 24}d ago"


def is_http_url(url: str | None) -> bool:
    return bool(url) and url.startswith(("http://", "https://")) and len(url) < 2000  # type: ignore[union-attr]


def format_job_message(
    *, title: str, company: str, location: str | None, posted_at: datetime | None, score: int | None,
    missing_skills: list[str], now: datetime, fresh: bool = False, watched: bool = False,
) -> str:  # fmt: skip
    """<b>{title}</b> — {company} / {location} · {posted_ago} · <b>{score}% match</b> / Missing: ..."""
    prefix = "WATCHED\n" if watched else "FRESH\n" if fresh else ""
    meta = [esc(location or "Location not listed"), posted_ago(posted_at, now)]
    if score is not None:
        meta.append(f"<b>{int(score)}% match</b>")
    lines = [f"<b>{esc(title)}</b> — {esc(company)}", " · ".join(meta)]
    if missing_skills:
        lines.append(f"Missing: {esc(', '.join(missing_skills[:4]))}")
    return (prefix + "\n".join(lines))[:MAX_MESSAGE_CHARS]


def job_keyboard(match_id: str, apply_url: str) -> dict[str, Any]:
    """Row 1 [Apply ↗] (URL); row 2 [Save] [Skip] [Applied ✓]. callback_data is `<s|k|a>:<match uuid>` (38 bytes)."""
    rows: list[list[dict[str, str]]] = []
    if is_http_url(apply_url):
        rows.append([{"text": "Apply ↗", "url": apply_url}])
    rows.append(
        [
            {"text": "Save", "callback_data": f"s:{match_id}"},
            {"text": "Skip", "callback_data": f"k:{match_id}"},
            {"text": "Applied ✓", "callback_data": f"a:{match_id}"},
        ]
    )
    return {"inline_keyboard": rows}


def format_digest(items: list[dict[str, Any]], more: int = 0) -> str:
    """One message listing up to 10 matches: `title — company · 82% · link`."""
    lines = [f"<b>{len(items)} new match{'es' if len(items) != 1 else ''} in SCOUT</b>"]
    for it in items[:DIGEST_LIMIT]:
        label = f"{esc(it['title'])} — {esc(it['company'])} · {int(it['score'])}%"
        lines.append(
            f'• <a href="{html.escape(it["url"], quote=True)}">{label}</a>'
            if is_http_url(it.get("url"))
            else f"• {label}"
        )
    if more > 0:
        lines.append(f"…and {more} more")
    return "\n".join(lines)[:MAX_MESSAGE_CHARS]


def digest_keyboard(app_url: str) -> dict[str, Any] | None:
    return (
        {"inline_keyboard": [[{"text": "View all in SCOUT", "url": f"{app_url.rstrip('/')}/jobs"}]]}
        if is_http_url(app_url)
        else None
    )


def split_alerts(
    rows: list[dict[str, Any]], now: datetime, max_individual: int
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    """§7.7: fresh (< 24h) matches go out individually (highest rank first, capped); everything else goes in the digest."""
    from scout_worker.pipeline.rank import is_fresh

    ordered = sorted(rows, key=lambda r: -(r.get("rank_score") or 0))
    fresh = [r for r in ordered if is_fresh(r["posted_at"], now)]
    individual = fresh[: max(0, max_individual)]
    sent = {id(r) for r in individual}
    digest = [r for r in ordered if id(r) not in sent]
    return individual, digest
