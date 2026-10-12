import type { NextRequest } from "next/server";
import { z } from "zod";

import { json, readJson, sessionOr401 } from "@/lib/api";
import { setMatchStatus } from "@/lib/applications";

const bodySchema = z.object({ status: z.enum(["new", "saved", "skipped", "applied"]) });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Save / Skip / Applied from the feed. Keeps the tracker in sync (saved/applied create or promote an application). */
export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/matches/[id]">) {
  const auth = await sessionOr401(request);
  if ("response" in auth) return auth.response;
  const { id } = await ctx.params;
  if (!UUID.test(id)) return json({ error: "Match not found." }, 404);
  const body = await readJson(request, bodySchema);
  if ("response" in body) return body.response;
  try {
    const result = await setMatchStatus(auth.session.pid, id, body.data.status);
    return result ? json({ ok: true, status: body.data.status }) : json({ error: "Match not found." }, 404);
  } catch {
    return json({ error: "Could not update this job." }, 500);
  }
}
