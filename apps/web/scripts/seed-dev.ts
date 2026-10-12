/**
 * Dev seed: `pnpm -C apps/web seed:dev` (add `-- --clean` to remove what it created).
 *
 * Writes sample jobs, matches, applications, programs, watched companies and scan history into the
 * Supabase project named by SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (read from apps/web/.env.local or the
 * environment). Idempotent: every row has a deterministic id and is upserted. It does not overwrite a profile's
 * real preferences (only fills them when `roles` is still empty) and never touches rows it did not create.
 */
import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "../lib/database.types";
import { buildSeed, SEED_DEDUPE_PREFIX, SEED_PROGRAM_SOURCE } from "./seed-data";

const envFile = resolve(process.cwd(), ".env.local");
if (existsSync(envFile)) process.loadEnvFile(envFile);

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Put them in apps/web/.env.local (see apps/web/.env.example).",
  );
  process.exit(1);
}

const db = createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const CHUNK = 100;

function fail(step: string, error: { message: string } | null): void {
  if (error) {
    console.error(`seed failed at "${step}": ${error.message}`);
    process.exit(1);
  }
}

function chunks<T>(rows: T[]): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < rows.length; i += CHUNK) out.push(rows.slice(i, i + CHUNK));
  return out;
}

async function profileIds() {
  const { data, error } = await db.from("profiles").select("id, slug").in("slug", ["user-01", "user-02"]);
  fail("read profiles", error);
  const map = new Map((data ?? []).map((p) => [p.slug, p.id]));
  const a = map.get("user-01");
  const b = map.get("user-02");
  if (!a || !b) {
    console.error("Profiles user-01/user-02 not found. Apply supabase/migrations/0002_seed_profiles.sql first.");
    process.exit(1);
  }
  return { "user-01": a, "user-02": b };
}

async function clean(): Promise<void> {
  const ids = await profileIds();
  const seed = buildSeed(new Date(), ids);
  const jobIds = seed.jobs.map((j) => j.id as string);
  const steps: [string, () => PromiseLike<{ error: { message: string } | null }>][] = [
    ["applications", () => db.from("applications").delete().in("id", seed.applications.map((r) => r.id as string))],
    ["job_matches", () => db.from("job_matches").delete().in("job_id", jobIds)],
    ["program_reminders", () => db.from("program_reminders").delete().in("program_id", seed.programs.map((r) => r.id as string))],
    ["programs", () => db.from("programs").delete().eq("source", SEED_PROGRAM_SOURCE)],
    ["watched_companies", () => db.from("watched_companies").delete().in("company_id", seed.companies.map((r) => r.id as string))],
    ["jobs", () => db.from("jobs").delete().like("dedupe_key", `${SEED_DEDUPE_PREFIX}%`)],
    ["companies", () => db.from("companies").delete().in("id", seed.companies.map((r) => r.id as string))],
    ["source_runs", () => db.from("source_runs").delete().in("scan_run_id", seed.scanRuns.map((r) => r.id as string))],
    ["scan_runs", () => db.from("scan_runs").delete().in("id", seed.scanRuns.map((r) => r.id as string))],
  ];
  for (const [name, run] of steps) {
    const { error } = await run();
    fail(`clean ${name}`, error);
    console.log(`cleaned ${name}`);
  }
  console.log("Done. Preferences/college filled by the seed were left in place.");
}

async function seed(): Promise<void> {
  const ids = await profileIds();
  const data = buildSeed(new Date(), ids);

  for (const rows of chunks(data.companies)) fail("companies", (await db.from("companies").upsert(rows, { onConflict: "id" })).error);
  for (const rows of chunks(data.jobs)) fail("jobs", (await db.from("jobs").upsert(rows, { onConflict: "id" })).error);
  for (const rows of chunks(data.jobMatches)) fail("job_matches", (await db.from("job_matches").upsert(rows, { onConflict: "id" })).error);
  for (const rows of chunks(data.applications)) fail("applications", (await db.from("applications").upsert(rows, { onConflict: "id" })).error);
  for (const rows of chunks(data.programs)) fail("programs", (await db.from("programs").upsert(rows, { onConflict: "id" })).error);
  fail("program_reminders", (await db.from("program_reminders").upsert(data.programReminders, { onConflict: "profile_id,program_id", ignoreDuplicates: true })).error);
  fail("watched_companies", (await db.from("watched_companies").upsert(data.watchedCompanies, { onConflict: "profile_id,company_id" })).error);
  fail("scan_runs", (await db.from("scan_runs").upsert(data.scanRuns, { onConflict: "id" })).error);
  fail("source_runs", (await db.from("source_runs").upsert(data.sourceRuns, { onConflict: "id" })).error);

  // Fill (never overwrite) real profile data.
  for (const slug of ["user-01", "user-02"] as const) {
    const { data: pref, error } = await db.from("preferences").select("roles").eq("profile_id", ids[slug]).maybeSingle();
    fail(`read preferences ${slug}`, error);
    if (!pref) {
      fail(`insert preferences ${slug}`, (await db.from("preferences").insert({ profile_id: ids[slug], ...data.preferencePatches[slug] })).error);
    } else if (pref.roles.length === 0) {
      fail(`fill preferences ${slug}`, (await db.from("preferences").update(data.preferencePatches[slug]).eq("profile_id", ids[slug])).error);
    }
    fail(`fill college ${slug}`, (await db.from("profiles").update({ college: data.profileColleges[slug] }).eq("id", ids[slug]).is("college", null)).error);
  }

  console.log("Seeded (idempotent upserts):");
  console.log(`  companies ${data.companies.length}, jobs ${data.jobs.length}, job_matches ${data.jobMatches.length}`);
  console.log(`  applications ${data.applications.length}, programs ${data.programs.length}, watched ${data.watchedCompanies.length}`);
  console.log(`  scan_runs ${data.scanRuns.length}, source_runs ${data.sourceRuns.length}`);
}

const main = process.argv.includes("--clean") ? clean : seed;
main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
