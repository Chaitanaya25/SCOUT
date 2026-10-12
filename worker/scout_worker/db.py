"""Postgres access (psycopg 3 pool, pgvector registered).

Supabase's pooler runs in transaction mode, which does not support prepared statements, so they are switched off
(`prepare_threshold=None`). On Windows psycopg's async mode needs the selector event loop (see main.py).
"""

from psycopg import AsyncConnection
from psycopg.rows import dict_row
from psycopg_pool import AsyncConnectionPool

from scout_worker.config import Settings


async def _configure(conn: AsyncConnection) -> None:
    from pgvector.psycopg import register_vector_async

    await register_vector_async(conn)


async def open_pool(settings: Settings, timeout: float = 30) -> AsyncConnectionPool:
    if not settings.database_url:
        raise RuntimeError(
            "DATABASE_URL is not set (Supabase pooler connection string, see worker/.env.example)"
        )
    pool = AsyncConnectionPool(
        settings.database_url,
        min_size=1,
        max_size=4,
        open=False,
        kwargs={"row_factory": dict_row, "prepare_threshold": None, "autocommit": False},
        configure=_configure,
    )
    try:
        await pool.open(wait=True, timeout=timeout)
    except Exception:
        await pool.close()
        raise
    return pool
