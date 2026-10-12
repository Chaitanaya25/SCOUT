-- SCOUT 0003: resume parse status, watched-company notes, generic careers-page status, scoring order.
-- Additive and idempotent: safe to run once on a database that already has 0001 + 0002 applied.

-- ---------------------------------------------------------------- resumes: keep the text even when AI parsing fails
alter table resumes add column if not exists parse_status text not null default 'done';
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'resumes_parse_status_check') then
    alter table resumes add constraint resumes_parse_status_check check (parse_status in ('done', 'pending', 'failed'));
  end if;
end $$;
alter table resumes alter column parsed set default '{}'::jsonb;

-- ---------------------------------------------------------------- watched companies: per-profile notes from the CSV import
alter table watched_companies add column if not exists notes text;
alter table watched_companies add column if not exists entry_route text;

-- ---------------------------------------------------------------- companies: generic careers pages waiting for the worker
alter table companies add column if not exists ats_status text not null default 'ok';
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'companies_ats_status_check') then
    alter table companies add constraint companies_ats_status_check check (ats_status in ('ok', 'pending', 'error'));
  end if;
end $$;
alter table companies add column if not exists last_error text;
-- One generic company per careers URL (ATS companies are already unique on (ats, ats_token)).
create unique index if not exists companies_generic_careers_url on companies (careers_url) where ats = 'generic';

-- ---------------------------------------------------------------- feed ordering
create index if not exists job_matches_profile_rank on job_matches (profile_id, rank_score desc nulls last);

-- ---------------------------------------------------------------- scoring order: newest first, then most similar
-- Same filter as match_candidates; used by the worker so unscored eligible jobs get scored in later scans,
-- newest days first and the most similar within a day, until the daily soft cap is reached.
create or replace function match_candidates_v2(
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
  order by (coalesce(j.posted_at, j.first_seen_at) at time zone 'Asia/Kolkata')::date desc,
           j.embedding <=> p_embedding
  limit greatest(p_k, 0);
$$;
revoke all on function match_candidates_v2(uuid, vector, timestamptz, int) from public, anon, authenticated;
grant execute on function match_candidates_v2(uuid, vector, timestamptz, int) to service_role;
