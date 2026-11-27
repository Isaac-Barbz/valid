-- Valid: foundation schema
-- Profiles, communities, memberships, posts, threaded comments, votes, reports.
--
-- Anonymity model: posts.author_id / comments.author_id are always set, but the
-- base tables are NOT readable by clients. Public reads go through the
-- post_feed / comment_feed views, which hide the author of anonymous content.
-- Moderators resolve an anonymous author with moderation_author().

create extension if not exists citext;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username citext not null unique
    check (username ~ '^[A-Za-z0-9_]{3,24}$'),
  display_name text check (char_length(display_name) <= 50),
  avatar_url text,
  bio text check (char_length(bio) <= 300),
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- Create a profile for every new auth user. The username comes from sign-up
-- metadata when present, otherwise a unique placeholder the user can change.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'username',
      'user_' || substr(replace(new.id::text, '-', ''), 1, 12)
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Communities and memberships
-- ---------------------------------------------------------------------------

create table public.communities (
  id uuid primary key default gen_random_uuid(),
  slug citext not null unique check (slug ~ '^[a-z0-9_]{3,24}$'),
  name text not null check (char_length(name) between 1 and 50),
  description text not null default '' check (char_length(description) <= 500),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create type public.member_role as enum ('member', 'moderator', 'owner');

create table public.community_members (
  community_id uuid not null references public.communities (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.member_role not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (community_id, user_id)
);

create index community_members_user_idx on public.community_members (user_id);

-- The creator of a community becomes its owner.
create function public.handle_new_community()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.created_by is not null then
    insert into public.community_members (community_id, user_id, role)
    values (new.id, new.created_by, 'owner');
  end if;
  return new;
end;
$$;

create trigger on_community_created
  after insert on public.communities
  for each row execute function public.handle_new_community();

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

create function public.is_moderator(target_community uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_admin() or exists (
    select 1
    from public.community_members
    where community_id = target_community
      and user_id = auth.uid()
      and role in ('moderator', 'owner')
  );
$$;

-- ---------------------------------------------------------------------------
-- Posts and comments
-- ---------------------------------------------------------------------------

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 300),
  body text not null default '' check (char_length(body) <= 40000),
  is_anonymous boolean not null default false,
  score integer not null default 0,
  comment_count integer not null default 0,
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  removed_at timestamptz
);

create index posts_community_created_idx on public.posts (community_id, created_at desc);
create index posts_created_idx on public.posts (created_at desc);
create index posts_score_idx on public.posts (score desc);
create index posts_author_idx on public.posts (author_id);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  parent_id uuid references public.comments (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 10000),
  is_anonymous boolean not null default false,
  score integer not null default 0,
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  removed_at timestamptz
);

create index comments_post_idx on public.comments (post_id, created_at);
create index comments_parent_idx on public.comments (parent_id);
create index comments_author_idx on public.comments (author_id);

-- A reply must belong to the same post as its parent.
create function public.check_comment_parent()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.parent_id is not null and not exists (
    select 1 from public.comments
    where id = new.parent_id and post_id = new.post_id
  ) then
    raise exception 'parent comment belongs to a different post';
  end if;
  return new;
end;
$$;

create trigger comments_check_parent
  before insert on public.comments
  for each row execute function public.check_comment_parent();

