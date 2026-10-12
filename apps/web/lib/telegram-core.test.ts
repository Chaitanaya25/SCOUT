import { describe, expect, it } from "vitest";

import {
  confirmedKeyboard,
  deepLink,
  generateLinkToken,
  isTokenValid,
  LINK_TOKEN_RE,
  LINK_TOKEN_TTL_MS,
  linkExpiry,
  parseCallbackData,
  parseStartCommand,
  secretMatches,
  updateSchema,
} from "./telegram-core";

const ID = "123e4567-e89b-42d3-a456-426614174000";

describe("link tokens", () => {
  it("are 22-char base64url (16 bytes) and unique", () => {
    const a = generateLinkToken();
    expect(a).toMatch(LINK_TOKEN_RE);
    expect(generateLinkToken()).not.toBe(a);
  });
  it("expire after exactly 15 minutes", () => {
    const now = new Date("2026-10-13T10:00:00Z");
    const exp = linkExpiry(now);
    expect(exp.getTime() - now.getTime()).toBe(LINK_TOKEN_TTL_MS);
    expect(isTokenValid(exp, new Date(now.getTime() + LINK_TOKEN_TTL_MS - 1))).toBe(true);
    expect(isTokenValid(exp, new Date(now.getTime() + LINK_TOKEN_TTL_MS))).toBe(false);
    expect(isTokenValid(null)).toBe(false);
  });
  it("build a t.me deep link and strip a leading @", () => {
    expect(deepLink("@ScoutBot", "abc_-")).toBe("https://t.me/ScoutBot?start=abc_-");
  });
});

describe("secretMatches", () => {
  it("accepts only the exact secret", () => {
    expect(secretMatches("s3cret-value-123456", "s3cret-value-123456")).toBe(true);
    expect(secretMatches("s3cret-value-123457", "s3cret-value-123456")).toBe(false);
    expect(secretMatches("short", "s3cret-value-123456")).toBe(false);
  });
  it("rejects a missing header or an unset secret (never matches empty to empty)", () => {
    expect(secretMatches(null, "x")).toBe(false);
    expect(secretMatches("x", undefined)).toBe(false);
    expect(secretMatches("", "")).toBe(false);
  });
});

describe("parseCallbackData", () => {
  it("parses save / skip / applied with a uuid", () => {
    expect(parseCallbackData(`s:${ID}`)).toEqual({ action: "s", matchId: ID });
    expect(parseCallbackData(`k:${ID}`)?.action).toBe("k");
    expect(parseCallbackData(`a:${ID.toUpperCase()}`)).toEqual({ action: "a", matchId: ID });
  });
  it("rejects anything else, including the no-op confirmed button", () => {
    for (const bad of [undefined, "", "s:", "s:not-a-uuid", `x:${ID}`, `n:${ID}`, `s:${ID};drop`, ID, `s: ${ID}`]) {
      expect(parseCallbackData(bad)).toBeNull();
    }
  });
});

describe("parseStartCommand", () => {
  const token = generateLinkToken();
  it("extracts a well-formed token", () => {
    expect(parseStartCommand(`/start ${token}`)).toEqual({ token });
    expect(parseStartCommand(`/start@ScoutBot ${token}`)).toEqual({ token });
  });
  it("treats a bare or malformed /start as bare, and other text as nothing", () => {
    expect(parseStartCommand("/start")).toEqual({ token: null, bare: true });
    expect(parseStartCommand("/start nope")).toEqual({ token: null, bare: true });
    expect(parseStartCommand("hello")).toEqual({ token: null, bare: false });
    expect(parseStartCommand(undefined)).toEqual({ token: null, bare: false });
  });
});

describe("updateSchema", () => {
  it("accepts a callback query and keeps the inline keyboard", () => {
    const parsed = updateSchema.safeParse({
      update_id: 1,
      callback_query: {
        id: "cb1",
        data: `s:${ID}`,
        message: { message_id: 5, chat: { id: 42 }, reply_markup: { inline_keyboard: [[{ text: "Apply", url: "https://x.test" }]] } },
      },
    });
    expect(parsed.success).toBe(true);
    expect(parsed.success && parsed.data.callback_query?.message?.reply_markup?.inline_keyboard[0][0].url).toBe("https://x.test");
  });
  it("rejects malformed updates", () => {
    expect(updateSchema.safeParse({ update_id: "x" }).success).toBe(false);
    expect(updateSchema.safeParse({ update_id: 1, message: { message_id: 1, chat: {} } }).success).toBe(false);
  });
});

describe("confirmedKeyboard", () => {
  it("keeps the Apply URL row and shows the confirmed state plus the other two actions", () => {
    const kb = confirmedKeyboard({ inline_keyboard: [[{ text: "Apply ↗", url: "https://x.test" }], [{ text: "Save", callback_data: `s:${ID}` }]] }, "a", ID);
    expect(kb.inline_keyboard[0]).toEqual([{ text: "Apply ↗", url: "https://x.test" }]);
    expect(kb.inline_keyboard[1].map((b) => b.text)).toEqual(["✓ Applied", "Save", "Skip"]);
    expect(kb.inline_keyboard[1].every((b) => (b.callback_data ?? "").length <= 64)).toBe(true);
  });
});
