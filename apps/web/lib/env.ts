import "server-only";

import { looksLikeBcryptHash } from "./auth";

/** Session signing secret (>= 32 chars) or null when missing/too short. */
export function getSessionSecret(): string | null {
  const secret = process.env.SESSION_SECRET;
  return secret && secret.length >= 32 ? secret : null;
}

export function getPasswordHash(): string | null {
  const hash = process.env.APP_PASSWORD_HASH;
  return looksLikeBcryptHash(hash) ? hash : null;
}

export function dbConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/** Human-readable configuration problems that stop sign-in from working (shown on /login, never secrets). */
export function configProblems(): string[] {
  const problems: string[] = [];
  if (!dbConfigured()) problems.push("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set.");
  if (!getSessionSecret()) problems.push("SESSION_SECRET is missing or shorter than 32 characters (run `pnpm -C apps/web gen-secret`).");
  if (!process.env.APP_PASSWORD_HASH) {
    problems.push("APP_PASSWORD_HASH is not set (run `pnpm -C apps/web hash-password`).");
  } else if (!getPasswordHash()) {
    problems.push("APP_PASSWORD_HASH is not a valid bcrypt hash. In .env.local every `$` must be escaped as `\\$`.");
  }
  return problems;
}
