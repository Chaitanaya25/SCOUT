-- SCOUT 0002: the two fixed profiles and their (empty) preferences rows. Idempotent.
-- Display names are placeholders; each person edits theirs in Settings -> Profile.

insert into profiles (slug, display_name)
values
  ('user-01', 'User 01'),
  ('user-02', 'User 02')
on conflict (slug) do nothing;

insert into preferences (profile_id)
select p.id
from profiles p
where p.slug in ('user-01', 'user-02')
on conflict (profile_id) do nothing;
