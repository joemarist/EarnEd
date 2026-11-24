# EarnEd — Free ESL Tutor Income Tracker

EarnEd is a free, responsive income-tracking application for independent ESL tutors. It helps tutors organize workplaces, record classes, reconcile payments, set income goals, and understand their earnings.

## Features

- **Dashboard:** earnings, received payments, outstanding balances, recent class logs, and six-month trends.
- **Workplaces:** multiple workplaces, currencies, historical class rates, pay schedules, cutoff rules, and payment notes.
- **Daily Logs:** calendar and paginated list views for recording classes, rates, income, and notes.
- **Payments:** full and partial payment records, payment methods, period reconciliation, and CSV export.
- **Goals:** personal income targets and progress calculated from matching Daily Log income.
- **Reports:** date and workplace filters, currency-separated summaries, charts, CSV export, and print/PDF.
- **Account:** profile settings, avatar upload, password management, data export, and account deletion.
- **Tutorials & Tips:** curated ESL teaching articles, video tutorials, a first-class checklist, and practical lesson guidance.
- **Voluntary support:** optional GCash donations. EarnEd remains free; donations are never required to use features.

## Technology

- React 19 and TypeScript
- Vite 8 and Tailwind CSS 4
- React Router 7
- Supabase Auth, Postgres, and Storage
- Recharts and Lucide icons
- Progressive Web App manifest and service worker

## Requirements

- Node.js 22
- npm (the repository includes `package-lock.json`)

## Run locally

```bash
npm ci
npm run dev
```

Create `.env.local` in the project root:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
```

Use the project URL and public/publishable (or legacy anon) key from Supabase Project Settings > API. These two values are intended for browser use. **Never put a Supabase service-role key or secret key in a `VITE_*` variable, source file, or public repository.**

## Production build

```bash
npm ci
npm run typecheck
npm run build
npm run preview
```

The production output is `dist/`.

## Deploy to Cloudflare Pages

Create a Pages project using the GitHub integration and connect this repository.

| Setting | Value |
| --- | --- |
| Production branch | `main` |
| Framework preset | Vite |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | `/` (repository root) |
| Node.js version | `22` |

Add these environment variables in the Cloudflare Pages project under Settings > Environment variables, for both Production and Preview as appropriate:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

After the first deployment, configure Supabase Authentication > URL Configuration:
- Set Site URL to the final HTTPS production domain.
- Add the production URLs used by the app, including `https://YOUR-DOMAIN/**`, to Redirect URLs.
- Keep localhost redirect URLs only for local development.
- If Google sign-in is enabled, configure the production website origin in Google OAuth's Authorized JavaScript origins. Keep the Supabase callback URL listed in Google's Authorized redirect URIs.

Cloudflare Pages supports Vite builds with `npm run build` and `dist` as the output directory. It serves Vite single-page applications with SPA fallback behavior when no top-level `404.html` is present.

## Supabase production checklist

The app uses the existing Supabase project; deploying the frontend does not create or migrate a database.

Before opening registration to the public, verify:

1. `workplaces`, `daily_logs`, `payments`, and `goals` exist and have Row Level Security enabled.
2. The four user-owned tables have authenticated policies that restrict each operation to the signed-in user's `user_id`.
3. The `avatars` bucket exists with the expected file size/MIME limits and per-user folder write policies.
4. The payment validation trigger and `public.validate_payment_amount()` function exist on `public.payments`. The latest repository safeguard script is `supabase/migrations/20261124_harden_payment_period_guard.sql`. Verify the live database after applying it; do not rely on frontend validation alone.
5. The `delete-account` Edge Function is deployed and tested.
6. Supabase Auth leaked-password protection is enabled.
7. Production Site URL and Redirect URLs are configured before testing email confirmation, password recovery, and Google sign-in.

The original base-table setup for `workplaces`, `daily_logs`, and `payments` was configured separately in the current Supabase project and is not yet fully represented as a clean, from-scratch migration set in this repository. Do not use this repository alone to create a replacement production database.

## Privacy and operational readiness

EarnEd stores personal teaching and income records. Before public launch, publish a privacy notice and terms of use that explain what data is stored, why it is processed, retention/deletion practices, and how users can contact the maintainer. Confirm Supabase backup and recovery options for the chosen plan. Test account isolation with two separate accounts and verify exports and deletion end-to-end.

## Current limitations

- Spreadsheet import is not available.
- Reminder preferences can be saved, but automatic email and push notifications are not enabled.
- No automated end-to-end test suite is currently configured.
- The current deployment workflow adds a TypeScript check and production build in GitHub Actions; it does not replace browser, security, or load testing.

## Project structure

```text
src/
  app/                 Router and route definitions
  components/          App shell, shared UI, and branding
  lib/                 Supabase client and utilities
  pages/               Application pages
public/
  brand/               EarnEd artwork
  manifest.webmanifest PWA metadata
  sw.js                Production service worker
supabase/
  migrations/          SQL safeguards and schema migrations
```
