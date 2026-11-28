-- Preference for the feed shortcut row (v/thestreets plus communities the
-- person has joined). Defaults to on; only the owner can change their own row.
alter table public.profiles
  add column show_community_row boolean not null default true;

grant update (show_community_row) on public.profiles to authenticated;

comment on column public.profiles.show_community_row is
  'When true, the feed shows shortcuts for v/thestreets and communities the person has joined.';
