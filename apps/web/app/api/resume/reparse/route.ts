import type { NextRequest } from "next/server";

import { json, sessionOr401 } from "@/lib/api";
import { db } from "@/lib/db";
import { parseStoredResume } from "@/lib/resume-service";

export const maxDuration = 60;

/** Re-parses the stored text of the profile's active resume (no re-upload). Used by "Retry parsing" in Settings. */
export async function POST(request: NextRequest) {
  const auth = await sessionOr401(request);
  if ("response" in auth) return auth.response;
  const profileId = auth.session.pid;
  try {
    const { data: resume } = await db()
      .from("resumes")
      .select("id, raw_text")
      .eq("profile_id", profileId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!resume) return json({ error: "Upload a resume first." }, 404);
    const outcome = await parseStoredResume(profileId, resume.id, resume.raw_text, 40_000);
    if (!outcome.ok) return json({ ok: true, pending: true, message: outcome.message }, 202);
    return json({ ok: true, pending: false, skills: outcome.parsed.skills });
  } catch {
    return json({ error: "Parsing failed. Try again." }, 500);
  }
}
