# Workout Log - Offline-First Workout Tracker PWA

A local-first progressive web app for logging weightlifting, calisthenics,
and CrossFit-style metcons (e.g. Cindy). Built for use mid-workout, one-handed,
on a gym floor with unreliable connectivity.

## Background

Most workout apps assume constant connectivity, or force every session into
a "3 sets of 10" mold that breaks down for AMRAP/EMOM metcon formats. This
app treats IndexedDB as the sole source of truth: no account, no server, no
network calls after install. Backup is a manual JSON export/import, so the
data always belongs to the person using it.

## Tech Stack

- **React 19 + TypeScript (strict)** — UI layer
- **Dexie (IndexedDB)** — chosen over `localStorage` because workout history
  can exceed the 5 MB `localStorage` cap and needs async, indexed queries
  (e.g. "every Back Squat set in the last year") to stay fast
- **Zod** — schema validation on JSON import, since a malformed backup file
  must never be allowed to touch the database
- **Tailwind CSS v4** — utility styling, kept small after purge
- **vite-plugin-pwa (Workbox)** — full offline app shell precaching, so the
  app works entirely in airplane mode after the first visit

## Architecture

Domain logic (`src/domain/`) is plain TypeScript with zero React or Dexie
imports, enforced by an ESLint `no-restricted-imports` rule — every
1RM/volume/PR calculation is meant to be a pure, independently testable
function.

```
src/
  app/        router, providers, error boundary
  db/         Dexie schema, seed data, per-entity queries
  domain/     pure types + business logic (no React, no Dexie)
  features/   exercises, routines, session, history, backup, settings
  components/ generic UI components
  lib/        timer, image handling, shared utilities
```

`Routine` (a reusable template) is kept separate from `Session` (what
actually happened): editing a routine must never rewrite history, so every
completed session is meant to snapshot the routine it was run from.

## Getting Started

### Prerequisites

- Node.js 22+

### Installation

```bash
npm install
npm run dev
```

### Other scripts

```bash
npm run build         # type-check + production build
npm run test           # vitest
npm run lint            # eslint
npm run format:check   # prettier --check
```

## Key Technical Decisions

**Decision**: Timers (rest timer, AMRAP countdown) never accumulate by
adding to a counter inside `setInterval`.
**Why**: iOS Safari freezes JavaScript execution when the screen locks, so a
tick-based counter silently drifts or stops entirely. Elapsed time is
instead always recomputed from a persisted `startedAtEpochMs` compared
against `Date.now()`, and resynced on `visibilitychange`/`pageshow`.
**Trade-off**: every timer display needs an explicit recompute-on-resume
code path instead of a single incrementing counter — more code, but it's
the only way a 20-minute Cindy clock survives the phone being locked and
put in a pocket mid-workout.

**Decision**: `SetLog` is planned to live in its own indexed Dexie table
rather than nested inside the `Session` document (see `src/db/schema.ts`).
**Why**: per-exercise progress queries ("every Back Squat set in the last
year") need to scan an indexed table directly, not deserialize and filter
every session document in the store.
**Trade-off**: writing a session and its sets has to happen inside one
Dexie transaction, or a crash mid-write leaves the two out of sync.

**Decision**: exercise seed data ships read-only; editing a seeded exercise
creates a local copy (`isCustom: true`) instead of mutating the shared seed.
**Why**: keeps the built-in exercise library consistent across installs
while still letting a user customize defaults (sets/reps/weight) freely.
**Trade-off**: needs an explicit copy-on-write step in the exercise editor,
which isn't fully wired up yet (see below).

## Project Status

This is an active work-in-progress, not a finished product. The full
`Session` / `SessionBlock` / `SetLog` model described in the project spec
([`CLAUDE.md`](CLAUDE.md)) is **not implemented yet** — the app currently
runs on a simpler interim model (`DailyExerciseLog`, `DailyWorkoutResult`)
that doesn't yet snapshot routines or support block-based logging. Exercise
library, routine CRUD, and basic session logging are functional; AMRAP/EMOM
runners, progress charts, and the derived-PR system are not built.

See [`CLAUDE.md`](CLAUDE.md) for the full spec and [`TO-DO.md`](TO-DO.md)
for the current build checklist.

## Testing

`vitest` + Testing Library for unit and component tests, `@playwright/test`
reserved for offline scenarios. Domain logic (1RM, volume, PR calculation)
is intended to be tested as pure functions with no mocking, once it's built
out in `src/domain/stats.ts`.

## Privacy

No network requests after the first load. No analytics, no third-party
CDNs, no external fonts. All data stays in the browser's IndexedDB unless
the user explicitly exports it.

## License

MIT — see [LICENSE](LICENSE)
