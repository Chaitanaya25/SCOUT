import type { NextRequest } from "next/server";

import { json, readJson, sessionOr401 } from "@/lib/api";
import { db } from "@/lib/db";
import { profileSchema } from "@/lib/preferences";

export async function PUT(request: NextRequest) {
  const auth = await sessionOr401(request);
  if ("response" in auth) return auth.response;
  const body = await readJson(request, profileSchema);
  if ("response" in body) return body.response;

  const { error } = await db().from("profiles").update({ display_name: body.data.display_name, college: body.data.college }).eq("id", auth.session.pid);
  if (error) return json({ error: "Could not save the profile." }, 500);
  return json({ ok: true });
}
