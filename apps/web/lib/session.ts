import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getSessionSecret } from "./env";
import { SESSION_COOKIE, verifySession, type SessionPayload } from "./session-core";

/** The verified session from the signed cookie, or null. The profile id inside is trusted only because it is signed. */
export async function getSession(): Promise<SessionPayload | null> {
  // Read the cookie FIRST: it makes every caller request-time dynamic. Checking env before this would let Next
  // prerender the "no session" branch (a baked-in redirect to /login) whenever the secret is absent at build time.
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const secret = getSessionSecret();
  if (!secret) return null;
  return verifySession(token, secret);
}

/**
 * Use in every server component / action / route that touches per-user data. Returns the profile id to filter
 * queries by — never accept a profile id from the client. Redirects to /login when there is no valid session.
 */
export async function requireProfile(): Promise<{ profileId: string; slug: string }> {
  const session = await getSession();
  if (!session) redirect("/login");
  return { profileId: session.pid, slug: session.slug };
}
