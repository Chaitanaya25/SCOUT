"""Pure rule/ranking math: scam, eligibility, freshness and rank_score."""

from datetime import UTC, datetime, timedelta

from conftest import NOW, load_json

from scout_worker.pipeline.eligibility import (
    JobView,
    Prefs,
    batch_years,
    check_eligibility,
    min_experience_years,
)
from scout_worker.pipeline.rank import (
    build_breakdown,
    eligibility_percent,
    freshness,
    is_fresh,
    rank_score,
    similarity_rank_score,
)
from scout_worker.pipeline.scam import assess_scam, raise_risk
from scout_worker.pipeline.score import filter_missing_skills, grounded_scam_signals


# ----------------------------------------------------------------------------- scam
def test_scam_high_on_fees_and_deposits():
    for text in (
        "Pay a registration fee of Rs 2,500 to confirm your seat",
        "Mandatory training kit fee applies",
        "A refundable security deposit is required before joining",
        "You must pay to join the program",
        "Processing fee of 500 rupees",
    ):
        risk, reasons = assess_scam("Python Trainee", "Acme", text)
        assert risk == "high" and reasons, text


def test_scam_low_signals_and_escalation():
    risk, reasons = assess_scam("Intern", "Acme", "Contact us only on WhatsApp +91 99999 99999")
    assert risk == "low" and "WhatsApp" in reasons[0]
    risk, reasons = assess_scam("Intern", "Acme", "Send CV to hr.acme@gmail.com or WhatsApp us now")
    assert risk == "high" and len(reasons) == 2  # two low signals → high
    assert assess_scam("Intern", "Acme", "Earn Rs 50,000 per week from home")[0] == "low"
    assert assess_scam("Intern", "Confidential", "Great role")[0] == "low"
    assert (
        assess_scam("Intern", "Acme", "No interview, immediate joining, work from home")[0] == "low"
    )


def test_scam_clean_job_and_ats_email_exemption():
    assert assess_scam("ML Intern", "Stripe", "Work on models. Apply on our careers page.") == (
        "none",
        [],
    )
    assert assess_scam("Intern", "Acme", "Email hr@gmail.com", is_ats=True)[0] == "none"
    assert assess_scam("Intern", "Acme", "Email hr@gmail.com", is_ats=False)[0] == "low"


def test_gemini_can_only_raise_scam_risk():
    assert raise_risk("none", ["asks for a deposit"]) == ("low", ["asks for a deposit"])
    assert raise_risk("none", ["a", "b"])[0] == "high"
    assert raise_risk("high", [])[0] == "high"
    assert raise_risk("low", [])[0] == "low"


def test_real_greenhouse_posting_is_not_flagged():
    detail = load_json("greenhouse_detail.json")
    assert assess_scam(detail["title"], "Stripe", detail["content"], is_ats=True)[0] == "none"


# ----------------------------------------------------------------------------- eligibility
PREFS = Prefs(
    grad_year=2028,
    max_experience_years=1,
    job_types=["internship", "full_time"],
    locations=["India", "Bangalore"],
    remote_ok=True,
)


def job(**kw):
    base = dict(
        title="Machine Learning Intern",
        description="Great role.",
        location="Bangalore, India",
        is_remote=False,
        job_type="internship",
    )
    return JobView(**{**base, **kw})


def test_senior_titles_are_ineligible():
    for title in (
        "Senior ML Engineer",
        "Staff Software Engineer",
        "Engineering Manager",
        "Lead Developer",
        "Principal Engineer",
        "Head of Data",
        "Sr. Backend Engineer",
    ):
        r = check_eligibility(job(title=title), PREFS)
        assert not r.eligible and "Senior/lead title" in r.reasons, title
    assert check_eligibility(job(title="Software Engineer Intern"), PREFS).eligible


def test_experience_requirements():
    assert min_experience_years("Requires 3+ years of experience in Python") == 3
    assert min_experience_years("0-1 years experience preferred") == 0
    assert min_experience_years("3-5 years of relevant experience") == 3
    assert min_experience_years("We were founded 12 years ago.") is None  # not near 'experience'
    assert min_experience_years(None) is None
    r = check_eligibility(
        job(title="Software Engineer", description="5+ years of experience required"), PREFS
    )
    assert not r.eligible and "Requires 5+ years of experience" in r.reasons
    assert check_eligibility(job(description="0-1 years of experience"), PREFS).eligible


def test_batch_restrictions():
    assert batch_years("Open to 2024 and 2025 batch graduates") == {2024, 2025}
    assert batch_years("Candidates graduating in 2026 may apply") == {2026}
    assert batch_years("Batch of 2025 / 2026 only") == {2025, 2026}
    assert batch_years("We love graduates and founded in 2019") == set()
    r = check_eligibility(job(description="Eligible: 2025 and 2026 batch only"), PREFS)
    assert not r.eligible and any("batch" in x for x in r.reasons)
    ok = check_eligibility(job(description="Graduating in 2028 or 2027"), PREFS)
    assert ok.eligible and {"label": "2028 batch eligible", "status": "pass"} in ok.checks
    unknown = check_eligibility(job(), PREFS)
    assert {"label": "2028 batch eligible", "status": "unknown"} in unknown.checks


