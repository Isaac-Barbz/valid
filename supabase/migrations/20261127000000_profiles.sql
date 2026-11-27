-- Valid: MySpace-style profiles
-- Profile customization (solid colors from a curated palette, font, banner,
-- song, mood/status, blurbs), friendships, Top 8, profile walls, presence,
-- and a storage bucket for banner images.
--
-- The color/background/font ids must match src/lib/profile-theme.ts.

-- ---------------------------------------------------------------------------
-- Profile fields
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column pronouns text check (char_length(pronouns) <= 20),
  add column location text check (char_length(location) <= 40),
  add column mood text check (char_length(mood) <= 40),
  add column status text check (char_length(status) <= 140),
  add column about_me text check (char_length(about_me) <= 2000),
  add column want_to_meet text check (char_length(want_to_meet) <= 1000),
  -- Object path inside the profile-media bucket; must sit in the owner's folder.
  add column banner_path text check (banner_path like id::text || '/%' and char_length(banner_path) <= 200),
  add column accent text not null default 'violet'
    check (accent in ('violet', 'rose', 'red', 'amber', 'green', 'teal', 'blue', 'ink')),
  add column background text not null default 'plain'
    check (background in ('plain', 'blush', 'mint', 'sky', 'butter', 'lilac', 'stone')),
  add column font text not null default 'sans'
    check (font in ('sans', 'display', 'serif', 'mono', 'rounded')),
  add column song_title text check (char_length(song_title) <= 80),
  add column song_artist text check (char_length(song_artist) <= 80),
  add column song_url text check (song_url ~ '^https://' and char_length(song_url) <= 500),
  add column last_seen_at timestamptz;

grant update (
  pronouns, location, mood, status, about_me, want_to_meet, banner_path,
  accent, background, font, song_title, song_artist, song_url
) on public.profiles to authenticated;

-- Presence: users can only stamp their own "last seen" time, and only to now.
create function public.touch_last_seen()
returns void
language sql
security definer
set search_path = ''
as $$
  update public.profiles set last_seen_at = now() where id = auth.uid();
$$;

revoke execute on function public.touch_last_seen() from public, anon;
grant execute on function public.touch_last_seen() to authenticated;

-- ---------------------------------------------------------------------------
-- Friendships
-- ---------------------------------------------------------------------------

create type public.friendship_status as enum ('pending', 'accepted');

create table public.friendships (
  requester_id uuid not null references public.profiles (id) on delete cascade,
  addressee_id uuid not null references public.profiles (id) on delete cascade,
  status public.friendship_status not null default 'pending',
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  primary key (requester_id, addressee_id),
  check (requester_id <> addressee_id)
);

-- One row per pair, whichever direction the request went.
create unique index friendships_pair_idx
  on public.friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id));
create index friendships_addressee_idx on public.friendships (addressee_id);

create function public.are_friends(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.friendships
    where status = 'accepted'
      and ((requester_id = a and addressee_id = b) or (requester_id = b and addressee_id = a))
  );
$$;

create function public.handle_friendship_accepted()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'accepted' and old.status = 'pending' then
    new.accepted_at := now();
  end if;
  return new;
end;
$$;

create trigger on_friendship_accepted
  before update on public.friendships
  for each row execute function public.handle_friendship_accepted();

-- ---------------------------------------------------------------------------
-- Top 8
-- ---------------------------------------------------------------------------

create table public.top_friends (
  user_id uuid not null references public.profiles (id) on delete cascade,
  position smallint not null check (position between 1 and 8),
  friend_id uuid not null references public.profiles (id) on delete cascade,
  primary key (user_id, position),
  unique (user_id, friend_id),
  check (user_id <> friend_id)
);

-- Unfriending someone takes them out of both Top 8s.
create function public.handle_friendship_removed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.top_friends
  where (user_id = old.requester_id and friend_id = old.addressee_id)
     or (user_id = old.addressee_id and friend_id = old.requester_id);
  return old;
end;
$$;

create trigger on_friendship_removed
  after delete on public.friendships
  for each row execute function public.handle_friendship_removed();

-- ---------------------------------------------------------------------------
-- Profile walls
-- ---------------------------------------------------------------------------

create table public.profile_comments (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index profile_comments_profile_idx on public.profile_comments (profile_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Privileges and Row Level Security
-- ---------------------------------------------------------------------------

alter table public.friendships enable row level security;
alter table public.top_friends enable row level security;
alter table public.profile_comments enable row level security;

revoke all on public.friendships, public.top_friends, public.profile_comments from anon, authenticated;
grant select on public.friendships, public.top_friends, public.profile_comments to anon, authenticated;
grant insert (requester_id, addressee_id) on public.friendships to authenticated;
grant update (status) on public.friendships to authenticated;
grant delete on public.friendships to authenticated;
grant insert (user_id, position, friend_id), update (position, friend_id), delete
  on public.top_friends to authenticated;
grant insert (profile_id, author_id, body), delete on public.profile_comments to authenticated;

-- Friendships: accepted ones are public (friend lists); pending requests are
-- visible only to the two people involved.
create policy "Friendships are visible"
  on public.friendships for select
  using (status = 'accepted' or auth.uid() in (requester_id, addressee_id));
create policy "Users send friend requests"
  on public.friendships for insert to authenticated
  with check (requester_id = auth.uid() and status = 'pending');
create policy "Recipients accept friend requests"
  on public.friendships for update to authenticated
  using (addressee_id = auth.uid() and status = 'pending')
  with check (addressee_id = auth.uid() and status = 'accepted');
create policy "Either side ends a friendship"
  on public.friendships for delete to authenticated
  using (auth.uid() in (requester_id, addressee_id));

-- Top 8: public; owners pick only from their accepted friends.
create policy "Top friends are public"
  on public.top_friends for select using (true);
create policy "Users add to their Top 8"
  on public.top_friends for insert to authenticated
  with check (user_id = auth.uid() and public.are_friends(user_id, friend_id));
create policy "Users reorder their Top 8"
  on public.top_friends for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and public.are_friends(user_id, friend_id));
create policy "Users remove from their Top 8"
  on public.top_friends for delete to authenticated
  using (user_id = auth.uid());

-- Walls: public to read; the owner and their friends can write; the author,
-- the wall's owner, or an admin can delete.
create policy "Walls are public"
  on public.profile_comments for select using (true);
create policy "Friends write on walls"
  on public.profile_comments for insert to authenticated
  with check (
    author_id = auth.uid()
    and (profile_id = auth.uid() or public.are_friends(author_id, profile_id))
  );
create policy "Authors and owners delete wall comments"
  on public.profile_comments for delete to authenticated
  using (auth.uid() in (author_id, profile_id) or public.is_admin());

-- ---------------------------------------------------------------------------
-- Storage: profile banners (public read, owner-only write, 2 MB images)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-media', 'profile-media', true, 2097152, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

create policy "Users upload their own profile media"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'profile-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users see their own profile media"
  on storage.objects for select to authenticated
  using (bucket_id = 'profile-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users replace their own profile media"
  on storage.objects for update to authenticated
  using (bucket_id = 'profile-media' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'profile-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users delete their own profile media"
  on storage.objects for delete to authenticated
  using (bucket_id = 'profile-media' and (storage.foldername(name))[1] = auth.uid()::text);
