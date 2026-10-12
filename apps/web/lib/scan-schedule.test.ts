import { describe, expect, it } from "vitest";

import { formatCountdown, msUntilNextScan, nextScanAt, relativeAgo, scanPillState } from "./scan-schedule";

const utc = (y: number, mo: number, d: number, h: number, mi: number, s = 0) => new Date(Date.UTC(y, mo - 1, d, h, mi, s));

describe("nextScanAt (cron minute 7, every 3rd UTC hour)", () => {
  it("picks the next boundary hour that is a multiple of 3", () => {
    expect(nextScanAt(utc(2026, 10, 12, 9, 30)).toISOString()).toBe("2026-10-12T12:07:00.000Z");
    expect(nextScanAt(utc(2026, 10, 12, 10, 59)).toISOString()).toBe("2026-10-12T12:07:00.000Z");
    expect(nextScanAt(utc(2026, 10, 12, 12, 6, 59)).toISOString()).toBe("2026-10-12T12:07:00.000Z");
  });

  it("is strictly after now, including exactly on a boundary", () => {
    expect(nextScanAt(utc(2026, 10, 12, 12, 7, 0)).toISOString()).toBe("2026-10-12T15:07:00.000Z");
    expect(nextScanAt(utc(2026, 10, 12, 12, 7, 1)).toISOString()).toBe("2026-10-12T15:07:00.000Z");
  });

  it("rolls over midnight", () => {
    expect(nextScanAt(utc(2026, 10, 12, 22, 30)).toISOString()).toBe("2026-10-13T00:07:00.000Z");
    expect(nextScanAt(utc(2026, 12, 31, 23, 59)).toISOString()).toBe("2027-01-01T00:07:00.000Z");
  });

  it("handles just after midnight and just before the first slot", () => {
    expect(nextScanAt(utc(2026, 10, 12, 0, 0)).toISOString()).toBe("2026-10-12T00:07:00.000Z");
    expect(nextScanAt(utc(2026, 10, 12, 0, 8)).toISOString()).toBe("2026-10-12T03:07:00.000Z");
  });

  it("supports a pure 3-hour boundary (minute 0)", () => {
    expect(nextScanAt(utc(2026, 10, 12, 9, 30), 0).toISOString()).toBe("2026-10-12T12:00:00.000Z");
    expect(nextScanAt(utc(2026, 10, 12, 12, 0, 0), 0).toISOString()).toBe("2026-10-12T15:00:00.000Z");
  });

  it("never exceeds 3 hours away", () => {
    for (let h = 0; h < 24; h++) {
      const ms = msUntilNextScan(utc(2026, 3, 29, h, 15));
      expect(ms).toBeGreaterThan(0);
      expect(ms).toBeLessThanOrEqual(3 * 3600 * 1000);
    }
  });
});

describe("formatCountdown", () => {
  it("formats HH:MM:SS and clamps at zero", () => {
    expect(formatCountdown(6130 * 1000)).toBe("01:42:10");
    expect(formatCountdown(59_999)).toBe("00:00:59");
    expect(formatCountdown(0)).toBe("00:00:00");
    expect(formatCountdown(-5000)).toBe("00:00:00");
    expect(formatCountdown(3 * 3600 * 1000)).toBe("03:00:00");
  });
});

describe("relativeAgo and pill state", () => {
  const now = utc(2026, 10, 12, 12, 0);
  it("formats relative times", () => {
    expect(relativeAgo(utc(2026, 10, 12, 11, 59, 30), now)).toBe("just now");
    expect(relativeAgo(utc(2026, 10, 12, 11, 18), now)).toBe("42m ago");
    expect(relativeAgo(utc(2026, 10, 12, 9, 0), now)).toBe("3h ago");
    expect(relativeAgo(utc(2026, 10, 10, 12, 0), now)).toBe("2d ago");
  });

  it("maps runs to pill states", () => {
    expect(scanPillState(null, 0, now)).toEqual({ kind: "none" });
    expect(scanPillState({ status: "running", started_at: "2026-10-12T11:50:00Z", finished_at: null }, 14, now)).toEqual({
      kind: "running",
      sources: 14,
    });
    expect(scanPillState({ status: "success", started_at: "2026-10-12T11:00:00Z", finished_at: "2026-10-12T11:18:00Z" }, 14, now)).toEqual({
      kind: "idle",
      label: "Last scan 42m ago",
    });
    expect(scanPillState({ status: "partial", started_at: "2026-10-12T11:00:00Z", finished_at: "2026-10-12T11:18:00Z" }, 14, now).kind).toBe("idle");
    expect(scanPillState({ status: "failed", started_at: "2026-10-12T11:00:00Z", finished_at: null }, 0, now).kind).toBe("failed");
  });
});
