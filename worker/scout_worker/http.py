"""Shared async HTTP client: real User-Agent, 20s timeout, retries with backoff, per-host politeness."""

import asyncio
import time
from urllib.parse import urlsplit

import httpx

from scout_worker.logging import get_logger
from scout_worker.robots import RobotsRules, parse_robots

USER_AGENT = "Mozilla/5.0 (compatible; ScoutRadar/0.1; personal job radar)"
RETRYABLE = {429, 500, 502, 503, 504}
log = get_logger("http")


def make_client(timeout: float = 20.0) -> httpx.AsyncClient:
    return httpx.AsyncClient(
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "application/json, text/html;q=0.9, */*;q=0.5",
        },
        timeout=timeout,
        limits=httpx.Limits(max_connections=20, max_keepalive_connections=10),
        follow_redirects=True,
    )


class HostThrottle:
    """Enforces a minimum interval between requests to the same host."""

    def __init__(self, min_interval: float = 0.25) -> None:
        self.min_interval = min_interval
        self._last: dict[str, float] = {}
        self._locks: dict[str, asyncio.Lock] = {}

    async def wait(self, url: str, interval: float | None = None) -> None:
        host = urlsplit(url).netloc
        lock = self._locks.setdefault(host, asyncio.Lock())
        gap = self.min_interval if interval is None else interval
        async with lock:
            delay = self._last.get(host, 0.0) + gap - time.monotonic()
            if delay > 0:
                await asyncio.sleep(delay)
            self._last[host] = time.monotonic()


def _retry_after(response: httpx.Response) -> float | None:
    value = response.headers.get("retry-after")
    if value and value.isdigit():
        return float(value)
    return None


async def request(
    client: httpx.AsyncClient,
    method: str,
    url: str,
    *,
    attempts: int = 3,
    throttle: HostThrottle | None = None,
    interval: float | None = None,
    **kwargs: object,
) -> httpx.Response:
    """HTTP request with at most `attempts` tries (exponential backoff, honors Retry-After, capped at 30s).

    Raises httpx.HTTPError once attempts are exhausted. A hard attempt cap means a failing source can never loop.
    """
    last_exc: Exception | None = None
    for attempt in range(1, attempts + 1):
        if throttle:
            await throttle.wait(url, interval)
        try:
            response = await client.request(method, url, **kwargs)  # type: ignore[arg-type]
        except httpx.TransportError as exc:
            last_exc = exc
            if attempt == attempts:
                raise
            await asyncio.sleep(min(2**attempt, 8))
            continue
        if response.status_code in RETRYABLE and attempt < attempts:
            await asyncio.sleep(min(_retry_after(response) or 2**attempt, 30))
            continue
        response.raise_for_status()
        return response
    raise last_exc or RuntimeError("request failed")  # pragma: no cover


async def get_json(client: httpx.AsyncClient, url: str, **kwargs: object):
    return (await request(client, "GET", url, **kwargs)).json()


async def get_text(client: httpx.AsyncClient, url: str, **kwargs: object) -> str:
    return (await request(client, "GET", url, **kwargs)).text


async def fetch_robots(client: httpx.AsyncClient, base_url: str) -> RobotsRules:
    """robots.txt rules for a site; a missing/erroring robots.txt means no restrictions (per RFC 9309)."""
    parts = urlsplit(base_url)
    try:
        response = await client.get(f"{parts.scheme}://{parts.netloc}/robots.txt")
        if response.status_code == 200:
            return parse_robots(response.text)
    except httpx.HTTPError:
        log.warning("robots_fetch_failed", host=parts.netloc)
    return RobotsRules()
