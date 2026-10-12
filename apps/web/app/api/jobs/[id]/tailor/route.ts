import type { NextRequest } from "next/server";
import { z } from "zod";

import { json, sessionOr401 } from "@/lib/api";
import { db } from "@/lib/db";
import { generateJson, LlmBudgetExceeded, LlmError } from "@/lib/gemini";
import { toTailoredView } from "@/lib/job-detail";
import { buildTailorPrompt, capWords, groundBullets, TAILOR_SYSTEM, tailorResponseSchema, tailorSchema } from "@/lib/tailor";

export const maxDuration = 60;
/** All Gemini attempts (retries + one fallback) must finish well inside maxDuration. */
const TAILOR_BUDGET_MS = 40_000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const bodySchema = z.object({ regenerate: z.boolean().optional() });

/**
 * F8 "Tailor for this job": cached per (profile, job, resume) in tailored_outputs; `regenerate` overwrites.
 * Uses GEMINI_TAILOR_MODEL through the wrapper (soft cap `tailor`, retries, fallback model). Bullets that mention
 * tools, employers or numbers not in the resume are dropped before saving.
 */
export async function POST(request: NextRequest, ctx: RouteContext<"/api/jobs/[id]/tailor">) {
  const auth = await sessionOr401(request);
  if ("response" in auth) return auth.response;
  const profileId = auth.session.pid;
  const { id: jobId } = await ctx.params;
  if (!UUID.test(jobId)) return json({ error: "Job not found." }, 404);
  let regenerate = false;
  try {
    const parsed = bodySchema.safeParse(await request.json());
    regenerate = parsed.success ? Boolean(parsed.data.regenerate) : false;
  } catch {
    regenerate = false;
  }

  try {
    const client = db();
    const [{ data: resume }, { data: match }] = await Promise.all([
      client.from("resumes").select("id, raw_text, parsed, parse_status").eq("profile_id", profileId).eq("is_active", true).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      client.from("job_matches").select("id, jobs!inner(title, company_name, description)").eq("profile_id", profileId).eq("job_id", jobId).maybeSingle(),
    ]);
    if (!resume) return json({ error: "Upload your resume in Settings first." }, 409);
    if (resume.parse_status !== "done") return json({ error: "Your resume is still waiting for AI parsing. Retry parsing in Settings → Resume." }, 409);
    if (!match) return json({ error: "Job not found." }, 404);
    const job = (match as unknown as { jobs: { title: string; company_name: string; description: string | null } }).jobs;

    if (!regenerate) {
      const { data: cached } = await client.from("tailored_outputs").select("bullets, cover_note, ats_keywords, created_at").eq("profile_id", profileId).eq("job_id", jobId).eq("resume_id", resume.id).maybeSingle();
      if (cached) return json({ tailored: toTailoredView(cached), cached: true, removed: 0 });
    }

    let out;
    try {
      out = await generateJson({
        kind: "tailor",
        system: TAILOR_SYSTEM,
        prompt: buildTailorPrompt({ parsed: resume.parsed, rawText: resume.raw_text, title: job.title, company: job.company_name, description: job.description ?? "" }),
        responseSchema: tailorResponseSchema,
        schema: tailorSchema,
        budgetMs: TAILOR_BUDGET_MS,
      });
    } catch (err) {
      if (err instanceof LlmBudgetExceeded) return json({ error: "Today's tailoring budget is used up. It resets tomorrow." }, 429);
      if (err instanceof LlmError) return json({ error: "AI is busy right now. Try again in a minute." }, 503);
      throw err;
    }

    const resumeText = `${resume.raw_text}\n${JSON.stringify(resume.parsed ?? {})}`;
    const { kept, removed } = groundBullets(out.bullets, resumeText, { company: job.company_name, title: job.title });
    if (kept.length === 0) return json({ error: "The AI suggestions mentioned things that are not in your resume, so they were discarded. Try Regenerate." }, 422);

    const row = { profile_id: profileId, job_id: jobId, resume_id: resume.id, bullets: kept, cover_note: capWords(out.cover_note), ats_keywords: out.ats_keywords.slice(0, 10), created_at: new Date().toISOString() };
    const { error } = await client.from("tailored_outputs").upsert(row, { onConflict: "profile_id,job_id,resume_id" });
    if (error) return json({ error: "Could not save the tailored resume." }, 500);
    return json({ tailored: toTailoredView(row), cached: false, removed });
  } catch {
    return json({ error: "Tailoring failed. Try again." }, 500);
  }
}
