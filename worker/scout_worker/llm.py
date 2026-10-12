"""The ONLY place the worker talks to Gemini (CLAUDE.md hard rule).

* models come from settings (env); structured JSON output; embeddings at 768 dims, one `Content` per text
* every REQUEST (including retries) is counted in `llm_usage` BEFORE it is sent, and refused once the daily soft cap
  for that kind is reached → `LlmBudgetExceeded`; callers degrade (similarity-only ranking) instead of failing
* retries honor the provider's retry hint, are capped at MAX_ATTEMPTS per logical call, and never retry a daily-quota
  429 or a client error — so nothing here can loop and burn quota
* calls are paced (>= llm_min_seconds_between_calls apart) to stay under per-minute limits
"""

import asyncio
import random
import re
import time
from datetime import date, datetime
from typing import Any, Protocol
from zoneinfo import ZoneInfo

from scout_worker.config import Settings
from scout_worker.logging import get_logger

MAX_ATTEMPTS = 3
MAX_RETRY_WAIT = 60.0
PACIFIC = ZoneInfo("America/Los_Angeles")  # Gemini daily quotas reset at midnight Pacific
log = get_logger("llm")


class LlmError(RuntimeError):
    """A Gemini call failed for a reason retrying will not fix (or retries were exhausted)."""


class LlmBudgetExceeded(LlmError):
    """The daily soft cap for this kind of request (or the provider's own daily quota) has been reached."""


def quota_day(now: datetime | None = None) -> date:
    return (now or datetime.now(PACIFIC)).astimezone(PACIFIC).date()


class UsageStore(Protocol):
    async def used_today(self, kind: str) -> int: ...
    async def increment(self, kind: str) -> int: ...


class DbUsageStore:
    """llm_usage(day, kind, requests) in Postgres. `day` is the Pacific quota day."""

    def __init__(self, pool) -> None:  # psycopg AsyncConnectionPool
        self.pool = pool

    async def used_today(self, kind: str) -> int:
        async with self.pool.connection() as conn:
            cur = await conn.execute(
                "select requests from llm_usage where day = %s and kind = %s", (quota_day(), kind)
            )
            row = await cur.fetchone()
            return int(row["requests"]) if row else 0

    async def increment(self, kind: str) -> int:
        async with self.pool.connection() as conn:
            cur = await conn.execute(
                """insert into llm_usage (day, kind, requests) values (%s, %s, 1)
                   on conflict (day, kind) do update set requests = llm_usage.requests + 1 returning requests""",
                (quota_day(), kind),
            )
            row = await cur.fetchone()
            await conn.commit()
            return int(row["requests"])  # type: ignore[index]


class MemoryUsageStore:
    """For tests and dry runs."""

    def __init__(self) -> None:
        self.counts: dict[str, int] = {}

    async def used_today(self, kind: str) -> int:
        return self.counts.get(kind, 0)

    async def increment(self, kind: str) -> int:
        self.counts[kind] = self.counts.get(kind, 0) + 1
        return self.counts[kind]


_RETRY_DELAY = re.compile(r"retry(?:Delay)?\"?[^0-9]{0,20}([0-9]+(?:\.[0-9]+)?)\s*s", re.I)


def parse_retry_delay(message: str) -> float | None:
    """Seconds from a provider hint such as `"retryDelay": "34s"` or `Please retry in 34.5s`."""
    m = _RETRY_DELAY.search(message or "")
    return float(m.group(1)) if m else None


def classify_error(code: int | None, message: str) -> str:
    """'daily' (stop for the day), 'retry' (transient), or 'fatal' (do not retry)."""
    msg = (message or "").lower()
    if code == 429:
        if "perday" in msg.replace(" ", "").replace("_", "") or "per day" in msg or "daily" in msg:
            return "daily"
        return "retry"
    if code in (500, 502, 503, 504):
        return "retry"
    return "fatal"


def is_overloaded(code: int | None, message: str) -> bool:
    """503 / 'overloaded' / 'unavailable': the primary model is busy, a fallback attempt is worthwhile."""
    msg = (message or "").lower()
    return code == 503 or "overloaded" in msg or "unavailable" in msg or "high demand" in msg


BASE_RETRY_WAIT = 2.0


def backoff_delay(attempt: int, hint: float | None, rng=random.random) -> float:
    """Exponential backoff with jitter (half fixed, half random), capped; a provider hint wins (also capped)."""
    if hint is not None:
        return min(hint, MAX_RETRY_WAIT)
    ceiling = min(MAX_RETRY_WAIT, BASE_RETRY_WAIT * 2 ** (attempt - 1))
    return ceiling / 2 + rng() * ceiling / 2


