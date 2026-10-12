import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

const noStore = { "Cache-Control": "no-store" };

/** Latest scan run + its per-source results. `{ run: null }` when nothing has run yet. */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401, headers: noStore });

  const client = db();
  const { data: run, error } = await client
    .from("scan_runs")
    .select("id, kind, status, started_at, finished_at, stats")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return NextResponse.json({ error: "Could not read scan status." }, { status: 500, headers: noStore });
  if (!run) return NextResponse.json({ run: null }, { headers: noStore });

  const { data: sources } = await client
    .from("source_runs")
    .select("source, status, fetched, new_jobs, error, finished_at")
    .eq("scan_run_id", run.id)
    .order("source");

  return NextResponse.json({ run: { ...run, sources: sources ?? [] } }, { headers: noStore });
}
