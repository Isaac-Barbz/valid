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
2. In the SQL editor, run `supabase/migrations/20261126000000_foundation.sql`,
   then `supabase/seed.sql` for the starter communities. (Or with the Supabase
   CLI: `supabase link` then `supabase db push`.)
3. Auth → URL Configuration: set the Site URL to the Vercel URL and add
   `https://<your-app>.vercel.app/auth/callback` (and
   `http://localhost:3000/auth/callback`) to the redirect URLs.
4. Optional: Auth → Providers → Google, for "Continue with Google" (free; needs
   a Google Cloud OAuth client).
5. Set the two environment variables above.

Free-plan notes: the built-in email sender is rate-limited (a few emails per
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
