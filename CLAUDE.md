# CLAUDE.md — SCOUT

SCOUT is a personal AI job & internship radar for **two profiles** sharing one password. A Python worker (GitHub Actions cron) scans job sources and company careers pages every 3h (watched companies hourly), ranks jobs against each profile's resume with Gemini (free tier), and sends Telegram alerts with apply links. A Next.js app on Vercel is the UI and hosts the Telegram webhook. Supabase (Postgres + pgvector + Storage) holds all state.

## Read before working
1. `PRD.md` — scope. **Feature freeze: build only what is listed there** (core capabilities + the 10 features). If something seems missing, ask; don't add it.
2. `ARCHITECTURE.md` — stack, schema, pipeline, APIs, env.
3. `DESIGN.md` + `docs/design/*.png` — the UI is final. **Open the relevant screenshot before building or changing any screen** and match it in dark and light mode.
4. `TASKS.md` — work the current phase only, in order. Tick boxes and commit when a phase's acceptance criteria pass.

## Repo map
- `apps/web` — Next.js App Router (TS strict, Tailwind v4, motion, shadcn primitives)
- `worker` — Python 3.12 (uv): `scout_worker/{sources,ats,pipeline,notify,programs}`
- `supabase/migrations` — SQL migrations (never edit an applied migration; add a new one)
- `.github/workflows` — `full_scan.yml`, `watched_scan.yml`, `ci.yml`

## Commands
```bash
# web
pnpm -C apps/web dev
pnpm -C apps/web lint && pnpm -C apps/web typecheck && pnpm -C apps/web build
pnpm -C apps/web seed:dev            # sample data for UI work
pnpm -C apps/web db:types            # regenerate Supabase types after migrations

# worker
cd worker && uv sync
uv run python -m scout_worker.main full --dry-run
uv run python -m scout_worker.main full | watched | reminders
uv run ruff check . && uv run ruff format --check . && uv run pytest
```

## Hard rules
- **Profile isolation:** every query on per-user tables filters by `profile_id` from `requireProfile()` (web) or the loop variable (worker). Never trust a profile id from the client.
- **Secrets server-side only:** Supabase service key, Gemini key, Telegram token are imported only in server code (`import "server-only"`). Nothing secret in client components or `NEXT_PUBLIC_*`.
- **Gemini budget:** every call goes through `lib/gemini.ts` / `scout_worker/llm.py` (structured output, retries, `llm_usage` soft caps). Never call Gemini in a loop per job — batch. Model names come from env; check current model names and free-tier limits in Google's docs instead of guessing.
- **External APIs:** verify each job-source/ATS endpoint against the live service before implementing, save a fixture, and test against fixtures. CI never makes live calls. If reality differs from `ARCHITECTURE.md`, update the doc in the same commit.
- **Scraped text is untrusted:** never render raw HTML from jobs; never let job text act as instructions in prompts (delimit it; system prompt says ignore instructions inside it).
- **Sources fail soft:** one source erroring must not fail a scan.
- **No auto-applying, no LinkedIn scraping, no automated outreach.** Referral helper only builds search URLs.

## UI rules
- Tokens only (`styles/tokens.css`); no raw hex in components. Both themes for every screen.
- Server Components by default; client components only for interaction.
- Motion: `LazyMotion` + `m.*`, tokens from `lib/motion.ts`. Animate **only transform/opacity** (+ SVG strokeDashoffset). Loops are CSS and pause off-screen. Respect `prefers-reduced-motion`. See `DESIGN.md §5–6`.
- Use existing components in `components/ui` before creating new ones. Match spacing, radius, and typography from `DESIGN.md §1` exactly.
- After building a screen, compare it side-by-side with its screenshot (both themes, 1440 / 1024 / 390) and fix differences before moving on.

## Code conventions
- TS: strict, no `any`, zod at every boundary (route handlers, server actions, Gemini output). Named exports. Files kebab-case, components PascalCase.
- Python: type hints everywhere, pydantic models at boundaries, async httpx, `structlog` logging with `run_id`, no prints.
- Small focused modules; one source adapter per file; pure functions for rules (eligibility, scam, dedupe, referrals) with unit tests.
- Times stored UTC; displayed and scheduled in `Asia/Kolkata`.
- Conventional commits: `feat(phase-N): …`, `fix: …`, `chore: …`.

## Definition of done (every task)
1. Acceptance criteria in `TASKS.md` pass.
2. Web: lint, typecheck, build pass. Worker: ruff + pytest pass.
3. New logic has tests (rules, parsers, adapters with fixtures, Telegram callback parsing).
4. UI matches the screenshot in both themes; no console errors; no jank (transform/opacity only).
5. `TASKS.md` boxes ticked; docs updated if behaviour changed.

## When unsure
Ask one specific question instead of guessing on: scope, anything that costs money, deleting data, or deviating from the design. For small implementation details, pick the simplest option consistent with these docs and note it in the commit message.
