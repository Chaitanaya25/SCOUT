import type { NextRequest } from "next/server";

import { json, sessionOr401 } from "@/lib/api";
import { db } from "@/lib/db";
import { deepLink, generateLinkToken, linkExpiry } from "@/lib/telegram-core";

/** Creates a fresh 15-minute link token for the signed-in profile (replacing any previous one) and the t.me deep link. */
export async function POST(request: NextRequest) {
  const auth = await sessionOr401(request);
  if ("response" in auth) return auth.response;
  const bot = process.env.TELEGRAM_BOT_USERNAME;
  if (!bot) return json({ error: "TELEGRAM_BOT_USERNAME is not configured." }, 500);

  const token = generateLinkToken();
  const expires = linkExpiry();
  const { error } = await db()
    .from("preferences")
    .update({ telegram_link_token: token, telegram_link_expires_at: expires.toISOString() })
    .eq("profile_id", auth.session.pid);
  if (error) return json({ error: "Could not create a link." }, 500);

  return json({ url: deepLink(bot, token), token, bot: bot.replace(/^@/, ""), expiresAt: expires.toISOString() });
}
