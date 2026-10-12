import { NextResponse, type NextRequest } from "next/server";

import { setMatchStatus } from "@/lib/applications";
import { db } from "@/lib/db";
import { answerCallbackQuery, editMessageReplyMarkup, escapeHtml, sendMessage } from "@/lib/telegram";
import {
  CALLBACK_ACTIONS,
  confirmedKeyboard,
  parseCallbackData,
  parseStartCommand,
  secretMatches,
  updateSchema,
  type TelegramUpdate,
} from "@/lib/telegram-core";

const ok = () => NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });

/**
 * Telegram webhook (ARCHITECTURE.md §9). Public to the proxy, so it authenticates itself: the secret-token header
 * is checked in constant time, and only `/start <token>` from an unknown chat or callbacks/messages from a chat
 * linked to a profile are acted on. Anything else is ignored silently (Telegram would retry a non-2xx forever).
 */
export async function POST(request: NextRequest) {
  if (!secretMatches(request.headers.get("x-telegram-bot-api-secret-token"), process.env.TELEGRAM_WEBHOOK_SECRET)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  let update: TelegramUpdate;
  try {
    const parsed = updateSchema.safeParse(await request.json());
    if (!parsed.success) return ok();
    update = parsed.data;
  } catch {
    return ok();
  }

  try {
    if (update.callback_query) await handleCallback(update.callback_query);
    else if (update.message) await handleMessage(update.message);
  } catch {
    // Never surface internals or trigger Telegram retries for a handler error.
  }
  return ok();
}

async function profileForChat(chatId: number): Promise<{ id: string; displayName: string } | null> {
  const client = db();
  const { data: prefs } = await client.from("preferences").select("profile_id").eq("telegram_chat_id", chatId).limit(2);
  if (!prefs || prefs.length !== 1) return null; // unknown chat, or ambiguous (never act on ambiguity)
  const { data: profile } = await client.from("profiles").select("id, display_name").eq("id", prefs[0].profile_id).maybeSingle();
  return profile ? { id: profile.id, displayName: profile.display_name } : null;
}

async function handleMessage(message: NonNullable<TelegramUpdate["message"]>) {
  const chatId = message.chat.id;
  const start = parseStartCommand(message.text);
  const known = await profileForChat(chatId);

  if (start.token) return linkChat(chatId, start.token);
  if (known && message.text?.startsWith("/start")) {
    await sendMessage(chatId, `Already linked to <b>${escapeHtml(known.displayName)}</b>.`);
  } else if (!known && "bare" in start && start.bare) {
    await sendMessage(chatId, "Open SCOUT → Settings → Telegram and use the link or QR code shown there to connect this chat.");
  }
  // Everything else (including any text from unknown chats) gets no reply.
}

async function linkChat(chatId: number, token: string) {
  const client = db();
  const existing = await profileForChat(chatId);
  if (existing) {
    await sendMessage(chatId, `This chat is already linked to <b>${escapeHtml(existing.displayName)}</b>. Unlink it in Settings first.`);
    return;
  }
  // One atomic statement: only an unexpired token matches, and it is cleared in the same update.
  const now = new Date().toISOString();
  const { data: linked } = await client
    .from("preferences")
    .update({ telegram_chat_id: chatId, telegram_linked_at: now, telegram_link_token: null, telegram_link_expires_at: null })
    .eq("telegram_link_token", token)
    .gt("telegram_link_expires_at", now)
    .select("profile_id");
  if (!linked || linked.length !== 1) {
    await sendMessage(chatId, "That link has expired or was already used. Generate a new one in SCOUT → Settings → Telegram.");
    return;
  }
  const { data: profile } = await client.from("profiles").select("display_name").eq("id", linked[0].profile_id).maybeSingle();
  await sendMessage(chatId, `Linked to <b>${escapeHtml(profile?.display_name ?? "your profile")}</b>. New matches will arrive here.`);
}

async function handleCallback(cb: NonNullable<TelegramUpdate["callback_query"]>) {
  const chatId = cb.message?.chat.id;
  if (chatId === undefined) return;
  const profile = await profileForChat(chatId);
  if (!profile) return; // unknown chat: no reply at all

  const parsed = parseCallbackData(cb.data);
  if (!parsed) {
    await answerCallbackQuery(cb.id);
    return;
  }

  // Profile isolation: setMatchStatus only acts on a match owned by the profile that owns this chat.
  const status = CALLBACK_ACTIONS[parsed.action];
  const result = await setMatchStatus(profile.id, parsed.matchId, status);
  if (!result) {
    await answerCallbackQuery(cb.id, "This match is no longer available.");
    return;
  }

  await answerCallbackQuery(cb.id, status === "saved" ? "Saved" : status === "applied" ? "Marked as applied" : "Skipped");
  if (cb.message) {
    await editMessageReplyMarkup(chatId, cb.message.message_id, confirmedKeyboard(cb.message.reply_markup, parsed.action, parsed.matchId));
  }
}
