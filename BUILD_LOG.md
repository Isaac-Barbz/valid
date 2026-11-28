# Build log

Newest first. One short entry per PR.

## 2026-11-27 · Personal community shortcut row (feat/personal-community-row)

- The feed chip row (and the desktop shortcuts list) no longer lists every
  community. It shows v/thestreets first, then only communities the person
  has joined, then a "Find communities" chip to `/v`. Demo mode uses the
  demo person's memberships (style, food, music); signed-out and new
  accounts see just v/thestreets and Find communities.
- Settings: "Show community shortcuts" toggle. Signed-in accounts save
  `profiles.show_community_row`; demo and signed-out use localStorage.
- Join / Leave on community pages (not v/thestreets, which stays open to
  everyone). Owners can't leave. Joining or leaving updates the row.
  Demo memberships are kept in localStorage so the row updates without a
  database. The demo banner can preview the signed-out row.
- Migration `20261129000000_community_row.sql`. RLS tests extended for the
  new column and join/leave policies: 83/83 pass.
- Checks: typecheck ✓, lint ✓ (0 warnings), build ✓. Lighthouse (mobile,
  local prod): home 100/100/100/100, settings 100/100/100/100, v/style
  100/100/100/90, v/thestreets 100/100/100/90 (SEO 90 is the streamed meta
  description on dynamic routes), CLS 0. Screens checked at 390px.

## 2026-11-26 · v/thestreets, tags, and customizable spaces (feat/streets-and-customize)

- Communities are now `v/` (`/v/[slug]`; old `/c/…` links redirect).
  **v/thestreets** is the default open community; New drop starts there, or
  in your home community (Settings).
- Tags: `#tags` from the body and a tag field (max 10), chips on drops,
  `/t/[tag]` pages with "Communities that talk about #tag", trending tags.
- Communities claim tags (moderators only). v/thestreets drops with a claimed
  tag land in that community's **Suggested** queue; mods accept (cross-list)
  or dismiss. New drop suggests best-fit communities from the title, body,
  and tags (keyword/tag matching in the browser, no AI) with "Also drop it in
  v/…" (up to 3).
- v/thestreets discovery: "Popping in v/…" strip and trending tags; hot sort
  there uses `street_rank` (untagged and low-engagement drops rank lower).
- Your space is built from blocks (About me, Top 8, song, now playing, pinned
  drop, photos, links, wall, drops) the owner toggles and reorders (drag on
  desktop, arrows everywhere) at `/settings/space`, with any colors for
  accent/background/cards/text (live WCAG AA check, Fix button, auto-fix on
  save), 5 fonts, rounded/sharp and flat/outlined/shadow cards, and a solid,
  pattern (SVG, no gradients), or photo background. Live preview. Stored as
  validated JSON in `profiles.layout`.
- Settings: theme (dark default, light, system), feed density
  (roomy/compact), and personal accent, per device; home community.
- Design direction: dark first (near-black/charcoal, violet accent, soft
  shadows, light borders), fixed left rail on desktop (Home, Streets,
  Communities, Your space, Settings), new `/v` communities page. No photos
  in the site design.
- Migration `20261128000000_streets_tags_spaces.sql`: thestreets, `post_tags`,
  `community_tags`, `community_listings`, `street_rank()`, `trending_tags`,
  `post_feed` with tags, `profiles.layout` (`is_valid_layout()`,
  `layout_paths_owned()`) and `home_community_id`; old theme columns dropped.
  RLS verified on PGlite: 72/72 checks (all earlier ones plus spoofed
  tags/claims/listings, non-mod accepts, author re-accepts, tag and listing
  limits, foreign photo paths, http links, bad colors).
- Checks: typecheck ✓, lint ✓, build ✓. Lighthouse (mobile, local prod):
  home 100/100/100/100, v/thestreets 100/100/100/90, New drop
  100/100/100/100, customize 100/100/100/100, Jasmine's space
  100/100/100/90, #hair 100/100/100/90 (SEO point = streamed meta
  description on dynamic routes), CLS ≤ 0.019. Screens checked at 390px and
  1366px, dark and light.

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
