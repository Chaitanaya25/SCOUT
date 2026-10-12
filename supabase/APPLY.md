# Applying the SCOUT database (no Supabase CLI needed)

You do this once per Supabase project. Everything is pasted into the dashboard's SQL Editor.

## 1. Create a project
1. Go to <https://supabase.com/dashboard> and create a new project (free tier is fine). Pick a region close to you and save the database password.
2. Wait until the project finishes provisioning.

## 2. Run the migrations (in order)
1. Open **SQL Editor** → **New query**.
2. Open `supabase/migrations/0001_init.sql` in this repo, copy **all** of it, paste it into the editor and click **Run**. It must finish with `Success. No rows returned`. It creates the extensions (`vector`, `pg_trgm`), enums, 15 tables, indexes, RLS (enabled on every table, no policies), the three RPCs, and the private `resumes` and `avatars` storage buckets.
3. New query. Copy all of `supabase/migrations/0002_seed_profiles.sql`, paste, **Run**. It creates `user-01` and `user-02` with empty preferences. It is safe to run twice.
4. **Do not edit an applied migration.** Later changes go into a new numbered file (`0003_…`), applied the same way.

## 3. Verify (paste each into a new query)
```sql
-- 15 tables, all with RLS on, and no policies
select count(*) as tables, count(*) filter (where rowsecurity) as rls_on
from pg_tables where schemaname = 'public';
select count(*) as policies from pg_policies where schemaname = 'public';

-- the two profiles and their preferences rows
select p.slug, p.display_name, (pr.profile_id is not null) as has_preferences
from profiles p left join preferences pr on pr.profile_id = p.id order by p.slug;

-- both buckets exist and are private
select id, public from storage.buckets where id in ('resumes', 'avatars');

-- the three RPCs exist
select proname from pg_proc
where proname in ('similar_jobs', 'match_candidates', 'dashboard_kpis') order by proname;
```
Expected: `tables = 15`, `rls_on = 15`, `policies = 0`; two profile rows; two buckets with `public = false`; three function names.

## 4. Connection values
In the project dashboard:
- **Project Settings → API**: copy **Project URL** (`SUPABASE_URL`) and the **service_role** key (`SUPABASE_SERVICE_ROLE_KEY`). The service_role key bypasses RLS: it is server-only, never put it in a `NEXT_PUBLIC_*` variable or commit it.
- **Project Settings → Database → Connection string → Transaction pooler**: copy it as `DATABASE_URL` (worker only), replacing `[YOUR-PASSWORD]`.
- Optional, for generating types: **Account → Access Tokens** → create a token → `SUPABASE_ACCESS_TOKEN` (web only).

Put them in `apps/web/.env.local` (copy from `apps/web/.env.example`) and `worker/.env`. Both files are git-ignored.

## 5. Dev data and types
From the repo root:
```powershell
pnpm -C apps/web seed:dev
```
Seeds ~80 sample jobs, matches for both profiles, applications in all six stages, 8 programs, 7 watched companies and scan history. It is idempotent (safe to re-run). It only fills a profile's preferences if they are still empty. Remove everything it created with:
```powershell
pnpm -C apps/web seed:dev -- --clean
```
Generate TypeScript types from your project (needs `SUPABASE_ACCESS_TOKEN`):
```powershell
pnpm -C apps/web db:types
```
`apps/web/lib/database.types.ts` is currently **hand-written** from the migration. `db:types` replaces it with generated types; if the Management API call fails, the file is left untouched.

## Troubleshooting
- `type "vector" does not exist`: enable the extension under **Database → Extensions**, or run `create extension if not exists vector;` first, then re-run 0001.
- `relation "profiles" already exists`: 0001 was already applied; do not re-run it. Use a new migration for changes.
- Seed says profiles not found: run `0002_seed_profiles.sql`.
