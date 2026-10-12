import "server-only";

import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

import { MAX_RESUME_TEXT, type ResumeKind } from "./resume-parse";

/** Plain text from a PDF or DOCX buffer, whitespace-collapsed and capped. Throws on unreadable files. */
export async function extractResumeText(buffer: Buffer, kind: ResumeKind): Promise<string> {
  let raw: string;
  if (kind === "pdf") {
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    try {
      raw = (await parser.getText()).text.replace(/^-- \d+ of \d+ --$/gm, ""); // drop pdf-parse page markers
    } finally {
      await parser.destroy();
    }
  } else {
    raw = (await mammoth.extractRawText({ buffer })).value;
  }
  return raw.replace(/\r/g, "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim().slice(0, MAX_RESUME_TEXT);
}
