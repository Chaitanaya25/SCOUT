// Pure mapping from a job_matches row (+ embedded job) to what cards, the drawer and the radar show.

export type JobEmbed = {
  id: string;
  title: string;
  company_name: string;
  company_id?: string | null;
  location: string | null;
  is_remote: boolean;
  job_type: string;
  posted_at: string | null;
  first_seen_at: string;
  apply_url: string;
  scam_risk: string;
  scam_reasons: string[] | null;
  sources: string[] | null;
  description?: string | null;
};

export type MatchRow = {
  id: string;
  status: string;
  score: number | null;
  similarity: number;
  rank_score: number | null;
  eligible: boolean;
  missing_skills: string[] | null;
  breakdown: unknown;
  eligibility: unknown;
  reason: string | null;
  created_at: string;
  jobs: JobEmbed | null;
};

export type Check = { label: string; status: "pass" | "fail" | "unknown" };
export type Breakdown = { skills: number | null; eligibility: number | null; freshness: number | null };

export type MatchCard = {
  matchId: string;
  jobId: string;
  status: string;
  title: string;
  company: string;
  location: string;
  isRemote: boolean;
  jobType: string;
  applyUrl: string;
  postedAt: string;
  hoursOld: number;
  fresh: boolean;
  scored: boolean;
  score: number | null;
  similarityPct: number;
  eligible: boolean;
  scamRisk: "none" | "low" | "high";
  scamReasons: string[];
  missingSkills: string[];
  reason: string | null;
  ats: string | null;
  tags: string[];
  checks: Check[];
  breakdown: Breakdown;
};

export const ATS_SOURCES = ["greenhouse", "lever", "ashby", "workday", "smartrecruiters"] as const;

const TECH = [
  "Python", "TypeScript", "JavaScript", "Java", "Go", "Rust", "C++", "SQL", "React", "Next.js", "Node.js", "FastAPI",
  "Django", "PyTorch", "TensorFlow", "Kubernetes", "Docker", "AWS", "GCP", "Azure", "Spark", "Kafka", "PostgreSQL",
  "Redis", "LLM", "NLP", "Machine Learning", "Computer Vision", "GraphQL", "Flutter", "Kotlin", "Swift",
];

/** Up to `max` known technology keywords mentioned in the title/description (word-boundary, case-insensitive). */
export function techTags(text: string, max = 4): string[] {
  const out: string[] = [];
  for (const t of TECH) {
    const re = new RegExp(`(^|[^A-Za-z0-9+.#])${t.replace(/[.+#]/g, (c) => `\\${c}`)}($|[^A-Za-z0-9+#])`, "i");
    if (re.test(text)) out.push(t);
    if (out.length >= max) break;
  }
  return out;
}

export function hoursSince(iso: string, now: Date): number {
  return Math.max(0, (now.getTime() - new Date(iso).getTime()) / 3_600_000);
}

function asChecks(v: unknown): Check[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((c): c is { label: unknown; status: unknown } => typeof c === "object" && c !== null && "label" in c)
    .map((c) => ({ label: String(c.label), status: c.status === "pass" || c.status === "fail" ? c.status : "unknown" }));
}

function asBreakdown(v: unknown): Breakdown {
  const o = (typeof v === "object" && v !== null ? v : {}) as Record<string, unknown>;
  const n = (x: unknown) => (typeof x === "number" && Number.isFinite(x) ? Math.round(x) : null);
  return { skills: n(o.skills), eligibility: n(o.eligibility), freshness: n(o.freshness) };
}

export function toMatchCard(row: MatchRow, now: Date): MatchCard | null {
  const j = row.jobs;
  if (!j) return null;
  const postedAt = j.posted_at ?? j.first_seen_at;
  const hoursOld = hoursSince(postedAt, now);
  const ats = (j.sources ?? []).find((s) => (ATS_SOURCES as readonly string[]).includes(s)) ?? null;
  return {
    matchId: row.id,
    jobId: j.id,
    status: row.status,
    title: j.title,
    company: j.company_name,
    location: j.location ?? (j.is_remote ? "Remote" : "Location not listed"),
    isRemote: j.is_remote,
    jobType: j.job_type,
    applyUrl: j.apply_url,
    postedAt,
    hoursOld,
    fresh: hoursOld < 24,
    scored: row.score !== null,
    score: row.score,
    similarityPct: Math.round(Math.max(0, Math.min(1, row.similarity)) * 100),
    eligible: row.eligible,
    scamRisk: j.scam_risk === "high" || j.scam_risk === "low" ? j.scam_risk : "none",
    scamReasons: j.scam_reasons ?? [],
    missingSkills: (row.missing_skills ?? []).slice(0, 4),
    reason: row.reason,
    ats,
    tags: techTags(`${j.title}\n${(j.description ?? "").slice(0, 3000)}`),
    checks: asChecks(row.eligibility),
    breakdown: asBreakdown(row.breakdown),
  };
}

/** `POSTED 2H AGO` / `POSTED 3D AGO` (DESIGN §8). */
export function postedLabel(hoursOld: number): string {
  if (hoursOld < 1) return "JUST NOW";
  if (hoursOld < 24) return `${Math.floor(hoursOld)}H AGO`;
  return `${Math.floor(hoursOld / 24)}D AGO`;
}

/** Hide links that are not http(s) (scraped data is untrusted). */
export function safeHref(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}
