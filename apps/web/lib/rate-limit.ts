// Login rate limiting (ARCHITECTURE.md §10.1): max 5 failed attempts per IP per 15 minutes.
// The decision logic is pure; the attempts themselves are stored in the `login_attempts` table (lib/login-attempts.ts).

export const MAX_FAILURES = 5;
export const WINDOW_MS = 15 * 60 * 1000;

export type RateLimitDecision = {
  blocked: boolean;
  /** Failed attempts still allowed before blocking. */
  remaining: number;
  /** Seconds until a blocked client may try again (0 when not blocked). */
  retryAfterSeconds: number;
};

/**
 * `failureTimes` are epoch-ms timestamps of failed attempts for one IP. Only those within the last WINDOW_MS count.
 * The client is blocked once MAX_FAILURES failures sit inside the window, until the oldest counted failure ages out.
 */
export function evaluateAttempts(failureTimes: number[], nowMs: number): RateLimitDecision {
  const recent = failureTimes.filter((t) => nowMs - t < WINDOW_MS).sort((a, b) => a - b);
  if (recent.length < MAX_FAILURES) {
    return { blocked: false, remaining: MAX_FAILURES - recent.length, retryAfterSeconds: 0 };
  }
  // The block lifts when enough old failures expire to drop below the limit.
  const pivot = recent[recent.length - MAX_FAILURES];
  const retryAfterMs = Math.max(0, pivot + WINDOW_MS - nowMs);
  return { blocked: true, remaining: 0, retryAfterSeconds: Math.ceil(retryAfterMs / 1000) };
}

/** Client IP from proxy headers (x-forwarded-for first hop, then x-real-ip); "unknown" if absent. */
export function clientIp(headers: { get(name: string): string | null }): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwarded) return forwarded;
  return headers.get("x-real-ip")?.trim() || "unknown";
}
