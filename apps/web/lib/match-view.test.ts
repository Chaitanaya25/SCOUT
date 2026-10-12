import { describe, expect, it } from "vitest";

import { cleanQuery, DEFAULT_FILTERS, filtersToParams, parseFilters } from "./feed-params";
import { greeting, timeOfDay } from "./greeting";
import { postedLabel, safeHref, techTags, toMatchCard, type MatchRow } from "./match-view";

const NOW = new Date("2026-10-13T12:00:00Z");

function row(over: Partial<MatchRow> = {}, job: Partial<NonNullable<MatchRow["jobs"]>> = {}): MatchRow {
  return {
    id: "m1",
    status: "new",
    score: 88,
    similarity: 0.71,
    rank_score: 90,
    eligible: true,
    missing_skills: ["Go", "Kafka", "Rust", "Spark", "Extra"],
    breakdown: { skills: 84.4, eligibility: 100, freshness: 92 },
    eligibility: [{ label: "2028 batch eligible", status: "pass" }, { label: "Location matches", status: "weird" }, "junk"],
    reason: "Strong ML fit",
    created_at: "2026-10-13T10:00:00Z",
    jobs: {
      id: "j1",
      title: "ML Intern",
      company_name: "Stripe",
      location: null,
      is_remote: true,
      job_type: "internship",
      posted_at: "2026-10-13T09:00:00Z",
      first_seen_at: "2026-10-13T10:00:00Z",
      apply_url: "https://stripe.com/j/1",
      scam_risk: "none",
      scam_reasons: null,
      sources: ["jobspy", "greenhouse"],
      description: "We use Python, PyTorch and Kubernetes. Go is a plus.",
      ...job,
    },
    ...over,
  };
}

describe("toMatchCard", () => {
  it("maps a scored match", () => {
    const c = toMatchCard(row(), NOW)!;
    expect(c).toMatchObject({ scored: true, score: 88, fresh: true, ats: "greenhouse", location: "Remote", similarityPct: 71 });
    expect(Math.round(c.hoursOld)).toBe(3);
    expect(c.missingSkills).toEqual(["Go", "Kafka", "Rust", "Spark"]);
    expect(c.breakdown).toEqual({ skills: 84, eligibility: 100, freshness: 92 });
    expect(c.checks).toEqual([{ label: "2028 batch eligible", status: "pass" }, { label: "Location matches", status: "unknown" }]);
    expect(c.tags).toEqual(["Python", "Go", "PyTorch", "Kubernetes"]);
  });
  it("marks unscored matches and uses first_seen_at when posted_at is missing", () => {
    const c = toMatchCard(row({ score: null, breakdown: null }, { posted_at: null, first_seen_at: "2026-10-11T12:00:00Z" }), NOW)!;
    expect(c.scored).toBe(false);
    expect(c.fresh).toBe(false);
    expect(c.breakdown).toEqual({ skills: null, eligibility: null, freshness: null });
  });
  it("returns null without a job", () => {
    expect(toMatchCard(row({ jobs: null }), NOW)).toBeNull();
  });
});

describe("helpers", () => {
  it("techTags uses word boundaries", () => {
    expect(techTags("Golang? no. Google and Gopher; but C++ and Next.js yes")).toEqual(["C++", "Next.js"]);
  });
  it("postedLabel", () => {
    expect(postedLabel(0.2)).toBe("JUST NOW");
    expect(postedLabel(5.9)).toBe("5H AGO");
    expect(postedLabel(50)).toBe("2D AGO");
  });
  it("safeHref only allows http(s)", () => {
    expect(safeHref("javascript:alert(1)")).toBeNull();
    expect(safeHref("https://x.test/a")).toBe("https://x.test/a");
    expect(safeHref("not a url")).toBeNull();
  });
});

describe("feed params", () => {
  it("defaults have eligible + hideScam on and serialise to an empty query", () => {
    expect(parseFilters(new URLSearchParams())).toEqual(DEFAULT_FILTERS);
    expect(filtersToParams(DEFAULT_FILTERS).toString()).toBe("");
  });
  it("round-trips non-defaults", () => {
    const f = parseFilters(new URLSearchParams("type=internship&remote=1&india=1&fresh=1&eligible=0&hideScam=0&sort=newest&q=ml"));
    expect(f).toEqual({ type: "internship", remote: true, india: true, fresh: true, eligible: false, hideScam: false, sort: "newest", q: "ml" });
    expect(parseFilters(filtersToParams(f))).toEqual(f);
  });
  it("accepts Next searchParams objects and ignores junk", () => {
    expect(parseFilters({ type: ["full_time"], sort: "weird", eligible: "nope" })).toMatchObject({ type: "full_time", sort: "match", eligible: false });
  });
  it("cleanQuery strips PostgREST syntax", () => {
    expect(cleanQuery("ml),or(id.eq.1*")).toBe("ml or id.eq.1");
    expect(cleanQuery("C++ / Next.js")).toBe("C++ Next.js");
  });
});

describe("greeting", () => {
  it("uses IST time of day and the first name", () => {
    expect(greeting("Chaitanya Sharma", new Date("2026-10-13T03:30:00Z"))).toBe("Good morning, Chaitanya"); // 09:00 IST
    expect(greeting("Akriti", new Date("2026-10-13T13:00:00Z"))).toBe("Good evening, Akriti"); // 18:30 IST
    expect(greeting("Akriti", new Date("2026-10-13T19:00:00Z"))).toBe("Working late, Akriti"); // 00:30 IST
    expect(timeOfDay(13)).toBe("afternoon");
  });
});
