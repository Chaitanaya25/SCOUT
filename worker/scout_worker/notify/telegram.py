"""Telegram sender + per-profile alert selection (ARCHITECTURE.md §7.7, F1, F2).

Rules: never notify skipped / applied / saved / ineligible / high-scam jobs; <= 1 message per second per chat; on 429
obey `retry_after` (bounded); set notified_at only after a successful send. Watched-company alerts (F2) are not gated
by min_score. The bot token is never logged.
"""

import asyncio
import time
from datetime import datetime
from typing import Any

import httpx

from scout_worker.logging import get_logger
from scout_worker.notify.messages import (
    DIGEST_LIMIT,
    digest_keyboard,
    format_digest,
    format_job_message,
    job_keyboard,
    split_alerts,
)
from scout_worker.pipeline.rank import is_fresh

log = get_logger("telegram")
API = "https://api.telegram.org"
MIN_GAP = 1.1  # seconds between messages to one chat
MAX_RETRIES = 2


class TelegramError(RuntimeError):
    pass


class TelegramBlocked(TelegramError):
    """403/400: the user blocked the bot or the chat no longer exists. Stop sending to this chat."""


class TelegramClient:
    def __init__(
        self, token: str, client: httpx.AsyncClient, sleep=asyncio.sleep, monotonic=time.monotonic
    ) -> None:
        self._token = token
        self._client = client
        self._sleep = sleep
        self._mono = monotonic
        self._last: dict[int, float] = {}

    async def send_message(
        self, chat_id: int, text: str, reply_markup: dict[str, Any] | None = None
    ) -> int | None:
        payload: dict[str, Any] = {
            "chat_id": chat_id,
            "text": text,
            "parse_mode": "HTML",
            "disable_web_page_preview": True,
        }
        if reply_markup:
            payload["reply_markup"] = reply_markup
        for attempt in range(MAX_RETRIES + 1):
            wait = self._last.get(chat_id, 0.0) + MIN_GAP - self._mono()
            if wait > 0:
                await self._sleep(wait)
            self._last[chat_id] = self._mono()
            response = await self._client.post(
                f"{API}/bot{self._token}/sendMessage", json=payload, timeout=20
            )
            if response.status_code == 429 and attempt < MAX_RETRIES:
                retry = int((response.json().get("parameters") or {}).get("retry_after", 5))
                log.warning("telegram_rate_limited", retry_after=retry)
                await self._sleep(min(retry + 1, 60))
                continue
            if response.status_code in (400, 403):
                raise TelegramBlocked(f"HTTP {response.status_code}")
            if response.status_code >= 400:
                raise TelegramError(f"HTTP {response.status_code}")
            return (response.json().get("result") or {}).get("message_id")
        raise TelegramError("rate limited")  # pragma: no cover


SELECT_REGULAR = """
select m.id, m.job_id, m.score, m.rank_score, m.missing_skills, j.title, j.company_name, j.location, j.apply_url,
       j.posted_at, j.company_id
from job_matches m join jobs j on j.id = m.job_id
where m.profile_id = %(profile)s and m.notified_at is null and m.eligible and m.status = 'new'
  and m.score >= %(min_score)s and j.scam_risk <> 'high' and j.is_active
order by m.rank_score desc nulls last
"""
SELECT_WATCHED = """
select m.id, m.job_id, m.score, m.rank_score, m.missing_skills, j.title, j.company_name, j.location, j.apply_url,
       j.posted_at, j.company_id
from job_matches m
join jobs j on j.id = m.job_id
join watched_companies w on w.company_id = j.company_id and w.profile_id = m.profile_id and w.instant_alerts
where m.profile_id = %(profile)s and m.notified_at is null and m.eligible and m.status = 'new'
  and j.scam_risk <> 'high' and j.is_active and j.first_seen_at >= w.created_at
order by j.first_seen_at desc
"""
MARK_NOTIFIED = (
    "update job_matches set notified_at = %s where profile_id = %s and id = any(%s::uuid[])"
)


async def _mark(pool, profile_id: str, ids: list[str], now: datetime) -> None:
    if not ids:
        return
    async with pool.connection() as conn:
        await conn.execute(MARK_NOTIFIED, (now, profile_id, ids))
        await conn.commit()


async def notify_profile(
    pool,
    tg: TelegramClient,
    *,
    profile_id: str,
    chat_id: int | None,
    min_score: int,
    max_individual: int,
    app_url: str,
    now: datetime,
) -> dict[str, int]:
    """Send this profile's alerts. Every query is filtered by profile_id; nothing is sent without a linked chat."""
    stats = {"watched": 0, "fresh": 0, "digest": 0}
    if chat_id is None:
        return stats
    async with pool.connection() as conn:
        watched = await (await conn.execute(SELECT_WATCHED, {"profile": profile_id})).fetchall()
        regular = await (
            await conn.execute(SELECT_REGULAR, {"profile": profile_id, "min_score": min_score})
        ).fetchall()
    watched_ids = {str(r["id"]) for r in watched}
    regular = [r for r in regular if str(r["id"]) not in watched_ids]
    individual, digest = split_alerts(regular, now, max_individual)
    try:
        for kind, rows in (("watched", watched), ("fresh", individual)):
            for r in rows:
                text = format_job_message(
                    title=r["title"], company=r["company_name"], location=r["location"], posted_at=r["posted_at"], score=r["score"],
                    missing_skills=list(r["missing_skills"] or []), now=now, fresh=kind == "fresh" or is_fresh(r["posted_at"], now), watched=kind == "watched",
                )  # fmt: skip
                await tg.send_message(chat_id, text, job_keyboard(str(r["id"]), r["apply_url"]))
                await _mark(pool, profile_id, [str(r["id"])], now)
                stats[kind] += 1
        if digest:
            shown = digest[:DIGEST_LIMIT]
            items = [
                {
                    "title": r["title"],
                    "company": r["company_name"],
                    "score": r["score"] or 0,
                    "url": r["apply_url"],
                }
                for r in shown
            ]
            await tg.send_message(
                chat_id,
                format_digest(items, more=len(digest) - len(shown)),
                digest_keyboard(app_url),
            )
            await _mark(pool, profile_id, [str(r["id"]) for r in shown], now)
            stats["digest"] = len(shown)
    except TelegramBlocked:
        log.warning("telegram_chat_unreachable", profile_id=profile_id)
    except (TelegramError, httpx.HTTPError) as exc:
        log.warning("telegram_send_failed", error=type(exc).__name__)
    return stats
