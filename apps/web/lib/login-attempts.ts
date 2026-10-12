import "server-only";

import { db } from "./db";
import { WINDOW_MS } from "./rate-limit";

/** Epoch-ms timestamps of this IP's failed logins inside the rate-limit window. Throws on DB errors (fail closed). */
export async function recentFailureTimes(ip: string, nowMs: number = Date.now()): Promise<number[]> {
  const since = new Date(nowMs - WINDOW_MS).toISOString();
  const { data, error } = await db().from("login_attempts").select("created_at").eq("ip", ip).eq("success", false).gte("created_at", since);
  if (error) throw new Error(`login_attempts read failed: ${error.message}`);
  return (data ?? []).map((row) => new Date(row.created_at).getTime());
}

export async function recordFailure(ip: string): Promise<void> {
  const { error } = await db().from("login_attempts").insert({ ip, success: false });
  if (error) throw new Error(`login_attempts write failed: ${error.message}`);
}

/** A successful login clears that IP's failures and prunes rows older than a day. */
export async function recordSuccess(ip: string, nowMs: number = Date.now()): Promise<void> {
  const client = db();
  await client.from("login_attempts").delete().eq("ip", ip);
  await client.from("login_attempts").delete().lt("created_at", new Date(nowMs - 24 * 60 * 60 * 1000).toISOString());
}
