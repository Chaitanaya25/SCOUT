"""scan_runs / source_runs bookkeeping and the fetch context built from both profiles' preferences."""

from datetime import UTC, datetime, timedelta
from typing import Any

from psycopg import AsyncConnection

from scout_worker.models import DEFAULT_LOCATIONS, DEFAULT_ROLES, FetchContext, SourceResult


async def start_scan(conn: AsyncConnection, kind: str) -> str:
    cur = await conn.execute("insert into scan_runs (kind) values (%s) returning id", (kind,))
    row = await cur.fetchone()
    await conn.commit()
    return str(row["id"])  # type: ignore[index]


def source_run_error(result: SourceResult) -> str | None:
    parts = [result.error] if result.error else []
    parts += [f"note: {n}" for n in result.notes]
    return "; ".join(parts)[:1000] or None


async def record_source_run(
    conn: AsyncConnection, scan_id: str, result: SourceResult, new_jobs: int
) -> None:
    await conn.execute(
        """insert into source_runs (scan_run_id, source, status, fetched, new_jobs, error, finished_at)
           values (%s, %s, %s, %s, %s, %s, now())""",
        (scan_id, result.source, result.status, result.fetched, new_jobs, source_run_error(result)),
    )
    await conn.commit()


def overall_status(results: list[SourceResult]) -> str:
    """success: nothing failed; failed: every enabled source failed; otherwise partial."""
    ran = [r for r in results if r.status in ("success", "failed")]
    failed = [r for r in ran if r.status == "failed"]
    if not failed:
        return "success"
    return "failed" if len(failed) == len(ran) else "partial"


async def finish_scan(
    conn: AsyncConnection, scan_id: str, status: str, stats: dict[str, Any]
) -> None:
    import json

    await conn.execute(
        "update scan_runs set status = %s, finished_at = now(), stats = %s::jsonb where id = %s",
        (status, json.dumps(stats), scan_id),
    )
    await conn.commit()


async def last_successful_runs(conn: AsyncConnection) -> dict[str, datetime]:
    cur = await conn.execute(
        "select source, max(finished_at) as last from source_runs where status = 'success' group by source"
    )
    return {r["source"]: r["last"] for r in await cur.fetchall() if r["last"]}


async def last_full_scan_start(conn: AsyncConnection) -> datetime | None:
    cur = await conn.execute(
        "select max(started_at) as t from scan_runs where kind = 'full' and status in ('success','partial')"
    )
    row = await cur.fetchone()
    return row["t"] if row else None


async def load_fetch_context(conn: AsyncConnection, now: datetime | None = None) -> FetchContext:
    """Union of both profiles' roles/locations/job types; `since` = last good full scan minus a 1h overlap."""
    now = now or datetime.now(UTC)
    cur = await conn.execute("select roles, locations, job_types from preferences")
    rows = await cur.fetchall()
    roles = list(dict.fromkeys(r for row in rows for r in row["roles"]))
    locations = list(dict.fromkeys(loc for row in rows for loc in row["locations"]))
    types = list(dict.fromkeys(t for row in rows for t in row["job_types"]))
    last = await last_full_scan_start(conn)
    return FetchContext(
        roles=roles or DEFAULT_ROLES,
        locations=locations or DEFAULT_LOCATIONS,
        job_types=types or ["internship", "full_time"],
        since=(last - timedelta(hours=1)) if last else None,
        now=now,
    )
