import { NextResponse } from "next/server";

import { loginSchema, verifyPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { dbConfigured, getPasswordHash, getSessionSecret } from "@/lib/env";
import { recentFailureTimes, recordFailure, recordSuccess } from "@/lib/login-attempts";
import { clientIp, evaluateAttempts } from "@/lib/rate-limit";
import { LAST_PROFILE_COOKIE, SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/session-core";

const noStore = { "Cache-Control": "no-store" };

export async function POST(request: Request) {
  const secret = getSessionSecret();
  const hash = getPasswordHash();
  if (!secret || !hash || !dbConfigured()) {
    return NextResponse.json({ error: "Sign-in is not configured on the server." }, { status: 500, headers: noStore });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400, headers: noStore });
  }
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400, headers: noStore });
  const { profileSlug, password } = parsed.data;

  const ip = clientIp(request.headers);
  const now = Date.now();

  let failures: number[];
  try {
    failures = await recentFailureTimes(ip, now);
  } catch {
    // Fail closed: without the limiter we do not check passwords.
    return NextResponse.json({ error: "Sign-in is temporarily unavailable." }, { status: 500, headers: noStore });
  }
  const decision = evaluateAttempts(failures, now);
  if (decision.blocked) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later.", retryAfterSeconds: decision.retryAfterSeconds },
      { status: 429, headers: { ...noStore, "Retry-After": String(decision.retryAfterSeconds) } },
    );
  }

  const ok = await verifyPassword(password, hash);
  if (!ok) {
    try {
      await recordFailure(ip);
    } catch {
      return NextResponse.json({ error: "Sign-in is temporarily unavailable." }, { status: 500, headers: noStore });
    }
    const after = evaluateAttempts([...failures, now], now);
    return NextResponse.json({ error: "Wrong password.", remaining: after.remaining }, { status: 401, headers: noStore });
  }

  const { data: profile, error } = await db().from("profiles").select("id, slug").eq("slug", profileSlug).maybeSingle();
  if (error || !profile) return NextResponse.json({ error: "Profile not found." }, { status: 404, headers: noStore });

  await recordSuccess(ip, now);
  const token = await signSession({ pid: profile.id, slug: profile.slug }, secret, now);
  const response = NextResponse.json({ ok: true }, { headers: noStore });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  response.cookies.set(LAST_PROFILE_COOKIE, profile.slug, { ...sessionCookieOptions(), maxAge: 365 * 24 * 60 * 60 });
  return response;
}
