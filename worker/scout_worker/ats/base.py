"""Shared logic for ATS adapters: the curated company list, bounded concurrency, per-company failure isolation."""

import asyncio
from abc import abstractmethod
from pathlib import Path
from typing import ClassVar

import httpx
import yaml
from pydantic import BaseModel

from scout_worker.logging import get_logger
from scout_worker.models import FetchContext, RawJob
from scout_worker.sources.base import Source

DATA_FILE = Path(__file__).resolve().parents[2] / "data" / "ats_companies.yaml"
MAX_PER_COMPANY = 25  # candidates kept (and detail-fetched) per board per scan
CONCURRENCY = 5
log = get_logger("ats")


class AtsCompany(BaseModel):
    name: str
    ats: str
    token: str
    note: str | None = None
    verified_at: str | None = None


def load_companies(ats: str, path: Path = DATA_FILE) -> list[AtsCompany]:
    data = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    return [AtsCompany(**c) for c in data.get("companies", []) if c.get("ats") == ats]


class AtsSource(Source):
    """One Source per ATS vendor; each company board is fetched independently so one bad board never fails the vendor."""

    kind = "ats"
    ats: ClassVar[str]

    def __init__(
        self, *args: object, companies: list[AtsCompany] | None = None, **kwargs: object
    ) -> None:
        super().__init__(*args, **kwargs)  # type: ignore[arg-type]
        self._companies = companies

    @property
    def companies(self) -> list[AtsCompany]:
        if self._companies is None:
            self._companies = load_companies(self.ats)
        return self._companies

    def unavailable_reason(self) -> str | None:
        return None if self.companies else f"no {self.ats} companies in data/ats_companies.yaml"

    @abstractmethod
    async def fetch_company(
        self, client: httpx.AsyncClient, company: AtsCompany, ctx: FetchContext
    ) -> list[RawJob]: ...

    async def fetch(self, ctx: FetchContext, client: httpx.AsyncClient) -> list[RawJob]:
        sem = asyncio.Semaphore(CONCURRENCY)
        failures: list[str] = []

        async def one(company: AtsCompany) -> list[RawJob]:
            async with sem:
                try:
                    return await self.fetch_company(client, company, ctx)
                except Exception as exc:  # noqa: BLE001 - isolate each board
                    failures.append(f"{company.name}: {type(exc).__name__}")
                    log.warning(
                        "ats_board_failed",
                        ats=self.ats,
                        company=company.name,
                        error=type(exc).__name__,
                    )
                    return []

        batches = await asyncio.gather(*(one(c) for c in self.companies))
        if failures:
            self.notes.append(
                f"{len(failures)}/{len(self.companies)} boards failed: {', '.join(failures[:5])}"
            )
        if len(failures) == len(self.companies):
            raise RuntimeError(f"all {self.ats} boards failed")
        return [job for batch in batches for job in batch]
