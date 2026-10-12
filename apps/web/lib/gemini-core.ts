// Pure helpers for the Gemini wrapper (no Next/server imports, unit-tested).

export type LlmKind = "embed" | "score" | "parse" | "tailor" | "extract";

/** Built-in daily soft caps, kept well below any free-tier limit; override with LLM_DAILY_SOFT_CAP_<KIND>. */
export const DEFAULT_CAPS: Record<LlmKind, number> = { score: 150, embed: 150, tailor: 30, parse: 20, extract: 50 };

export const MAX_ATTEMPTS = 3;
export const MAX_RETRY_DELAY_MS = 8_000;

export function capFor(kind: LlmKind, env: Record<string, string | undefined> = process.env): number {
  const raw = Number.parseInt(env[`LLM_DAILY_SOFT_CAP_${kind.toUpperCase()}`] ?? "", 10);
  return Number.isFinite(raw) && raw >= 0 ? raw : DEFAULT_CAPS[kind];
}

/** Gemini daily quotas reset at midnight Pacific time, so usage rows are keyed by the Pacific calendar day. */
export function pacificDay(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

/** Retry hint in ms from an API error message/body (`retryDelay: "12s"`, `retry in 3.5s`); null when absent. */
export function parseRetryDelay(message: string): number | null {
  const m = /retry(?:Delay)?["']?\s*(?:in|:)?\s*["']?(\d+(?:\.\d+)?)\s*(ms|s)\b/i.exec(message);
  if (!m) return null;
  const n = Number.parseFloat(m[1]);
  return Math.round(m[2].toLowerCase() === "ms" ? n : n * 1000);
}

export type ErrorClass = "retry" | "daily_quota" | "fatal";

/** 429 that names a per-day quota is final for today; other 429/500/503 are transient; the rest are fatal. */
export function classifyError(status: number | undefined, message: string): ErrorClass {
  if (status === 429 && /per\s*day|daily|PerDay/i.test(message)) return "daily_quota";
  if (status === 429 || status === 500 || status === 503 || status === 504) return "retry";
  return "fatal";
}

export class LlmBudgetExceeded extends Error {
  constructor(kind: LlmKind) {
    super(`Daily AI budget for "${kind}" is used up. It resets tomorrow.`);
    this.name = "LlmBudgetExceeded";
  }
}

export class LlmError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LlmError";
  }
}

/** Strips a ```json fence some models add even with a JSON mime type. */
export function stripJsonFence(text: string): string {
  const t = text.trim();
  const m = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(t);
  return m ? m[1] : t;
}
