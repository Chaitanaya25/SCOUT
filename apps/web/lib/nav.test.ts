import { describe, expect, it } from "vitest";

import { breadcrumbFor, DISCOVER, isActive, isSettingsSection, PIPELINE, SETTINGS_ITEM } from "./nav";

describe("nav", () => {
  it("marks the active item by section", () => {
    expect(isActive(DISCOVER[0], "/dashboard")).toBe(true);
    expect(isActive(DISCOVER[1], "/jobs")).toBe(true);
    expect(isActive(DISCOVER[1], "/jobs/abc")).toBe(true);
    expect(isActive(DISCOVER[0], "/jobs")).toBe(false);
    expect(isActive(PIPELINE[1], "/tracker")).toBe(true);
    expect(isActive(SETTINGS_ITEM, "/settings/telegram")).toBe(true);
    expect(isActive(SETTINGS_ITEM, "/dashboard")).toBe(false);
  });

  it("builds breadcrumbs like the Stitch screens", () => {
    expect(breadcrumbFor("/dashboard")).toEqual(["INTELLIGENCE CORE"]);
    expect(breadcrumbFor("/tracker")).toEqual(["INTELLIGENCE CORE"]);
    expect(breadcrumbFor("/watched")).toEqual(["PIPELINE", "WATCHED COMPANIES"]);
    expect(breadcrumbFor("/programs")).toEqual(["DISCOVER", "PROGRAMS"]);
  });

  it("knows the five settings sections only", () => {
    for (const s of ["profile", "resume", "preferences", "telegram", "scan"]) expect(isSettingsSection(s)).toBe(true);
    expect(isSettingsSection("api")).toBe(false);
    expect(isSettingsSection("webhooks")).toBe(false);
  });
});
