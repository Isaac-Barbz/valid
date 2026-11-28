# Valid

A modern, open forum and social site: communities on any topic, posts, threaded
comments, and voting. Everyone has an account, and every post or comment can be
made **anonymously**: it shows as "Anonymous" publicly while the author stays
known to moderators.

> "Valid" is the working name and may change.

## Budget: $0

This project runs entirely on free tiers for as long as possible:
**GitHub Free, Vercel Hobby, Supabase Free**. No paid services, paid add-ons,
or custom domain (the site lives on its `*.vercel.app` address). Anything that
would add a cost needs the owner's sign-off first. See the free-tier rules in
[AGENTS.md](./AGENTS.md#budget-0-free-tiers-only).

## Stack

- [Next.js 16](https://nextjs.org) (App Router, Cache Components) + TypeScript (strict)
- Tailwind CSS v4 with design tokens in `src/app/globals.css`
- Supabase: Postgres, Auth, (later) Storage and Realtime
- Hosted on Vercel

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
```

With no environment variables set, the app runs in **demo mode**: it reads
seed data from `src/lib/data/mock.ts`, votes only change on screen, and
posting, commenting, reporting, and sign-in show a demo notice.

## Environment variables

Copy `.env.example` to `.env.local` (and add the same values in Vercel →
Project → Settings → Environment Variables).

| Variable                               | Where to find it                                 |
| -------------------------------------- | ------------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`             | Supabase → Project Settings → API → Project URL   |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → Project Settings → API Keys → publishable key (the legacy `anon` key also works) |

Both are safe to expose in the browser; Row Level Security decides what each
user may read and write. Never add the `service_role`/secret key to this app.

## Supabase setup (free plan)

1. Create a free project at [supabase.com](https://supabase.com).
2. In the SQL editor, run the files in `supabase/migrations/` in order
   (`20261126000000_foundation.sql`, `20261127000000_profiles.sql`,
   `20261128000000_streets_tags_spaces.sql`,
   `20261129000000_community_row.sql`),
   then `supabase/seed.sql` for the starter communities. (Or with the Supabase
   CLI: `supabase link` then `supabase db push`.)
3. Auth → URL Configuration: set the Site URL to the Vercel URL and add
   `https://<your-app>.vercel.app/auth/callback` (and
   `http://localhost:3000/auth/callback`) to the redirect URLs.
4. Optional: Auth → Providers → Google, for "Continue with Google" (free; needs
   a Google Cloud OAuth client).
5. Set the two environment variables above.

Free-plan notes: Supabase Storage's free plan includes 1 GB, plenty for
WebP banners and space photos at a few hundred KB each (up to 9 photos plus a
banner and a background per person). The built-in email sender is rate-limited (a few emails per
hour), which is fine for testing; free projects pause after a week without
activity and can be resumed from the dashboard.

## Data model

`supabase/migrations/` holds the schema: profiles, communities, memberships,
posts and threaded comments (each with `is_anonymous`), post/comment votes,
and reports, all with Row Level Security.

- Clients can never read `posts`/`comments` directly. Public reads go through
  the `post_feed` and `comment_feed` views, which blank the author of anonymous
  content and skip removed content.
- Moderators of a community (and site admins) can call
  `moderation_author()` to see who wrote anonymous content, and
  `remove_content()` to take it down.
- Scores and comment counts are kept in sync by triggers; users cannot write
  them.
- Profiles carry the MySpace-style fields (mood, status, blurbs, song, banner
  path), a `home_community_id`, and `layout`: validated JSON (checked by
  `is_valid_layout()` and `layout_paths_owned()`) with the block order,
  colors, font, card shape/style, background, links, photos, pinned drop, and
  now playing. `friendships` holds requests and
  accepted friends (one row per pair), `top_friends` the ordered Top 8 (only
  accepted friends), and `profile_comments` each person's wall (the owner and
  their friends can write). Banners live in the public `profile-media`
  storage bucket under each user's own folder (2 MB max, resized to WebP in
  the browser first). `touch_last_seen()` powers "Online now".
- **v/thestreets** is the default open community. Drops carry `post_tags`
  (lowercase, max 10, only the author tags). Communities claim tags in
  `community_tags` (moderators only); `community_listings` cross-lists a drop
  into other communities: authors can "also drop it in" up to 3, moderators
  accept or dismiss v/thestreets drops that match their claimed tags (the
  Suggested queue). `post_feed` exposes `tags` and `street_rank` (hot rank
  with untagged and low-engagement drops lower); `trending_tags` covers the
  last 7 days.
- Personal look (theme, feed density, accent) is per device in
  `localStorage` (`valid-look`), applied by an inline script before first
  paint. Dark is the default.
- The feed shortcut row shows v/thestreets, then communities the person has
  joined, then "Find communities" (`/v`). It can be hidden from Settings
  (`profiles.show_community_row` for signed-in users; `localStorage` for
  demo and signed-out).

## Scripts

| Command             | What it does                               |
| ------------------- | ------------------------------------------ |
| `npm run dev`       | Local dev server                           |
| `npm run typecheck` | Generates route types, then `tsc --noEmit` |
| `npm run lint`      | ESLint (Next.js core-web-vitals + TS)      |
| `npm run build`     | Production build                           |
| `npm run check`     | All three, in order. Run before every PR.  |

## Project layout

```
src/app/            routes, server actions (actions.ts), auth callback
src/components/     feature components (feed, post card, comments, forms)
src/components/ui/  shared primitives (button, card, switch, field styles)
src/lib/            types, ranking, formatting, config
src/lib/data/       read API (Supabase or demo seed data)
supabase/           SQL migrations and seed
```

## Workflow

Every change is its own pull request with a Vercel preview link. PRs are merged
only by the owner. See [AGENTS.md](./AGENTS.md) for conventions and
[BUILD_LOG.md](./BUILD_LOG.md) for the history of changes.