class LlmClient:
    def __init__(
        self,
        settings: Settings,
        usage: UsageStore,
        client: Any | None = None,
        sleep=asyncio.sleep,
        monotonic=time.monotonic,
        rng=random.random,
    ) -> None:
        self.settings = settings
        self.usage = usage
        self._client = client
        self._sleep = sleep
        self._monotonic = monotonic
        self._rng = rng
        self._pace_lock = asyncio.Lock()
        self._last_call = 0.0

    @property
    def client(self) -> Any:
        if self._client is None:
            if not self.settings.gemini_api_key:
                raise LlmError("GEMINI_API_KEY is not set")
            from google import genai

            self._client = genai.Client(api_key=self.settings.gemini_api_key)
        return self._client

    async def _pace(self) -> None:
        async with self._pace_lock:
            wait = self._last_call + self.settings.llm_min_seconds_between_calls - self._monotonic()
            if wait > 0:
                await self._sleep(wait)
            self._last_call = self._monotonic()

    async def _attempt(self, kind: str, call, model: str) -> Any:
        cap = self.settings.llm_cap(kind)
        if await self.usage.used_today(kind) >= cap:
            raise LlmBudgetExceeded(f"daily soft cap for '{kind}' reached ({cap})")
        await self._pace()
        await self.usage.increment(kind)  # counted before sending: failed attempts count too
        return await call(model)

    async def _guarded(self, kind: str, call, model: str, fallback: str | None = None) -> Any:
        """Run `call(model)` with cap checks, usage counting, pacing and bounded retries (jittered exponential
        backoff or the provider's hint). If the primary's last failure was an overload (503), `fallback` gets one
        extra attempt. Every attempt is counted against the soft cap."""
        last: Exception | None = None
        overloaded = False
        for attempt in range(1, MAX_ATTEMPTS + 1):
            try:
                return await self._attempt(kind, call, model)
            except LlmBudgetExceeded:
                raise
            except Exception as exc:  # noqa: BLE001 - classified below
                last = exc
                code = getattr(exc, "code", None)
                code = code if isinstance(code, int) else None
                message = str(exc)
                verdict = classify_error(code, message)
                overloaded = is_overloaded(code, message)
                log.warning(
                    "llm_call_failed", kind=kind, attempt=attempt, code=code, verdict=verdict
                )
                if verdict == "daily":
                    raise LlmBudgetExceeded("provider daily quota exhausted") from exc
                if verdict == "fatal":
                    raise LlmError(f"{type(exc).__name__}: {message[:200]}") from exc
                if attempt == MAX_ATTEMPTS:
                    break
                await self._sleep(backoff_delay(attempt, parse_retry_delay(message), self._rng))
        if fallback and fallback != model and overloaded:
            log.warning("llm_fallback_model", kind=kind, model=fallback)
            try:
                return await self._attempt(kind, call, fallback)
            except LlmBudgetExceeded:
                raise
            except Exception as exc:  # noqa: BLE001
                last = exc
        raise LlmError(f"{type(last).__name__}: {str(last)[:200]}") from last

    async def generate_json(
        self, kind: str, system: str, prompt: str, schema: Any, model: str | None = None
    ) -> Any:
        """Structured JSON generation; returns the parsed JSON (validate it with pydantic at the call site)."""
        import json

        from google.genai import types

        config = types.GenerateContentConfig(
            system_instruction=system,
            response_mime_type="application/json",
            response_schema=schema,
            temperature=0,
        )

        async def call(use_model: str) -> Any:
            response = await self.client.aio.models.generate_content(
                model=use_model, contents=prompt, config=config
            )
            text = response.text
            if not text:
                raise LlmError("empty response")
            return json.loads(text)

        return await self._guarded(
            kind, call, model or self.settings.gemini_model, self.settings.gemini_fallback_model
        )

    async def embed(
        self, texts: list[str], task_type: str = "RETRIEVAL_DOCUMENT"
    ) -> list[list[float]]:
        """One request for the whole batch (<= 100 texts). Each text is its own `Content`: passing a plain list of
        strings makes gemini-embedding-2 return ONE aggregated vector, so this is verified on every call."""
        from google.genai import types

        if not texts:
            return []
        dims = self.settings.embed_dimensions
        config = types.EmbedContentConfig(output_dimensionality=dims, task_type=task_type)
        contents = [types.Content(parts=[types.Part(text=t)]) for t in texts]

        async def call(use_model: str) -> list[list[float]]:
            response = await self.client.aio.models.embed_content(
                model=use_model, contents=contents, config=config
            )
            vectors = [list(e.values) for e in response.embeddings or []]
            if len(vectors) != len(texts) or any(len(v) != dims for v in vectors):
                raise LlmError(
                    f"embedding shape mismatch: {len(vectors)} vectors for {len(texts)} texts"
                )
            return vectors

        # No fallback for embeddings: another model would put vectors in a different space.
        return await self._guarded("embed", call, self.settings.gemini_embed_model)
