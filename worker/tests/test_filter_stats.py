"""EXTRA 2: why-was-this-filtered counters (pure aggregation)."""

from scout_worker.pipeline.filter_stats import aggregate, failed_reason


def row(eligible=True, checks=None, scam="none", score=None):
    return {"eligible": eligible, "eligibility": checks or [], "scam_risk": scam, "score": score}


def fail(label):
    return {"label": label, "status": "fail"}


def test_failed_reason_buckets_match_eligibility_labels():
    assert failed_reason("Entry-level title") == "senior_title"
    assert failed_reason("Requires 3+ years of experience") == "experience"
    assert failed_reason("2028 batch eligible") == "batch_year"
    assert failed_reason("Job type matches") == "job_type"
    assert failed_reason("Location matches") == "location"
    assert failed_reason("No active backlogs") == "other"


def test_aggregate_counts_each_bucket_once_per_job():
    rows = [
        row(False, [fail("Entry-level title"), fail("Requires 5+ years of experience")]),
        row(False, [fail("2028 batch eligible"), {"label": "Location matches", "status": "pass"}]),
        row(False, [fail("Location matches")]),
        row(False, []),  # ineligible without a recorded reason
        row(scam="high", score=90),  # scam wins over everything else
        row(score=82),
        row(score=41),
        row(score=None),
        row(score=None),
    ]
    out = aggregate(rows, min_score=60)
    assert out["total"] == 9 and out["ineligible"] == 4 and out["scam_high"] == 1
    assert out["eligibility"] == {
        "senior_title": 1, "experience": 1, "batch_year": 1, "job_type": 0, "location": 1, "other": 1,
    }  # fmt: skip
    assert out["scored"] == 2 and out["low_score"] == 1 and out["unscored"] == 2
