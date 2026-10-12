import { describe, expect, it } from "vitest";

import { capFor, classifyError, DEFAULT_CAPS, pacificDay, parseRetryDelay, stripJsonFence } from "./gemini-core";

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
