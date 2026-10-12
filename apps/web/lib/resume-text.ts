import "server-only";

import mammoth from "mammoth";
import { extractText, getDocumentProxy } from "unpdf";

import { MAX_RESUME_TEXT, type ResumeKind } from "./resume-parse";

/** Below this many characters the file is treated as having no readable text (e.g. a scanned image). */
export const MIN_RESUME_TEXT = 200;

/**
 * Plain text from a PDF or DOCX buffer, whitespace-collapsed and capped. Throws on unreadable files.
 * PDFs use unpdf (pure JS, bundled pdf.js build made for serverless runtimes); DOCX uses mammoth.
 */
export async function extractResumeText(buffer: Buffer, kind: ResumeKind): Promise<string> {
  let raw: string;
  if (kind === "pdf") {
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    try {
      raw = (await extractText(pdf, { mergePages: true })).text;
    } finally {
      await pdf.loadingTask.destroy(); // frees the document and its fake worker
    }
  } else {
    raw = (await mammoth.extractRawText({ buffer })).value;
  }
  return raw.replace(/\r/g, "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim().slice(0, MAX_RESUME_TEXT);
}
