-- Valid: v/thestreets, hashtags, claimed tags + cross-listing, home
-- community, and block-based "Your space" layouts.
--
-- Keep street_rank() in sync with streetRank() in src/lib/ranking.ts, and
-- the layout checks in sync with src/lib/profile-layout-schema.ts.

-- ---------------------------------------------------------------------------
-- The default open community
-- ---------------------------------------------------------------------------

insert into public.communities (slug, name, description)
values ('thestreets', 'The Streets', 'Any drop can land here. Tag it and the right communities will find it.')
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Hashtags on drops
-- ---------------------------------------------------------------------------

create table public.post_tags (
  post_id uuid not null references public.posts (id) on delete cascade,
  tag text not null check (tag ~ '^[a-z0-9_]{2,32}$'),
  primary key (post_id, tag)
);

create index post_tags_tag_idx on public.post_tags (tag);

-- At most 10 tags per drop.
create function public.limit_post_tags()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select count(*) from public.post_tags where post_id = new.post_id) >= 10 then
    raise exception 'too many tags';
  end if;
  return new;
end;
$$;

create trigger post_tags_limit
  before insert on public.post_tags
  for each row execute function public.limit_post_tags();

-- Authorship check without exposing posts.author_id to clients.
create function public.is_post_author(target_post uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.posts where id = target_post and author_id = auth.uid());
$$;

-- ---------------------------------------------------------------------------
-- Communities claim tags; drops get cross-listed into communities
-- ---------------------------------------------------------------------------

create table public.community_tags (
  community_id uuid not null references public.communities (id) on delete cascade,
  tag text not null check (tag ~ '^[a-z0-9_]{2,32}$'),
  added_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (community_id, tag)
);

create index community_tags_tag_idx on public.community_tags (tag);

create type public.listing_status as enum ('accepted', 'dismissed');
create type public.listing_source as enum ('author', 'moderator');

-- A drop shown in a community other than the one it was posted to.
-- 'author': "also drop it in v/x" when posting. 'moderator': a mod accepted
-- (or dismissed) it from the community's Suggested queue.
create table public.community_listings (
  community_id uuid not null references public.communities (id) on delete cascade,
  post_id uuid not null references public.posts (id) on delete cascade,
  status public.listing_status not null,
  source public.listing_source not null,
  decided_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (community_id, post_id)
);

create index community_listings_post_idx on public.community_listings (post_id);

