"""SCOUT worker CLI: `full | watched | reminders`."""

import argparse
import sys
from collections.abc import Sequence

COMMANDS: dict[str, str] = {
    "full": "Full scan: all sources, rank, notify (every 3 hours).",
    "watched": "Watched-company scan (hourly).",
    "reminders": "Send due application and program reminders.",
}


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="python -m scout_worker.main",
        description="SCOUT worker: scans job sources, ranks jobs and sends Telegram alerts.",
    )
    sub = parser.add_subparsers(dest="command", required=True, metavar="{full,watched,reminders}")
    for name, help_text in COMMANDS.items():
        cmd = sub.add_parser(name, help=help_text, description=help_text)
        if name == "full":
            cmd.add_argument(
                "--dry-run",
                action="store_true",
                help="Print per-source counts without writing to the database.",
            )
    return parser


def main(argv: Sequence[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    sys.stdout.write(f"scout_worker: '{args.command}' is not implemented yet (phase 0).\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
