import "server-only";

import { NextResponse, type NextRequest } from "next/server";

import { getSessionSecret } from "./env";
import { SESSION_COOKIE, verifySession, type SessionPayload } from "./session-core";

const noStore = { "Cache-Control": "no-store" };

export function json(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, { status, headers: noStore });
}

/**
 * Session from the signed cookie for route handlers. The proxy already blocks unauthenticated /api calls; this
 * re-checks so a handler stays safe if the proxy matcher ever changes. The profile id is trusted only from here.
 */
export async function sessionOr401(request: NextRequest): Promise<{ session: SessionPayload } | { response: NextResponse }> {
  const secret = getSessionSecret();
  const session = secret ? await verifySession(request.cookies.get(SESSION_COOKIE)?.value, secret) : null;
  if (!session) return { response: json({ error: "Not signed in." }, 401) };
  return { session };
}

/** Parses a JSON body with a zod schema; returns a 400 response on failure. */
export async function readJson<T>(request: NextRequest, schema: { safeParse: (v: unknown) => { success: true; data: T } | { success: false; error: { issues: { message: string }[] } } }): Promise<{ data: T } | { response: NextResponse }> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { response: json({ error: "Invalid request." }, 400) };
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return { response: json({ error: parsed.error.issues[0]?.message ?? "Invalid request." }, 400) };
  return { data: parsed.data };
}
