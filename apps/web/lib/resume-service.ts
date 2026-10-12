import "server-only";

import { db } from "./db";
import { embedText, generateJson, LlmBudgetExceeded, LlmError } from "./gemini";
import { buildResumePrompt, normalizeSkills, parsedResumeSchema, RESUME_SYSTEM, resumeEmbedText, resumeResponseSchema, type ParsedResume } from "./resume-parse";

export const PARSE_BUSY_MESSAGE = "Resume saved. AI parsing is busy, try again in a minute.";

export type ParseOutcome = { ok: true; parsed: ParsedResume } | { ok: false; reason: "busy" | "budget"; message: string };

/**
 * Parses stored resume text with Gemini, embeds it and marks the row `done`. On an AI failure the row stays
 * `pending` (the raw text is already saved) so the user can retry without re-uploading. Filters by profile id.
 */
export async function parseStoredResume(profileId: string, resumeId: string, rawText: string, budgetMs = 20_000): Promise<ParseOutcome> {
  let parsed: ParsedResume;
  let embedding: number[];
  const started = Date.now();
  try {
    parsed = await generateJson({ kind: "parse", system: RESUME_SYSTEM, prompt: buildResumePrompt(rawText), responseSchema: resumeResponseSchema, schema: parsedResumeSchema, budgetMs });
    parsed.skills = normalizeSkills(parsed.skills);
    embedding = await embedText(resumeEmbedText(parsed), "RETRIEVAL_QUERY", Math.max(3_000, budgetMs - (Date.now() - started)));
  } catch (err) {
    if (err instanceof LlmBudgetExceeded) return { ok: false, reason: "budget", message: `${err.message} Your resume text is saved; retry parsing tomorrow.` };
    if (err instanceof LlmError) return { ok: false, reason: "busy", message: PARSE_BUSY_MESSAGE };
    throw err;
  }
  const { error } = await db()
    .from("resumes")
    .update({ parsed, skills: parsed.skills, embedding: JSON.stringify(embedding), parse_status: "done" })
    .eq("id", resumeId)
    .eq("profile_id", profileId);
  if (error) throw new Error("Could not save the parsed resume.");
  await prefillEmpty(profileId, parsed);
  return { ok: true, parsed };
}

/** Fills grad_year / degree / roles / college only where the profile has nothing yet; never overwrites user input. */
async function prefillEmpty(profileId: string, parsed: Pick<ParsedResume, "grad_year" | "degree" | "target_roles" | "college">) {
  const client = db();
  const { data: prefs } = await client.from("preferences").select("grad_year, degree, roles").eq("profile_id", profileId).maybeSingle();
  if (prefs) {
    const patch: { grad_year?: number; degree?: string; roles?: string[] } = {};
    if (prefs.grad_year == null && parsed.grad_year) patch.grad_year = parsed.grad_year;
    if (!prefs.degree && parsed.degree) patch.degree = parsed.degree;
    if ((prefs.roles ?? []).length === 0 && parsed.target_roles.length > 0) patch.roles = parsed.target_roles;
    if (Object.keys(patch).length > 0) await client.from("preferences").update(patch).eq("profile_id", profileId);
  }
  const { data: profile } = await client.from("profiles").select("college").eq("id", profileId).maybeSingle();
  if (profile && !profile.college && parsed.college) await client.from("profiles").update({ college: parsed.college }).eq("id", profileId);
}
