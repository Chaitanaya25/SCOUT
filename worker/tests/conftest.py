import json
from datetime import UTC, datetime
from pathlib import Path

import pytest

from scout_worker.models import FetchContext

FIXTURES = Path(__file__).parent / "fixtures"
NOW = datetime(2026, 10, 12, 12, 0, tzinfo=UTC)


def load_json(name: str):
    return json.loads((FIXTURES / name).read_text(encoding="utf-8"))


def load_text(name: str) -> str:
    return (FIXTURES / name).read_text(encoding="utf-8")


@pytest.fixture
def ctx() -> FetchContext:
    return FetchContext(
        roles=["machine learning intern", "backend engineer intern"],
        locations=["India", "Bangalore", "Remote"],
        now=NOW,
    )
