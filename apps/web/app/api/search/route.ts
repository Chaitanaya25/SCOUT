import { NextResponse, type NextRequest } from "next/server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

const noStore = { "Cache-Control": "no-store" };

export type SearchHit = { id: string; label: string; sub: string; href: string };

/** Keep letters, digits, space and a few safe symbols so the value can't break a PostgREST filter. */
function sanitize(q: string): string {
  return q.replace(/[^\p{L}\p{N} .+#-]/gu, "").trim().slice(0, 60);
}

/** ⌘K palette search: this profile's matched jobs, its watched companies, and programs. */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401, headers: noStore });

  const q = sanitize(request.nextUrl.searchParams.get("q") ?? "");
  if (q.length < 2) return NextResponse.json({ jobs: [], companies: [], programs: [] }, { headers: noStore });

  const client = db();
  const profileId = session.pid; // from the signed cookie, never from the query string
  const pattern = `%${q}%`;

  // Jobs are global; only those matched to this profile are returned.
  const { data: jobRows } = await client
    .from("jobs")
    .select("id, title, company_name")
    .or(`title.ilike.${pattern},company_name.ilike.${pattern}`)
    .eq("is_active", true)
    .order("posted_at", { ascending: false, nullsFirst: false })
    .limit(25);
  const jobIds = (jobRows ?? []).map((j) => j.id);
  const { data: mine } = jobIds.length
    ? await client.from("job_matches").select("job_id").eq("profile_id", profileId).in("job_id", jobIds)
    : { data: [] as { job_id: string }[] };
  const mineSet = new Set((mine ?? []).map((m) => m.job_id));
  const jobs: SearchHit[] = (jobRows ?? [])
    .filter((j) => mineSet.has(j.id))
    .slice(0, 6)
    .map((j) => ({ id: j.id, label: j.title, sub: j.company_name, href: `/jobs?job=${j.id}` }));

  const { data: watched } = await client.from("watched_companies").select("company_id").eq("profile_id", profileId);
  const companyIds = (watched ?? []).map((w) => w.company_id);
  const { data: companyRows } = companyIds.length
    ? await client.from("companies").select("id, name, ats").in("id", companyIds).ilike("name", pattern).limit(4)
    : { data: [] as { id: string; name: string; ats: string | null }[] };
  const companies: SearchHit[] = (companyRows ?? []).map((c) => ({ id: c.id, label: c.name, sub: c.ats ? `${c.ats} ATS` : "Careers page", href: "/watched" }));

  const { data: programRows } = await client.from("programs").select("id, name, organizer").ilike("name", pattern).order("deadline_at").limit(4);
  const programs: SearchHit[] = (programRows ?? []).map((p) => ({ id: p.id, label: p.name, sub: p.organizer ?? "Program", href: "/programs" }));

  return NextResponse.json({ jobs, companies, programs }, { headers: noStore });
}
