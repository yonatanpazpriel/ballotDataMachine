# Mock Trial Ballot Tracker

Single-page Vite/React app for creating tournaments, entering ballots, and exporting to CSV. Uses Supabase for auth (Google sign-in) and data storage.

## Auth & Supabase setup
- Enable Google provider in Supabase: Authentication > Providers > Google. Add your Google OAuth client ID/secret and the Supabase redirect URL to the Google Cloud Console.
- Run `supabase-setup.sql` in the Supabase SQL editor to create tables and RLS policies.
- Set env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

## Quick start
- Install: `npm i`
- Dev server: `npm run dev`
- Production build: `npm run build`

## Sharing & access model
- Any `https://your-domain/tournaments/:id` URL is **public and fully editable**:
  - Anyone with the link can view and change the tournament, ballots, and aggregated stats.
  - There is **no per-user access control** on the core tables; do not store sensitive data.
- Google sign-in is used to power the \"My tournaments\" list:
  - Authenticated users see tournaments they created or that have been added to their account.
  - Public editing still works for non-signed-in users via direct `/tournaments/:id` links.

## Where everything lives
- Entry + router: `src/main.tsx`, `src/App.tsx` (routes for tournaments, details, new ballot, 404). Root layout: `src/components/Layout.tsx`.
- Pages:
  - `src/pages/TournamentsPage.tsx` — list, create modal, navigation.
  - `src/pages/TournamentDetailPage.tsx` — ballots table, CSV export, new ballot link.
  - `src/pages/NewBallotPage.tsx` — loads tournament, renders ballot form.
  - `src/pages/NotFound.tsx` — 404 screen.
- Ballot UI (all in one file): `src/components/BallotForm.tsx`
  - `ScoreRow` + `ScoreGrid` — inputs for all score keys.
  - `LiveSummary` — live totals/winner.
  - `BallotForm` — validation, toast, save, navigation.
- Other components: `src/components/BallotTable.tsx` (read-only view), `src/components/TournamentCreateModal.tsx`.
- Data + logic:
  - `src/lib/constants.ts` — ordered prosecution/defense score keys and labels.
  - `src/lib/types.ts` — DTOs and domain types.
  - `src/lib/supabase-storage.ts` — Supabase persistence (tournaments, ballots, user access).
  - `src/lib/storage.ts` — legacy localStorage (used only for optional import).
  - `src/lib/scoring.ts` — total/winner calculations.
  - `src/lib/csv-export.ts` — CSV string + download helper.
  - `src/lib/utils.ts` — `cn` class merge helper.
- Styling/config: `src/index.css`, `src/App.css`, `tailwind.config.ts`, `postcss.config.js`, `tsconfig*.json`, `vite.config.ts`.
- UI primitives kept: `src/components/ui/` (button, input, label, radio-group, card, table, dialog, tooltip, toaster/sonner, toast types).

## Deployment to Vercel
- Import the GitHub repo in Vercel.
- Framework preset: Vite.
- Build command: `npm run build`
- Output directory: `dist`
- Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel env vars.
