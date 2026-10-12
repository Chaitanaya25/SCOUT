import { NextResponse, type NextRequest } from "next/server";

import { switchSchema } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSessionSecret } from "@/lib/env";
import { LAST_PROFILE_COOKIE, SESSION_COOKIE, sessionCookieOptions, signSession, verifySession } from "@/lib/session-core";

const noStore = { "Cache-Control": "no-store" };

/** Re-signs the session for the other profile. Requires a valid session; the profile id comes from the DB, never the client. */
export async function POST(request: NextRequest) {
  const secret = getSessionSecret();
  if (!secret) return NextResponse.json({ error: "Not configured." }, { status: 500, headers: noStore });

  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value, secret);
  if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401, headers: noStore });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400, headers: noStore });
  }
  const parsed = switchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400, headers: noStore });

  const { data: profile, error } = await db().from("profiles").select("id, slug").eq("slug", parsed.data.profileSlug).maybeSingle();
  if (error || !profile) return NextResponse.json({ error: "Profile not found." }, { status: 404, headers: noStore });

  const token = await signSession({ pid: profile.id, slug: profile.slug }, secret);
  const response = NextResponse.json({ ok: true }, { headers: noStore });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  response.cookies.set(LAST_PROFILE_COOKIE, profile.slug, { ...sessionCookieOptions(), maxAge: 365 * 24 * 60 * 60 });
  return response;
}
