import type { NextRequest } from "next/server";

import { json, sessionOr401 } from "@/lib/api";
import { db } from "@/lib/db";
import { sendMessage, TelegramApiError } from "@/lib/telegram";

export async function POST(request: NextRequest) {
  const auth = await sessionOr401(request);
  if ("response" in auth) return auth.response;

  const { data } = await db().from("preferences").select("telegram_chat_id").eq("profile_id", auth.session.pid).maybeSingle();
  if (data?.telegram_chat_id == null) return json({ error: "Telegram is not linked yet." }, 409);
  try {
    await sendMessage(Number(data.telegram_chat_id), "<b>SCOUT test ping</b>\nAlerts for this profile will arrive in this chat.");
  } catch (err) {
    const blocked = err instanceof TelegramApiError && (err.status === 403 || err.status === 400);
    return json({ error: blocked ? "Telegram refused the message. Open the bot and press Start again." : "Could not reach Telegram." }, 502);
  }
  return json({ ok: true });
}
