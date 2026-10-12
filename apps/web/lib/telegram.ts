import "server-only";

type ApiResult = { ok: boolean; description?: string; result?: unknown; parameters?: { retry_after?: number } };

export class TelegramApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "TelegramApiError";
  }
}

/** Calls the Bot API. The token only ever appears in the request URL on the server and never in an error message. */
async function call(method: string, body: Record<string, unknown>): Promise<unknown> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new TelegramApiError("TELEGRAM_BOT_TOKEN is not set.", 500);
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({ ok: false }))) as ApiResult;
  if (!res.ok || !json.ok) throw new TelegramApiError(json.description ?? `Telegram ${method} failed`, res.status);
  return json.result;
}

export function sendMessage(chatId: number, text: string, replyMarkup?: unknown): Promise<unknown> {
  return call("sendMessage", { chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true, ...(replyMarkup ? { reply_markup: replyMarkup } : {}) });
}

export function answerCallbackQuery(id: string, text?: string): Promise<unknown> {
  return call("answerCallbackQuery", { callback_query_id: id, ...(text ? { text } : {}) });
}

export function editMessageReplyMarkup(chatId: number, messageId: number, replyMarkup: unknown): Promise<unknown> {
  return call("editMessageReplyMarkup", { chat_id: chatId, message_id: messageId, reply_markup: replyMarkup });
}

export function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
