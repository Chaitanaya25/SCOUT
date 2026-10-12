import type { NextRequest } from "next/server";

import { json, sessionOr401 } from "@/lib/api";
import { loadJobDetail } from "@/lib/job-detail";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Inspector drawer data for one job (only if the signed-in profile has a match for it). */
export async function GET(request: NextRequest, ctx: RouteContext<"/api/jobs/[id]">) {
  const auth = await sessionOr401(request);
  if ("response" in auth) return auth.response;
  const { id } = await ctx.params;
  if (!UUID.test(id)) return json({ error: "Job not found." }, 404);
  try {
    const detail = await loadJobDetail(auth.session.pid, id, new Date());
    return detail ? json(detail) : json({ error: "Job not found." }, 404);
  } catch {
    return json({ error: "Could not load this job." }, 500);
  }
}
