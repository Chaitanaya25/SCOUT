"""Telegram message formatting, alert selection and the sender's rate-limit handling (httpx MockTransport, no network)."""

import asyncio
import json
from datetime import timedelta

import httpx
import pytest
from conftest import NOW

from scout_worker.notify.messages import (
    digest_keyboard,
    esc,
    format_digest,
    format_job_message,
    job_keyboard,
    posted_ago,
    split_alerts,
)
from scout_worker.notify.telegram import MIN_GAP, TelegramBlocked, TelegramClient

MATCH_ID = "123e4567-e89b-42d3-a456-426614174000"


def test_job_message_format_and_escaping():
    text = format_job_message(
        title="ML <Intern> & Co", company="Acme <b>Inc</b>", location="Bangalore", posted_at=NOW - timedelta(hours=3),
        score=91, missing_skills=["Kubernetes", "Airflow"], now=NOW, fresh=True,
    )  # fmt: skip
    assert text.startswith("FRESH\n<b>ML &lt;Intern&gt; &amp; Co</b> — Acme &lt;b&gt;Inc&lt;/b&gt;")
    assert "Bangalore · 3h ago · <b>91% match</b>" in text
    assert text.endswith("Missing: Kubernetes, Airflow")
    assert "<script" not in format_job_message(
        title="<script>x</script>",
        company="c",
        location=None,
        posted_at=None,
        score=None,
        missing_skills=[],
        now=NOW,
    )


def test_watched_prefix_and_no_score_for_watched_alerts():
    text = format_job_message(
        title="Backend Intern",
        company="Stripe",
        location=None,
        posted_at=NOW,
        score=None,
        missing_skills=[],
        now=NOW,
        watched=True,
    )
    assert (
        text.startswith("WATCHED\n")
        and "match" not in text
        and "Location not listed" in text
        and "Missing" not in text
    )


def test_posted_ago():
    assert posted_ago(NOW - timedelta(minutes=10), NOW) == "just now"
    assert posted_ago(NOW - timedelta(hours=5), NOW) == "5h ago"
    assert posted_ago(NOW - timedelta(days=3, hours=2), NOW) == "3d ago"
    assert posted_ago(None, NOW) == "recently"


def test_keyboard_layout_and_callback_data_size():
    kb = job_keyboard(MATCH_ID, "https://example.com/apply")
    rows = kb["inline_keyboard"]
    assert rows[0] == [{"text": "Apply ↗", "url": "https://example.com/apply"}]
    assert [b["text"] for b in rows[1]] == ["Save", "Skip", "Applied ✓"]
    data = [b["callback_data"] for b in rows[1]]
    assert data == [f"s:{MATCH_ID}", f"k:{MATCH_ID}", f"a:{MATCH_ID}"]
    assert all(len(d.encode()) <= 64 for d in data)  # Telegram's callback_data limit
    assert (
        len(job_keyboard(MATCH_ID, "javascript:alert(1)")["inline_keyboard"]) == 1
    )  # no URL button for unsafe URLs


def test_digest_lists_ten_with_links_and_more():
    items = [
        {
            "title": f"Job {i} <x>",
            "company": "Co",
            "score": 70 + i,
            "url": f"https://x.test/{i}?a=1&b=2",
        }
        for i in range(12)
    ]
    text = format_digest(items, more=5)
    assert text.count("•") == 10 and "…and 5 more" in text
    assert 'href="https://x.test/0?a=1&amp;b=2"' in text and "Job 0 &lt;x&gt; — Co · 70%" in text
    assert (
        digest_keyboard("https://scout.example.app/")["inline_keyboard"][0][0]["url"]
        == "https://scout.example.app/jobs"
    )
    assert digest_keyboard("not a url") is None
    assert esc(None) == ""


def test_split_alerts_fresh_individual_capped_rest_digest():
    def row(i, hours, rank):
        return {"id": i, "posted_at": NOW - timedelta(hours=hours), "rank_score": rank}

    rows = [row("a", 2, 90), row("b", 30, 99), row("c", 5, 80), row("d", 1, 70), row("e", 3, 60)]
    individual, digest = split_alerts(rows, NOW, max_individual=2)
    assert [r["id"] for r in individual] == ["a", "c"]  # fresh only, best rank first, capped
    assert [r["id"] for r in digest] == ["b", "d", "e"]  # older + fresh overflow, rank order
    assert split_alerts(rows, NOW, 0)[0] == []
    assert all(
        r["id"] != "b" for r in split_alerts(rows, NOW, 8)[0]
    )  # a 30h-old job is never an individual alert


def _client(handler, sleeps, clock):
    async def sleep(s):
        sleeps.append(s)
        clock["t"] += s

    http = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    return TelegramClient("TOKEN", http, sleep=sleep, monotonic=lambda: clock["t"]), http


def test_send_success_paces_messages_and_never_leaks_token_in_payload():
    seen = []

    def handler(request: httpx.Request):
        seen.append(json.loads(request.content))
        return httpx.Response(200, json={"ok": True, "result": {"message_id": len(seen)}})

    sleeps, clock = [], {"t": 1000.0}

    async def go():
        tg, http = _client(handler, sleeps, clock)
        ids = [
            await tg.send_message(7, "hi"),
            await tg.send_message(7, "again", {"inline_keyboard": []}),
        ]
        await http.aclose()
        return ids

    assert asyncio.run(go()) == [1, 2]
    assert (
        seen[0]["parse_mode"] == "HTML"
        and seen[0]["chat_id"] == 7
        and "TOKEN" not in json.dumps(seen)
    )
    assert sleeps and sleeps[-1] == pytest.approx(
        MIN_GAP
    )  # second message to the same chat waits >= 1.1s


def test_rate_limit_obeys_retry_after_then_succeeds():
    calls = {"n": 0}

    def handler(request: httpx.Request):
        calls["n"] += 1
        if calls["n"] == 1:
            return httpx.Response(429, json={"ok": False, "parameters": {"retry_after": 7}})
        return httpx.Response(200, json={"ok": True, "result": {"message_id": 42}})

    sleeps, clock = [], {"t": 0.0}

    async def go():
        tg, http = _client(handler, sleeps, clock)
        mid = await tg.send_message(1, "x")
        await http.aclose()
        return mid

    assert asyncio.run(go()) == 42 and calls["n"] == 2 and 8 in sleeps  # retry_after + 1


def test_blocked_chat_raises_and_is_not_retried():
    calls = {"n": 0}

    def handler(request: httpx.Request):
        calls["n"] += 1
        return httpx.Response(
            403, json={"ok": False, "description": "Forbidden: bot was blocked by the user"}
        )

    async def go():
        tg, http = _client(handler, [], {"t": 0.0})
        try:
            await tg.send_message(1, "x")
        finally:
            await http.aclose()

    with pytest.raises(TelegramBlocked):
        asyncio.run(go())
    assert calls["n"] == 1
