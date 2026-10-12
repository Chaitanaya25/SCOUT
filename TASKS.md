# SCOUT — Build Plan

Work **one phase at a time, in order.** Each task has acceptance criteria — a task is done only when they pass. After each phase: run checks (§ "Definition of done" in `CLAUDE.md`), tick the boxes here, and commit with `feat(phase-N): …`. Do not start the next phase with failing checks.

Legend: `[ ]` todo · `[x]` done · `(W)` worker · `(UI)` web.

---

## Phase 0 — Repo & tooling
- [x] Monorepo layout per `ARCHITECTURE.md §2`; pnpm workspace for `apps/web`; uv project for `worker`.
- [x] Next.js (App Router, TS strict, ESLint, Tailwind v4), path alias `@/*`.
- [x] Worker: Python 3.12, uv, ruff, pytest, `python -m scout_worker.main --help` works.
- [x] `.env.example` for web and worker (all vars in `ARCHITECTURE.md §12`).
- [x] `ci.yml`: web lint + typecheck + build; worker ruff + pytest.
- [x] Copy Stitch exports into `docs/design/<NN-screen-theme>/{code.html,screen.png}`.

**Accept:** `pnpm -C apps/web build` and `uv run pytest` pass in CI.

## Phase 1 — Database
- [x] `supabase/migrations/0001_init.sql` with the full schema from `ARCHITECTURE.md §4` (types, tables, indexes, RLS enabled, no anon policies) + `login_attempts`. *(Applied and checked on a local Postgres/pgvector (PGlite): 15 tables, RLS on all, 0 policies. Not yet applied to a Supabase project.)*
- [x] RPCs: `similar_jobs`, `match_candidates`, `dashboard_kpis`. *(Smoke-tested on PGlite.)*
- [x] Storage buckets `resumes`, `avatars` (private). *(In 0001; bucket rows checked on a stub `storage.buckets`, real Supabase storage unverified.)*
- [x] Seed script: 2 profiles (`user-01`, `user-02`), empty preferences rows (`0002_seed_profiles.sql`, idempotent).
- [ ] Dev seed (`pnpm seed:dev`): ~80 realistic sample jobs, matches, applications, programs, watched companies — for building UI without running scans. *(Written; row data unit-tested and loaded twice into the real schema on PGlite. The supabase-js runner has not been run against Supabase — pending your project.)*
- [ ] Generate Supabase TS types into `apps/web/lib/database.types.ts`. *(`db:types` script written (Management API, unverified); the file is currently hand-written from the schema and typechecks against the seed runner.)*

**Accept:** migration applies cleanly on a fresh Supabase project; dev seed renders realistic data.

## Phase 2 — Design system (UI)
- [x] `styles/tokens.css` with dark/light tokens (`DESIGN.md §1`), Tailwind `@theme` mapping, `next-themes` (default dark, class strategy). *(Light is unverified: no Stitch mock.)*
- [x] Fonts via `next/font`: Inter, JetBrains Mono (Stitch export; Archivo Black / Inter Tight were dropped).
- [x] `lib/motion.ts` tokens; `LazyMotion` provider in root layout.
- [x] Components (`DESIGN.md §3`): Button (primary/secondary/ghost/danger), Chip, Tag, FreshBadge, ScamBadge, AtsBadge, CountPill, DiffPill, MatchRing, ProgressBar, Sparkline, Card, CompanyLogo, Kbd, Skeleton, EmptyState, Switch, Tabs (layoutId indicator), Tooltip, PageHeader, StatTile, ModuleCard.
- [x] Radar (`DESIGN.md §5.3`) and Marquee components with off-screen pause + reduced-motion.
- [x] `/dev/components` page showing every component in both themes (dev only; 404 in production).

**Accept:** component page matches screenshot styling in both themes; animations are transform/opacity only (verify in DevTools "Rendering → Paint flashing": no repaint storms).

