from datetime import UTC, datetime, timedelta

from conftest import NOW, load_json

from scout_worker.models import Job, RawJob
from scout_worker.pipeline.dedupe import (
    dedupe_batch,
    dedupe_key,
    location_key,
    merge_jobs,
    norm_company,
    norm_title,
)
from scout_worker.pipeline.normalize import (
    canonicalize_url,
    html_to_text,
    infer_job_type,
    normalize,
    parse_posted_at,
)


def test_html_to_text_handles_plain_escaped_and_real_html():
    assert html_to_text("<p>Hello <b>world</b></p><script>x()</script>") == "Hello\nworld"
    assert "Who we are" in html_to_text("&lt;h2&gt;Who we are&lt;/h2&gt;&lt;p&gt;Hi&lt;/p&gt;")
    assert "<" not in html_to_text("&lt;p&gt;a &amp;amp; b&lt;/p&gt;")
    assert html_to_text(None) == ""
    assert len(html_to_text("x" * 20000)) == 8000


def test_html_to_text_greenhouse_fixture_has_no_markup():
    text = html_to_text(load_json("greenhouse_detail.json")["content"])
    assert text and "<" not in text and "&lt;" not in text


def test_parse_posted_at_variants():
    assert parse_posted_at(1791734403, NOW) == datetime(2026, 10, 11, 16, 0, 3, tzinfo=UTC)
    assert parse_posted_at(1791734403000, NOW) == datetime(2026, 10, 11, 16, 0, 3, tzinfo=UTC)
    assert parse_posted_at("2026-10-08T21:47:32", NOW) == datetime(
        2026, 10, 8, 21, 47, 32, tzinfo=UTC
    )
    assert parse_posted_at("2026-10-07T19:02:27-04:00", NOW) == datetime(
        2026, 10, 7, 23, 2, 27, tzinfo=UTC
    )
    assert parse_posted_at("3 days ago", NOW) == NOW - timedelta(days=3)
    assert parse_posted_at("Posted 26 Days Ago", NOW) == NOW - timedelta(days=26)
    assert parse_posted_at("1 week ago", NOW) == NOW - timedelta(weeks=1)
    assert parse_posted_at("Posted Today", NOW) == NOW
    assert parse_posted_at("yesterday", NOW) == NOW - timedelta(days=1)
    assert parse_posted_at("Mon, 12 Oct 2026 09:00:00 +0000", NOW) == datetime(
        2026, 10, 12, 9, 0, tzinfo=UTC
    )
    assert parse_posted_at("garbage", NOW) is None
    assert parse_posted_at(None, NOW) is None
    assert parse_posted_at(NOW.timestamp() + 86400 * 5, NOW) == NOW  # future clamps to now


def test_job_type_inference():
    assert infer_job_type("Data Science Intern", None, None) == "internship"
    assert infer_job_type("Software Engineer", None, "Intern") == "internship"
    assert (
        infer_job_type("Software Engineer", "This is an internship opportunity for students.", None)
        == "internship"
    )
    assert (
        infer_job_type("Software Engineer", "You will mentor interns and grow the team.", None)
        == "unknown"
    )
    assert infer_job_type("Software Engineer", None, "Full-time") == "full_time"
    assert infer_job_type("Engineer", None, None) == "unknown"


def test_canonicalize_url_strips_tracking_only():
    url = "https://x.com/job/1?utm_source=a&ref=b&gh_jid=123&lever-source=z#frag"
    assert canonicalize_url(url) == "https://x.com/job/1?gh_jid=123"
    assert canonicalize_url("https://x.com/job/1?utm_medium=x") == "https://x.com/job/1"


def test_normalize_raw_job():
    raw = RawJob(
        source="greenhouse", source_id="stripe:1", title="  Backend  Engineer, Intern ", company="Stripe",
        location="Bangalore, India", description="&lt;p&gt;Build things&lt;/p&gt;", url="https://stripe.com/jobs/1?utm_source=x&gh_jid=1",
        posted_at="2 days ago", ats="greenhouse",
    )  # fmt: skip
    job = normalize(raw, NOW)
    assert job and job.title == "Backend Engineer, Intern"
    assert job.job_type == "internship" and not job.is_remote
    assert job.description == "Build things"
    assert job.apply_url == "https://stripe.com/jobs/1?gh_jid=1"
    assert job.posted_at == NOW - timedelta(days=2)
    assert job.sources == ["greenhouse"] and job.source_ids == {"greenhouse": "stripe:1"}
    assert normalize(raw.model_copy(update={"company": ""}), NOW) is None
    assert normalize(raw.model_copy(update={"url": ""}), NOW) is None
    remote = normalize(raw.model_copy(update={"location": "Remote - Worldwide"}), NOW)
    assert remote and remote.is_remote


def test_dedupe_key_normalization():
    base = dedupe_key("Razorpay", "Backend Engineer", "Bangalore", False)
    assert (
        dedupe_key(
            "Razorpay Software Private Limited",
            "Backend Engineer (m/f/d)",
            "Bengaluru, India",
            False,
        )
        == base
    )
    assert dedupe_key("RAZORPAY Inc.", "backend   engineer!", "bangalore / hybrid", False) == base
    assert (
        dedupe_key("Razorpay", "Senior Backend Engineer", "Bangalore", False) != base
    )  # seniority is kept
    assert dedupe_key("Razorpay", "Backend Engineer", "Pune", False) != base
    assert dedupe_key("X", "Y", "Remote - Worldwide", True) == dedupe_key("X", "Y", None, True)


def test_normalizers():
    assert norm_company("Acme Technologies Pvt. Ltd.") == "acme"
    assert norm_title("Software Engineer [Backend] (f/m/d)") == "software engineer"
    assert location_key("Gurugram, Haryana", False) == "gurgaon"
    assert location_key(None, True) == "remote"
    assert location_key(None, False) == "unknown"


def _job(**kw) -> Job:
    d = dict(
        dedupe_key="k", sources=["linkedin"], source_ids={"linkedin": "1"}, company_name="Acme", title="Intern",
        description="short", apply_url="https://linkedin.com/jobs/1", posted_at=NOW,
    )  # fmt: skip
    d.update(kw)
    return Job(**d)


def test_merge_prefers_ats_url_longest_description_and_unions_sources():
    agg = _job()
    ats = _job(
        sources=["greenhouse"],
        source_ids={"greenhouse": "acme:9"},
        ats="greenhouse",
        description="a much longer description",
        apply_url="https://boards.greenhouse.io/acme/jobs/9",
        posted_at=NOW - timedelta(days=1),
    )
    merged = merge_jobs(agg, ats)
    assert merged.apply_url == "https://boards.greenhouse.io/acme/jobs/9"
    assert merged.sources == ["linkedin", "greenhouse"]
    assert merged.source_ids == {"linkedin": "1", "greenhouse": "acme:9"}
    assert merged.description == "a much longer description"
    assert merged.posted_at == NOW - timedelta(days=1)
    # an aggregator never overrides an ATS URL
    assert merge_jobs(ats, agg).apply_url == "https://boards.greenhouse.io/acme/jobs/9"


def test_dedupe_batch_collapses_same_role_across_three_boards():
    jobs = [
        _job(sources=[s], source_ids={s: s}, apply_url=f"https://{s}.example/1")
        for s in ("linkedin", "indeed", "naukri")
    ]
    out = dedupe_batch(jobs + [_job(dedupe_key="other")])
    assert len(out) == 2
    same = next(j for j in out if j.dedupe_key == "k")
    assert same.sources == ["linkedin", "indeed", "naukri"]
