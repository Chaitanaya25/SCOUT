import type { NextRequest } from "next/server";

import { json, sessionOr401 } from "@/lib/api";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  const auth = await sessionOr401(request);
  if ("response" in auth) return auth.response;
  const { error } = await db()
    .from("preferences")
    .update({ telegram_chat_id: null, telegram_linked_at: null, telegram_link_token: null, telegram_link_expires_at: null })
    .eq("profile_id", auth.session.pid);
  if (error) return json({ error: "Could not unlink." }, 500);
  return json({ ok: true });
}
