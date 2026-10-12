import { describe, expect, it } from "vitest";

import { backoffDelay, capFor, classifyError, DEFAULT_CAPS, LlmBudgetExceeded, LlmError, pacificDay, parseRetryDelay, runWithRetry, stripJsonFence } from "./gemini-core";

describe("capFor", () => {
  it("uses defaults and honours a valid override", () => {
    expect(capFor("parse", {})).toBe(DEFAULT_CAPS.parse);
    expect(capFor("parse", { LLM_DAILY_SOFT_CAP_PARSE: "5" })).toBe(5);
    expect(capFor("parse", { LLM_DAILY_SOFT_CAP_PARSE: "0" })).toBe(0);
  });
  it("ignores empty or invalid overrides", () => {
    expect(capFor("embed", { LLM_DAILY_SOFT_CAP_EMBED: "" })).toBe(DEFAULT_CAPS.embed);
    expect(capFor("embed", { LLM_DAILY_SOFT_CAP_EMBED: "abc" })).toBe(DEFAULT_CAPS.embed);
    expect(capFor("embed", { LLM_DAILY_SOFT_CAP_EMBED: "-3" })).toBe(DEFAULT_CAPS.embed);
  });
});

describe("pacificDay", () => {
  it("rolls over at midnight Pacific, not UTC", () => {
    expect(pacificDay(new Date("2026-10-13T06:59:00Z"))).toBe("2026-10-12"); // 23:59 PDT
    expect(pacificDay(new Date("2026-10-13T07:00:00Z"))).toBe("2026-10-13"); // 00:00 PDT
  });
});

describe("parseRetryDelay / classifyError", () => {
  it("reads retry hints", () => {
    expect(parseRetryDelay('{"retryDelay":"12s"}')).toBe(12000);
    expect(parseRetryDelay("Please retry in 3.5s.")).toBe(3500);
    expect(parseRetryDelay("retryDelay: 250ms")).toBe(250);
    expect(parseRetryDelay("nothing here")).toBeNull();
  });
  it("treats a per-day 429 as final and other 429/5xx as retryable", () => {
    expect(classifyError(429, "Quota exceeded for GenerateRequestsPerDayPerProjectPerModel")).toBe("daily_quota");
    expect(classifyError(429, "Resource exhausted, retry in 5s")).toBe("retry");
    expect(classifyError(503, "overloaded")).toBe("retry");
    expect(classifyError(400, "bad request")).toBe("fatal");
    expect(classifyError(undefined, "network")).toBe("fatal");
  });
});

describe("stripJsonFence", () => {
  it("removes a markdown fence and leaves plain JSON alone", () => {
    expect(stripJsonFence('```json\n{"a":1}\n```')).toBe('{"a":1}');
    expect(stripJsonFence('{"a":1}')).toBe('{"a":1}');
  });
});

describe("runWithRetry", () => {
  const err = (status: number, message = "error") => Object.assign(new Error(message), { status });
  function harness(budgetMs = 20_000) {
    let t = 0;
    const log = { reserved: 0, sleeps: [] as number[], models: [] as string[] };
    const deps = {
      reserve: async () => {
        log.reserved++;
      },
      sleep: async (ms: number) => {
        log.sleeps.push(ms);
        t += ms;
      },
      now: () => t,
    };
    return { log, deps, plan: { kind: "parse" as const, primary: "flash-lite", fallback: "flash", budgetMs } };
  }

  it("retries a 503 and succeeds on the next attempt", async () => {
    const { log, deps, plan } = harness();
    let n = 0;
    const out = await runWithRetry(plan, async (m) => {
      log.models.push(m);
      if (n++ === 0) throw err(503, "The model is overloaded");
      return "ok";
    }, deps);
    expect(out).toBe("ok");
    expect(log.models).toEqual(["flash-lite", "flash-lite"]);
    expect(log.reserved).toBe(2); // every attempt is counted
    expect(log.sleeps).toHaveLength(1);
    expect(log.sleeps[0]).toBeGreaterThanOrEqual(400);
  });

  it("uses the fallback model once after three overloaded primary attempts", async () => {
    const { log, deps, plan } = harness();
    const out = await runWithRetry(plan, async (m) => {
      log.models.push(m);
      if (m === "flash-lite") throw err(503, "UNAVAILABLE");
      return "from fallback";
    }, deps);
    expect(out).toBe("from fallback");
    expect(log.models).toEqual(["flash-lite", "flash-lite", "flash-lite", "flash"]);
    expect(log.reserved).toBe(4);
  });

  it("does not use the fallback for a 500 or a 429, and fails after the hard cap", async () => {
    const { log, deps, plan } = harness();
    await expect(runWithRetry(plan, async (m) => {
      log.models.push(m);
      throw err(500, "internal");
    }, deps)).rejects.toBeInstanceOf(LlmError);
    expect(log.models).toEqual(["flash-lite", "flash-lite", "flash-lite"]);
  });

  it("stops at once on a per-day quota 429 and on a fatal 400", async () => {
    const a = harness();
    await expect(runWithRetry(a.plan, async () => {
      throw err(429, "Quota exceeded for GenerateRequestsPerDayPerProjectPerModel");
    }, a.deps)).rejects.toBeInstanceOf(LlmBudgetExceeded);
    expect(a.log.reserved).toBe(1);
    const b = harness();
    await expect(runWithRetry(b.plan, async () => {
      throw err(400, "bad");
    }, b.deps)).rejects.toBeInstanceOf(LlmError);
    expect(b.log.reserved).toBe(1);
  });

  it("honours a retry hint and never waits past the time budget", async () => {
    const a = harness();
    let n = 0;
    await runWithRetry(a.plan, async () => {
      if (n++ === 0) throw err(429, 'Resource exhausted {"retryDelay":"3s"}');
      return 1;
    }, a.deps);
    expect(a.log.sleeps).toEqual([3000]);

    const b = harness(1_000); // budget smaller than the first backoff
    await expect(runWithRetry({ ...b.plan, fallback: null }, async () => {
      throw err(503);
    }, b.deps)).rejects.toBeInstanceOf(LlmError);
    expect(b.log.sleeps.reduce((s, x) => s + x, 0)).toBeLessThan(1_000);
  });

  it("stops when the soft cap is reached mid-retry", async () => {
    const { deps, plan } = harness();
    let reserved = 0;
    const capped = { ...deps, reserve: async () => {
      if (++reserved > 1) throw new LlmBudgetExceeded("parse");
    } };
    await expect(runWithRetry(plan, async () => {
      throw err(503);
    }, capped)).rejects.toBeInstanceOf(LlmBudgetExceeded);
  });
});

describe("backoffDelay", () => {
  it("grows exponentially with jitter and caps", () => {
    expect(backoffDelay(1, null, () => 0)).toBe(400);
    expect(backoffDelay(1, null, () => 1)).toBe(800);
    expect(backoffDelay(3, null, () => 1)).toBe(3200);
    expect(backoffDelay(10, null, () => 1)).toBe(8000);
    expect(backoffDelay(2, 1500)).toBe(1500);
  });
});
