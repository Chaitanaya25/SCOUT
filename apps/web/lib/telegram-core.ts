// Telegram pure logic: link tokens, update parsing, callback data, webhook secret check. No server imports.
import { randomBytes, timingSafeEqual } from "node:crypto";
import { z } from "zod";

export const LINK_TOKEN_TTL_MS = 15 * 60 * 1000;

/** 16 random bytes, base64url (22 chars): fits Telegram's 64-char `start` payload limit and is URL-safe. */
export function generateLinkToken(): string {
  return randomBytes(16).toString("base64url");
}

export const LINK_TOKEN_RE = /^[A-Za-z0-9_-]{22}$/;

export function linkExpiry(now: Date = new Date()): Date {
  return new Date(now.getTime() + LINK_TOKEN_TTL_MS);
}

export function isTokenValid(expiresAt: string | Date | null | undefined, now: Date = new Date()): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() > now.getTime();
}

export function deepLink(botUsername: string, token: string): string {
  return `https://t.me/${encodeURIComponent(botUsername.replace(/^@/, ""))}?start=${encodeURIComponent(token)}`;
}

/** Constant-time comparison of the `X-Telegram-Bot-Api-Secret-Token` header with the configured secret. */
export function secretMatches(header: string | null | undefined, secret: string | undefined): boolean {
  if (!header || !secret) return false;
  const a = Buffer.from(header);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export const CALLBACK_ACTIONS = { s: "saved", k: "skipped", a: "applied" } as const;
export type CallbackAction = keyof typeof CALLBACK_ACTIONS;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** `s:<uuid>` / `k:<uuid>` / `a:<uuid>` → action + match id; null for anything else. */
export function parseCallbackData(data: string | undefined): { action: CallbackAction; matchId: string } | null {
  if (!data) return null;
  const m = /^([ska]):(.+)$/.exec(data);
  if (!m || !UUID_RE.test(m[2])) return null;
  return { action: m[1] as CallbackAction, matchId: m[2].toLowerCase() };
}

/** Text of the confirmed state shown on the edited keyboard. */
export const ACTION_LABEL: Record<CallbackAction, string> = { s: "✓ Saved", k: "✕ Skipped", a: "✓ Applied" };

const chat = z.object({ id: z.number().int() });
const button = z.object({ text: z.string(), url: z.string().optional(), callback_data: z.string().optional() });
const message = z.object({
  message_id: z.number().int(),
  chat,
  text: z.string().max(4096).optional(),
  reply_markup: z.object({ inline_keyboard: z.array(z.array(button)) }).optional(),
});
export const updateSchema = z.object({
  update_id: z.number().int(),
  message: message.optional(),
  callback_query: z
    .object({ id: z.string(), data: z.string().max(256).optional(), message: message.optional() })
    .optional(),
});
export type TelegramUpdate = z.infer<typeof updateSchema>;

/** `/start <token>` (also `/start@Bot <token>`) → the token if it is well-formed. */
export function parseStartCommand(text: string | undefined): { token: string } | { token: null; bare: boolean } {
  const m = /^\/start(?:@\w+)?(?:\s+(\S+))?\s*$/.exec(text ?? "");
  if (!m) return { token: null, bare: false };
  if (!m[1]) return { token: null, bare: true };
  return LINK_TOKEN_RE.test(m[1]) ? { token: m[1] } : { token: null, bare: true };
}

/** Inline keyboard for a handled alert: keep the Apply URL button, replace row 2 with the confirmed state. */
export function confirmedKeyboard(
  existing: { inline_keyboard?: { text: string; url?: string; callback_data?: string }[][] } | undefined,
  action: CallbackAction,
  matchId: string,
): { inline_keyboard: { text: string; url?: string; callback_data?: string }[][] } {
  const urlRows = (existing?.inline_keyboard ?? []).filter((row) => row.some((b) => b.url));
  const next = [{ text: ACTION_LABEL[action], callback_data: `n:${matchId}` }];
  // Allow switching state: show the two other actions next to the confirmed one.
  const others = (Object.keys(CALLBACK_ACTIONS) as CallbackAction[])
    .filter((a) => a !== action)
    .map((a) => ({ text: a === "s" ? "Save" : a === "k" ? "Skip" : "Applied ✓", callback_data: `${a}:${matchId}` }));
  return { inline_keyboard: [...urlRows, [...next, ...others]] };
}
