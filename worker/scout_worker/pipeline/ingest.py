"""Fetch → normalize → dedupe. Pure orchestration of the Phase 4 pipeline (no database access here)."""

from dataclasses import dataclass, field
from datetime import datetime

import httpx

from scout_worker.config import Settings
from scout_worker.models import FetchContext, Job, SourceResult
from scout_worker.pipeline.dedupe import dedupe_batch
from scout_worker.pipeline.normalize import normalize
from scout_worker.registry import build_sources
from scout_worker.runner import fetch_all


@dataclass
class IngestResult:
    results: list[SourceResult]
    jobs: list[Job]  # normalized and deduped
    normalized_by_source: dict[str, int] = field(default_factory=dict)

    @property
    def unique_total(self) -> int:
        return len(self.jobs)


def normalize_results(
    results: list[SourceResult], now: datetime
) -> tuple[list[Job], dict[str, int]]:
    jobs: list[Job] = []
    per_source: dict[str, int] = {}
    for result in results:
        for raw in result.jobs:
            job = normalize(raw, now)
            if job:
                jobs.append(job)
                per_source[result.source] = per_source.get(result.source, 0) + 1
    return dedupe_batch(jobs), per_source


async def ingest(
    settings: Settings,
    ctx: FetchContext,
    client: httpx.AsyncClient,
    only: set[str] | None = None,
    last_success: dict[str, datetime] | None = None,
) -> IngestResult:
    sources = [s for s in build_sources(settings) if only is None or s.name in only]
    results = await fetch_all(sources, ctx, client, settings.source_timeout_seconds, last_success)
    jobs, per_source = normalize_results(results, ctx.now)
    return IngestResult(results=results, jobs=jobs, normalized_by_source=per_source)


def format_report(ingested: IngestResult) -> str:
    """Per-source table printed by `full --dry-run`."""
    lines = [f"{'source':<16}{'status':<10}{'fetched':>8}{'normalized':>11}{'secs':>7}  notes"]
    for r in sorted(ingested.results, key=lambda r: r.source):
        note = (r.error or "") + (" | " if r.error and r.notes else "") + "; ".join(r.notes)
        lines.append(
            f"{r.source:<16}{r.status:<10}{r.fetched:>8}{ingested.normalized_by_source.get(r.source, 0):>11}"
            f"{r.duration_seconds:>7.1f}  {note}"
        )
    fetched = sum(r.fetched for r in ingested.results)
    lines.append(f"\ntotal fetched {fetched}, unique after dedupe {ingested.unique_total}")
    return "\n".join(lines)
