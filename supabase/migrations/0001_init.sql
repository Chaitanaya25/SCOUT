-- SCOUT 0001_init: schema from ARCHITECTURE.md §4, RPCs, login_attempts, private storage buckets.
-- Every table has RLS enabled and NO policies: only the service role (server-side) can read/write.
-- Never edit this file after it has been applied; add a new migration instead.

create extension if not exists vector;
create extension if not exists pg_trgm;

-- ---------------------------------------------------------------- enums
create type job_type as enum ('internship', 'full_time', 'unknown');
create type scam_risk as enum ('none', 'low', 'high');
create type match_status as enum ('new', 'saved', 'skipped', 'applied');
create type app_stage as enum ('saved', 'applied', 'oa', 'interview', 'offer', 'rejected');
create type ats_type as enum ('greenhouse', 'lever', 'ashby', 'workday', 'smartrecruiters', 'generic');
create type program_category as enum ('gsoc', 'lfx', 'mlh', 'hackathon', 'off_campus', 'other');

-- ---------------------------------------------------------------- tables
create table profiles (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,                 -- 'user-01', 'user-02'
  display_name text not null,
  avatar_path text,                          -- storage: avatars/
  college text,                              -- used by referral helper
  created_at timestamptz not null default now()
);

create table resumes (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  file_path text not null,                   -- storage: resumes/
  raw_text text not null,
  parsed jsonb not null,                     -- ARCHITECTURE.md §8.2 schema
  skills text[] not null default '{}',
  embedding vector(768),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table preferences (
  profile_id uuid primary key references profiles(id) on delete cascade,
  roles text[] not null default '{}',        -- search terms, e.g. 'machine learning intern'
  locations text[] not null default '{}',    -- 'India', 'Bangalore', ...
  remote_ok boolean not null default true,
  job_types job_type[] not null default '{internship,full_time}',
  grad_year int,
  degree text,                               -- 'B.Tech CSE (Data Science)'
  max_experience_years int not null default 1,
  has_active_backlogs boolean,
  min_score int not null default 60,
  telegram_chat_id bigint,
  telegram_link_token text,
  telegram_link_expires_at timestamptz,
  telegram_linked_at timestamptz,
  created_at timestamptz not null default now()
);

create table companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  domain text,
  logo_url text,
  careers_url text,
  ats ats_type,
  ats_token text,                            -- board token / slug / workday tenant+site
  content_hash text,                         -- generic fallback change detection
  created_at timestamptz not null default now(),
  unique (ats, ats_token)
);

create table watched_companies (
  profile_id uuid not null references profiles(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  instant_alerts boolean not null default true,
  last_checked_at timestamptz,
  last_open_count int,
  last_new_count int,
  last_error text,
  created_at timestamptz not null default now(),
  primary key (profile_id, company_id)
);

create table jobs (
  id uuid primary key default gen_random_uuid(),
  dedupe_key text unique not null,
  sources text[] not null,                   -- ['greenhouse','linkedin']
  source_ids jsonb not null default '{}',    -- {source: source_job_id}
  company_id uuid references companies(id),
  company_name text not null,
  title text not null,
  location text,
  is_remote boolean not null default false,
  job_type job_type not null default 'unknown',
  description text,
  apply_url text not null,
  posted_at timestamptz,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  is_active boolean not null default true,
  scam_risk scam_risk not null default 'none',
  scam_reasons text[] not null default '{}',
  embedding vector(768),
  raw jsonb,
  created_at timestamptz not null default now()
);
create index jobs_embedding_idx on jobs using hnsw (embedding vector_cosine_ops);
create index jobs_posted_at_idx on jobs (posted_at desc);
create index jobs_title_trgm_idx on jobs using gin (title gin_trgm_ops);
create index jobs_company_id_idx on jobs (company_id);
create index jobs_active_first_seen_idx on jobs (is_active, first_seen_at desc);

create table job_matches (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  job_id uuid not null references jobs(id) on delete cascade,
  similarity real not null,
  score int,                                 -- null until Gemini-scored
  rank_score real,                           -- ARCHITECTURE.md §7.6
  breakdown jsonb,                           -- {skills, eligibility, freshness}
  eligibility jsonb,                         -- [{label, status:'pass'|'fail'|'unknown'}]
  missing_skills text[] not null default '{}',
  reason text,
  eligible boolean not null default true,
  status match_status not null default 'new',
  notified_at timestamptz,
  created_at timestamptz not null default now(),
  unique (profile_id, job_id)
);
create index job_matches_profile_status_idx on job_matches (profile_id, status);
create index job_matches_profile_score_idx on job_matches (profile_id, score desc nulls last);
create index job_matches_job_id_idx on job_matches (job_id);

create table applications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  job_id uuid references jobs(id) on delete set null,
  company_name text not null,
  role text not null,
  apply_url text,
  stage app_stage not null default 'saved',
  position int not null default 0,           -- order within column
  applied_at date,
  next_action_label text,                    -- 'Interview', 'Follow up', 'OA due'
  next_action_at date,
  reminder_sent_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, job_id)
);
create index applications_profile_stage_idx on applications (profile_id, stage, position);

