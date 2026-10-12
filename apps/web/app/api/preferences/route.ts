import type { NextRequest } from "next/server";

import { json, readJson, sessionOr401 } from "@/lib/api";
import { db } from "@/lib/db";
import { preferencesSchema } from "@/lib/preferences";

export async function PUT(request: NextRequest) {
  const auth = await sessionOr401(request);
  if ("response" in auth) return auth.response;
  const body = await readJson(request, preferencesSchema);
  if ("response" in body) return body.response;

  const { error } = await db().from("preferences").update(body.data).eq("profile_id", auth.session.pid);
  if (error) return json({ error: "Could not save preferences." }, 500);
  return json({ ok: true });
}
