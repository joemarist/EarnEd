# EarnEd — ESL Income Tracker

Phase 1 is a responsive, frontend-only product prototype for online ESL tutors. It uses realistic mock data and deliberately has **no backend, authentication provider, or live persistence yet**.

## Current stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4
- React Router (data router)
- Recharts
- Lucide icons
- Zod for form validation
- Installable PWA shell

The Figma Make workspace is Vite-based, so this UI prototype stays on the existing runtime. When the UI is approved, the page and component layer can be moved to Next.js App Router before Supabase is connected.

## Run locally

```bash
pnpm install
pnpm dev
```

In Figma Make, the development server is already managed automatically.

## Folder structure

```text
src/
  app/
    App.tsx             # RouterProvider entry
    routes.tsx          # Public and app routes
  components/
    AppShell.tsx        # Responsive sidebar, header and mobile navigation
    Brand.tsx           # EarnEd brand component
    ui.tsx              # Shared buttons, cards, fields, badges and headers
  data/
    mock.ts             # Typed mock repository; replace this boundary first
  lib/
    utils.ts            # Formatting, class and export helpers
  pages/                # Route-level UI
public/
  brand/                # Supplied EarnEd artwork
  manifest.webmanifest  # PWA metadata
  sw.js                 # Minimal production app-shell cache
```

## Mock-data boundary

All shared mock entities live in `src/data/mock.ts`. Route components consume typed exports from that file rather than embedding server calls. During backend integration, replace these imports with repository functions or typed query hooks while leaving the page components largely unchanged.

Recommended interface:

```ts
interface IncomeRepository {
  listWorkplaces(): Promise<Workplace[]>;
  listDailyLogs(range: DateRange): Promise<DailyLog[]>;
  listPayments(workplaceId?: string): Promise<Payment[]>;
  getDashboardSummary(range: DateRange): Promise<DashboardSummary>;
}
```

## Planned Supabase model

Use UUID primary keys, `user_id`, `created_at`, `updated_at`, and nullable `deleted_at` on every user-owned table:

- `profiles` / auth users
- `workplaces`
- `rates` (`workplace_id`, `amount`, `effective_from`)
- `pay_schedules`
- `daily_logs` (`workplace_id`, `date`, `classes`, `remarks`)
- `payments` (`workplace_id`, `period_start`, `period_end`, `amount_received`, `date_received`)
- `goals`
- `share_links`
- `audit_events`

Add composite indexes such as `(user_id, date)` for daily logs and `(user_id, period_end)` for payments. Preserve rate history instead of overwriting old values so historical income remains reproducible.

## Connecting Supabase later

1. Move the approved UI to Next.js App Router and keep server-only code out of client components.
2. Create typed Zod schemas shared by server actions/route handlers and client forms.
3. Add Supabase environment variables only through deployment secrets; never expose the service-role key.
4. Implement auth with secure, HTTP-only sessions and PKCE/OAuth callbacks.
5. Enable RLS on every user-owned table. Policies must require `auth.uid() = user_id` for select, insert, update, and soft-delete.
6. Resolve `user_id` on the server, not from a trusted client payload.
7. Add CSRF protection to mutations, rate-limit auth and share-link endpoints, and audit sensitive actions.
8. Replace `src/data/mock.ts` consumers with repository/query hooks one feature at a time.
9. Generate PDF/CSV exports on the server for full datasets; sanitize imported spreadsheet values before validation.

No Supabase project, keys, database, or backend code has been added in Phase 1.
