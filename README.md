# EarnEd — ESL Income Tracker

EarnEd is a responsive income-tracking application for independent ESL tutors. It helps users organize workplaces, record classes, reconcile payments, set income goals, and review reports.

## Features

- **Dashboard:** current-period earnings, received payments, outstanding balances, recent class logs, and six-month trends.
- **Workplaces:** multiple workplaces, currencies, historical class rates, pay schedules, cutoff rules, and payment notes.
- **Daily Log:** record classes by date and workplace while preserving the rate and income saved for each entry.
- **Payments:** record full or partial payments, reconcile them against Daily Logs, and prevent overpayments and overlapping date ranges.
- **Goals:** create personal income targets and calculate progress from matching Daily Log income.
- **Reports:** filter by date and workplace, compare earned and received amounts by currency, and export CSV or print a PDF.
- **Settings & Account:** update profile preferences, change password, export account data, and request account deletion.
- **Tutorials & Tips:** remains available in the navigation; its content is intentionally reserved for a later update.

## Technology

- React 19 and TypeScript
- Vite 8
- Tailwind CSS 4
- React Router 7
- Supabase Auth and Postgres
- Recharts and Lucide icons
- Installable Progressive Web App (PWA)

## Run locally

Use a Node.js version supported by Vite 8.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Environment variables

Create a `.env.local` file in the project root:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_OR_PUBLISHABLE_KEY
```

Use the URL and public/anon key from your Supabase project settings. Never put a Supabase service-role key in a `VITE_*` variable or any client-side file.

## Supabase database

The application expects user-owned records in these tables:

- `workplaces`
- `daily_logs`
- `payments`
- `goals`

The `daily_logs` records are linked to workplaces through `workplace_id`; legacy records can still be matched by workplace name. Payment reconciliation uses saved Daily Log income and a database trigger to guard against overpayments and overlapping payment ranges.

SQL files currently tracked in `supabase/migrations/` cover the goals table, payment safeguards/indexes, and the public-read `avatars` Storage bucket. Run `20261124_create_avatar_storage.sql` in the Supabase SQL Editor before using custom profile picture uploads. Each authenticated user can write only to their own UUID folder; profile image URLs are public so the app header can display them. The original base-table setup for `workplaces`, `daily_logs`, and `payments` was configured separately in the Supabase project and is not yet fully represented as a clean, from-scratch migration set in this repository. Before setting up a new Supabase project, that base schema and its Row Level Security policies must also be recreated.

Enable Row Level Security on every user-owned table and ensure policies restrict reads and writes to rows where `auth.uid() = user_id`. The client uses only the public/anon key; database policies are an essential part of the security boundary.

Account deletion calls a Supabase Edge Function named `delete-account`. Ensure that function is deployed and configured in the Supabase project before relying on the delete-account action.

## Current limitations

- Spreadsheet import is not available yet.
- Reminder preferences can be saved, but automatic email and push notifications are not enabled.
- Timezone is saved as an account preference for future date and reminder features; current date calculations still use the browser's local timezone.
- The default currency is an account preference; each workplace continues to store its own currency.
- No automated test suite is currently configured.

## Production checks

Before deploying a new release:

1. Confirm the production Supabase URL and public key are configured.
2. Confirm all required tables, indexes, triggers, and Row Level Security policies exist.
3. Confirm the `delete-account` Edge Function is deployed if account deletion is enabled.
4. Run `npm run build` and resolve any TypeScript or Vite build errors.
5. Test sign-in (including Google), profile picture display and upload, workplace creation, class logging, partial/full payments, overlapping payment protection, goals, reports, exports, account settings, and both light and dark themes.
6. Test the app at mobile and desktop widths, including the installed PWA if it will be distributed that way.

## Project structure

```text
src/
  app/                 Router and route definitions
  components/          App shell, shared UI, and branding
  lib/                 Supabase client and utility helpers
  pages/               Dashboard and feature pages
  data/                Legacy mock data (not the source for live account records)
public/
  brand/               EarnEd artwork
  manifest.webmanifest PWA metadata
  sw.js                Production service worker
supabase/
  migrations/          SQL migrations and payment safeguards
```

## Available scripts

```bash
npm run dev       # Start the development server
npm run build     # Create a production build
npm run preview   # Preview the production build
npm run format    # Format supported source files
```
