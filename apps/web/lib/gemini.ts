import "server-only";

import { GoogleGenAI, type Schema } from "@google/genai";
import type { z } from "zod";

import { db } from "./db";
import {
  capFor,
  classifyError,
  LlmBudgetExceeded,
  LlmError,
  MAX_ATTEMPTS,
  MAX_RETRY_DELAY_MS,
  pacificDay,
  parseRetryDelay,
  stripJsonFence,
  type LlmKind,
} from "./gemini-core";

export { LlmBudgetExceeded, LlmError };
export type { LlmKind };

export const EMBED_DIMENSIONS = 768;

let client: GoogleGenAI | null = null;
function ai(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new LlmError("GEMINI_API_KEY is not set.");
  client ??= new GoogleGenAI({ apiKey });
  return client;
}

function model(kind: "generate" | "embed" | "tailor"): string {
  if (kind === "embed") return process.env.GEMINI_EMBED_MODEL || "gemini-embedding-2";
  if (kind === "tailor") return process.env.GEMINI_TAILOR_MODEL || process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
  return process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
}

/**
 * Counts one request in `llm_usage` BEFORE it is sent (a failed call still costs quota) and refuses once the
 * daily soft cap is reached. Shared with the worker: same table, same Pacific-day key.
 */
async function reserve(kind: LlmKind): Promise<void> {
  const day = pacificDay();
  const cap = capFor(kind);
  const { data } = await db().from("llm_usage").select("requests").eq("day", day).eq("kind", kind).maybeSingle();
  const used = data?.requests ?? 0;
  if (used >= cap) throw new LlmBudgetExceeded(kind);
  const { error } = await db().from("llm_usage").upsert({ day, kind, requests: used + 1 }, { onConflict: "day,kind" });
  if (error) throw new LlmError("Could not record AI usage.");
}

async function guarded<T>(kind: LlmKind, call: () => Promise<T>): Promise<T> {
  let lastMessage = "";
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    await reserve(kind);
    try {
      return await call();
    } catch (err) {
      const status = typeof err === "object" && err && "status" in err ? Number((err as { status: unknown }).status) : undefined;
      lastMessage = err instanceof Error ? err.message : String(err);
      const cls = classifyError(status, lastMessage);
      if (cls === "daily_quota") throw new LlmBudgetExceeded(kind);
      if (cls === "fatal" || attempt === MAX_ATTEMPTS) break;
      const hint = parseRetryDelay(lastMessage);
      if (hint !== null && hint > MAX_RETRY_DELAY_MS) break; // never sleep long inside a request
      await new Promise((r) => setTimeout(r, Math.min(hint ?? 1000 * 2 ** (attempt - 1), MAX_RETRY_DELAY_MS)));
    }
  }
  throw new LlmError("The AI service is unavailable right now. Try again later.");
}

/** Structured JSON generation validated with zod. `untrusted` text is passed as data inside tags, never as instructions. */
export async function generateJson<S extends z.ZodType>(opts: {
  kind: Exclude<LlmKind, "embed">;
  system: string;
  prompt: string;
  responseSchema: Schema;
  schema: S;
}): Promise<z.infer<S>> {
  const text = await guarded(opts.kind, async () => {
    const res = await ai().models.generateContent({
      model: model(opts.kind === "tailor" ? "tailor" : "generate"),
      contents: opts.prompt,
      config: { systemInstruction: opts.system, responseMimeType: "application/json", responseSchema: opts.responseSchema, temperature: 0.1 },
    });
    return res.text ?? "";
  });
  let json: unknown;
  try {
    json = JSON.parse(stripJsonFence(text));
  } catch {
    throw new LlmError("The AI returned an unreadable answer.");
  }
  const parsed = opts.schema.safeParse(json);
  if (!parsed.success) throw new LlmError("The AI answer did not match the expected shape.");
  return parsed.data;
}

/** One 768-dim embedding. Each text goes in its own Content object (a plain string list is aggregated into one vector). */
export async function embedText(text: string, taskType: "RETRIEVAL_QUERY" | "RETRIEVAL_DOCUMENT" = "RETRIEVAL_QUERY"): Promise<number[]> {
  return guarded("embed", async () => {
    const res = await ai().models.embedContent({
      model: model("embed"),
      contents: [{ parts: [{ text }] }],
      config: { outputDimensionality: EMBED_DIMENSIONS, taskType },
    });
    const values = res.embeddings?.[0]?.values;
    if (res.embeddings?.length !== 1 || !values || values.length !== EMBED_DIMENSIONS) throw new Error("Unexpected embedding shape");
    return values;
  });
}
