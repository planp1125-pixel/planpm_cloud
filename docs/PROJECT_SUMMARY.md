# Plan-PM Project Summary

## Stack
- Next.js 15 App Router with Tailwind + Radix UI (shadcn-style components).
- Supabase for data/auth (Google OAuth + email/password) exposed via custom providers/contexts.
- Genkit + Google Gemini 2.5 Flash for AI flows.
- TanStack Table for data grids; React Hook Form + Zod for forms/validation.

## App Shell
- `src/app/layout.tsx` sets fonts, theme provider, Supabase/Auth providers, and wraps content in `MainLayout`.
- `src/components/layout/*` implements sidebar, header (user menu, notifications, theme toggle), and loading gate via `AppContent`.

## Auth
- `src/contexts/auth-context.tsx` handles Supabase auth state, redirects on sign-in/out, and exposes sign-in/up/out helpers.
- Login/Signup pages under `src/app/(auth)/*`; OAuth callback handled at `src/app/auth/callback/route.ts`.
- `src/lib/supabase.ts` creates the Supabase client (currently with hardcoded anon key/URL).

## Domain Models (see `src/lib/types.ts`)
- Instruments with metadata (eqpId, type, make/model, serial, location, schedule info, images).
- Maintenance schedules/events, maintenance results, maintenance configurations.
- Test templates composed of sections (tolerance/range/simple) and rows; templates back results display.

## Feature Pages
- **Dashboard** (`src/app/page.tsx`): overview cards, maintenance completion chart, instrument status, upcoming maintenance.
- **Instruments** (`src/app/instruments/page.tsx`): table CRUD for instruments with add/edit/delete dialogs and cascade deletes of related maintenance data.
- **Maintenance Results** (`src/app/results/page.tsx`): searchable list of completed maintenance with schedule/instrument join, expandable test sections, status badges, document links.
- **Design Results** (`src/app/design-results/page.tsx`): builder to create/edit/delete test templates, dynamic sections/rows saved to Supabase.
- **Predictive Advisor** (`src/app/advisor/page.tsx`): form to select instrument, enter usage, fetch history, and request AI recommendation.

## AI Flow
- Server action `predictInstrumentFailure` (`src/app/actions.ts`) wraps Genkit flow in `src/ai/flows/predictive-maintenance-advisor.ts`.
- Flow enforces Zod schemas: input (instrumentName, maintenanceHistory, usagePatterns) → output (failureLikelihood, recommendedActions).
- Genkit config at `src/ai/genkit.ts` uses Google Gemini 2.5 Flash via `@genkit-ai/google-genai`.

## Notes/Considerations
- Supabase anon key is embedded client-side; swap to env vars for production.
- Data fetches are client-side; ensure Supabase tables exist: instruments, maintenanceSchedules, maintenanceResults, maintenance_configurations, testTemplates.
- Sidebar/layout assumes authenticated experience; `(auth)` routes bypass main shell.
