"""Registry of all source adapters."""

from scout_worker.ats.ashby import Ashby
from scout_worker.ats.greenhouse import Greenhouse
from scout_worker.ats.lever import Lever
from scout_worker.ats.smartrecruiters import SmartRecruiters
from scout_worker.ats.workday import Workday
from scout_worker.config import Settings
from scout_worker.http import HostThrottle
from scout_worker.sources.adzuna import Adzuna
from scout_worker.sources.arbeitnow import Arbeitnow
from scout_worker.sources.base import Source
from scout_worker.sources.himalayas import Himalayas
from scout_worker.sources.internshala import Internshala
from scout_worker.sources.jobspy_source import JobSpy
from scout_worker.sources.remoteok import RemoteOk
from scout_worker.sources.remotive import Remotive
from scout_worker.sources.weworkremotely import WeWorkRemotely

ALL_SOURCES: tuple[type[Source], ...] = (
    JobSpy, Adzuna, Internshala, RemoteOk, Remotive, Himalayas, Arbeitnow, WeWorkRemotely,
    Greenhouse, Lever, Ashby, Workday, SmartRecruiters,
)  # fmt: skip


def build_sources(settings: Settings, throttle: HostThrottle | None = None) -> list[Source]:
    shared = throttle or HostThrottle()
    return [cls(settings, shared) for cls in ALL_SOURCES]
