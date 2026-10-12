"""Adapter parsers against fixtures captured from the live APIs (see tests/fixtures; adzuna.json is hand-written)."""

import asyncio
from datetime import timedelta

import pytest
from conftest import load_json, load_text

from scout_worker.ats import ashby, greenhouse, lever, smartrecruiters, workday
from scout_worker.ats.base import AtsCompany, AtsSource, load_companies
from scout_worker.config import Settings
from scout_worker.models import FetchContext, RawJob
from scout_worker.registry import ALL_SOURCES, build_sources
from scout_worker.runner import run_source
from scout_worker.sources import (
    adzuna,
    arbeitnow,
    himalayas,
    internshala,
    jobspy_source,
    remoteok,
    remotive,
    weworkremotely,
)
from scout_worker.sources.base import Source


@pytest.fixture
def permissive(monkeypatch):
    """Field-mapping tests should not depend on which live sample rows survive the relevance filters."""
    for module in (
        remoteok,
        remotive,
        himalayas,
        arbeitnow,
        weworkremotely,
        internshala,
        adzuna,
        jobspy_source,
    ):
        monkeypatch.setattr(module, "feed_prefilter", lambda *a, **k: True, raising=False)
    for module in (remoteok, remotive, himalayas, arbeitnow, weworkremotely):
        monkeypatch.setattr(module, "remote_region_ok", lambda *a, **k: True, raising=False)
    monkeypatch.setattr(arbeitnow, "INDIA_RE", __import__("re").compile(r".*"))
    for module in (greenhouse, lever, ashby, smartrecruiters, workday):
        monkeypatch.setattr(module, "ats_prefilter", lambda *a, **k: True)


def _check_basic(jobs: list[RawJob], source: str) -> None:
    assert jobs, f"{source}: parser returned nothing"
    for job in jobs:
        assert job.source == source or job.source == "jobspy"
        assert job.title and job.company and job.url.startswith("http") and job.source_id


def test_remoteok(permissive, ctx):
    data = load_json("remoteok.json")
    assert "legal" in data[0]
    jobs = remoteok.parse_remoteok(data, ctx)
    _check_basic(jobs, "remoteok")
    assert len(jobs) == len(data) - 1 and all(j.is_remote for j in jobs)
    assert jobs[0].extra["attribution"] == "Remote OK"


def test_remotive(permissive, ctx):
    jobs = remotive.parse_remotive(load_json("remotive.json"), ctx)
    _check_basic(jobs, "remotive")
    assert jobs[0].extra["attribution"] == "Remotive" and jobs[0].job_type_hint


def test_himalayas(permissive, ctx):
    for name in ("himalayas.json", "himalayas_search.json"):
        jobs = himalayas.parse_himalayas(load_json(name), ctx)
        _check_basic(jobs, "himalayas")
        assert all(j.is_remote for j in jobs)


def test_arbeitnow(permissive, ctx):
    jobs = arbeitnow.parse_arbeitnow(load_json("arbeitnow.json"), ctx)
    _check_basic(jobs, "arbeitnow")


def test_weworkremotely(permissive, ctx):
    jobs = weworkremotely.parse_wwr(load_text("weworkremotely.rss"), ctx)
    _check_basic(jobs, "weworkremotely")
    assert jobs[0].company and ": " not in jobs[0].company[-2:]
    assert jobs[0].posted_at


def test_internshala_listing_and_paths(permissive, ctx):
    jobs = internshala.parse_internshala(load_text("internshala.html"), ctx)
    _check_basic(jobs, "internshala")
    assert all(
        j.job_type_hint == "internship"
        and j.url.startswith("https://internshala.com/internship/detail/")
        for j in jobs
    )
    assert jobs[0].description and "Skills:" in jobs[0].description
    assert (
        internshala.listing_path("machine learning intern")
        == "/internships/machine-learning-internship/"
    )
    assert internshala.listing_path("intern") is None


def test_adzuna_fixture_is_handwritten_and_filtered(ctx):
    data = load_json("adzuna.json")
    jobs = adzuna.parse_adzuna(data, ctx)
    assert [j.title for j in jobs] == [
        "Machine Learning Intern"
    ]  # the senior sales role is filtered out


def test_adzuna_disabled_without_keys():
    assert "not set" in (adzuna.Adzuna(Settings(_env_file=None)).disabled_reason or "")
    keys = Settings(_env_file=None, adzuna_app_id="x", adzuna_app_key="y")
    assert adzuna.Adzuna(keys).disabled_reason is None


def test_jobspy_rows(ctx):
    rows = [
        {"id": "li-1", "site": "linkedin", "title": "Machine Learning Intern", "company": "Acme", "location": "Bangalore, IN",
         "job_url": "https://linkedin.com/jobs/view/1", "date_posted": "2026-10-11", "is_remote": False, "description": float("nan"), "job_type": None},
        {"id": "in-2", "site": "indeed", "title": "Senior ML Lead", "company": "Acme", "location": "Pune", "job_url": "https://indeed.com/2"},
        {"id": "nk-3", "site": "naukri", "title": "Backend Engineer Intern", "company": "Beta", "location": "Remote",
         "job_url": "https://naukri.com/3", "job_url_direct": "https://beta.com/careers/3", "is_remote": True, "description": "Go and SQL"},
    ]  # fmt: skip
    jobs, per_site = jobspy_source.parse_jobspy_rows(rows, ctx)
    assert per_site == {"linkedin": 1, "indeed": 1, "naukri": 1}
    assert [j.title for j in jobs] == [
        "Machine Learning Intern",
        "Backend Engineer Intern",
    ]  # senior filtered
    assert jobs[0].description is None  # NaN handled
    assert jobs[1].url == "https://beta.com/careers/3"  # direct URL preferred


