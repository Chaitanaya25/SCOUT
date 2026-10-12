import { describe, expect, it } from "vitest";

import { avatarExtension, cleanTags, preferencesSchema, profileSchema } from "./preferences";

const valid = {
  roles: ["ml intern", " ML Intern ", "backend intern"],
  locations: ["India", "Bangalore"],
  remote_ok: true,
  job_types: ["internship", "internship", "full_time"],
  grad_year: 2028,
  degree: "B.Tech CSE",
  max_experience_years: 1,
  has_active_backlogs: null,
  min_score: 60,
};

describe("preferencesSchema", () => {
  it("normalises tags and job types", () => {
    const p = preferencesSchema.parse(valid);
    expect(p.roles).toEqual(["ml intern", "backend intern"]);
    expect(p.job_types).toEqual(["internship", "full_time"]);
  });
  it("turns an empty degree into null", () => {
    expect(preferencesSchema.parse({ ...valid, degree: "  " }).degree).toBeNull();
  });
  it("enforces the 40-90 score slider and a job type", () => {
    expect(preferencesSchema.safeParse({ ...valid, min_score: 39 }).success).toBe(false);
    expect(preferencesSchema.safeParse({ ...valid, min_score: 91 }).success).toBe(false);
    expect(preferencesSchema.safeParse({ ...valid, job_types: [] }).success).toBe(false);
    expect(preferencesSchema.safeParse({ ...valid, job_types: ["contract"] }).success).toBe(false);
  });
  it("bounds numbers and rejects wrong types", () => {
    expect(preferencesSchema.safeParse({ ...valid, grad_year: 1850 }).success).toBe(false);
    expect(preferencesSchema.safeParse({ ...valid, max_experience_years: 11 }).success).toBe(false);
    expect(preferencesSchema.safeParse({ ...valid, remote_ok: "yes" }).success).toBe(false);
  });
  it("does not allow extra keys to reach the database (profile_id, telegram_chat_id)", () => {
    const p = preferencesSchema.parse({ ...valid, profile_id: "other", telegram_chat_id: 1 });
    expect(p).not.toHaveProperty("profile_id");
    expect(p).not.toHaveProperty("telegram_chat_id");
  });
});

describe("profileSchema / cleanTags", () => {
  it("requires a name and nulls an empty college", () => {
    expect(profileSchema.safeParse({ display_name: " ", college: null }).success).toBe(false);
    expect(profileSchema.parse({ display_name: " Aarav ", college: "" })).toEqual({ display_name: "Aarav", college: null });
  });
  it("cleanTags caps the count", () => {
    expect(cleanTags(Array.from({ length: 30 }, (_, i) => `t${i}`), 5)).toHaveLength(5);
  });
});

describe("avatarExtension", () => {
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0, 0, 0, 0, 0]);
  it("accepts matching type and content", () => {
    expect(avatarExtension({ type: "image/png", size: 100 }, png)).toEqual({ ext: "png" });
  });
  it("rejects spoofed, oversize and unsupported files", () => {
    expect(avatarExtension({ type: "image/jpeg", size: 100 }, png)).toHaveProperty("error");
    expect(avatarExtension({ type: "image/png", size: 3 * 1024 * 1024 }, png)).toMatchObject({ status: 413 });
    expect(avatarExtension({ type: "image/svg+xml", size: 100 }, png)).toMatchObject({ status: 415 });
  });
});
