import { describe, expect, it } from "vitest";

import { buildSeed, SEED_DEDUPE_PREFIX, uuidV5 } from "./seed-data";

const ids = {
  "user-01": "11111111-1111-4111-8111-111111111111",
  "user-02": "22222222-2222-4222-8222-222222222222",
};
const NOW = new Date("2026-10-12T09:30:00.000Z");

describe("uuidV5", () => {
  it("is deterministic and well-formed", () => {
    expect(uuidV5("job:x")).toBe(uuidV5("job:x"));
    expect(uuidV5("job:x")).not.toBe(uuidV5("job:y"));
    expect(uuidV5("job:x")).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
});

describe("buildSeed", () => {
  const seed = buildSeed(NOW, ids);

  it("is idempotent: same inputs give identical rows", () => {
    expect(buildSeed(NOW, ids)).toEqual(seed);
  });

  it("has the expected volumes", () => {
    expect(seed.jobs).toHaveLength(80);
    expect(seed.programs).toHaveLength(8);
    expect(seed.watchedCompanies.filter((w) => w.profile_id === ids["user-01"])).toHaveLength(7);
    expect(seed.watchedCompanies.some((w) => w.profile_id === ids["user-02"])).toBe(true);
    expect(seed.jobMatches.some((m) => m.profile_id === ids["user-01"])).toBe(true);
    expect(seed.jobMatches.some((m) => m.profile_id === ids["user-02"])).toBe(true);
  });

  it("uses unique ids and keys", () => {
    const unique = (xs: (string | undefined)[]) => new Set(xs).size === xs.length;
    expect(unique(seed.jobs.map((j) => j.id))).toBe(true);
    expect(unique(seed.jobs.map((j) => j.dedupe_key))).toBe(true);
    expect(seed.jobs.every((j) => j.dedupe_key.startsWith(SEED_DEDUPE_PREFIX))).toBe(true);
    expect(unique(seed.jobMatches.map((m) => m.id))).toBe(true);
    expect(unique(seed.jobMatches.map((m) => `${m.profile_id}:${m.job_id}`))).toBe(true);
    expect(unique(seed.applications.map((a) => `${a.profile_id}:${a.job_id}`))).toBe(true);
    expect(unique(seed.programs.map((p) => p.url))).toBe(true);
  });

  it("covers all six application stages", () => {
    const stages = new Set(seed.applications.map((a) => a.stage));
    for (const s of ["saved", "applied", "oa", "interview", "offer", "rejected"]) expect(stages.has(s as never)).toBe(true);
  });

  it("has fresh (<24h), older and scam-flagged jobs", () => {
    const hours = (iso: string) => (NOW.getTime() - new Date(iso).getTime()) / 3_600_000;
    expect(seed.jobs.filter((j) => hours(j.posted_at as string) < 24).length).toBeGreaterThan(5);
    expect(seed.jobs.filter((j) => hours(j.posted_at as string) >= 24).length).toBeGreaterThan(30);
    expect(seed.jobs.filter((j) => j.scam_risk === "high").length).toBeGreaterThan(0);
    expect(seed.jobs.filter((j) => j.scam_risk === "low").length).toBeGreaterThan(0);
    expect(seed.jobs.filter((j) => j.scam_risk !== "none").every((j) => (j.scam_reasons ?? []).length > 0)).toBe(true);
  });

  it("produces valid scores, breakdowns and capped missing skills", () => {
    for (const m of seed.jobMatches) {
      expect(m.score).toBeGreaterThanOrEqual(0);
      expect(m.score).toBeLessThanOrEqual(100);
      expect((m.missing_skills ?? []).length).toBeLessThanOrEqual(4);
      expect(m.breakdown).toHaveProperty("skills");
      expect(m.breakdown).toHaveProperty("eligibility");
      expect(m.breakdown).toHaveProperty("freshness");
    }
  });

  it("spreads match and application history over 7 days for KPI series", () => {
    const days = new Set(seed.jobMatches.map((m) => (m.created_at as string).slice(0, 10)));
    expect(days.size).toBeGreaterThanOrEqual(6);
    expect(seed.applications.filter((a) => a.applied_at).length).toBeGreaterThan(5);
  });

  it("puts program deadlines in the future", () => {
    for (const p of seed.programs) expect(new Date(p.deadline_at).getTime()).toBeGreaterThan(NOW.getTime());
  });
});
