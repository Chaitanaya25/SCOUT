# SCOUT

Personal AI job & internship radar for two profiles sharing one password. A Python worker (GitHub Actions cron) scans job sources and company careers pages, ranks jobs against each profile's resume with Gemini, and sends Telegram alerts. A Next.js app on Vercel is the UI and the Telegram webhook; Supabase holds all state.

Read `PRD.md` (scope), `ARCHITECTURE.md` (technical), `DESIGN.md` + `docs/design/` (UI), `TASKS.md` (build plan) and `CLAUDE.md` (rules).

## Setup

Requirements: Node 20.9+ (22 recommended), pnpm, Python 3.12 and [uv](https://docs.astral.sh/uv/).

```powershell
pnpm install
```

### 1. Database
Create a Supabase project and apply the migrations by pasting them into the SQL Editor. Exact steps: [`supabase/APPLY.md`](supabase/APPLY.md).

### 2. Environment
Copy the template and fill it in:

```powershell
Copy-Item apps/web/.env.example apps/web/.env.local
Copy-Item worker/.env.example worker/.env
```

`.env.local` / `.env` are git-ignored. Never put secrets in `NEXT_PUBLIC_*` variables.

### 3. Shared password hash (`APP_PASSWORD_HASH`)
```powershell
pnpm -C apps/web hash-password
```
It asks for the password (hidden) and prints two forms of the bcrypt hash:
- the **`.env.local` form** with every `$` escaped as `\$` — use this in `apps/web/.env.local`. Next.js expands `$VAR` inside `.env` files, so an unescaped hash is silently mangled and sign-in fails (the login page tells you when the hash is invalid);
- the **raw form** — paste this as-is into Vercel / GitHub secrets (no escaping there).

### 4. Session secret (`SESSION_SECRET`)
```powershell
pnpm -C apps/web gen-secret
```
Prints `SESSION_SECRET=<43 random characters>`. Put it in `apps/web/.env.local` and in Vercel. Changing it signs everyone out.

### 5. Sample data (optional, for UI work)
```powershell
pnpm -C apps/web seed:dev
```
Idempotent. Remove it again with `pnpm -C apps/web seed:dev -- --clean`.

### 6. Run
```powershell
pnpm -C apps/web dev
```
Open <http://localhost:3000>. In development, `/dev/components` shows every UI component in both themes (it returns 404 in production).

## Checks

```powershell
pnpm -C apps/web lint
pnpm -C apps/web typecheck
pnpm -C apps/web test
pnpm -C apps/web build
```

Worker (from `worker/`):

```powershell
uv sync
uv run python -m scout_worker.main --help
uv run ruff check .
uv run ruff format --check .
uv run pytest
```

## Notes
- Sign-in: pick a profile, enter the shared password. 5 failed attempts per IP per 15 minutes are blocked (stored in the `login_attempts` table).
- Next.js 16 uses `proxy.ts` where older versions used `middleware.ts`; it protects every route except `/login`, `/api/auth/*`, `/api/telegram/webhook` and static assets.
- Times are stored in UTC and displayed in `Asia/Kolkata`. The full scan cron is `7 */3 * * *` (UTC); the sidebar countdown is approximate because GitHub can delay scheduled runs.
