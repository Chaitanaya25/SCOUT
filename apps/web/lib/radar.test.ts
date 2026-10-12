import { describe, expect, it } from "vitest";

import { blipPosition, blipTone, hashString } from "./radar";

describe("radar helpers", () => {
  it("hashes deterministically", () => {
    expect(hashString("job-1")).toBe(hashString("job-1"));
    expect(hashString("job-1")).not.toBe(hashString("job-2"));
  });

  it("puts best matches near the centre and worst on the rim", () => {
    const R = 150;
    const best = blipPosition("a", 100, R);
    const worst = blipPosition("a", 0, R);
    expect(Math.hypot(best.x, best.y)).toBeCloseTo(0);
    expect(Math.hypot(worst.x, worst.y)).toBeCloseTo(R);
  });

  it("keeps the angle fixed per id and within 0-360", () => {
    const a = blipPosition("x", 80, 100);
    const b = blipPosition("x", 40, 100);
    expect(a.angle).toBe(b.angle);
    expect(a.angle).toBeGreaterThanOrEqual(0);
    expect(a.angle).toBeLessThan(360);
  });

  it("classifies blip age", () => {
    expect(blipTone(1)).toBe("fresh");
    expect(blipTone(12)).toBe("recent");
    expect(blipTone(48)).toBe("older");
  });
});
