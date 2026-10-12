"""SCOUT worker CLI: `full | watched | reminders | cleanup`."""

import argparse
import asyncio
import sys
from collections.abc import Sequence
from datetime import UTC, datetime

from scout_worker.config import get_settings
from scout_worker.http import make_client
from scout_worker.logging import configure_logging, new_run_id
from scout_worker.models import DEFAULT_LOCATIONS, DEFAULT_ROLES, FetchContext
from scout_worker.pipeline.ingest import format_report, ingest

COMMANDS: dict[str, str] = {
    "full": "Full scan: all sources, rank, notify (every 3 hours).",
    "watched": "Watched-company scan (hourly).",
    "reminders": "Send due application and program reminders.",
    "generic-pending": "Print true/false: is a generic careers page waiting to be checked (gates Playwright install).",
    "cleanup": "Delete stale jobs and old scan history (also runs daily inside `full`).",
}


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="python -m scout_worker.main",
        description="SCOUT worker: scans job sources, ranks jobs and sends Telegram alerts.",
    )
    sub = parser.add_subparsers(
        dest="command", required=True, metavar="{full,watched,reminders,cleanup,generic-pending}"
    )
    for name, help_text in COMMANDS.items():
        cmd = sub.add_parser(name, help=help_text, description=help_text)
        if name == "full":
            cmd.add_argument(
                "--dry-run",
                action="store_true",
                help="Fetch and print per-source counts; write nothing.",
            )
            cmd.add_argument(
                "--roles",
                help="Comma-separated role terms (dry-run default: from the database if DATABASE_URL is set, else built-ins).",
            )
            cmd.add_argument("--only", help="Comma-separated source names to run.")
    return parser


def out(text: str) -> None:
    sys.stdout.write(text + "\n")


async def run_full_dry(args: argparse.Namespace) -> int:
    """No database writes. Roles/locations come from --roles, else the DB preferences when reachable, else defaults."""
    settings = get_settings()
    log = configure_logging(new_run_id())
    ctx = FetchContext(
        roles=[r.strip() for r in args.roles.split(",")] if args.roles else DEFAULT_ROLES,
        locations=DEFAULT_LOCATIONS,
        now=datetime.now(UTC),
    )
    if not args.roles and settings.database_url:
        try:
            from scout_worker.db import open_pool
            from scout_worker.runs import load_fetch_context

            pool = await open_pool(settings, timeout=8)
            try:
                async with pool.connection() as conn:
                    ctx = await load_fetch_context(conn)
            finally:
                await pool.close()
        except Exception as exc:  # noqa: BLE001 - a dry run must work without a reachable database
            log.warning("db_unreachable_using_default_roles", error=type(exc).__name__)
    only = {s.strip() for s in args.only.split(",")} if args.only else None
    async with make_client() as client:
        ingested = await ingest(settings, ctx, client, only=only)
    out(f"roles: {', '.join(ctx.roles)}\nlocations: {', '.join(ctx.locations)}\n")
    out(format_report(ingested))
    return 0


async def run_cleanup_cmd() -> int:
    from scout_worker.db import open_pool
    from scout_worker.pipeline.cleanup import run_cleanup

    pool = await open_pool(get_settings())
    try:
        async with pool.connection() as conn:
            out(f"cleanup: {await run_cleanup(conn)}")
    finally:
        await pool.close()
    return 0


def main(argv: Sequence[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    if sys.platform == "win32":  # psycopg async needs the selector loop on Windows
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    if args.command == "full" and args.dry_run:
        return asyncio.run(run_full_dry(args))
    if args.command == "full":
        from scout_worker.pipeline.full_scan import run_full

        stats = asyncio.run(run_full(get_settings()))
        out(
            f"full scan {stats['status']}: { ({k: v for k, v in stats.items() if k not in {'run_id', 'status'}}) }"
        )
        return 0 if stats["status"] != "failed" else 1
    if args.command == "cleanup":
        return asyncio.run(run_cleanup_cmd())
    if args.command == "generic-pending":
        out(
            "false"
        )  # generic careers-page watchers arrive with the Watchlist phase; ATS watchers never need a browser
        return 0
    out(f"scout_worker: '{args.command}' is not implemented yet.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
