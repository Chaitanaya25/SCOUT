import { describe, expect, it } from "vitest";

import { SESSION_MAX_AGE_SECONDS, sessionCookieOptions, signSession, verifySession } from "./session-core";

const SECRET = "test-secret-test-secret-test-secret-123";
const NOW = Date.UTC(2026, 9, 12, 9, 30, 0);
const payload = { pid: "11111111-1111-4111-8111-111111111111", slug: "user-01" };

describe("session tokens", () => {
  it("round-trips a signed session", async () => {
    const token = await signSession(payload, SECRET, NOW);
    expect(await verifySession(token, SECRET, NOW + 1000)).toEqual(payload);
  });

  it("rejects a token signed with another secret", async () => {
    const token = await signSession(payload, SECRET, NOW);
    expect(await verifySession(token, "another-secret-another-secret-123456", NOW)).toBeNull();
  });

  it("rejects a tampered token", async () => {
    const token = await signSession(payload, SECRET, NOW);
    const [h, p, s] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ pid: "someone-else", slug: "user-02", iat: 1, exp: 9999999999 })).toString("base64url");
    expect(await verifySession(`${h}.${forged}.${s}`, SECRET, NOW)).toBeNull();
    expect(await verifySession(`${h}.${p}x.${s}`, SECRET, NOW)).toBeNull();
  });

  it("expires after 30 days", async () => {
    const token = await signSession(payload, SECRET, NOW);
    const justBefore = NOW + (SESSION_MAX_AGE_SECONDS - 5) * 1000;
    const after = NOW + (SESSION_MAX_AGE_SECONDS + 5) * 1000;
    expect(await verifySession(token, SECRET, justBefore)).toEqual(payload);
    expect(await verifySession(token, SECRET, after)).toBeNull();
  });

  it("returns null for missing or garbage tokens and never throws", async () => {
    expect(await verifySession(undefined, SECRET)).toBeNull();
    expect(await verifySession("", SECRET)).toBeNull();
    expect(await verifySession("not.a.jwt", SECRET)).toBeNull();
  });

  it("sets httpOnly/lax cookies, secure only in production", () => {
    expect(sessionCookieOptions(true)).toMatchObject({ httpOnly: true, sameSite: "lax", secure: true, path: "/" });
    expect(sessionCookieOptions(false).secure).toBe(false);
  });
});