create table tailored_outputs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  job_id uuid not null references jobs(id) on delete cascade,
  resume_id uuid not null references resumes(id) on delete cascade,
  bullets jsonb not null,                    -- string[3]
  cover_note text not null,
  ats_keywords text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (profile_id, job_id, resume_id)
);

create table programs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  organizer text,
  category program_category not null,
  url text not null unique,
  logo_url text,
  description text,
  opens_at date,
  deadline_at date not null,
  source text not null default 'seed',       -- 'seed' | 'mlh' | 'manual'
  created_at timestamptz not null default now()
);
create index programs_deadline_idx on programs (deadline_at);

create table program_reminders (
  profile_id uuid not null references profiles(id) on delete cascade,
  program_id uuid not null references programs(id) on delete cascade,
  sent_7d_at timestamptz,
  sent_1d_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (profile_id, program_id)
);

create table scan_runs (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('full', 'watched', 'manual')),
  status text not null default 'running' check (status in ('running', 'success', 'partial', 'failed')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  stats jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index scan_runs_started_idx on scan_runs (started_at desc);

create table source_runs (
  id uuid primary key default gen_random_uuid(),
  scan_run_id uuid not null references scan_runs(id) on delete cascade,
  source text not null,
  status text not null default 'running',
  fetched int not null default 0,
  new_jobs int not null default 0,
  error text,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);
create index source_runs_scan_idx on source_runs (scan_run_id);

create table llm_usage (                     -- quota guard
  day date not null,
  kind text not null,                        -- 'embed' | 'score' | 'parse' | 'tailor' | 'extract'
  requests int not null default 0,
  created_at timestamptz not null default now(),
  primary key (day, kind)
);

-- Login rate limiting (ARCHITECTURE.md §10.1): 5 failed attempts per IP per 15 minutes.
create table login_attempts (
  id bigint generated always as identity primary key,
  ip text not null,
  success boolean not null default false,
  created_at timestamptz not null default now()
);
create index login_attempts_ip_created_idx on login_attempts (ip, created_at desc);

-- ---------------------------------------------------------------- updated_at trigger
-- Bumps updated_at on every update, unless the statement set updated_at explicitly (seed/backfills).
create function set_updated_at() returns trigger
language plpgsql as $$
begin
  if new.updated_at is not distinct from old.updated_at then
    new.updated_at = now();
  end if;
  return new;
end;
$$;

create trigger applications_set_updated_at
before update on applications
for each row execute function set_updated_at();

-- ---------------------------------------------------------------- RLS: enabled everywhere, no policies
alter table profiles enable row level security;
alter table resumes enable row level security;
alter table preferences enable row level security;
alter table companies enable row level security;
alter table watched_companies enable row level security;
alter table jobs enable row level security;
alter table job_matches enable row level security;
alter table applications enable row level security;
alter table tailored_outputs enable row level security;
alter table programs enable row level security;
alter table program_reminders enable row level security;
alter table scan_runs enable row level security;
alter table source_runs enable row level security;
alter table llm_usage enable row level security;
alter table login_attempts enable row level security;

-- Belt and braces: the public API roles get no table privileges at all.
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

-- ---------------------------------------------------------------- RPCs (service role only)

-- Cosine neighbours among active jobs (drawer "similar" lookups).
create function similar_jobs(p_job_id uuid, p_k int default 5)
returns table (
  id uuid,
  company_name text,
  title text,
  location text,
  is_remote boolean,
  job_type job_type,
  posted_at timestamptz,
  apply_url text,
  similarity real
)
language sql stable
as $$
  select j.id, j.company_name, j.title, j.location, j.is_remote, j.job_type,
         j.posted_at, j.apply_url,
         (1 - (j.embedding <=> t.embedding))::real as similarity
  from jobs t
  join jobs j on j.id <> t.id
  where t.id = p_job_id
    and t.embedding is not null
    and j.embedding is not null
    and j.is_active
  order by j.embedding <=> t.embedding
  limit greatest(p_k, 0);
$$;

-- Unscored, active, non-high-scam jobs seen since p_since, ranked by similarity to the profile resume.
-- Jobs already marked ineligible / skipped for this profile (or already scored) are excluded.
create function match_candidates(
  p_profile uuid,
  p_embedding vector(768),
  p_since timestamptz,
  p_k int
)
returns table (job_id uuid, similarity real)
language sql stable
as $$
  select j.id as job_id,
         (1 - (j.embedding <=> p_embedding))::real as similarity
  from jobs j
  left join job_matches m on m.job_id = j.id and m.profile_id = p_profile
  where j.is_active
    and j.embedding is not null
    and j.scam_risk <> 'high'
    and coalesce(j.posted_at, j.first_seen_at) >= p_since
    and (m.id is null or (m.score is null and m.eligible and m.status <> 'skipped'))
  order by j.embedding <=> p_embedding
  limit greatest(p_k, 0);
$$;

-- Dashboard KPIs for one profile, plus 7-day series (oldest first, Asia/Kolkata days) for sparklines.
create function dashboard_kpis(p_profile uuid)
returns table (
  new_today int,
  fresh_24h int,
  applied_week int,
  interviews int,
  new_series int[],
  fresh_series int[],
  applied_series int[],
  interviews_series int[]
)
language sql stable
as $$
  with bounds as (
    select (now() at time zone 'Asia/Kolkata')::date as today
  ),
  days as (
    select generate_series(b.today - 6, b.today, interval '1 day')::date as d
    from bounds b
  ),
  mm as (
    select (m.created_at at time zone 'Asia/Kolkata')::date as created_day,
           coalesce(j.posted_at, j.first_seen_at) as posted_ts,
           (coalesce(j.posted_at, j.first_seen_at) at time zone 'Asia/Kolkata')::date as posted_day
    from job_matches m
    join jobs j on j.id = m.job_id
    where m.profile_id = p_profile
      and m.eligible
      and m.status <> 'skipped'
      and j.scam_risk <> 'high'
  ),
  aa as (
    select a.applied_at,
           a.stage,
           (a.updated_at at time zone 'Asia/Kolkata')::date as updated_day
    from applications a
    where a.profile_id = p_profile
  )
  select
    (select count(*) from mm where created_day = (select today from bounds))::int,
    (select count(*) from mm where posted_ts >= now() - interval '24 hours')::int,
    (select count(*) from aa where applied_at >= (select today from bounds) - 6)::int,
    (select count(*) from aa where stage = 'interview')::int,
    array(select (select count(*) from mm where mm.created_day = days.d)::int from days order by days.d),
    array(select (select count(*) from mm where mm.posted_day = days.d)::int from days order by days.d),
    array(select (select count(*) from aa where aa.applied_at = days.d)::int from days order by days.d),
    array(select (select count(*) from aa where aa.stage = 'interview' and aa.updated_day = days.d)::int from days order by days.d);
$$;

revoke all on function similar_jobs(uuid, int) from public, anon, authenticated;
revoke all on function match_candidates(uuid, vector, timestamptz, int) from public, anon, authenticated;
revoke all on function dashboard_kpis(uuid) from public, anon, authenticated;
grant execute on function similar_jobs(uuid, int) to service_role;
grant execute on function match_candidates(uuid, vector, timestamptz, int) to service_role;
grant execute on function dashboard_kpis(uuid) to service_role;

-- ---------------------------------------------------------------- Storage: private buckets
-- No storage.objects policies are created, so only the service role can read/write objects.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('resumes', 'resumes', false, 5242880,
   array['application/pdf', 'application/msword',
         'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('avatars', 'avatars', false, null, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
