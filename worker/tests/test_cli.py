import pytest

from scout_worker.main import COMMANDS, build_parser, main


def test_help_lists_all_commands(capsys: pytest.CaptureFixture[str]) -> None:
    with pytest.raises(SystemExit) as exc:
        build_parser().parse_args(["--help"])
    assert exc.value.code == 0
    out = capsys.readouterr().out
    for name in COMMANDS:
        assert name in out


def test_full_accepts_dry_run() -> None:
    args = build_parser().parse_args(["full", "--dry-run"])
    assert args.command == "full"
    assert args.dry_run is True


def test_stub_commands_exit_zero() -> None:
    assert main(["watched"]) == 0
    assert main(["reminders"]) == 0