## Phase 3 — Auth & shell (UI)
- [x] `/login` exactly per `DESIGN.md §4.1` (profile cards, password, shake on error). *(Checked against `01-sign-in-dark` in dark mode; tile status line shows alert count instead of the mock's "2h ago".)*
- [x] `/api/auth/login|logout|switch`, JWT cookie, login rate limit, `proxy.ts` (Next 16's `middleware.ts`), `requireProfile()`. *(Verified end to end against a mock of the Supabase REST API, not a real project.)*
- [x] Sidebar (`§2.1`) with profile switcher, nav indicator `layoutId`, next-scan countdown (Stitch has no ring), collapse.
- [x] Topbar (`§2.2`) with search (cmdk palette: pages + jobs + companies + programs), scan status pill (polling `/api/scan/status`), Telegram pill, bell, avatar menu (sign out). *(Theme toggle lives in the sidebar, per Stitch. Bell has no data source yet.)*
- [x] Responsive behaviour (`§2.3`). *(Checked at 1440, 1024 and 390 in dark mode.)*

**Accept:** wrong password rejected and rate-limited; switching profile swaps data; shell matches screenshots at 1440, 1024, 390 widths.

## Phase 4 — Worker: sources (W)
- [x] `config.py` (pydantic-settings), `db.py` (psycopg pool + pgvector register), `models.py` (RawJob, Job).
- [x] Shared HTTP client, retry, structured logging, `scan_runs` / `source_runs` bookkeeping.
- [x] Adapters (`ARCHITECTURE.md §5`): jobspy, adzuna, internshala, remoteok, remotive, himalayas, arbeitnow, weworkremotely, greenhouse, lever, ashby, workday, smartrecruiters. Verify each live endpoint before coding; record fixtures. _ — verified live (dry-run: 12 sources returned jobs). Adzuna is disabled without keys and UNVERIFIED live (hand-written fixture). jobspy's google site returned 429 in the live run and is skipped with a note._
- [x] `data/ats_companies.yaml` with a starter list of intern-hiring companies + tokens (verify each).
- [x] Normalize (`§7.1`) and dedupe/upsert (`§7.2`).
- [x] `main full --dry-run` prints per-source counts without writing.

**Accept:** one real run inserts jobs from ≥10 sources; a source raising an exception marks only its `source_runs` row failed; unit tests for normalize + dedupe pass on fixtures.

## Phase 5 — Worker: matching (W)
- [x] `llm.py` wrapper (structured output, retries, `llm_usage` soft caps, graceful degradation). _ — verified with a fake Gemini client; real Gemini calls UNVERIFIED._
- [x] Scam rules (`§7.4`) with tests (fees, deposits, WhatsApp-only, gmail recruiter).
- [x] Eligibility rules (`§7.3`) with tests (senior titles, "3+ years", batch restrictions, location/remote, job type).
- [x] Embeddings for new jobs (batched) (`§7.5`). _ — fake Gemini only; real embedding calls UNVERIFIED._
- [x] Ranking + Gemini scoring (`§7.6`, `§8.3`), prompt in `prompts/score.md`, pydantic validation. _ — fake Gemini only; real scoring quality UNVERIFIED._
- [x] Freshness + `rank_score` + `breakdown`.

**Accept:** with a real resume, top 10 matches for User 01 are relevant ML/AI/backend internships/entry roles; no senior roles; per-scan Gemini calls ≤ configured budget; tests pass.

## Phase 6 — Telegram (W + UI)
- [x] Bot setup docs in README (BotFather, setWebhook with secret).
- [x] `/api/telegram/webhook`: secret verification, `/start <token>` linking, callback handling (save/skip/applied) with keyboard edit (`ARCHITECTURE.md §9`). _ — verified against a mock Supabase; real Telegram delivery UNVERIFIED._
- [x] `/api/telegram/link` + Settings → Telegram UI (QR, countdown, linked state, test message, unlink). _ — verified against a mock Supabase._
- [x] Worker notifier: fresh individual alerts, digest, watched alerts, rate-limit handling (`§7.7`). _ — verified with a fake Telegram transport on PGlite; real delivery UNVERIFIED. Watched alerts exist in the notifier, but `main watched` is still a stub (Phase 10)._

**Accept:** linking works for both profiles independently; tapping Applied ✓ in Telegram moves the job to Applied in the web tracker within one refresh; no duplicate notifications across scans.

## Phase 7 — Scheduling & scan status
- [x] `full_scan.yml` (every 3h, off-hour minute) and `watched_scan.yml` (hourly), shared concurrency group, secrets wired, Playwright chromium installed. _ — written, not yet run on GitHub. Playwright installs only when a generic careers page is pending (never, until Phase 10)._
- [x] `/api/scan` (workflow_dispatch) + `/api/scan/status`. _ — `/api/scan` returns 501 until GITHUB_TOKEN/GITHUB_REPO are set; the GitHub call itself is UNVERIFIED._
- [x] `lib/scan-schedule.ts` next-run computation; sidebar ring + topbar pill use it. _ — already done in Phase 3; the topbar pill now shows live source counts from `source_runs`._

**Accept:** scheduled runs succeed for 24h; "Scan now" starts a run and the UI shows live progress then idle state.

## Phase 8 — Dashboard (UI)
- [ ] `/dashboard` per `DESIGN.md §4.2`: hero (greeting, radar with real blips, scan status card), KPI tiles with count-up + sparklines (`dashboard_kpis`), top 4 matches, bottom marquee.
- [ ] Loading skeletons, empty state (no resume → CTA to Settings → Resume).

**Accept:** matches screenshot in both themes; 60fps idle with radar + marquee running (DevTools, 4× CPU throttle); Lighthouse perf ≥ 90.

## Phase 9 — Job Feed + drawer (UI) — F1, F3, F4, F5, F8, F9
- [ ] `/jobs` filters in URL params (Remote, India, Internship, Fresh < 24h, Eligible only, Hide scam risk), sort, Cards/Table toggle, infinite scroll, virtualization.
- [ ] Job cards with Fresh/Scam badges, ring, missing skills line, Apply/Save actions.
- [ ] Drawer (`§4.3`): tabs Overview/Match/Company/Similar, eligibility list, breakdown bars, keyboard nav, Esc, focus trap, URL `?job=`.
- [ ] F8: `/api/jobs/[id]/tailor` + UI (generate, checklist, results, copy, regenerate, cache).
- [ ] F9: `lib/referrals.ts` + Find referrals card.
- [ ] Apply ↗ → new tab + "Mark as applied?" toast action.

**Accept:** filters animate smoothly (layout, no jank); tailored bullets only use real resume content; referral links open correct LinkedIn searches.

## Phase 10 — Watched Companies (UI + W) — F2
- [ ] `POST /api/watched` with ATS detection (patterns + page markers + API validation); generic URLs marked pending.
- [ ] Worker `main watched`: ATS fetch, active/inactive marking, new-role diff, generic Playwright fallback with content hash + Gemini extraction, instant alerts.
- [ ] `/watched` UI per `§4.4` (add flow with status steps, rows, expand, switch, remove).

**Accept:** adding a Greenhouse, a Lever and an Ashby company shows correct counts within a minute; a generic page resolves on the next hourly scan; new roles trigger a Telegram alert once.

## Phase 11 — Tracker (UI) — F6, F7
- [ ] `/tracker` kanban per `§4.5` with dnd-kit (mouse, touch, keyboard), position persistence, counts, edit popover, manual add, delete.
- [ ] Next-action reminders sent by worker (`§7.8`).
- [ ] Sync with `job_matches.status` (save/applied) from feed and Telegram.

**Accept:** drag across all columns persists after reload; Telegram reminder sent once on the due date.

## Phase 12 — Programs (UI + W) — F10
- [ ] `worker/data/programs.yaml` curated seed (GSoC, LFX terms, MLH Fellowship, known off-campus drives) with verified URLs/dates; loader upserts on each full scan.
- [ ] MLH hackathon scraper → `programs` (category hackathon).
- [ ] `/programs` per `§4.6` (tabs, rows, progress, days-left colours, reminder toggle, add program).
- [ ] 7-day and 1-day Telegram reminders.

**Accept:** tabs filter instantly; a reminder set for a program 7 days out is delivered that day.

## Phase 13 — Settings (UI)
- [x] Profile (name, avatar upload + crop, college). _ — no crop step: the image is stored as uploaded (PNG/JPEG/WebP, max 2 MB)._
- [x] Resume: upload → storage → text extraction (PDF, DOCX; DOC via best effort) → Gemini parse → embedding → skill chips editable; re-embedding on skill edits. _ — legacy .doc is rejected with a clear message (cannot be parsed in Node); Gemini parse/embedding verified with a fake Gemini only, real calls UNVERIFIED._
- [x] Preferences form (zod-validated) per `§4.7`.
- [x] Telegram (from Phase 6) and Scan Settings (schedule, last 10 runs, sources, Scan now). _ — verified against a mock Supabase; Scan now needs real GitHub credentials (UNVERIFIED)._

**Accept:** uploading a resume updates matches on the next scan; preferences changes affect eligibility on the next scan.

## Phase 14 — Polish & QA
- [ ] Pixel pass against every `docs/design/<NN-screen-theme>/screen.png` (dark + light, 1440/1024/390).
- [ ] Reduced-motion pass; keyboard-only pass; contrast check.
- [ ] Performance pass (`DESIGN.md §6` targets) and bundle check.
- [ ] Error states for every fetch; toasts for every mutation.
- [ ] Remove `/dev/components` from production build.

**Accept:** all `DESIGN.md §6` targets met; no console errors; no layout shift on load.

## Phase 15 — Deploy
- [ ] Supabase prod project, migrations applied, buckets created, seed profiles.
- [ ] Vercel project for `apps/web` with env vars; custom domain optional.
- [ ] Telegram `setWebhook` to prod URL with secret.
- [ ] GitHub Actions secrets; enable schedules.
- [ ] README: setup, env, generating `APP_PASSWORD_HASH`, linking Telegram, adding sources.

**Accept:** fresh deploy works end-to-end: login → upload resume → link Telegram → scheduled scan → alert → Applied ✓ → tracker.
