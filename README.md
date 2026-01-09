# Sets

A production-ready, mobile-first workout set tracker built with Next.js App Router, shadcn/ui, and local-only storage by default. When Supabase is configured, sets sync to your Supabase project while still caching locally.

All dates are displayed and edited in America/Los_Angeles (PT), regardless of device timezone.

## Features

- Log and edit workout sets (all fields optional)
- Local persistence via `localStorage`
- Optional Supabase sync for cross-device storage
- Calendar range view with read-only details and deep-link editing
- Trends dashboard with 3 charts powered by shadcn/ui (Recharts)
- Fixed bottom navigation for mobile

## Routes

- `/` Home: create, list, and edit sets
- `/calendar` Calendar: range selection + read-only set details
- `/trends` Trends: charts and filters

## Local data

Sets are cached in your browser `localStorage` under the key `sets-tracker:v1`.
A device ID is stored under `sets-tracker:device-id` when Supabase sync is enabled.

## Supabase sync (optional)

1. Create the `sets` table by running `supabase/schema.sql` in your Supabase SQL editor.
2. Add the environment variables below.
3. Restart the dev server.

Required environment variables:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (or `SUPABASE_SECRET_KEY`)

The service role key is used only on the server via the API route in `app/api/sets/route.ts`.

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

## Tests

```bash
pnpm test
pnpm test:e2e
```

If Playwright browsers are missing, run:

```bash
pnpm exec playwright install chromium
```

## Deploy to Vercel

1. Push this repo to GitHub/GitLab/Bitbucket.
2. Create a new Vercel project and import the repo.
3. Vercel detects Next.js automatically; keep the defaults.
4. Add the Supabase environment variables if you want sync.
5. Deploy.

## Tech stack

- Next.js App Router + TypeScript
- Tailwind CSS + shadcn/ui
- React Hook Form + Zod
- Recharts via shadcn/ui chart components
- Supabase via API routes
- date-fns + @date-fns/tz
