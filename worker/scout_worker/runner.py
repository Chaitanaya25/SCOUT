"""Concurrent fetch runner: every source returns a SourceResult; nothing here can raise to the caller."""

import asyncio
import time
from datetime import datetime

import httpx

from scout_worker.logging import get_logger
from scout_worker.models import FetchContext, SourceResult
from scout_worker.sources.base import Source

log = get_logger("sources")


async def run_source(
    source: Source,
    ctx: FetchContext,
    client: httpx.AsyncClient,
    timeout: float,
    last_success: dict[str, datetime] | None = None,
) -> SourceResult:
    """Run one source. Never raises: disabled/skipped/failed states are returned as data."""
    reason = source.disabled_reason
    if reason:
        return SourceResult(source=source.name, status="disabled", error=reason)
    if source.min_interval and last_success and (last := last_success.get(source.name)):
        if ctx.now - last < source.min_interval:
            return SourceResult(
                source=source.name,
                status="skipped",
                error=f"ran {int((ctx.now - last).total_seconds() // 60)}m ago; courtesy interval {source.min_interval}",
            )
    started = time.monotonic()
    try:
        jobs = await asyncio.wait_for(source.fetch(ctx, client), timeout=timeout)
        return SourceResult(
            source=source.name,
            status="success",
            jobs=jobs,
            duration_seconds=time.monotonic() - started,
            notes=source.notes,
        )
    except TimeoutError:
        error = f"timed out after {timeout:.0f}s"
    except Exception as exc:  # noqa: BLE001 - a source must never fail the scan
        error = f"{type(exc).__name__}: {str(exc)[:200]}"
    log.warning("source_failed", source=source.name, error=error)
    return SourceResult(
        source=source.name,
        status="failed",
        error=error,
        duration_seconds=time.monotonic() - started,
        notes=source.notes,
    )


async def fetch_all(
    sources: list[Source],
    ctx: FetchContext,
    client: httpx.AsyncClient,
    timeout: float,
    last_success: dict[str, datetime] | None = None,
) -> list[SourceResult]:
    return list(
        await asyncio.gather(*(run_source(s, ctx, client, timeout, last_success) for s in sources))
    )