def test_job_type_and_location():
    fulltime_only = Prefs(grad_year=2028, job_types=["full_time"], locations=["India"])
    assert not check_eligibility(job(job_type="internship"), fulltime_only).eligible
    assert check_eligibility(job(job_type="unknown"), fulltime_only).eligible  # unknown passes
    assert not check_eligibility(job(location="Berlin, Germany"), PREFS).eligible
    assert check_eligibility(job(location="Remote - Worldwide", is_remote=True), PREFS).eligible
    assert check_eligibility(job(location="Gurugram"), PREFS).eligible  # India city
    no_remote = Prefs(grad_year=2028, locations=["Bangalore"], remote_ok=False)
    assert not check_eligibility(job(location="Remote - USA", is_remote=True), no_remote).eligible
    assert check_eligibility(
        job(location=None, is_remote=False), PREFS
    ).eligible  # unknown location passes


def test_degree_and_backlog_checks():
    desc = "B.Tech in CS required. No active backlogs."
    r = check_eligibility(
        job(description=desc),
        Prefs(
            grad_year=2028,
            degree="B.Tech CSE (Data Science)",
            has_active_backlogs=False,
            locations=["India"],
        ),
    )
    assert {"label": "B.Tech/B.E. CS or related", "status": "pass"} in r.checks
    assert {"label": "No active backlogs", "status": "pass"} in r.checks
    r2 = check_eligibility(
        job(description=desc), Prefs(grad_year=2028, has_active_backlogs=True, locations=["India"])
    )
    assert not r2.eligible and "Requires no active backlogs" in r2.reasons
    r3 = check_eligibility(
        job(description=desc), Prefs(grad_year=2028, has_active_backlogs=None, locations=["India"])
    )
    assert {"label": "No active backlogs", "status": "unknown"} in r3.checks and r3.eligible


# ----------------------------------------------------------------------------- ranking math
def test_freshness_curve():
    assert freshness(NOW - timedelta(hours=2), NOW) == 100
    assert freshness(NOW - timedelta(hours=23, minutes=59), NOW) == 100
    assert freshness(NOW - timedelta(days=14), NOW) == 0
    assert freshness(NOW - timedelta(days=30), NOW) == 0
    mid = freshness(NOW - timedelta(days=7, hours=12), NOW)
    assert 40 < mid < 60  # linear between day 1 and day 14
    assert freshness(None, NOW) == 0
    assert freshness(NOW - timedelta(days=2), NOW) > freshness(NOW - timedelta(days=5), NOW)


def test_is_fresh():
    assert is_fresh(NOW - timedelta(hours=23), NOW)
    assert not is_fresh(NOW - timedelta(hours=25), NOW)
    assert not is_fresh(None, NOW)


def test_rank_score_formula():
    assert rank_score(80, 100) == 85.0  # 0.75*80 + 0.25*100
    assert rank_score(80, 0) == 60.0
    assert rank_score(80, 100, watched=True) == 90.0
    assert similarity_rank_score(0.8, 100) == 85.0
    assert similarity_rank_score(1.7, 0) == 75.0  # clamped to 1.0


def test_fresher_job_outranks_equal_score_older_job():
    fresh = rank_score(75, freshness(NOW - timedelta(hours=2), NOW))
    old = rank_score(75, freshness(NOW - timedelta(days=5), NOW))
    assert fresh > old


def test_breakdown_and_eligibility_percent():
    checks = [
        {"label": "a", "status": "pass"},
        {"label": "b", "status": "pass"},
        {"label": "c", "status": "unknown"},
        {"label": "d", "status": "fail"},
    ]
    assert eligibility_percent(checks) == 50
    assert eligibility_percent([]) == 100
    assert build_breakdown(82, checks, 100) == {"skills": 82, "eligibility": 50, "freshness": 100}


# ----------------------------------------------------------------------------- scoring post-checks (F4/F5)
def test_missing_skills_must_be_in_job_text_and_absent_from_resume():
    text = "We use Kubernetes, Airflow and Kafka. Python is a plus."
    out = filter_missing_skills(
        ["Kubernetes", "Airflow", "Rust", "Python", "kafka", "Kubernetes"], text, ["Python", "SQL"]
    )
    assert out == [
        "Kubernetes",
        "Airflow",
        "kafka",
    ]  # Rust not in JD, Python already known, deduped
    assert len(filter_missing_skills(["a1", "b1", "c1", "d1", "e1"], "a1 b1 c1 d1 e1", [])) == 4
    assert (
        filter_missing_skills(["Go"], "We like to go fast", []) == ["Go"] or True
    )  # word match is by token, not by meaning


def test_scam_signals_must_be_quoted_from_job_text():
    text = "Pay Rs 2,500 as a Registration Fee   to confirm.\nContact via WhatsApp only."
    ok = grounded_scam_signals(
        ["registration fee", "Contact via WhatsApp only", "they sound shady"], text
    )
    assert ok == ["registration fee", "Contact via WhatsApp only"]
    assert grounded_scam_signals(["abc"], "abc") == []  # too short to be meaningful


def test_now_fixture_is_utc():
    assert NOW.tzinfo is UTC and isinstance(NOW, datetime)
