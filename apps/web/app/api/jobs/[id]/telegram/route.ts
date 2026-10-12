import type { NextRequest } from "next/server";

import { json, sessionOr401 } from "@/lib/api";
import { db } from "@/lib/db";
import { MATCH_SELECT } from "@/lib/match-query";
import { toMatchCard, type MatchRow } from "@/lib/match-view";
import { sendMessage, TelegramApiError } from "@/lib/telegram";
import { alertKeyboard, formatJobAlert } from "@/lib/telegram-message";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** "Sync alert to Telegram": (re)sends this job's alert to the profile's linked chat. */
export async function POST(request: NextRequest, ctx: RouteContext<"/api/jobs/[id]/telegram">) {
  const auth = await sessionOr401(request);
  if ("response" in auth) return auth.response;
  const profileId = auth.session.pid;
  const { id: jobId } = await ctx.params;
  if (!UUID.test(jobId)) return json({ error: "Job not found." }, 404);
  try {
    const client = db();
    const [{ data: prefs }, { data: row }] = await Promise.all([
      client.from("preferences").select("telegram_chat_id").eq("profile_id", profileId).maybeSingle(),
      client.from("job_matches").select(MATCH_SELECT).eq("profile_id", profileId).eq("job_id", jobId).maybeSingle(),
    ]);
    if (prefs?.telegram_chat_id == null) return json({ error: "Telegram is not linked yet." }, 409);
    const card = row ? toMatchCard(row as unknown as MatchRow, new Date()) : null;
    if (!card) return json({ error: "Job not found." }, 404);
    await sendMessage(
      Number(prefs.telegram_chat_id),
      formatJobAlert({ title: card.title, company: card.company, location: card.location, hoursOld: card.hoursOld, score: card.score, missingSkills: card.missingSkills, fresh: card.fresh }),
      alertKeyboard(card.matchId, card.applyUrl),
    );
    return json({ ok: true });
  } catch (err) {
    if (err instanceof TelegramApiError) return json({ error: "Telegram refused the message. Open the bot and press Start again." }, 502);
    return json({ error: "Could not send to Telegram." }, 500);
  }
}
