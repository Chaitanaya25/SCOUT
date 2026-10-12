"""Embeddings (ARCHITECTURE.md §7.5): batched, only for jobs without one; degrades quietly when the budget is spent."""

from typing import Any

from pgvector import Vector

from scout_worker.llm import LlmClient, LlmError
from scout_worker.logging import get_logger

BATCH_SIZE = 100
MAX_JOBS_PER_SCAN = 400
log = get_logger("embed")


def job_embed_text(title: str, company: str, location: str | None, description: str | None) -> str:
    """title + company + location + first 2,000 chars of the description."""
    return f"{title}\n{company}\n{location or ''}\n{(description or '')[:2000]}".strip()


def resume_embed_text(parsed: dict[str, Any], target_roles: list[str]) -> str:
    """summary + skills + project titles + target roles (same recipe as the web resume upload)."""
    projects = [p.get("name", "") for p in parsed.get("projects") or [] if isinstance(p, dict)]
    parts = [
        parsed.get("summary") or "",
        "Skills: " + ", ".join(parsed.get("skills") or []),
        "Projects: " + ", ".join(p for p in projects if p),
        "Target roles: " + ", ".join(target_roles or parsed.get("target_roles") or []),
    ]
    return "\n".join(p for p in parts if p.strip())


async def embed_new_jobs(pool, llm: LlmClient, limit: int = MAX_JOBS_PER_SCAN) -> int:
    """Embed up to `limit` active jobs lacking an embedding, newest first. Returns how many were embedded."""
    async with pool.connection() as conn:
        cur = await conn.execute(
            """select id, title, company_name, location, description from jobs
               where embedding is null and is_active order by first_seen_at desc limit %s""",
            (limit,),
        )
        rows = await cur.fetchall()
    done = 0
    for i in range(0, len(rows), BATCH_SIZE):
        chunk = rows[i : i + BATCH_SIZE]
        texts = [
            job_embed_text(r["title"], r["company_name"], r["location"], r["description"])
            for r in chunk
        ]
        try:
            vectors = await llm.embed(texts, "RETRIEVAL_DOCUMENT")
        except (
            LlmError
        ) as exc:  # includes LlmBudgetExceeded: keep what we have, the rest waits for the next scan
            log.warning(
                "embedding_stopped",
                reason=type(exc).__name__,
                embedded=done,
                remaining=len(rows) - done,
            )
            break
        async with pool.connection() as conn:
            for row, vec in zip(chunk, vectors, strict=True):
                await conn.execute(
                    "update jobs set embedding = %s where id = %s", (Vector(vec), row["id"])
                )
            await conn.commit()
        done += len(chunk)
    return done
