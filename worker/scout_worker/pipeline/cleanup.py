"""Daily housekeeping for the free tiers (runs inside the full scan, at most once per UTC day).

* jobs not seen for 7 days are marked inactive
* inactive jobs unseen for 45+ days are deleted, unless an application references them or a saved/applied match exists
  (their job_matches and tailored outputs cascade)
* scan_runs older than 30 days are deleted (source_runs cascade)
"""

from scout_worker.logging import get_logger

log = get_logger("cleanup")

MARK_INACTIVE = (
    "update jobs set is_active = false where is_active and last_seen_at < now() - interval '7 days'"
)
DELETE_STALE_JOBS = """
delete from jobs j
where j.is_active = false
  and j.last_seen_at < now() - interval '45 days'
  and not exists (select 1 from applications a where a.job_id = j.id)
  and not exists (select 1 from job_matches m where m.job_id = j.id and m.status in ('saved', 'applied'))
"""
DELETE_OLD_RUNS = "delete from scan_runs where started_at < now() - interval '30 days'"
CLAIM_TODAY = """
insert into llm_usage (day, kind, requests) values ((now() at time zone 'utc')::date, 'cleanup', 1)
on conflict (day, kind) do nothing returning kind
"""


async def run_cleanup(conn) -> dict[str, int]:
    stats: dict[str, int] = {}
    for key, sql in (
        ("marked_inactive", MARK_INACTIVE),
        ("jobs_deleted", DELETE_STALE_JOBS),
        ("scan_runs_deleted", DELETE_OLD_RUNS),
    ):
        cur = await conn.execute(sql)
        stats[key] = cur.rowcount
    await conn.commit()
    return stats


async def run_cleanup_if_due(conn) -> dict[str, int] | None:
    """Claims today's cleanup marker (llm_usage kind 'cleanup'); returns stats if it ran, None if already done today."""
    cur = await conn.execute(CLAIM_TODAY)
    if not await cur.fetchone():
        await conn.commit()
        return None
    stats = await run_cleanup(conn)
    log.info("cleanup_done", **stats)
    return stats
