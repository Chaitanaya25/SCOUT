// Password + request-body helpers (pure; no Next imports).
import bcrypt from "bcryptjs";
import { z } from "zod";

export const PROFILE_SLUGS = ["user-01", "user-02"] as const;
export type ProfileSlug = (typeof PROFILE_SLUGS)[number];

export const loginSchema = z.object({
  profileSlug: z.enum(PROFILE_SLUGS),
  password: z.string().min(1).max(200),
});

export const switchSchema = z.object({ profileSlug: z.enum(PROFILE_SLUGS) });

const BCRYPT_RE = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

/** True when `hash` has the shape of a bcrypt hash. A hash with unescaped `$` in .env files is mangled and fails this. */
export function looksLikeBcryptHash(hash: string | undefined): hash is string {
  return typeof hash === "string" && BCRYPT_RE.test(hash);
}

/** Constant-time password check against APP_PASSWORD_HASH; false for any malformed input (never throws). */
export async function verifyPassword(password: string, hash: string | undefined): Promise<boolean> {
  if (!looksLikeBcryptHash(hash)) return false;
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

export async function hashPassword(password: string, rounds = 12): Promise<string> {
  return bcrypt.hash(password, rounds);
}

/** Escapes `$` as `\$` so Next/dotenv-expand does not mangle a bcrypt hash placed in .env.local. */
export function escapeForDotenv(hash: string): string {
  return hash.replace(/\$/g, "\\$");
}

/** Post-login redirect target: same-origin relative paths only (no `//host`, no backslashes, no auth/API routes). */
export function safeNextPath(next: string | null | undefined, fallback = "/dashboard"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return fallback;
  if (next === "/login" || next.startsWith("/login?") || next.startsWith("/api/")) return fallback;
  return next;
}
