# Sets

A production-ready, mobile-first workout set tracker built with Next.js App Router, shadcn/ui, and local-only storage. All dates are displayed and edited in America/Los_Angeles (PT), regardless of device timezone.

## Features

- Log and edit workout sets (all fields optional)
- Local-only persistence via `localStorage`
- Calendar range view with read-only details and deep-link editing
- Trends dashboard with 3 charts powered by shadcn/ui (Recharts)
- Fixed bottom navigation for mobile

## Routes

- `/` Home: create, list, and edit sets
- `/calendar` Calendar: range selection + read-only set details
- `/trends` Trends: charts and filters

## Local data

Sets are stored only in your browser `localStorage` under the key `sets-tracker:v1`.
No authentication or backend is used.

## Setup

```bash
pnpm install
pnpm dev
```

## Build

```bash
pnpm lint
pnpm build
pnpm start
```

## Deploy to Vercel

1. Push this repo to GitHub/GitLab/Bitbucket.
2. Create a new Vercel project and import the repo.
3. Vercel detects Next.js automatically; keep the defaults.
4. Deploy.

## Tech stack

- Next.js App Router + TypeScript
- Tailwind CSS + shadcn/ui
- React Hook Form + Zod
- Recharts via shadcn/ui chart components
- date-fns + @date-fns/tz
