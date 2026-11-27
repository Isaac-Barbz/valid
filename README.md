# Valid

A modern, open forum and social site: communities on any topic, posts, threaded
comments, and voting. Everyone has an account, and every post or comment can be
made **anonymously**: it shows as "Anonymous" publicly while the author stays
known to moderators.

> "Valid" is the working name and may change.

## Stack

- [Next.js](https://nextjs.org) (App Router, Cache Components) + TypeScript (strict)
- Tailwind CSS v4 with design tokens in `src/app/globals.css`
- Hosted on Vercel
- Backend: Supabase (Postgres, Auth, Storage, Realtime). Not wired yet.

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
```

## Scripts

| Command             | What it does                              |
| ------------------- | ----------------------------------------- |
| `npm run dev`       | Local dev server                          |
| `npm run typecheck` | Generates route types, then `tsc --noEmit` |
| `npm run lint`      | ESLint (Next.js core-web-vitals + TS)     |
| `npm run build`     | Production build                          |
| `npm run check`     | All three, in order. Run before every PR. |

## Workflow

Every change is its own pull request with a Vercel preview link. PRs are merged
only by the owner. See [AGENTS.md](./AGENTS.md) for conventions and
[BUILD_LOG.md](./BUILD_LOG.md) for the history of changes.
