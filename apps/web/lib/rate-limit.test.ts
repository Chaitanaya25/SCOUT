import { describe, expect, it } from "vitest";

import { clientIp, evaluateAttempts, MAX_FAILURES, WINDOW_MS } from "./rate-limit";

const NOW = Date.UTC(2026, 9, 12, 9, 30, 0);
const MIN = 60_000;

describe("evaluateAttempts", () => {
  it("allows up to 4 failures and counts down", () => {
    expect(evaluateAttempts([], NOW)).toEqual({ blocked: false, remaining: 5, retryAfterSeconds: 0 });
    const four = [1, 2, 3, 4].map((m) => NOW - m * MIN);
    expect(evaluateAttempts(four, NOW)).toEqual({ blocked: false, remaining: 1, retryAfterSeconds: 0 });
  });

  it("blocks on the 5th failure within 15 minutes", () => {
    const five = [1, 2, 3, 4, 5].map((m) => NOW - m * MIN);
    const d = evaluateAttempts(five, NOW);
    expect(MAX_FAILURES).toBe(5);
    expect(d.blocked).toBe(true);
    expect(d.remaining).toBe(0);
    // oldest failure is 5 min old → 10 minutes until it leaves the window
    expect(d.retryAfterSeconds).toBe(10 * 60);
  });

  it("ignores failures outside the window", () => {
    const old = [16, 20, 30, 40, 50].map((m) => NOW - m * MIN);
    expect(evaluateAttempts(old, NOW).blocked).toBe(false);
    const mixed = [...old, NOW - 1 * MIN, NOW - 2 * MIN];
    expect(evaluateAttempts(mixed, NOW)).toMatchObject({ blocked: false, remaining: 3 });
  });

  it("unblocks once the window has passed", () => {
    const five = [0, 0, 0, 0, 0].map(() => NOW);
    expect(evaluateAttempts(five, NOW).blocked).toBe(true);
    expect(evaluateAttempts(five, NOW + WINDOW_MS - 1).blocked).toBe(true);
    expect(evaluateAttempts(five, NOW + WINDOW_MS).blocked).toBe(false);
  });

  it("is independent per IP when callers pass each IP's own failures", () => {
    const ipA = [1, 2, 3, 4, 5].map((m) => NOW - m * MIN);
    const ipB = [1].map((m) => NOW - m * MIN);
    expect(evaluateAttempts(ipA, NOW).blocked).toBe(true);
    expect(evaluateAttempts(ipB, NOW).blocked).toBe(false);
  });
});

describe("clientIp", () => {
  const headers = (h: Record<string, string>) => ({ get: (n: string) => h[n.toLowerCase()] ?? null });
  it("prefers the first x-forwarded-for hop", () => {
    expect(clientIp(headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" }))).toBe("203.0.113.7");
  });
  it("falls back to x-real-ip then unknown", () => {
    expect(clientIp(headers({ "x-real-ip": "198.51.100.2" }))).toBe("198.51.100.2");
    expect(clientIp(headers({}))).toBe("unknown");
  });
});
