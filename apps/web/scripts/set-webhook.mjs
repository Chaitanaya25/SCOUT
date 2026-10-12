// Registers the Telegram webhook (with the secret token) for the deployed app.
//
//   pnpm -C apps/web set-webhook -- --url https://your-app.vercel.app
//   pnpm -C apps/web set-webhook -- --info        (show what Telegram has registered)
//   pnpm -C apps/web set-webhook -- --delete      (remove the webhook)
//
// Reads TELEGRAM_BOT_TOKEN and TELEGRAM_WEBHOOK_SECRET from apps/web/.env.local or the environment, and APP_URL
// when --url is not given. The token and secret are never printed. Telegram only accepts public https URLs.
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const envFile = resolve(process.cwd(), ".env.local");
if (existsSync(envFile)) process.loadEnvFile(envFile);

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const value = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

const token = process.env.TELEGRAM_BOT_TOKEN;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
if (!token) {
  console.error("TELEGRAM_BOT_TOKEN is not set (apps/web/.env.local).");
  process.exit(1);
}

async function api(method, body) {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  const json = await res.json().catch(() => ({ ok: false, description: `HTTP ${res.status}` }));
  if (!json.ok) {
    console.error(`${method} failed: ${json.description ?? res.status}`);
    process.exit(1);
  }
  return json.result;
}

if (flag("--info")) {
  const info = await api("getWebhookInfo");
  console.log(
    JSON.stringify(
      { url: info.url || null, pending_update_count: info.pending_update_count, last_error_date: info.last_error_date ?? null, last_error_message: info.last_error_message ?? null, has_custom_certificate: info.has_custom_certificate },
      null,
      2,
    ),
  );
} else if (flag("--delete")) {
  await api("deleteWebhook", { drop_pending_updates: false });
  console.log("Webhook deleted.");
} else {
  const base = (value("--url") ?? process.env.APP_URL ?? "").replace(/\/+$/, "");
  if (!/^https:\/\/[^/]+/.test(base)) {
    console.error("Pass the public https URL of the deployed app: --url https://your-app.vercel.app (Telegram rejects http and localhost).");
    process.exit(1);
  }
  if (!secret || secret.length < 16) {
    console.error("Set TELEGRAM_WEBHOOK_SECRET (16+ characters; letters, digits, _ and - only) in apps/web/.env.local.");
    process.exit(1);
  }
  if (!/^[A-Za-z0-9_-]{1,256}$/.test(secret)) {
    console.error("TELEGRAM_WEBHOOK_SECRET may only contain letters, digits, _ and - (Telegram's rule).");
    process.exit(1);
  }
  const url = `${base}/api/telegram/webhook`;
  await api("setWebhook", { url, secret_token: secret, allowed_updates: ["message", "callback_query"], drop_pending_updates: true });
  console.log(`Webhook set to ${url}`);
  const info = await api("getWebhookInfo");
  console.log(`Telegram reports: ${info.url}  pending=${info.pending_update_count}${info.last_error_message ? `  last_error=${info.last_error_message}` : ""}`);
}
