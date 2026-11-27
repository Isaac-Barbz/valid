# Build log

Newest first. One short entry per PR.

## 2026-11-26 · Modern Clean + MySpace-style profiles (feat/modern-clean)

- Design: Modern Clean tokens (solid colors, Inter + Bricolage Grotesque,
  1px borders, subtle card shadow). No gradients anywhere; rule added to
  AGENTS.md. New wordmark, avatar initials on solid colors.
- Vocabulary: every core term comes from `src/lib/copy.ts` (Drop, Valid,
  Lowkey, Your space); glossary in AGENTS.md.
- Profiles at `/u/[username]`: banner (uploaded image or solid color),
  avatar, online now, mood + status, Add friend / Message (coming soon),
  profile song (plays only on tap), About me / Who I'd like to meet, Top 8
  Friend Space, wall, the person's drops, and an owner-only Customize panel
  (curated solid colors, page background, 5 fonts, banner upload resized to
  WebP in the browser, song) with live preview.
- Feed: mood bar, Top 8 sidebar widget, mobile bottom tab bar with a center
  + button. Author names link to their space.
- Migration `20261127000000_profiles.sql`: profile fields with check
  constraints, `friendships` (pending/accepted, one row per pair),
  `top_friends`, `profile_comments`, `touch_last_seen()` presence, and a
  public `profile-media` storage bucket (2 MB, images, owner-folder writes).
  RLS verified on PGlite with stubbed auth/storage: 31/31 checks pass
  (spoofed requesters/authors, self-accepting, non-friend wall/Top 8 writes,
  bad colors, foreign banner paths, http song links, cross-folder uploads
  rejected; unfriending clears Top 8).
- Demo mode: seed people, friendships, Top 8, and walls; "you" is
  u/starlight_jas so the Customize panel can be previewed (saving shows the
  demo notice).
- Checks: typecheck ✓, lint ✓ (0 warnings), build ✓. Lighthouse (mobile,
  local prod build): home 94/100/100/100, own profile 99/100/100/90, other
  profile 100/100/100/90 (perf/a11y/best-practices/SEO; the profile SEO
  point is the streamed meta description), CLS ≤ 0.015. Screens checked at
  390px and 1366px.

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
