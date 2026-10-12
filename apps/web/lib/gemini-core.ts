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

export const BASE_RETRY_DELAY_MS = 800;

/** Exponential backoff with full jitter; a server retry hint wins when present. */
export function backoffDelay(attempt: number, hintMs: number | null, rng: () => number = Math.random): number {
  if (hintMs !== null) return Math.max(0, hintMs);
  const ceiling = Math.min(MAX_RETRY_DELAY_MS, BASE_RETRY_DELAY_MS * 2 ** Math.max(0, attempt - 1));
  return Math.round(ceiling / 2 + rng() * (ceiling / 2)); // half fixed + half random: never 0, never a thundering herd
}

/** 503 / "overloaded" / "unavailable": the primary model is busy, so one fallback attempt is worth it. */
export function isOverloaded(status: number | undefined, message: string): boolean {
  return status === 503 || /overloaded|unavailable|high demand/i.test(message);
}

export type CallError = { status?: number; message: string };

export function toCallError(err: unknown): CallError {
  const status = typeof err === "object" && err && "status" in err ? Number((err as { status: unknown }).status) : undefined;
  return { status: Number.isFinite(status) ? status : undefined, message: err instanceof Error ? err.message : String(err) };
}

export type RetryDeps = {
  /** Counts one request against the soft cap BEFORE it is sent; throws LlmBudgetExceeded at the cap. */
  reserve: () => Promise<void>;
  sleep: (ms: number) => Promise<void>;
  now: () => number;
};

export type RetryPlan = {
  kind: LlmKind;
  primary: string;
  /** Used for exactly one extra attempt after the primary's retries end on an overload (503). */
  fallback?: string | null;
  maxAttempts?: number;
  /** Hard wall-clock budget for all attempts and waits (keep it under the route's maxDuration). */
  budgetMs: number;
};

/**
 * Runs `call(model)` with a hard cap on attempts and total time. 429/500/503/504 are retried with jittered
 * exponential backoff (or the server's hint); a per-day 429 stops immediately; other errors are fatal. When the
 * primary's last failure was an overload, the fallback model gets one attempt if time remains. Every attempt is
 * reserved in llm_usage first, so a soft cap can never be exceeded by retries.
 */
export async function runWithRetry<T>(plan: RetryPlan, call: (model: string) => Promise<T>, deps: RetryDeps): Promise<T> {
  const deadline = deps.now() + plan.budgetMs;
  const maxAttempts = Math.max(1, Math.min(plan.maxAttempts ?? MAX_ATTEMPTS, MAX_ATTEMPTS));
  let last: CallError = { message: "not attempted" };

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await deps.reserve();
    try {
      return await call(plan.primary);
    } catch (err) {
      last = toCallError(err);
      const cls = classifyError(last.status, last.message);
      if (cls === "daily_quota") throw new LlmBudgetExceeded(plan.kind);
      if (cls === "fatal") throw new LlmError("The AI service rejected the request.");
      if (attempt === maxAttempts) break;
      const delay = backoffDelay(attempt, parseRetryDelay(last.message));
      if (delay > MAX_RETRY_DELAY_MS || deps.now() + delay >= deadline) break; // never wait past the budget
      await deps.sleep(delay);
    }
  }

  const fallback = plan.fallback && plan.fallback !== plan.primary ? plan.fallback : null;
  if (fallback && isOverloaded(last.status, last.message) && deps.now() < deadline) {
    await deps.reserve();
    try {
      return await call(fallback);
    } catch (err) {
      const e = toCallError(err);
      if (classifyError(e.status, e.message) === "daily_quota") throw new LlmBudgetExceeded(plan.kind);
    }
  }
  throw new LlmError("The AI service is busy right now. Try again in a minute.");
}

/** Strips a ```json fence some models add even with a JSON mime type. */
export function stripJsonFence(text: string): string {
  const t = text.trim();
  const m = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(t);
  return m ? m[1] : t;
}
