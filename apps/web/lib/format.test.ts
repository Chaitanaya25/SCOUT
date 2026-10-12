import { describe, expect, it } from "vitest";

import { monogram, pad } from "./format";

describe("format helpers", () => {
  it("builds monograms", () => {
    expect(monogram("Hugging Face")).toBe("HF");
    expect(monogram("Razorpay")).toBe("RA");
    expect(monogram("Razorpay", 1)).toBe("R");
    expect(monogram("  ")).toBe("?");
  });

  it("zero-pads", () => {
    expect(pad(9)).toBe("09");
    expect(pad(18)).toBe("18");
    expect(pad(3, 3)).toBe("003");
    expect(pad(-4)).toBe("00");
  });
});