create function public.post_community(target_post uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select community_id from public.posts where id = target_post;
$$;

-- Authors may cross-list a drop into at most 3 extra communities.
create function public.limit_author_listings()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.source = 'author' and (
    select count(*) from public.community_listings where post_id = new.post_id and source = 'author'
  ) >= 3 then
    raise exception 'too many communities';
  end if;
  return new;
end;
$$;

create trigger community_listings_limit
  before insert on public.community_listings
  for each row execute function public.limit_author_listings();

-- ---------------------------------------------------------------------------
-- Ranking for v/thestreets: untagged and low-engagement drops sink.
-- ---------------------------------------------------------------------------

create function public.street_rank(score integer, comment_count integer, tag_count integer, created_at timestamptz)
returns double precision
language sql
immutable
as $$
  select public.hot_rank(score, created_at)
    - case when tag_count = 0 then 1.0 else 0.0 end
    - case when score + comment_count < 3 then 0.5 else 0.0 end;
$$;

-- post_feed gains tags and street_rank (columns appended; existing ones unchanged).
create or replace view public.post_feed as
select
  p.id,
  p.community_id,
  c.slug as community_slug,
  c.name as community_name,
  case when p.is_anonymous then null else p.author_id end as author_id,
  case when p.is_anonymous then null else pr.username end as author_username,
  p.is_anonymous,
  p.title,
  p.body,
  p.score,
  p.comment_count,
  p.created_at,
  p.edited_at,
  public.hot_rank(p.score, p.created_at) as hot_rank,
  coalesce(t.tags, '{}') as tags,
  public.street_rank(p.score, p.comment_count, coalesce(cardinality(t.tags), 0), p.created_at) as street_rank
from public.posts p
join public.communities c on c.id = p.community_id
join public.profiles pr on pr.id = p.author_id
left join lateral (
  select array_agg(pt.tag order by pt.tag) as tags from public.post_tags pt where pt.post_id = p.id
) t on true
where p.removed_at is null;

-- Tags on drops from the last 7 days, most used first.
create view public.trending_tags as
select pt.tag, count(*)::integer as drop_count, sum(greatest(p.score, 0))::integer as score
from public.post_tags pt
join public.posts p on p.id = pt.post_id
where p.removed_at is null and p.created_at > now() - interval '7 days'
group by pt.tag
order by count(*) desc, sum(greatest(p.score, 0)) desc
limit 20;

-- ---------------------------------------------------------------------------
-- Profiles: home community and block layout
-- ---------------------------------------------------------------------------

-- Validates the JSON layout written by the "Customize your space" editor.
create function public.is_valid_layout(layout jsonb)
returns boolean
language sql
immutable
as $$
  select jsonb_typeof(layout) = 'object'
    and pg_column_size(layout) <= 16384
    and coalesce(jsonb_typeof(layout -> 'blocks') = 'array' and jsonb_array_length(layout -> 'blocks') <= 12, true)
    and coalesce(jsonb_typeof(layout -> 'links') = 'array' and jsonb_array_length(layout -> 'links') <= 6, true)
    and coalesce(jsonb_typeof(layout -> 'photos') = 'array' and jsonb_array_length(layout -> 'photos') <= 9, true)
    -- Colors are plain hex (no gradients, no CSS).
    and coalesce((
      select bool_and(value ~ '^#[0-9a-f]{6}$')
      from jsonb_each_text(case when jsonb_typeof(layout -> 'colors') = 'object' then layout -> 'colors' else '{}'::jsonb end)
    ), true)
    -- Links are https only.
    and coalesce((
      select bool_and(link ->> 'url' ~ '^https://')
      from jsonb_array_elements(case when jsonb_typeof(layout -> 'links') = 'array' then layout -> 'links' else '[]'::jsonb end) link
    ), true);
$$;

-- Every image path in the layout must sit in the owner's storage folder.
create function public.layout_paths_owned(layout jsonb, owner uuid)
returns boolean
language sql
immutable
as $$
  select coalesce((
      select bool_and(path like owner::text || '/%')
      from jsonb_array_elements_text(
        case when jsonb_typeof(layout -> 'photos') = 'array' then layout -> 'photos' else '[]'::jsonb end
      ) path
    ), true)
    and coalesce(layout #>> '{backdrop,photoPath}' like owner::text || '/%', true);
$$;

-- The palette-id columns from the previous migration are replaced by the
-- layout's free colors (with contrast checks in the app).
alter table public.profiles
  drop column accent,
  drop column background,
  drop column font,
  add column home_community_id uuid references public.communities (id) on delete set null,
  add column layout jsonb not null default '{}'::jsonb;

alter table public.profiles
  add constraint profiles_layout_valid check (public.is_valid_layout(layout) and public.layout_paths_owned(layout, id));

grant update (home_community_id, layout) on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- Privileges and Row Level Security
-- ---------------------------------------------------------------------------

alter table public.post_tags enable row level security;
alter table public.community_tags enable row level security;
alter table public.community_listings enable row level security;

revoke all on public.post_tags, public.community_tags, public.community_listings from anon, authenticated;
grant select on public.post_tags, public.community_tags, public.community_listings to anon, authenticated;
grant select on public.trending_tags to anon, authenticated;
grant insert (post_id, tag), delete on public.post_tags to authenticated;
grant insert (community_id, tag, added_by), delete on public.community_tags to authenticated;
grant insert (community_id, post_id, status, source, decided_by), delete on public.community_listings to authenticated;
grant update (status, decided_by) on public.community_listings to authenticated;

-- Tags: readable while the drop is up; only the drop's author tags it.
create policy "Tags on live drops are public"
  on public.post_tags for select using (public.post_is_open(post_id));
create policy "Authors tag their drops"
  on public.post_tags for insert to authenticated with check (public.is_post_author(post_id));
create policy "Authors untag their drops"
  on public.post_tags for delete to authenticated using (public.is_post_author(post_id));

-- Claimed tags: public; only that community's moderators manage them.
create policy "Claimed tags are public"
  on public.community_tags for select using (true);
create policy "Moderators claim tags"
  on public.community_tags for insert to authenticated
  with check (public.is_moderator(community_id) and added_by = auth.uid());
create policy "Moderators release tags"
  on public.community_tags for delete to authenticated using (public.is_moderator(community_id));

-- Listings: public. Authors may add their own drop to another community
-- ("also drop it in"); only moderators accept or dismiss suggestions.
create policy "Listings are public"
  on public.community_listings for select using (true);
create policy "Authors cross-list their drops"
  on public.community_listings for insert to authenticated
  with check (
    source = 'author' and status = 'accepted' and decided_by is null
    and public.is_post_author(post_id)
    and public.post_community(post_id) <> community_id
  );
create policy "Moderators decide suggestions"
  on public.community_listings for insert to authenticated
  with check (
    source = 'moderator' and decided_by = auth.uid()
    and public.is_moderator(community_id)
    and public.post_community(post_id) <> community_id
  );
create policy "Moderators change decisions"
  on public.community_listings for update to authenticated
  using (public.is_moderator(community_id))
  with check (public.is_moderator(community_id) and decided_by = auth.uid());
create policy "Moderators and authors remove listings"
  on public.community_listings for delete to authenticated
  using (public.is_moderator(community_id) or (source = 'author' and public.is_post_author(post_id)));
