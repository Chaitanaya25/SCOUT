import { describe, expect, it } from "vitest";

import { escapeForDotenv, hashPassword, loginSchema, looksLikeBcryptHash, safeNextPath, switchSchema, verifyPassword } from "./auth";

describe("password helpers", () => {
  it("hashes and verifies a password", async () => {
    const hash = await hashPassword("correct horse battery staple", 4);
    expect(looksLikeBcryptHash(hash)).toBe(true);
    expect(await verifyPassword("correct horse battery staple", hash)).toBe(true);
    expect(await verifyPassword("wrong password", hash)).toBe(false);
  });

  it("returns false (not throws) for a missing or mangled hash", async () => {
    expect(await verifyPassword("x", undefined)).toBe(false);
    expect(await verifyPassword("x", "")).toBe(false);
    // what dotenv-expand leaves of an unescaped hash
    expect(await verifyPassword("x", "2a12")).toBe(false);
    expect(looksLikeBcryptHash("$2a$12$short")).toBe(false);
  });

  it("escapes $ for .env files", async () => {
    const hash = await hashPassword("pw", 4);
    const escaped = escapeForDotenv(hash);
    expect(escaped.startsWith("\\$2")).toBe(true);
    expect(escaped.replace(/\\\$/g, "$")).toBe(hash);
  });
});

describe("request schemas", () => {
  it("accepts only the two profile slugs", () => {
    expect(loginSchema.safeParse({ profileSlug: "user-01", password: "pw" }).success).toBe(true);
    expect(loginSchema.safeParse({ profileSlug: "user-02", password: "pw" }).success).toBe(true);
    expect(loginSchema.safeParse({ profileSlug: "user-03", password: "pw" }).success).toBe(false);
    expect(loginSchema.safeParse({ profileSlug: "user-01", password: "" }).success).toBe(false);
    expect(loginSchema.safeParse({ profileSlug: "user-01" }).success).toBe(false);
    expect(switchSchema.safeParse({ profileSlug: "user-02" }).success).toBe(true);
    expect(switchSchema.safeParse({ profileSlug: "admin" }).success).toBe(false);
  });
});

describe("safeNextPath", () => {
  it("allows same-origin relative paths", () => {
    expect(safeNextPath("/jobs?job=abc")).toBe("/jobs?job=abc");
    expect(safeNextPath("/settings/telegram")).toBe("/settings/telegram");
  });

  it("falls back for open-redirect attempts and auth/API paths", () => {
    expect(safeNextPath("//evil.example")).toBe("/dashboard");
    expect(safeNextPath("https://evil.example")).toBe("/dashboard");
    expect(safeNextPath("/\\evil.example")).toBe("/dashboard");
    expect(safeNextPath("/login")).toBe("/dashboard");
    expect(safeNextPath("/api/auth/logout")).toBe("/dashboard");
    expect(safeNextPath(null)).toBe("/dashboard");
    expect(safeNextPath("")).toBe("/dashboard");
  });
});
