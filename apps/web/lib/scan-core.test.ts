import { describe, expect, it } from "vitest";

import { dispatchRequest, isScanRunning, STALE_RUN_MS } from "./scan-core";

const now = new Date("2026-10-13T10:00:00Z");

describe("isScanRunning", () => {
  it("is true only for a recent running row", () => {
    expect(isScanRunning({ status: "running", started_at: "2026-10-13T09:50:00Z" }, now)).toBe(true);
    expect(isScanRunning({ status: "success", started_at: "2026-10-13T09:50:00Z" }, now)).toBe(false);
    expect(isScanRunning(null, now)).toBe(false);
  });
  it("treats an old running row as a crashed run, not an in-flight one", () => {
    const old = new Date(now.getTime() - STALE_RUN_MS - 1000).toISOString();
    expect(isScanRunning({ status: "running", started_at: old }, now)).toBe(false);
  });
});

describe("dispatchRequest", () => {
  it("targets the full_scan workflow of a valid owner/repo", () => {
    const r = dispatchRequest("me/scout", "main");
    expect(r?.url).toBe("https://api.github.com/repos/me/scout/actions/workflows/full_scan.yml/dispatches");
    expect(JSON.parse(r!.body)).toEqual({ ref: "main" });
  });
  it("refuses anything that is not owner/repo (no path injection)", () => {
    for (const bad of ["", "me", "me/scout/extra", "../x/y", "me/scout?x=1", "me/ scout"]) expect(dispatchRequest(bad)).toBeNull();
  });
});
