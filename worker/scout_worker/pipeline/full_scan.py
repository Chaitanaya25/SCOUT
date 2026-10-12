"""The full scan (ARCHITECTURE.md §7): fetch → normalize → dedupe/upsert → scam → embed → per profile
(eligibility → rank → Gemini score) → notify → cleanup → close the scan_run.

A failing stage degrades the run (status `partial`) but never crashes it; sources fail soft; Gemini stops at the soft caps.
"""

from datetime import UTC, datetime
from typing import Any

import httpx

from scout_worker.ats.base import load_companies
from scout_worker.config import Settings
from scout_worker.db import open_pool
from scout_worker.http import make_client
from scout_worker.llm import DbUsageStore, LlmClient
from scout_worker.logging import configure_logging, get_logger, new_run_id
from scout_worker.notify.telegram import TelegramClient, notify_profile
from scout_worker.pipeline.cleanup import run_cleanup_if_due
from scout_worker.pipeline.embed import embed_new_jobs
from scout_worker.pipeline.ingest import ingest
from scout_worker.pipeline.matching import load_profiles, score_profile
from scout_worker.pipeline.scam import assess_scam
from scout_worker.pipeline.upsert import ensure_companies, upsert_jobs
from scout_worker.runs import (
    finish_scan,
    last_successful_runs,
    load_fetch_context,
    overall_status,
    record_source_run,
    start_scan,
)

ATS_NAMES = ("greenhouse", "lever", "ashby", "workday", "smartrecruiters")


def apply_scam_rules(jobs) -> int:
    flagged = 0
    for job in jobs:
        risk, reasons = assess_scam(
            job.title, job.company_name, job.description, is_ats=bool(job.ats)
        )
        job.scam_risk, job.scam_reasons = risk, reasons
        flagged += risk != "none"
    return flagged


async def run_full(
    settings: Settings, kind: str = "full", client: httpx.AsyncClient | None = None
) -> dict[str, Any]:
    run_id = new_run_id()
    log = configure_logging(run_id)
    get_logger("full_scan")
    pool = await open_pool(settings)
    own_client = client is None
    http = client or make_client()
    stats: dict[str, Any] = {"run_id": run_id}
    scan_id = ""
    status = "failed"
    try:
        now = datetime.now(UTC)
        async with pool.connection() as conn:
            scan_id = await start_scan(conn, kind)
            companies = [c for ats in ATS_NAMES for c in load_companies(ats)]
            company_ids = await ensure_companies(conn, companies)
            ctx = await load_fetch_context(conn, now)
            last_success = await last_successful_runs(conn)

        ingested = await ingest(settings, ctx, http, last_success=last_success)
        stats["fetched"] = sum(r.fetched for r in ingested.results)
        stats["unique"] = ingested.unique_total
        stats["scam_flagged"] = apply_scam_rules(ingested.jobs)

        async with pool.connection() as conn:
            new_by_source = await upsert_jobs(conn, ingested.jobs, now, company_ids)
            for result in ingested.results:
                await record_source_run(conn, scan_id, result, new_by_source.get(result.source, 0))
        stats["new_jobs"] = sum(new_by_source.values())

        status = overall_status(ingested.results)
        llm = LlmClient(settings, DbUsageStore(pool))
        stats["embedded"] = await embed_new_jobs(pool, llm)

        profiles = await load_profiles(pool)
        stats["profiles"] = {}
        for profile in profiles:
            try:
                stats["profiles"][profile.slug] = await score_profile(
                    pool, llm, settings, profile, now
                )
            except Exception as exc:  # noqa: BLE001 - one profile must not stop the other
                log.error("profile_failed", profile=profile.slug, error=type(exc).__name__)
                status = "partial" if status == "success" else status

        if settings.telegram_bot_token:
            tg = TelegramClient(settings.telegram_bot_token, http)
            stats["notified"] = {}
            for profile in profiles:
                stats["notified"][profile.slug] = await notify_profile(
                    pool, tg, profile_id=profile.profile_id, chat_id=profile.telegram_chat_id, min_score=profile.min_score,
                    max_individual=settings.max_individual_alerts, app_url=settings.app_url, now=now,
                )  # fmt: skip
        else:
            log.info("telegram_not_configured")

        async with pool.connection() as conn:
            stats["cleanup"] = await run_cleanup_if_due(conn)
    except Exception as exc:
        log.error("full_scan_failed", error=type(exc).__name__)
        stats["error"] = f"{type(exc).__name__}: {str(exc)[:200]}"
        status = "failed"
    finally:
        if scan_id:
            async with pool.connection() as conn:
                await finish_scan(conn, scan_id, status, stats)
        if own_client:
            await http.aclose()
        await pool.close()
    log.info(
        "full_scan_done", status=status, **{k: v for k, v in stats.items() if isinstance(v, int)}
    )
    stats["status"] = status
    return stats