COMPANY = AtsCompany(name="Stripe", ats="greenhouse", token="stripe")


def test_greenhouse(permissive, ctx):
    lst = load_json("greenhouse_list.json")
    candidates = greenhouse.parse_greenhouse_list(lst, COMPANY, ctx)
    assert candidates and len(candidates) <= 25
    detail = load_json("greenhouse_detail.json")
    job = greenhouse.to_raw_job(
        candidates[0], COMPANY, detail if str(detail["id"]) == str(candidates[0]["id"]) else None
    )
    assert (
        job.ats == "greenhouse"
        and job.source_id == f"stripe:{candidates[0]['id']}"
        and job.url.startswith("https://")
    )
    assert greenhouse.to_raw_job(
        lst["jobs"][0], COMPANY, detail
    ).description  # content comes from the detail call


def test_lever(permissive, ctx):
    jobs = lever.parse_lever(
        load_json("lever.json"), AtsCompany(name="Palantir", ats="lever", token="palantir"), ctx
    )
    _check_basic(jobs, "lever")
    assert all(j.ats == "lever" and j.posted_at for j in jobs)


def test_ashby(permissive, ctx):
    jobs = ashby.parse_ashby(
        load_json("ashby.json"), AtsCompany(name="Ramp", ats="ashby", token="ramp"), ctx
    )
    _check_basic(jobs, "ashby")
    assert all(j.description for j in jobs)


def test_smartrecruiters(permissive, ctx):
    co = AtsCompany(name="Bosch", ats="smartrecruiters", token="BoschGroup")
    lst = load_json("smartrecruiters_list.json")
    cands = smartrecruiters.parse_smartrecruiters_list(lst, ctx)
    assert cands
    job = smartrecruiters.to_raw_job(cands[0], co, load_json("smartrecruiters_detail.json"))
    assert (
        job.ats == "smartrecruiters"
        and job.description
        and job.url.startswith("https://jobs.smartrecruiters.com/")
    )
    assert "india" in (job.location or "").lower()


def test_workday(permissive, ctx):
    co = AtsCompany(name="NVIDIA", ats="workday", token="nvidia|wd5|NVIDIAExternalCareerSite")
    cands = workday.parse_workday_list(load_json("workday_list.json"), ctx)
    assert cands
    job = workday.to_raw_job(cands[0], co, load_json("workday_detail.json"))
    assert (
        job.ats == "workday"
        and job.description
        and job.url.startswith("https://nvidia.wd5.myworkdayjobs.com/")
    )
    assert workday.split_token(co.token) == ("nvidia", "wd5", "NVIDIAExternalCareerSite")


def test_company_list_is_verified_and_large_enough():
    allc = [
        c
        for ats in ("greenhouse", "lever", "ashby", "workday", "smartrecruiters")
        for c in load_companies(ats)
    ]
    assert len(allc) >= 60
    assert all(c.verified_at for c in allc)
    assert len({(c.ats, c.token) for c in allc}) == len(allc)
    assert all(c.token.count("|") == 2 for c in allc if c.ats == "workday")


class _Boom(Source):
    name = "remoteok"
    kind = "remote"

    async def fetch(self, ctx, client):
        raise RuntimeError("blocked")


class _Slow(Source):
    name = "remotive"
    kind = "remote"
    min_interval = timedelta(hours=6)

    async def fetch(self, ctx, client):
        await asyncio.sleep(10)
        return []


def test_run_source_isolation_states(ctx):
    settings = Settings(_env_file=None)
    boom = asyncio.run(run_source(_Boom(settings), ctx, None, 5))  # type: ignore[arg-type]
    assert boom.status == "failed" and "blocked" in (boom.error or "")
    slow = asyncio.run(run_source(_Slow(settings), ctx, None, 0.05))  # type: ignore[arg-type]
    assert slow.status == "failed" and "timed out" in (slow.error or "")
    skipped = asyncio.run(
        run_source(_Slow(settings), ctx, None, 5, {"remotive": ctx.now - timedelta(hours=1)})
    )  # type: ignore[arg-type]
    assert skipped.status == "skipped"
    off = asyncio.run(
        run_source(_Boom(Settings(_env_file=None, enable_remoteok=False)), ctx, None, 5)
    )  # type: ignore[arg-type]
    assert off.status == "disabled" and "ENABLE_REMOTEOK" in (off.error or "")


def test_registry_has_all_thirteen_sources():
    sources = build_sources(Settings(_env_file=None))
    assert {s.name for s in sources} == {
        "jobspy", "adzuna", "internshala", "remoteok", "remotive", "himalayas", "arbeitnow", "weworkremotely",
        "greenhouse", "lever", "ashby", "workday", "smartrecruiters",
    }  # fmt: skip
    assert len(ALL_SOURCES) == 13
    assert all(isinstance(s, AtsSource) for s in sources if s.kind == "ats")


def test_context_helpers():
    ctx = FetchContext(roles=["a", "b", "c", "d"], locations=[])
    assert ctx.role_terms() == ["a", "b", "c"]
