import { describe, expect, it } from "vitest";

import { cn } from "./cn";

describe("cn", () => {
  it("keeps custom type-scale classes next to colour classes", () => {
    expect(cn("text-display-hero", "text-text-strong")).toBe("text-display-hero text-text-strong");
    expect(cn("text-mono-micro", "text-muted")).toBe("text-mono-micro text-muted");
  });

  it("still resolves real conflicts", () => {
    expect(cn("text-headline-sm", "text-body-sm")).toBe("text-body-sm");
    expect(cn("text-muted", "text-accent-fg")).toBe("text-accent-fg");
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
});
