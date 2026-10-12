"""Source adapter contract. Adapters never raise to the runner: the runner records errors per source and continues."""

from abc import ABC, abstractmethod
from datetime import timedelta
from typing import ClassVar

import httpx

from scout_worker.config import Settings
from scout_worker.http import HostThrottle
from scout_worker.models import FetchContext, RawJob, SourceKind


class Source(ABC):
    name: ClassVar[str]
    kind: ClassVar[SourceKind]
    # Minimum time between real fetches (courtesy limits, e.g. Remotive asks for <= 4 requests/day).
    min_interval: ClassVar[timedelta | None] = None

    def __init__(self, settings: Settings, throttle: HostThrottle | None = None) -> None:
        self.settings = settings
        self.throttle = throttle or HostThrottle()
        self.notes: list[
            str
        ] = []  # partial problems (e.g. "3 of 15 boards failed"), stored on the source_run

    @property
    def disabled_reason(self) -> str | None:
        """Why this source cannot run (None = runnable). Config flags first, then adapter-specific needs."""
        if not self.settings.source_enabled(self.name):
            return f"disabled by ENABLE_{self.name.upper()}=false"
        return self.unavailable_reason()

    def unavailable_reason(self) -> str | None:
        return None

    @abstractmethod
    async def fetch(self, ctx: FetchContext, client: httpx.AsyncClient) -> list[RawJob]: ...
