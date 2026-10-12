import { describe, expect, it } from "vitest";

import { deadlineTone, ringCaption, scoreTone } from "./score";

describe("score helpers", () => {
  it("maps scores to tones at the boundaries", () => {
    expect(scoreTone(96)).toBe("accent");
    expect(scoreTone(90)).toBe("accent");
    expect(scoreTone(89)).toBe("info");
    expect(scoreTone(75)).toBe("info");
    expect(scoreTone(74)).toBe("warning");
    expect(scoreTone(65)).toBe("warning");
    expect(scoreTone(64)).toBe("danger");
  });

  it("captions rings", () => {
    expect(ringCaption(96)).toBe("BEST FIT");
    expect(ringCaption(91)).toBe("HIGH FIT");
    expect(ringCaption(88)).toBe("GOOD FIT");
    expect(ringCaption(50)).toBe("FIT");
  });

  it("maps days left to deadline tones", () => {
    expect(deadlineTone(12)).toBe("danger");
    expect(deadlineTone(14)).toBe("danger");
    expect(deadlineTone(28)).toBe("tint");
    expect(deadlineTone(35)).toBe("tint");
    expect(deadlineTone(42)).toBe("muted");
  });
});
