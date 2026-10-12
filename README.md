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

## Telegram setup

1. In Telegram open [@BotFather](https://t.me/BotFather), send `/newbot`, and copy the **bot token** and the **bot username**.
2. Generate a webhook secret (Telegram allows letters, digits, `_` and `-` only, up to 256 characters):
   ```powershell
   pnpm -C apps/web gen-secret
   ```
   It prints a `SESSION_SECRET=<random value>` line; the random value is URL-safe, so copy just that value and use it as `TELEGRAM_WEBHOOK_SECRET` (a second run gives a different one, so you can keep the session secret separate).
3. Put `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME` (without `@`) and `TELEGRAM_WEBHOOK_SECRET` in `apps/web/.env.local` and in Vercel. Put `TELEGRAM_BOT_TOKEN` and `APP_URL` in the GitHub secrets (the worker sends the alerts).
4. Deploy the web app, then register the webhook against the **public https URL** (Telegram rejects localhost and http):
   ```powershell
   pnpm -C apps/web set-webhook -- --url https://your-app.vercel.app
   pnpm -C apps/web set-webhook -- --info
   ```
   `--info` shows the registered URL and any delivery error; `--delete` removes the webhook. The script never prints the token or the secret.
5. In SCOUT open **Settings → Telegram**, scan the QR code (or press **Open in Telegram**) and press **Start** in the chat. The link is valid for 15 minutes; **Regenerate Key** makes a new one. Repeat while signed in as the other profile; each profile links its own chat.
6. **Send Test Ping** confirms delivery. Tapping **Save**, **Skip** or **Applied ✓** under an alert updates the job in SCOUT.

## Scheduled scans (GitHub Actions)

`full_scan.yml` runs at minute 7 of every third hour (UTC) and `watched_scan.yml` at minute 37 of every hour; both share one concurrency group so they never overlap, and both can be started by hand (**Actions → Run workflow**, or **Scan now** in Settings).

Repository secrets (**Settings → Secrets and variables → Actions → Secrets**):

| Secret | Value |
|---|---|
| `DATABASE_URL` | Supabase **pooler** connection string (Project Settings → Database → Connection pooling). GitHub runners have no IPv6, so the direct host will not connect |
| `GEMINI_API_KEY` | Google AI Studio key (free tier) |
| `TELEGRAM_BOT_TOKEN` | from BotFather |
| `APP_URL` | public URL of the web app (used for the digest's "View all" button) |
| `ADZUNA_APP_ID`, `ADZUNA_APP_KEY` | optional; Adzuna stays disabled without them |

Optional repository **variables**: `GEMINI_MODEL`, `GEMINI_EMBED_MODEL`, `GEMINI_TAILOR_MODEL` (defaults: `gemini-3.5-flash-lite`, `gemini-embedding-2`, same as `GEMINI_MODEL`).

"Scan now" needs `GITHUB_TOKEN` (a fine-grained personal access token for this repo with **Actions: Read and write**) and `GITHUB_REPO` (`owner/repo`) in the web app's environment.

Worker commands (from `worker/`; they need `worker/.env`):

```powershell
uv run python -m scout_worker.main full --dry-run
uv run python -m scout_worker.main full
```

`--dry-run` fetches every source, prints per-source counts and writes nothing (it needs no database).

## Free-tier checklist

SCOUT is designed to cost nothing. Limits below were read from the official pages on 2026-10-13; they change, so re-check the linked page before relying on a number. **Billing stays off on all four services.**

| Service | Free limits that matter here | Where to confirm billing is off |
|---|---|---|
| **Supabase** ([pricing](https://supabase.com/pricing)) | 500 MB database per project, 1 GB file storage (50 MB max upload), 5 GB egress, 2 active projects, **projects pause after 1 week of inactivity** (the 3-hourly scan counts as activity), no automatic backups, 1 day of logs | Dashboard → Organization → Billing: plan must read **Free**. A Free org has no payment method, so it cannot be charged. Never click "Upgrade". |
| **Vercel** ([limits](https://vercel.com/docs/limits)) | Hobby: 100 deployments/day, 45 min build time, 1 concurrent build, 100 MB static upload, runtime logs kept 1 hour. Monthly allotments of bandwidth/function usage are listed under [fair-use guidelines](https://vercel.com/docs/limits/fair-use-guidelines#typical-monthly-usage-guidelines). Hobby is for non-commercial personal use | Vercel → Team Settings → Billing: plan must read **Hobby**. Hobby never bills overage; it pauses when an allotment is spent. |
| **GitHub Actions** ([billing](https://docs.github.com/en/billing/managing-billing-for-your-products/managing-billing-for-github-actions/about-billing-for-github-actions)) | **Public repo: standard runners are free and unmetered.** Private repo on GitHub Free: 2,000 minutes/month, 500 MB artifacts, 10 GB cache. Both scans together are about 8 full (about 6 min) + 24 watched (about 1 min) runs per day, roughly 2,200 min/month if those estimates hold, which is over the private quota. Keep the repo public (no secrets are committed) or lower the cron frequency, and watch the usage page | Settings → Billing and plans → Usage (Actions minutes). With no payment method on file, usage is blocked at the quota instead of billed. If you added a card, set a budget of **$0** under Budgets and alerts. |
| **Gemini API** ([rate limits](https://ai.google.dev/gemini-api/docs/rate-limits)) | Free tier, limits per **project** (RPM, tokens/min, requests/day), differ by model, and are shown only in [AI Studio](https://aistudio.google.com/rate-limit). Daily quotas reset at midnight Pacific time. The docs publish no fixed free numbers, so the worker caps itself far below what you see there (`LLM_DAILY_SOFT_CAP_*`) | AI Studio → API keys: the key's project must show tier **Free**. Do not click "Set up billing" or link a Cloud billing account; billing is required to leave the free tier. |

How SCOUT stays inside these limits:

- The worker retries Gemini at most 3 times per call, honours the server's retry hint, counts every request in `llm_usage` before sending it, and stops at the soft cap (scoring then falls back to similarity-only ranking, which never sends alerts).
- The daily cleanup (inside the full scan) deletes jobs inactive for 45+ days (unless you applied or saved them) and `scan_runs` older than 30 days, which keeps the 500 MB database small.
- The watched scan installs no browser unless a generic careers page is pending, and uv and Playwright downloads are cached, so hourly runs are short.

## Notes
- Sign-in: pick a profile, enter the shared password. 5 failed attempts per IP per 15 minutes are blocked (stored in the `login_attempts` table).
- Next.js 16 uses `proxy.ts` where older versions used `middleware.ts`; it protects every route except `/login`, `/api/auth/*`, `/api/telegram/webhook` and static assets.
- Times are stored in UTC and displayed in `Asia/Kolkata`. The full scan cron is `7 */3 * * *` (UTC); the sidebar countdown is approximate because GitHub can delay scheduled runs.
