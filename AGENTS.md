<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Agent conventions for Valid

## Workflow

- One change per pull request, on its own branch (`feat/…`, `fix/…`, `chore/…`).
- Every PR gets a Vercel preview link in its description.
- **Never merge.** The owner merges when they say go.
- Before opening or updating a PR, run `npm run check` (typecheck, lint, build)
  and note the results, plus a mobile/responsive check and a speed check
  (Lighthouse when possible), in the PR description.
- Add a short entry to `BUILD_LOG.md` in the same PR.

## Budget: $0 (free tiers only)

- Stay on free tiers: GitHub Free, Vercel Hobby, Supabase Free. No paid
  services, paid add-ons, or custom domain without the owner's explicit OK.
- Images: Supabase Storage, resized and compressed in the browser before
  upload (e.g. canvas → WebP, max ~1600px). Do not use paid image/video APIs
  or Vercel image optimization quotas for user uploads (`unoptimized` for
  user content).
- Video: not until a free approach is agreed.
- Keep requests cheap: paginate, select only needed columns, prefer static
  shells + streaming, no polling loops (use Supabase Realtime sparingly).
- Note any new free-tier limit you rely on in the README.

## Data and privacy rules

- Never read `posts`/`comments` base tables from the app; use the
  `post_feed`/`comment_feed` views so anonymous authors stay hidden.
- Every schema change is a new file in `supabase/migrations/` with RLS
  policies; never edit an applied migration.
- Keep `hot_rank()`/`street_rank()` in SQL and `hotRank()`/`streetRank()` in
  `src/lib/ranking.ts` in sync.
- Keep the profile layout rules in sync: `is_valid_layout()` in SQL,
  `src/lib/profile-layout-schema.ts` (zod), and `src/lib/profile-layout.ts`.
- Tags are lowercase `[a-z0-9_]{2,32}`, max 10 per drop (`src/lib/tags.ts`
  and the SQL checks); "also drop it in" is capped at 3 in both places.
- The app must keep working in demo mode (no Supabase env vars).

## Design: Modern Clean, dark first

- **Dark mode is the primary, default feel** (`data-theme="dark"` on `<html>`;
  people can switch to light or system in Settings). Deep charcoal and
  near-black surfaces, moody and polished: nighttime LA / streets energy with
  clean text. Violet accent, soft shadows, light 1px borders. Light mode
  must still look right.
- Layout: on desktop, a fixed left rail (Home, Streets = v/thestreets,
  Communities, Your space, Settings) with a violet active state; on phones,
  the top bar plus bottom tab bar. The feed shortcut row lists v/thestreets,
  then communities the person has joined, then "Find communities"; it can be
  hidden in Settings.
- **No photos in the site design**: no hero images, stock photos, or photo
  placeholder slots. LA night scenes are mood inspiration only; convey the
  vibe through dark solid colors, type, and layout. (Photos people upload to
  their own space, like banners, backgrounds, and the Photos block, are user
  content and fine.)
- Solid colors only. **No gradients anywhere** (no `bg-gradient-*`,
  `linear-gradient`, `radial-gradient`, `conic-gradient`, gradient text, or
  gradient banners/avatars). Banners are an uploaded image or a solid color.
- Clean typography: Inter for text, Bricolage Grotesque (`font-display`) for
  the wordmark and big headings. Real contrast (WCAG AA); depth comes from
  1px borders and the subtle `shadow-card` token only.
- Profile customization (the MySpace part): owners pick any solid colors for
  accent, background, cards, and text (these hex values are user data, the
  one place raw colors are allowed), checked for WCAG AA in the editor and
  auto-fixed on save. Plus a font from `FONTS`, card shape and style, a solid,
  photo, or subtle SVG pattern background, and blocks they toggle and reorder.
  No gradients, no custom CSS. See `src/lib/profile-layout.ts`.
- Site-wide personal look (Settings): theme, feed density (`compact:`
  variant), and an accent from the `--palette-*` tokens.

## Vocabulary

All user-facing names for core concepts come from `TERMS` in
`src/lib/copy.ts`; never hard-code them in components.

| Concept | Term on the site |
| --- | --- |
| Post | **Drop** ("New drop", "Drop it", "12 drops") |
| Upvote | **Valid** ("12 valid"); downvote stays plain ("Downvote") |
| Anonymous post | **Lowkey** (toggle "Post lowkey", badge "Lowkey") |
| Profile | **Your space** in navigation; others' read "Jasmine's space" |
| Community prefix | **v/** (`/v/style`); the default open community is **v/thestreets** |
| Tag | **#tag** (`/t/braids`) |
| Everything else | Plain words: comment, community, friends, feed, trending, mood |

Code, routes, and the database keep the plain names (`posts`, `votes`,
`is_anonymous`, `/u/…`); `/c/…` links redirect to `/v/…`.

## Code standards

- TypeScript strict. No `any`, no `@ts-ignore`, no disabled lint rules without a
  written reason on the same line.
- No dead code: no unused files, exports, components, or commented-out blocks.
- No hacks or one-off magic values. Colors, radii, and spacing come from the
  design tokens in `src/app/globals.css` (`@theme`). Add a token rather than a
  raw hex value.
- Reuse shared components before writing new ones. Generic UI lives in
  `src/components/ui`; feature components live in `src/components`.
- Server Components by default; add `"use client"` only where interactivity
  needs it, and keep those components small.
- Mobile-first: design for ~360px wide first, then scale up with `sm:`/`md:`/`lg:`.
- Respect light and dark mode; never hard-code a color that only works in one.
