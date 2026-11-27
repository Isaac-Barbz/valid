# Build log

Newest first. One short entry per PR.

## 2026-11-26 · Foundation (feat/foundation)

- Supabase schema as a migration: profiles, communities, memberships, posts and
  threaded comments with `is_anonymous`, votes, reports. RLS on every table;
  anonymous authors hidden behind `post_feed`/`comment_feed` views; moderator
  functions `moderation_author()` and `remove_content()`. Verified locally on
  Postgres (PGlite) with a stubbed Supabase auth schema: spoofed authors,
  fake scores, base-table reads, self-promotion to moderator and self-admin
  are all rejected.
- UI: home feed (hot/new/top), community pages, post page with threaded
  comments and replies, compose with "Post anonymously", voting, report
  dialog, sign-in shell (Google + email link). Light/dark via OS setting.
- Demo mode with seed data when Supabase env vars are missing.
- $0 budget rule added to README and AGENTS.md.
- Checks: typecheck ✓, lint ✓ (0 warnings), build ✓. Lighthouse (mobile,
  local prod build): home 95/100/100/100, post 96/100/100/100
  (perf/a11y/best-practices/SEO), CLS 0. Screens checked at 390px and 1366px.

## 2026-11-26 · Repo setup

- Scaffolded Next.js 16 (App Router, Cache Components), TypeScript strict,
  Tailwind v4, ESLint.
- Added README, AGENTS.md (conventions), and this log.
- Added `typecheck` and `check` scripts.
