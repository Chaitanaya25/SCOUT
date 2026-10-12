/**
 * Hand-written from supabase/migrations/0001_init.sql (+ 0002, 0003).
 *
 * This file was NOT produced by the Supabase generator: no Supabase project or CLI was available
 * when it was written. Run `pnpm -C apps/web db:types` (needs SUPABASE_ACCESS_TOKEN) to replace it
 * with generated types once the migration is applied. Keep it in sync with the migrations until then.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Ins<Row, Required extends keyof Row> = Pick<Row, Required> & Partial<Omit<Row, Required>>;

export type JobType = "internship" | "full_time" | "unknown";
export type ScamRisk = "none" | "low" | "high";
export type MatchStatus = "new" | "saved" | "skipped" | "applied";
export type AppStage = "saved" | "applied" | "oa" | "interview" | "offer" | "rejected";
export type AtsType = "greenhouse" | "lever" | "ashby" | "workday" | "smartrecruiters" | "generic";
export type ProgramCategory = "gsoc" | "lfx" | "mlh" | "hackathon" | "off_campus" | "other";
export type ResumeParseStatus = "done" | "pending" | "failed";
export type CompanyAtsStatus = "ok" | "pending" | "error";

type ProfilesRow = {
  id: string;
  slug: string;
  display_name: string;
  avatar_path: string | null;
  college: string | null;
  created_at: string;
};

type ResumesRow = {
  id: string;
  profile_id: string;
  file_path: string;
  raw_text: string;
  parsed: Json;
  skills: string[];
  embedding: string | null;
  is_active: boolean;
  parse_status: ResumeParseStatus;
  created_at: string;
};

type PreferencesRow = {
  profile_id: string;
  roles: string[];
  locations: string[];
  remote_ok: boolean;
  job_types: JobType[];
  grad_year: number | null;
  degree: string | null;
  max_experience_years: number;
  has_active_backlogs: boolean | null;
  min_score: number;
  telegram_chat_id: number | null;
  telegram_link_token: string | null;
  telegram_link_expires_at: string | null;
  telegram_linked_at: string | null;
  created_at: string;
};

type CompaniesRow = {
  id: string;
  name: string;
  domain: string | null;
  logo_url: string | null;
  careers_url: string | null;
  ats: AtsType | null;
  ats_token: string | null;
  content_hash: string | null;
  ats_status: CompanyAtsStatus;
  last_error: string | null;
  created_at: string;
};

type WatchedCompaniesRow = {
  profile_id: string;
  company_id: string;
  instant_alerts: boolean;
  last_checked_at: string | null;
  last_open_count: number | null;
  last_new_count: number | null;
  last_error: string | null;
  notes: string | null;
  entry_route: string | null;
  created_at: string;
};

type JobsRow = {
  id: string;
  dedupe_key: string;
  sources: string[];
  source_ids: Json;
  company_id: string | null;
  company_name: string;
  title: string;
  location: string | null;
  is_remote: boolean;
  job_type: JobType;
  description: string | null;
  apply_url: string;
  posted_at: string | null;
  first_seen_at: string;
  last_seen_at: string;
  is_active: boolean;
  scam_risk: ScamRisk;
  scam_reasons: string[];
  embedding: string | null;
  raw: Json | null;
  created_at: string;
};

type JobMatchesRow = {
  id: string;
  profile_id: string;
  job_id: string;
  similarity: number;
  score: number | null;
  rank_score: number | null;
  breakdown: Json | null;
  eligibility: Json | null;
  missing_skills: string[];
  reason: string | null;
  eligible: boolean;
  status: MatchStatus;
  notified_at: string | null;
  created_at: string;
};

type ApplicationsRow = {
  id: string;
  profile_id: string;
  job_id: string | null;
  company_name: string;
  role: string;
  apply_url: string | null;
  stage: AppStage;
  position: number;
  applied_at: string | null;
  next_action_label: string | null;
  next_action_at: string | null;
  reminder_sent_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type TailoredOutputsRow = {
  id: string;
  profile_id: string;
  job_id: string;
  resume_id: string;
  bullets: Json;
  cover_note: string;
  ats_keywords: string[];
  created_at: string;
};

type ProgramsRow = {
  id: string;
  name: string;
  organizer: string | null;
  category: ProgramCategory;
  url: string;
  logo_url: string | null;
  description: string | null;
  opens_at: string | null;
  deadline_at: string;
  source: string;
  created_at: string;
};

type ProgramRemindersRow = {
  profile_id: string;
  program_id: string;
  sent_7d_at: string | null;
  sent_1d_at: string | null;
  created_at: string;
};

type ScanRunsRow = {
  id: string;
  kind: string;
  status: string;
  started_at: string;
  finished_at: string | null;
  stats: Json;
  created_at: string;
};

type SourceRunsRow = {
  id: string;
  scan_run_id: string;
  source: string;
  status: string;
  fetched: number;
  new_jobs: number;
  error: string | null;
  finished_at: string | null;
  created_at: string;
};

type LlmUsageRow = {
  day: string;
  kind: string;
  requests: number;
  created_at: string;
};

type LoginAttemptsRow = {
  id: number;
  ip: string;
  success: boolean;
  created_at: string;
};

type Rel = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne?: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

type Table<Row, Required extends keyof Row, Relationships extends Rel[] = []> = {
  Row: Row;
  Insert: Ins<Row, Required>;
  Update: Partial<Row>;
  Relationships: Relationships;
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<ProfilesRow, "slug" | "display_name">;
      resumes: Table<
        ResumesRow,
        "profile_id" | "file_path" | "raw_text" | "parsed",
        [
          {
            foreignKeyName: "resumes_profile_id_fkey";
            columns: ["profile_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ]
      >;
      preferences: Table<
        PreferencesRow,
        "profile_id",
        [
          {
            foreignKeyName: "preferences_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ]
      >;
      companies: Table<CompaniesRow, "name">;
      watched_companies: Table<
        WatchedCompaniesRow,
        "profile_id" | "company_id",
        [
          {
            foreignKeyName: "watched_companies_profile_id_fkey";
            columns: ["profile_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "watched_companies_company_id_fkey";
            columns: ["company_id"];
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ]
      >;
      jobs: Table<
        JobsRow,
        "dedupe_key" | "sources" | "company_name" | "title" | "apply_url",
        [
          {
            foreignKeyName: "jobs_company_id_fkey";
            columns: ["company_id"];
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ]
      >;
      job_matches: Table<
        JobMatchesRow,
        "profile_id" | "job_id" | "similarity",
        [
          {
            foreignKeyName: "job_matches_profile_id_fkey";
            columns: ["profile_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "job_matches_job_id_fkey";
            columns: ["job_id"];
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
        ]
      >;
      applications: Table<
        ApplicationsRow,
        "profile_id" | "company_name" | "role",
        [
          {
            foreignKeyName: "applications_profile_id_fkey";
            columns: ["profile_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "applications_job_id_fkey";
            columns: ["job_id"];
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
        ]
      >;
      tailored_outputs: Table<
        TailoredOutputsRow,
        "profile_id" | "job_id" | "resume_id" | "bullets" | "cover_note",
        [
          {
            foreignKeyName: "tailored_outputs_profile_id_fkey";
            columns: ["profile_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tailored_outputs_job_id_fkey";
            columns: ["job_id"];
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tailored_outputs_resume_id_fkey";
            columns: ["resume_id"];
            referencedRelation: "resumes";
            referencedColumns: ["id"];
          },
        ]
      >;
      programs: Table<ProgramsRow, "name" | "category" | "url" | "deadline_at">;
      program_reminders: Table<
        ProgramRemindersRow,
        "profile_id" | "program_id",
        [
          {
            foreignKeyName: "program_reminders_profile_id_fkey";
            columns: ["profile_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "program_reminders_program_id_fkey";
            columns: ["program_id"];
            referencedRelation: "programs";
            referencedColumns: ["id"];
          },
        ]
      >;
      scan_runs: Table<ScanRunsRow, "kind">;
      source_runs: Table<
        SourceRunsRow,
        "scan_run_id" | "source",
        [
          {
            foreignKeyName: "source_runs_scan_run_id_fkey";
            columns: ["scan_run_id"];
            referencedRelation: "scan_runs";
            referencedColumns: ["id"];
          },
        ]
      >;
      llm_usage: Table<LlmUsageRow, "day" | "kind">;
      login_attempts: Table<LoginAttemptsRow, "ip">;
    };
    Views: { [_ in never]: never };
    Functions: {
      similar_jobs: {
        Args: { p_job_id: string; p_k?: number };
        Returns: {
          id: string;
          company_name: string;
          title: string;
          location: string | null;
          is_remote: boolean;
          job_type: JobType;
          posted_at: string | null;
          apply_url: string;
          similarity: number;
        }[];
      };
      match_candidates: {
        Args: { p_profile: string; p_embedding: string; p_since: string; p_k: number };
        Returns: { job_id: string; similarity: number }[];
      };
      match_candidates_v2: {
        Args: { p_profile: string; p_embedding: string; p_since: string; p_k: number };
        Returns: { job_id: string; similarity: number }[];
      };
      dashboard_kpis: {
        Args: { p_profile: string };
        Returns: {
          new_today: number;
          fresh_24h: number;
          applied_week: number;
          interviews: number;
          new_series: number[];
          fresh_series: number[];
          applied_series: number[];
          interviews_series: number[];
        }[];
      };
    };
    Enums: {
      job_type: JobType;
      scam_risk: ScamRisk;
      match_status: MatchStatus;
      app_stage: AppStage;
      ats_type: AtsType;
      program_category: ProgramCategory;
    };
    CompositeTypes: { [_ in never]: never };
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
export type Enums<T extends keyof Database["public"]["Enums"]> = Database["public"]["Enums"][T];
