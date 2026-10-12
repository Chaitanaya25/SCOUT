import "server-only";

import { GoogleGenAI, type Schema } from "@google/genai";
import type { z } from "zod";

import { db } from "./db";
import { capFor, LlmBudgetExceeded, LlmError, pacificDay, runWithRetry, stripJsonFence, type LlmKind, type RetryDeps } from "./gemini-core";

export { LlmBudgetExceeded, LlmError };
export type { LlmKind };

export const EMBED_DIMENSIONS = 768;
/** Default wall-clock budget for one wrapped call (attempts + waits). Routes pass less when they do more work. */
export const DEFAULT_BUDGET_MS = 25_000;

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

/** One extra attempt on this model when the primary is overloaded (503). Set GEMINI_FALLBACK_MODEL="" to disable. */
function fallbackModel(): string | null {
  const v = process.env.GEMINI_FALLBACK_MODEL;
  if (v === "") return null;
  return v ?? "gemini-3.8-flash";
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

function deps(kind: LlmKind): RetryDeps {
  return { reserve: () => reserve(kind), sleep: (ms) => new Promise((r) => setTimeout(r, ms)), now: () => Date.now() };
}

/** Structured JSON generation validated with zod. Untrusted text is passed as data inside tags, never as instructions. */
export async function generateJson<S extends z.ZodType>(opts: {
  kind: Exclude<LlmKind, "embed">;
  system: string;
  prompt: string;
  responseSchema: Schema;
  schema: S;
  budgetMs?: number;
}): Promise<z.infer<S>> {
  const primary = model(opts.kind === "tailor" ? "tailor" : "generate");
  const text = await runWithRetry(
    { kind: opts.kind, primary, fallback: fallbackModel(), budgetMs: opts.budgetMs ?? DEFAULT_BUDGET_MS },
    async (m) => {
      const res = await ai().models.generateContent({
        model: m,
        contents: opts.prompt,
        config: { systemInstruction: opts.system, responseMimeType: "application/json", responseSchema: opts.responseSchema, temperature: 0.1 },
      });
      return res.text ?? "";
    },
    deps(opts.kind),
  );
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

/**
 * One 768-dim embedding. Each text goes in its own Content object (a plain string list is aggregated into one
 * vector). No fallback model: a different embedding model would put vectors in a different space.
 */
export async function embedText(
  text: string,
  taskType: "RETRIEVAL_QUERY" | "RETRIEVAL_DOCUMENT" = "RETRIEVAL_QUERY",
  budgetMs: number = DEFAULT_BUDGET_MS,
): Promise<number[]> {
  return runWithRetry(
    { kind: "embed", primary: model("embed"), fallback: null, budgetMs },
    async (m) => {
      const res = await ai().models.embedContent({
        model: m,
        contents: [{ parts: [{ text }] }],
        config: { outputDimensionality: EMBED_DIMENSIONS, taskType },
      });
      const values = res.embeddings?.[0]?.values;
      if (res.embeddings?.length !== 1 || !values || values.length !== EMBED_DIMENSIONS) throw new Error("Unexpected embedding shape");
      return values;
    },
    deps("embed"),
  );
}
