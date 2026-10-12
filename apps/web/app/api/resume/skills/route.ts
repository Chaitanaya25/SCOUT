import type { NextRequest } from "next/server";

import { json, readJson, sessionOr401 } from "@/lib/api";
import { db } from "@/lib/db";
import { embedText } from "@/lib/gemini";
import { normalizeSkills, parsedResumeSchema, resumeEmbedText, skillsBodySchema } from "@/lib/resume-parse";

/** Saves the edited skill chips on the profile's active resume and refreshes its embedding (best effort). */
export async function PUT(request: NextRequest) {
  const auth = await sessionOr401(request);
  if ("response" in auth) return auth.response;
  const body = await readJson(request, skillsBodySchema);
  if ("response" in body) return body.response;

  const profileId = auth.session.pid;
  const skills = normalizeSkills(body.data.skills);
  const client = db();
  const { data: resume } = await client.from("resumes").select("id, parsed").eq("profile_id", profileId).eq("is_active", true).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!resume) return json({ error: "Upload a resume first." }, 404);

  const parsed = parsedResumeSchema.safeParse(resume.parsed);
  const merged = parsed.success ? { ...parsed.data, skills } : null;

  // Re-embed so matching reflects the edit. If the AI budget is spent, clear the embedding: the worker rebuilds it
  // on its next scan (it embeds any resume whose embedding is null).
  let embedding: string | null = null;
  if (merged) {
    try {
      embedding = JSON.stringify(await embedText(resumeEmbedText(merged), "RETRIEVAL_QUERY"));
    } catch {
      embedding = null;
    }
  }
  const { error } = await client
    .from("resumes")
    .update({ skills, parsed: merged ?? resume.parsed, embedding })
    .eq("id", resume.id)
    .eq("profile_id", profileId);
  if (error) return json({ error: "Could not save skills." }, 500);
  return json({ ok: true, skills });
}
