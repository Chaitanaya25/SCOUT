import type { NextRequest } from "next/server";

import { json, sessionOr401 } from "@/lib/api";
import { db } from "@/lib/db";
import { checkResumeUpload, RESUME_MIME, resumeStoragePath } from "@/lib/resume-parse";
import { parseStoredResume } from "@/lib/resume-service";
import { extractResumeText, MIN_RESUME_TEXT } from "@/lib/resume-text";

// Runs on the Node.js runtime, the default. `export const runtime = "nodejs"` cannot be declared here: Next 16 rejects
// the `runtime` segment config when `cacheComponents` is enabled ("not compatible with nextConfig.cacheComponents").
export const maxDuration = 60;
/** Gemini budget (parse + embed, including retries and the fallback attempt), well under maxDuration. */
const PARSE_BUDGET_MS = 35_000;

/**
 * Resume upload (ARCHITECTURE.md §8.2): validate -> private `resumes` bucket -> extract text -> Gemini parse ->
 * 768-dim query embedding -> one active resume per profile -> prefill empty preferences / college. If the AI is
 * busy the text is kept (`parse_status = pending`) and the client gets 202 + a retry hint.
 */
export async function POST(request: NextRequest) {
  const auth = await sessionOr401(request);
  if ("response" in auth) return auth.response;
  try {
    return await handleUpload(request, auth.session.pid);
  } catch {
    // Never answer with a bare 500 page: the client always gets a JSON error it can show.
    return json({ error: "Upload failed. Try again." }, 500);
  }
}

async function handleUpload(request: NextRequest, profileId: string) {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > 6 * 1024 * 1024) return json({ error: "The file is larger than 5 MB." }, 413);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ error: "Invalid upload." }, 400);
  }
  const file = form.get("file");
  if (!(file instanceof File)) return json({ error: "Choose a file to upload." }, 400);

  const buffer = Buffer.from(await file.arrayBuffer());
  const check = checkResumeUpload({ size: buffer.length, type: file.type, name: file.name }, buffer.subarray(0, 8));
  if (!check.ok) return json({ error: check.error }, check.status);

  let rawText: string;
  try {
    rawText = await extractResumeText(buffer, check.kind);
  } catch {
    const message = check.kind === "pdf" ? "Couldn't read this PDF, try a text-based PDF or DOCX" : "Couldn't read this DOCX, try re-saving it or upload a text-based PDF";
    return json({ error: message }, 422);
  }
  if (rawText.length < MIN_RESUME_TEXT) {
    const message = check.kind === "pdf" ? "This PDF has no readable text (scanned image?)" : "This DOCX has almost no readable text";
    return json({ error: message }, 422);
  }

  // Save the file and the extracted text FIRST (parse_status = pending), so an AI outage never loses the upload.
  const client = db();
  const path = resumeStoragePath(profileId, check.kind);
  const { error: uploadError } = await client.storage.from("resumes").upload(path, buffer, {
    contentType: check.kind === "pdf" ? RESUME_MIME.pdf : RESUME_MIME.docx,
    upsert: false,
  });
  if (uploadError) return json({ error: "Could not store the file." }, 500);

  // Insert the new resume first, then retire the old ones, so a failed insert never leaves the profile without a resume.
  const { data: inserted, error: insertError } = await client
    .from("resumes")
    .insert({ profile_id: profileId, file_path: path, raw_text: rawText, parsed: {}, skills: [], embedding: null, is_active: true, parse_status: "pending" })
    .select("id, created_at")
    .single();
  if (insertError || !inserted) {
    await client.storage.from("resumes").remove([path]);
    return json({ error: "Could not save the resume." }, 500);
  }
  await client.from("resumes").update({ is_active: false }).eq("profile_id", profileId).eq("is_active", true).neq("id", inserted.id);

  const resume = { id: inserted.id, uploadedAt: inserted.created_at, fileName: file.name.slice(0, 120), size: buffer.length };
  const outcome = await parseStoredResume(profileId, inserted.id, rawText, PARSE_BUDGET_MS);
  if (!outcome.ok) return json({ ok: true, pending: true, message: outcome.message, resume: { ...resume, skills: [] } }, 202);
  return json({ ok: true, pending: false, resume: { ...resume, skills: outcome.parsed.skills } });
}
