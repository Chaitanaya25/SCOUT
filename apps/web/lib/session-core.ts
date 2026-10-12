// Pure session-token logic (no Next imports) so it can run in the request proxy and in unit tests.
import { jwtVerify, SignJWT } from "jose";

export const SESSION_COOKIE = "scout_session";
export const LAST_PROFILE_COOKIE = "scout_last_profile";
export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

export type SessionPayload = { pid: string; slug: string };

const encoder = new TextEncoder();

/** Signs a 30-day HS256 JWT carrying only the profile id and slug. */
export async function signSession(payload: SessionPayload, secret: string, nowMs: number = Date.now()): Promise<string> {
  const iat = Math.floor(nowMs / 1000);
  return new SignJWT({ pid: payload.pid, slug: payload.slug })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(iat)
    .setExpirationTime(iat + SESSION_MAX_AGE_SECONDS)
    .sign(encoder.encode(secret));
}

/** Returns the payload for a valid, unexpired token signed with `secret`; otherwise null (never throws). */
export async function verifySession(token: string | undefined, secret: string, nowMs: number = Date.now()): Promise<SessionPayload | null> {
  if (!token || !secret) return null;
  try {
    const { payload } = await jwtVerify(token, encoder.encode(secret), {
      algorithms: ["HS256"],
      currentDate: new Date(nowMs),
    });
    if (typeof payload.pid !== "string" || typeof payload.slug !== "string") return null;
    return { pid: payload.pid, slug: payload.slug };
  } catch {
    return null;
  }
}

/** Cookie attributes for the session cookie (httpOnly, sameSite=lax, secure in production). */
export function sessionCookieOptions(production: boolean = process.env.NODE_ENV === "production") {
  return {
    httpOnly: true,
    secure: production,
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}