-- Keep posts.comment_count in sync.
create function public.sync_comment_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set comment_count = comment_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update public.posts set comment_count = greatest(comment_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end;
$$;

create trigger comments_sync_count
  after insert or delete on public.comments
  for each row execute function public.sync_comment_count();

-- ---------------------------------------------------------------------------
-- Votes
-- ---------------------------------------------------------------------------

create table public.post_votes (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table public.comment_votes (
  comment_id uuid not null references public.comments (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

create index post_votes_user_idx on public.post_votes (user_id);
create index comment_votes_user_idx on public.comment_votes (user_id);

-- Keep the cached score on posts/comments in sync with their votes.
create function public.sync_post_score()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.posts
  set score = score + coalesce(
    case tg_op when 'DELETE' then 0 else new.value end, 0
  ) - coalesce(
    case tg_op when 'INSERT' then 0 else old.value end, 0
  )
  where id = coalesce(new.post_id, old.post_id);
  return null;
end;
$$;

create trigger post_votes_sync_score
  after insert or update or delete on public.post_votes
  for each row execute function public.sync_post_score();

create function public.sync_comment_score()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.comments
  set score = score + coalesce(
    case tg_op when 'DELETE' then 0 else new.value end, 0
  ) - coalesce(
    case tg_op when 'INSERT' then 0 else old.value end, 0
  )
  where id = coalesce(new.comment_id, old.comment_id);
  return null;
end;
$$;

create trigger comment_votes_sync_score
  after insert or update or delete on public.comment_votes
  for each row execute function public.sync_comment_score();

-- ---------------------------------------------------------------------------
-- Reports
-- ---------------------------------------------------------------------------

create type public.report_reason as enum (
  'spam', 'harassment', 'hate', 'violence', 'sexual_content', 'illegal', 'other'
);

create type public.report_status as enum ('open', 'actioned', 'dismissed');

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  post_id uuid references public.posts (id) on delete cascade,
  comment_id uuid references public.comments (id) on delete cascade,
  reason public.report_reason not null,
  details text not null default '' check (char_length(details) <= 1000),
  status public.report_status not null default 'open',
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references public.profiles (id) on delete set null,
  check (num_nonnulls(post_id, comment_id) = 1)
);

create index reports_status_idx on public.reports (status, created_at desc);

-- ---------------------------------------------------------------------------
-- Ranking
-- ---------------------------------------------------------------------------

-- "Hot" rank: log-scaled score plus a time bonus, so new posts with a few votes
-- can beat old posts with many. Mirrors hotRank() in src/lib/ranking.ts.
create function public.hot_rank(score integer, created_at timestamptz)
returns double precision
language sql
immutable
as $$
  select sign(score) * log(greatest(abs(score), 1))
    + extract(epoch from created_at) / 45000.0;
$$;

-- ---------------------------------------------------------------------------
-- Public read views (hide anonymous authors, skip removed content)
-- ---------------------------------------------------------------------------

-- These views run with the owner's privileges on purpose: clients cannot read
-- the base tables, so the views are the only public window onto them.
create view public.post_feed as
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
  public.hot_rank(p.score, p.created_at) as hot_rank
from public.posts p
join public.communities c on c.id = p.community_id
join public.profiles pr on pr.id = p.author_id
where p.removed_at is null;

create view public.comment_feed as
select
  cm.id,
  cm.post_id,
  cm.parent_id,
  case when cm.is_anonymous then null else cm.author_id end as author_id,
  case when cm.is_anonymous then null else pr.username end as author_username,
  cm.is_anonymous,
  case when cm.removed_at is null then cm.body else '' end as body,
  cm.removed_at is not null as is_removed,
  cm.score,
  cm.created_at,
  cm.edited_at
from public.comments cm
join public.posts p on p.id = cm.post_id
join public.profiles pr on pr.id = cm.author_id
where p.removed_at is null;

-- Moderators (of the content's community) and admins can see who wrote it.
create function public.moderation_author(target_post uuid default null, target_comment uuid default null)
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  found_community uuid;
  found_author uuid;
begin
  if target_post is not null then
    select community_id, author_id into found_community, found_author
    from public.posts where id = target_post;
  elsif target_comment is not null then
    select p.community_id, cm.author_id into found_community, found_author
    from public.comments cm join public.posts p on p.id = cm.post_id
    where cm.id = target_comment;
  end if;

  if found_community is null or not public.is_moderator(found_community) then
    raise exception 'not allowed';
  end if;

  return found_author;
end;
$$;

-- Moderators (of the content's community) and admins remove content.
create function public.remove_content(target_post uuid default null, target_comment uuid default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  found_community uuid;
begin
  if target_post is not null then
    select community_id into found_community from public.posts where id = target_post;
  elsif target_comment is not null then
    select p.community_id into found_community
    from public.comments cm join public.posts p on p.id = cm.post_id
    where cm.id = target_comment;
  end if;

  if found_community is null or not public.is_moderator(found_community) then
    raise exception 'not allowed';
  end if;

  if target_post is not null then
    update public.posts set removed_at = now() where id = target_post;
  else
    update public.comments set removed_at = now() where id = target_comment;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Privileges and Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.communities enable row level security;
alter table public.community_members enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.post_votes enable row level security;
alter table public.comment_votes enable row level security;
alter table public.reports enable row level security;

-- Base content tables: no client reads at all (author_id must stay private).
-- Writes are allowed and constrained by the policies below.
revoke all on public.posts, public.comments from anon, authenticated;
grant insert (id, community_id, author_id, title, body, is_anonymous)
  on public.posts to authenticated;
grant insert (id, post_id, parent_id, author_id, body, is_anonymous)
  on public.comments to authenticated;
grant update (title, body, edited_at) on public.posts to authenticated;
grant update (body, edited_at) on public.comments to authenticated;

grant select on public.post_feed, public.comment_feed to anon, authenticated;

-- Profiles
create policy "Profiles are public"
  on public.profiles for select using (true);
create policy "Users update their own profile"
  on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());
revoke update on public.profiles from anon, authenticated;
grant update (username, display_name, avatar_url, bio) on public.profiles to authenticated;

-- Communities
create policy "Communities are public"
  on public.communities for select using (true);
create policy "Signed-in users create communities"
  on public.communities for insert to authenticated
  with check (created_by = auth.uid());
create policy "Moderators update their community"
  on public.communities for update to authenticated
  using (public.is_moderator(id))
  with check (public.is_moderator(id));

-- Memberships
create policy "Memberships are public"
  on public.community_members for select using (true);
create policy "Users join as members"
  on public.community_members for insert to authenticated
  with check (user_id = auth.uid() and role = 'member');
create policy "Users leave; moderators remove"
  on public.community_members for delete to authenticated
  using (user_id = auth.uid() or public.is_moderator(community_id));

-- Posts
create policy "Users post as themselves"
  on public.posts for insert to authenticated
  with check (author_id = auth.uid());
create policy "Authors edit their posts"
  on public.posts for update to authenticated
  using (author_id = auth.uid() and removed_at is null)
  with check (author_id = auth.uid());

-- Comments
create function public.post_is_open(target_post uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.posts where id = target_post and removed_at is null
  );
$$;

create policy "Users comment as themselves"
  on public.comments for insert to authenticated
  with check (
    author_id = auth.uid()
    and public.post_is_open(post_id)
  );
create policy "Authors edit their comments"
  on public.comments for update to authenticated
  using (author_id = auth.uid() and removed_at is null)
  with check (author_id = auth.uid());

-- Votes: users see and manage only their own.
create policy "Users read their post votes"
  on public.post_votes for select to authenticated using (user_id = auth.uid());
create policy "Users cast post votes"
  on public.post_votes for insert to authenticated with check (user_id = auth.uid());
create policy "Users change post votes"
  on public.post_votes for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Users remove post votes"
  on public.post_votes for delete to authenticated using (user_id = auth.uid());

create policy "Users read their comment votes"
  on public.comment_votes for select to authenticated using (user_id = auth.uid());
create policy "Users cast comment votes"
  on public.comment_votes for insert to authenticated with check (user_id = auth.uid());
create policy "Users change comment votes"
  on public.comment_votes for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Users remove comment votes"
  on public.comment_votes for delete to authenticated using (user_id = auth.uid());

-- Reports: anyone signed in can report; only moderators of the content's
-- community (or admins) can read and resolve them.
create function public.report_community(target_post uuid, target_comment uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select community_id from public.posts where id = target_post),
    (select p.community_id from public.comments cm
       join public.posts p on p.id = cm.post_id
      where cm.id = target_comment)
  );
$$;

create policy "Users file reports"
  on public.reports for insert to authenticated
  with check (reporter_id = auth.uid() and status = 'open');
create policy "Moderators read reports"
  on public.reports for select to authenticated
  using (public.is_moderator(public.report_community(post_id, comment_id)));
create policy "Moderators resolve reports"
  on public.reports for update to authenticated
  using (public.is_moderator(public.report_community(post_id, comment_id)))
  with check (public.is_moderator(public.report_community(post_id, comment_id)));
revoke update on public.reports from anon, authenticated;
grant update (status, resolved_at, resolved_by) on public.reports to authenticated;

revoke execute on function public.moderation_author(uuid, uuid) from public, anon;
revoke execute on function public.remove_content(uuid, uuid) from public, anon;
grant execute on function public.moderation_author(uuid, uuid) to authenticated;
grant execute on function public.remove_content(uuid, uuid) to authenticated;
