/**
 * Deterministic dev-seed data (no I/O). `buildSeed(now, ids)` returns the same rows for the same
 * inputs: every id is a UUIDv5 of a stable key, every timestamp is relative to `now`.
 * Rows are inserted by scripts/seed-dev.ts with upserts, so re-running never duplicates anything.
 *
 * All companies, listings and URLs are SAMPLE data for UI work. ATS tokens are unverified.
 */
import { createHash } from "node:crypto";

import type { Enums, Json, TablesInsert } from "../lib/database.types";

export const SEED_DEDUPE_PREFIX = "seed:";
export const SEED_PROGRAM_SOURCE = "dev-seed";

const NAMESPACE = "6f1d1a0e-5c0e-4d84-9f58-5c0d1d5c0de1";

export function uuidV5(name: string, namespace: string = NAMESPACE): string {
  const ns = Buffer.from(namespace.replace(/-/g, ""), "hex");
  const hash = createHash("sha1").update(ns).update(name).digest();
  hash[6] = (hash[6] & 0x0f) | 0x50;
  hash[8] = (hash[8] & 0x3f) | 0x80;
  const hex = hash.subarray(0, 16).toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const iso = (ms: number): string => new Date(ms).toISOString();
const dateOnly = (ms: number): string => new Date(ms).toISOString().slice(0, 10);

type Family = "ml" | "backend" | "frontend" | "fullstack" | "data";
type JobType = Enums<"job_type">;
type Ats = Enums<"ats_type">;

type CompanySpec = {
  name: string;
  domain: string;
  location: string;
  ats: Ats | null;
  token: string | null;
};

const COMPANIES: CompanySpec[] = [
  { name: "Razorpay", domain: "razorpay.com", location: "Bangalore (Hybrid)", ats: "greenhouse", token: "razorpay" },
  { name: "CRED", domain: "cred.club", location: "Bangalore (Onsite)", ats: "lever", token: "cred" },
  { name: "Zerodha", domain: "zerodha.com", location: "Bangalore", ats: "lever", token: "zerodha" },
  { name: "Postman", domain: "postman.com", location: "Bangalore / Hybrid Remote", ats: "ashby", token: "postman" },
  { name: "Swiggy", domain: "swiggy.com", location: "Bangalore", ats: "lever", token: "swiggy" },
  { name: "Zepto", domain: "zeptonow.com", location: "Mumbai", ats: "ashby", token: "zepto" },
  { name: "Groww", domain: "groww.in", location: "Bangalore (Hybrid)", ats: "greenhouse", token: "groww" },
  { name: "Meesho", domain: "meesho.com", location: "Bangalore", ats: "lever", token: "meesho" },
  { name: "PhonePe", domain: "phonepe.com", location: "Bangalore", ats: "lever", token: "phonepe" },
  { name: "Freshworks", domain: "freshworks.com", location: "Chennai", ats: "smartrecruiters", token: "Freshworks" },
  { name: "Flipkart", domain: "flipkart.com", location: "Bangalore", ats: null, token: null },
  { name: "Atlassian", domain: "atlassian.com", location: "Bengaluru / Remote", ats: "lever", token: "atlassian" },
  { name: "Microsoft IDC", domain: "microsoft.com", location: "Hyderabad", ats: null, token: null },
  { name: "Sarvam AI", domain: "sarvam.ai", location: "Bangalore", ats: "ashby", token: "sarvam" },
  { name: "Juspay", domain: "juspay.in", location: "Bangalore", ats: "greenhouse", token: "juspay" },
  { name: "Paytm", domain: "paytm.com", location: "Noida", ats: null, token: null },
  { name: "Stripe", domain: "stripe.com", location: "Remote (India/Global)", ats: "greenhouse", token: "stripe" },
  { name: "Vercel", domain: "vercel.com", location: "Remote Worldwide", ats: "generic", token: null },
  { name: "Hugging Face", domain: "huggingface.co", location: "Remote", ats: "generic", token: null },
  { name: "GitLab", domain: "gitlab.com", location: "Remote Worldwide", ats: "greenhouse", token: "gitlab" },
  { name: "Databricks", domain: "databricks.com", location: "Remote", ats: "greenhouse", token: "databricks" },
  { name: "Linear", domain: "linear.app", location: "Remote (EU/India)", ats: "ashby", token: "linear" },
  { name: "Supabase", domain: "supabase.com", location: "Remote Worldwide", ats: "ashby", token: "supabase" },
  { name: "Canonical", domain: "canonical.com", location: "Remote Worldwide", ats: null, token: null },
  { name: "Elastic", domain: "elastic.co", location: "Remote", ats: "greenhouse", token: "elastic" },
  { name: "Grafana Labs", domain: "grafana.com", location: "Remote", ats: "greenhouse", token: "grafanalabs" },
];

type RoleSpec = {
  title: string;
  type: JobType;
  family: Family;
  skills: string[];
  senior?: boolean;
};

const ROLES: RoleSpec[] = [
  { title: "Machine Learning Intern", type: "internship", family: "ml", skills: ["Python", "Machine Learning", "PyTorch", "Pandas"] },
  { title: "AI Research Intern", type: "internship", family: "ml", skills: ["Python", "PyTorch", "Deep Learning", "NLP"] },
  { title: "Data Science Intern", type: "internship", family: "data", skills: ["Python", "SQL", "Pandas", "Statistics"] },
  { title: "MLOps Engineer Intern", type: "internship", family: "ml", skills: ["Python", "Docker", "Kubernetes", "Airflow"] },
  { title: "NLP Engineer (New Grad)", type: "full_time", family: "ml", skills: ["Python", "NLP", "PyTorch", "FastAPI"] },
  { title: "Backend Engineer Intern", type: "internship", family: "backend", skills: ["Python", "FastAPI", "SQL", "Docker"] },
  { title: "Software Development Engineer Intern", type: "internship", family: "backend", skills: ["Java", "Data Structures", "SQL", "System Design"] },
  { title: "SDE-1 (New Grad)", type: "full_time", family: "backend", skills: ["Go", "Distributed Systems", "SQL", "Kafka"] },
  { title: "Platform Engineer Intern", type: "internship", family: "backend", skills: ["Go", "Kubernetes", "Docker", "Linux"] },
  { title: "Frontend Engineer Intern", type: "internship", family: "frontend", skills: ["React", "TypeScript", "CSS", "Next.js"] },
  { title: "Frontend Engineer (Design Systems)", type: "full_time", family: "frontend", skills: ["React", "TypeScript", "Storybook", "CSS"] },
  { title: "Full Stack Engineer Intern", type: "internship", family: "fullstack", skills: ["TypeScript", "Node.js", "React", "PostgreSQL"] },
  { title: "Product Engineer Intern", type: "internship", family: "fullstack", skills: ["TypeScript", "React", "Node.js", "GraphQL"] },
  { title: "Data Engineer Intern", type: "internship", family: "data", skills: ["Python", "SQL", "Airflow", "Spark"] },
  { title: "Analytics Engineer Intern", type: "internship", family: "data", skills: ["SQL", "dbt", "Python", "BigQuery"] },
];

const SENIOR_ROLES: RoleSpec[] = [
  { title: "Senior Backend Engineer", type: "full_time", family: "backend", skills: ["Go", "Kafka", "System Design", "Kubernetes"], senior: true },
  { title: "Staff Infrastructure Engineer", type: "full_time", family: "backend", skills: ["Kubernetes", "AWS", "Terraform", "Go"], senior: true },
  { title: "Senior ML Engineer (5+ years)", type: "full_time", family: "ml", skills: ["Python", "PyTorch", "MLOps", "Spark"], senior: true },
  { title: "Engineering Manager, Platform", type: "full_time", family: "backend", skills: ["Leadership", "System Design", "Go", "Hiring"], senior: true },
];

type ScamSpec = { company: string; title: string; risk: Enums<"scam_risk">; reasons: string[] };
const SCAMS: ScamSpec[] = [
  { company: "GlobalTech Solutions", title: "Junior Developer & QA Trainee", risk: "high", reasons: ["Asks for a Rs 2,500 training-kit deposit before the interview", "Recruiter contactable only on WhatsApp"] },
  { company: "QuickHire Consultancy", title: "Software Trainee (Guaranteed Placement)", risk: "high", reasons: ["Registration fee required", "Claims guaranteed placement"] },
  { company: "NextGen Infotech", title: "Data Entry + Python Intern", risk: "high", reasons: ["Recruiter uses a personal gmail address", "Unrealistic stipend (Rs 80,000/month for an intern)"] },
  { company: "SkillBridge Careers", title: "Backend Developer Trainee", risk: "low", reasons: ["Vague company details"] },
  { company: "TechVista Hiring", title: "ML Intern (Paid Training)", risk: "low", reasons: ["Mentions a training fee in the description"] },
];
const SCAM_INDEXES = new Set([17, 38, 53, 66, 74]);

const AGGREGATORS: string[][] = [
  ["linkedin", "indeed"],
  ["internshala"],
  ["naukri"],
  ["adzuna"],
  ["linkedin"],
  ["google_jobs", "indeed"],
];
const REMOTE_BOARDS: string[][] = [["remoteok"], ["remotive"], ["himalayas"], ["weworkremotely"], ["arbeitnow"]];

type ProfileSeed = {
  slug: "user-01" | "user-02";
  skills: string[];
  families: Family[];
  grad_year: number;
  degree: string;
  roles: string[];
  locations: string[];
  college: string;
};

const PROFILES: ProfileSeed[] = [
  {
    slug: "user-01",
    skills: ["Python", "Machine Learning", "PyTorch", "Pandas", "FastAPI", "SQL", "Docker", "Deep Learning", "NLP", "Data Structures"],
    families: ["ml", "backend", "data"],
    grad_year: 2028,
    degree: "B.Tech CSE (Data Science)",
    roles: ["machine learning intern", "backend engineer intern", "data science intern"],
    locations: ["India", "Bangalore", "Remote"],
    college: "Sample Institute of Technology",
  },
  {
    slug: "user-02",
    skills: ["TypeScript", "React", "Next.js", "Node.js", "CSS", "PostgreSQL", "GraphQL", "SQL", "Storybook"],
    families: ["frontend", "fullstack", "backend"],
    grad_year: 2027,
    degree: "B.Tech CSE",
    roles: ["frontend engineer intern", "full stack engineer intern", "product engineer intern"],
    locations: ["India", "Bangalore", "Remote"],
    college: "Sample Institute of Technology",
  },
];

export type SeedProfileIds = { "user-01": string; "user-02": string };

export type SeedData = {
  companies: TablesInsert<"companies">[];
  jobs: TablesInsert<"jobs">[];
  jobMatches: TablesInsert<"job_matches">[];
  applications: TablesInsert<"applications">[];
  programs: TablesInsert<"programs">[];
  programReminders: TablesInsert<"program_reminders">[];
  watchedCompanies: TablesInsert<"watched_companies">[];
  scanRuns: TablesInsert<"scan_runs">[];
  sourceRuns: TablesInsert<"source_runs">[];
  preferencePatches: Record<
    "user-01" | "user-02",
    { roles: string[]; locations: string[]; grad_year: number; degree: string; max_experience_years: number }
  >;
  profileColleges: Record<"user-01" | "user-02", string>;
};

const slugify = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function scoreJob(profile: ProfileSeed, role: RoleSpec, hoursOld: number) {
  const matched = role.skills.filter((s) => profile.skills.includes(s));
  const skills = Math.round((matched.length / role.skills.length) * 100);
  const eligibility = role.senior ? 0 : 100;
  const freshness = Math.max(10, Math.round(100 - hoursOld * 1.2));
  const familyBonus = profile.families.includes(role.family) ? 12 : 0;
  const raw = 0.5 * skills + 0.3 * eligibility + 0.2 * freshness + familyBonus;
  const score = role.senior ? 22 : Math.max(41, Math.min(98, Math.round(raw)));
  const missing = role.skills.filter((s) => !profile.skills.includes(s)).slice(0, 4);
  return { skills, eligibility, freshness, score, missing };
}

export function buildSeed(now: Date, ids: SeedProfileIds): SeedData {
  const nowMs = now.getTime();
  const rand = mulberry32(20260101);

  // ---------------------------------------------------------------- companies
  const companyId = (name: string) => uuidV5(`company:${name}`);
  const companies: TablesInsert<"companies">[] = COMPANIES.map((c) => ({
    id: companyId(c.name),
    name: c.name,
    domain: c.domain,
    careers_url: `https://${c.domain}/careers`,
    ats: c.ats,
    ats_token: c.token,
  }));

  // ---------------------------------------------------------------- jobs (80)
  type JobMeta = { role: RoleSpec; hoursOld: number; scam: ScamSpec | null; company: CompanySpec | null };
  const jobs: TablesInsert<"jobs">[] = [];
  const meta = new Map<string, JobMeta>();

  for (let i = 0; i < 80; i++) {
    const scam = SCAM_INDEXES.has(i) ? SCAMS[[...SCAM_INDEXES].indexOf(i)] : null;
    const senior = !scam && i % 10 === 9;
    const role = scam
      ? ROLES[i % ROLES.length]
      : senior
        ? SENIOR_ROLES[Math.floor(i / 10) % SENIOR_ROLES.length]
        : ROLES[(i * 7 + (i % 4)) % ROLES.length];
    const company = scam ? null : COMPANIES[(i * 5 + 3) % COMPANIES.length];
    const companyName = scam ? scam.company : (company as CompanySpec).name;
    const fresh = i < 16;
    const hoursOld = fresh ? 1 + ((i * 37) % 22) : 26 + Math.floor(rand() * 9 * 24);
    const postedMs = nowMs - hoursOld * HOUR;
    const location = scam ? "Pune / Work from home" : (company as CompanySpec).location;
    const isRemote = /remote|work from home/i.test(location);
    const sources = scam
      ? ["naukri"]
      : company && company.ats && company.ats !== "generic"
        ? [company.ats]
        : isRemote
          ? REMOTE_BOARDS[i % REMOTE_BOARDS.length]
          : AGGREGATORS[i % AGGREGATORS.length];
    const title = scam ? scam.title : role.title;
    const dedupeKey = `${SEED_DEDUPE_PREFIX}${slugify(companyName)}:${slugify(title)}:${i}`;
    const id = uuidV5(`job:${dedupeKey}`);
    const domain = company?.domain ?? "jobs-board.example.com";
    jobs.push({
      id,
      dedupe_key: dedupeKey,
      sources,
      source_ids: Object.fromEntries(sources.map((s) => [s, `${s}-${1000 + i}`])) as Json,
      company_id: company ? companyId(company.name) : null,
      company_name: companyName,
      title,
      location,
      is_remote: isRemote,
      job_type: scam ? "internship" : role.type,
      description:
        `${companyName} is hiring for ${title}. You will work with ${role.skills.slice(0, 3).join(", ")} ` +
        `and ship production features with a small team. Looking for strong fundamentals in ${role.skills[0]} ` +
        `and curiosity about ${role.skills[role.skills.length - 1]}. (Sample listing from the dev seed.)`,
      apply_url: `https://careers.${domain}/jobs/${slugify(title)}-${i}`,
      posted_at: iso(postedMs),
      first_seen_at: iso(Math.min(nowMs, postedMs + 20 * 60_000)),
      last_seen_at: iso(nowMs - (i % 3) * HOUR),
      is_active: true,
      scam_risk: scam ? scam.risk : "none",
      scam_reasons: scam ? scam.reasons : [],
      embedding: null,
      raw: null,
      created_at: iso(Math.min(nowMs, postedMs + 20 * 60_000)),
    });
    meta.set(id, { role, hoursOld, scam, company });
  }

  // ---------------------------------------------------------------- matches (both profiles)
  const jobMatches: TablesInsert<"job_matches">[] = [];
  const matchesByProfile = new Map<string, { jobId: string; score: number; eligible: boolean; scam: boolean }[]>();

  for (const profile of PROFILES) {
    const profileId = ids[profile.slug];
    const list: { jobId: string; score: number; eligible: boolean; scam: boolean }[] = [];
    jobs.forEach((job, idx) => {
      const m = meta.get(job.id as string) as JobMeta;
      const relevant = profile.families.includes(m.role.family) || idx % 4 === 0;
      if (!relevant && !m.scam) return;
      const sc = scoreJob(profile, m.role, m.hoursOld);
      const isScam = m.scam?.risk === "high";
      const score = isScam ? 0 : m.scam ? Math.min(sc.score, 55) : sc.score;
      const eligible = !m.role.senior;
      const dayOffset = idx < 16 ? 0 : idx % 7;
      const createdMs = nowMs - dayOffset * DAY - ((idx * 53) % 600) * 60_000;
      const notified = !isScam && eligible && score >= 60 && m.hoursOld < 24;
      list.push({ jobId: job.id as string, score, eligible, scam: isScam });
      jobMatches.push({
        id: uuidV5(`match:${profile.slug}:${job.id}`),
        profile_id: profileId,
        job_id: job.id as string,
        similarity: Number((0.55 + (0.4 * score) / 100).toFixed(3)),
        score,
        rank_score: Number((score + (m.hoursOld < 24 ? 8 : 0)).toFixed(2)),
        breakdown: { skills: sc.skills, eligibility: sc.eligibility, freshness: sc.freshness },
        eligibility: m.role.senior
          ? [
              { label: "Requires 5+ years of experience", status: "fail" },
              { label: `${profile.grad_year} batch eligible`, status: "unknown" },
            ]
          : [
              { label: `${profile.grad_year} batch eligible`, status: "pass" },
              { label: "B.Tech/B.E. CS or related", status: "pass" },
              { label: "No active backlogs", status: "unknown" },
            ],
        missing_skills: sc.missing,
        reason: isScam
          ? "Blocked: flagged as high scam risk."
          : `${sc.skills}% of the required skills match this resume; ${m.hoursOld < 24 ? "posted within the last day" : "older posting"}.`,
        eligible,
        status: "new",
        notified_at: notified ? iso(createdMs + 5 * 60_000) : null,
        created_at: iso(createdMs),
      });
    });
    matchesByProfile.set(profile.slug, list);
  }

  // ---------------------------------------------------------------- applications (all six stages)
  const stagePlan: Record<ProfileSeed["slug"], Enums<"app_stage">[]> = {
    "user-01": ["saved", "saved", "saved", "applied", "applied", "applied", "oa", "oa", "interview", "interview", "offer", "rejected"],
    "user-02": ["saved", "saved", "applied", "applied", "applied", "oa", "interview", "offer", "rejected"],
  };
  const applications: TablesInsert<"applications">[] = [];
  const matchStatus = new Map<string, Enums<"match_status">>();

  for (const profile of PROFILES) {
    const profileId = ids[profile.slug];
    const candidates = (matchesByProfile.get(profile.slug) ?? [])
      .filter((m) => m.eligible && !m.scam && m.score >= 55)
      .sort((a, b) => b.score - a.score || a.jobId.localeCompare(b.jobId));
    const perStage = new Map<string, number>();
    stagePlan[profile.slug].forEach((stage, k) => {
      const pick = candidates[k * 2];
      if (!pick) return;
      const job = jobs.find((j) => j.id === pick.jobId) as TablesInsert<"jobs">;
      const position = perStage.get(stage) ?? 0;
      perStage.set(stage, position + 1);
      const appliedDaysAgo = (k * 3) % 7;
      const nextAction: { label: string | null; days: number } =
        stage === "applied"
          ? { label: "Follow up", days: 3 + (k % 4) }
          : stage === "oa"
            ? { label: "OA due", days: 1 + (k % 3) }
            : stage === "interview"
              ? { label: "Interview", days: 2 + (k % 5) }
              : stage === "offer"
                ? { label: "Offer", days: -3 }
                : { label: null, days: 0 };
      applications.push({
        id: uuidV5(`application:${profile.slug}:${pick.jobId}`),
        profile_id: profileId,
        job_id: pick.jobId,
        company_name: job.company_name,
        role: job.title,
        apply_url: job.apply_url,
        stage,
        position,
        applied_at: stage === "saved" ? null : dateOnly(nowMs - appliedDaysAgo * DAY),
        next_action_label: nextAction.label,
        next_action_at: nextAction.label ? dateOnly(nowMs + nextAction.days * DAY) : null,
        notes: stage === "interview" ? "System design round with a staff engineer." : null,
        created_at: iso(nowMs - (appliedDaysAgo + 1) * DAY),
        updated_at: iso(nowMs - appliedDaysAgo * DAY + 2 * HOUR),
      });
      matchStatus.set(`${profile.slug}:${pick.jobId}`, stage === "saved" ? "saved" : "applied");
    });
    // a few skipped matches
    (matchesByProfile.get(profile.slug) ?? []).forEach((m, n) => {
      if (n % 11 === 5 && !matchStatus.has(`${profile.slug}:${m.jobId}`)) matchStatus.set(`${profile.slug}:${m.jobId}`, "skipped");
    });
  }
  for (const m of jobMatches) {
    const slug = PROFILES.find((p) => ids[p.slug] === m.profile_id)?.slug;
    const status = slug ? matchStatus.get(`${slug}:${m.job_id}`) : undefined;
    if (status) m.status = status;
  }

  // ---------------------------------------------------------------- programs (8)
  const programSpecs: {
    name: string;
    organizer: string;
    category: Enums<"program_category">;
    url: string;
    description: string;
    deadlineIn: number;
    openedAgo: number;
  }[] = [
    { name: "Google Summer of Code", organizer: "Google Open Source Programs Office", category: "gsoc", url: "https://summerofcode.withgoogle.com/", description: "Open source mentorship for students and newcomers.", deadlineIn: 12, openedAgo: 70 },
    { name: "LFX Mentorship", organizer: "Linux Foundation / CNCF", category: "lfx", url: "https://lfx.linuxfoundation.org/tools/mentorship/", description: "Paid mentorships on cloud native and kernel projects.", deadlineIn: 28, openedAgo: 42 },
    { name: "MLH Fellowship", organizer: "Major League Hacking", category: "mlh", url: "https://fellowship.mlh.io/", description: "Remote fellowship working on open source projects.", deadlineIn: 42, openedAgo: 28 },
    { name: "Smart India Hackathon", organizer: "Ministry of Education & AICTE", category: "hackathon", url: "https://www.sih.gov.in/", description: "National hackathon with hardware and software problem statements.", deadlineIn: 64, openedAgo: 21 },
    { name: "HackWithInfy", organizer: "Infosys Campus Recruitment", category: "hackathon", url: "https://www.infosys.com/careers/hackwithinfy.html", description: "Coding marathon with direct specialist interview gate.", deadlineIn: 8, openedAgo: 50 },
    { name: "Flipkart GRiD", organizer: "Flipkart Engineering", category: "hackathon", url: "https://unstop.com/competitions/flipkart-grid", description: "Engineering challenge with pre-placement interview fast-track.", deadlineIn: 35, openedAgo: 30 },
    { name: "Amazon ML Summer School", organizer: "Amazon Science & Research", category: "off_campus", url: "https://amazon.jobs/en/landing_pages/mlsummerschool", description: "Machine learning summer school with applied scientists.", deadlineIn: 78, openedAgo: 10 },
    { name: "Microsoft Engage Mentorship", organizer: "Microsoft University Relations", category: "off_campus", url: "https://www.microsoft.com/en-in/campus/engage", description: "Mentorship programme with internship evaluation.", deadlineIn: 89, openedAgo: 5 },
  ];
  const programs: TablesInsert<"programs">[] = programSpecs.map((p) => ({
    id: uuidV5(`program:${p.url}`),
    name: p.name,
    organizer: p.organizer,
    category: p.category,
    url: p.url,
    description: p.description,
    opens_at: dateOnly(nowMs - p.openedAgo * DAY),
    deadline_at: dateOnly(nowMs + p.deadlineIn * DAY),
    source: SEED_PROGRAM_SOURCE,
  }));
  const programReminders: TablesInsert<"program_reminders">[] = [
    ...[0, 2, 4].map((n) => ({ profile_id: ids["user-01"], program_id: programs[n].id as string })),
    ...[0, 1].map((n) => ({ profile_id: ids["user-02"], program_id: programs[n].id as string })),
  ];

  // ---------------------------------------------------------------- watched companies
  const watchedSpecs: { name: string; open: number | null; fresh: number | null; minutesAgo: number | null; alerts: boolean }[] = [
    { name: "Razorpay", open: 3, fresh: 2, minutesAgo: 12, alerts: true },
    { name: "Zerodha", open: 2, fresh: 0, minutesAgo: 24, alerts: true },
    { name: "CRED", open: 4, fresh: 1, minutesAgo: 38, alerts: true },
    { name: "Postman", open: 1, fresh: 0, minutesAgo: 45, alerts: true },
    { name: "Stripe", open: 0, fresh: 0, minutesAgo: 52, alerts: false },
    { name: "Vercel", open: null, fresh: null, minutesAgo: null, alerts: true },
    { name: "Hugging Face", open: 8, fresh: 3, minutesAgo: 58, alerts: true },
  ];
  const watchedCompanies: TablesInsert<"watched_companies">[] = [];
  PROFILES.forEach((profile) => {
    const list = profile.slug === "user-01" ? watchedSpecs : watchedSpecs.slice(0, 5);
    list.forEach((w) =>
      watchedCompanies.push({
        profile_id: ids[profile.slug],
        company_id: companyId(w.name),
        instant_alerts: w.alerts,
        last_checked_at: w.minutesAgo === null ? null : iso(nowMs - w.minutesAgo * 60_000),
        last_open_count: w.open,
        last_new_count: w.fresh,
        last_error: null,
      }),
    );
  });

  // ---------------------------------------------------------------- scan runs
  const sources = [
    ["jobspy", 212, 31], ["adzuna", 120, 14], ["internshala", 96, 12], ["remoteok", 80, 6], ["remotive", 44, 3],
    ["himalayas", 38, 4], ["arbeitnow", 25, 2], ["weworkremotely", 30, 2], ["greenhouse", 150, 9],
    ["lever", 110, 7], ["ashby", 70, 5], ["workday", 0, 0], ["smartrecruiters", 18, 1], ["generic_careers", 12, 1],
  ] as const;
  const runSpecs: { key: string; kind: "full" | "watched"; startedAgo: number; status: "success" | "partial" }[] = [
    { key: "latest", kind: "full", startedAgo: 80, status: "partial" },
    { key: "watched-1", kind: "watched", startedAgo: 25, status: "success" },
    { key: "previous", kind: "full", startedAgo: 260, status: "success" },
  ];
  const scanRuns: TablesInsert<"scan_runs">[] = runSpecs.map((r) => ({
    id: uuidV5(`scan:${r.key}`),
    kind: r.kind,
    status: r.status,
    started_at: iso(nowMs - r.startedAgo * 60_000),
    finished_at: iso(nowMs - (r.startedAgo - 9) * 60_000),
    stats: { fetched: 1000, new_jobs: 85, scored: 40, alerts: 6 },
  }));
  const sourceRuns: TablesInsert<"source_runs">[] = [];
  runSpecs
    .filter((r) => r.kind === "full")
    .forEach((r) =>
      sources.forEach(([source, fetched, fresh]) =>
        sourceRuns.push({
          id: uuidV5(`source:${r.key}:${source}`),
          scan_run_id: uuidV5(`scan:${r.key}`),
          source,
          status: source === "workday" && r.key === "latest" ? "failed" : "success",
          fetched,
          new_jobs: fresh,
          error: source === "workday" && r.key === "latest" ? "HTTP 429 from tenant API (seed sample)" : null,
          finished_at: iso(nowMs - (r.startedAgo - 5) * 60_000),
        }),
      ),
    );

  return {
    companies,
    jobs,
    jobMatches,
    applications,
    programs,
    programReminders,
    watchedCompanies,
    scanRuns,
    sourceRuns,
    preferencePatches: {
      "user-01": { roles: PROFILES[0].roles, locations: PROFILES[0].locations, grad_year: PROFILES[0].grad_year, degree: PROFILES[0].degree, max_experience_years: 1 },
      "user-02": { roles: PROFILES[1].roles, locations: PROFILES[1].locations, grad_year: PROFILES[1].grad_year, degree: PROFILES[1].degree, max_experience_years: 1 },
    },
    profileColleges: { "user-01": PROFILES[0].college, "user-02": PROFILES[1].college },
  };
}
