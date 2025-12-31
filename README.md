# Mock Trial Ballot Tracker

Single-page Vite/React app for creating tournaments, entering ballots, and exporting to CSV. Data is stored locally in `localStorage`.

## Quick start
- Install: `npm i`
- Dev server: `npm run dev`
- Production build: `npm run build`

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
  - `src/lib/storage.ts` — `localStorage` persistence (tournaments, ballots).
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
- No env vars needed for current localStorage-only app. Add envs in Vercel if you later add APIs.
