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
