import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { extractResumeText, MIN_RESUME_TEXT } from "./resume-text";

const fixture = (name: string) => readFileSync(new URL(`../test/fixtures/${name}`, import.meta.url));

describe("extractResumeText (Node runtime)", () => {
  it("extracts every line of a text-based PDF", async () => {
    const text = await extractResumeText(fixture("resume.pdf"), "pdf");
    expect(text.length).toBeGreaterThanOrEqual(MIN_RESUME_TEXT);
    for (const phrase of ["Test Student", "PyTorch", "Scout, a job radar", "Smart India Hackathon finalist"]) expect(text).toContain(phrase);
    expect(text).not.toMatch(/-- \d+ of \d+ --/);
  });

  it("extracts text from a DOCX", async () => {
    const text = await extractResumeText(fixture("resume.docx"), "docx");
    expect(text.length).toBeGreaterThanOrEqual(MIN_RESUME_TEXT);
    for (const phrase of ["Test Student", "FastAPI", "Example Labs"]) expect(text).toContain(phrase);
  });

  it("returns (almost) nothing for a PDF without text, so the route can say it looks scanned", async () => {
    const text = await extractResumeText(fixture("blank.pdf"), "pdf");
    expect(text.length).toBeLessThan(MIN_RESUME_TEXT);
  });

  it("rejects a corrupt PDF and a corrupt DOCX instead of returning junk", async () => {
    await expect(extractResumeText(Buffer.from("%PDF-1.4\nthis is not really a pdf"), "pdf")).rejects.toThrow();
    await expect(extractResumeText(Buffer.from("PK\u0003\u0004 not a zip"), "docx")).rejects.toThrow();
  });
});
