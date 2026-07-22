# Nafes Passport — System Overview

A student gamification and activity-tracking system built for Abha National Elementary School (ابتدائية أبها الأهلية). Each student has a "space passport": they earn points across subjects and activities, progress through 8 space-explorer ranks, and unlock silver/gold/diamond stamps. "Nafes" refers to the Saudi national standardized-test program (Nafes/Nafis exams) that is one of the graded activities.

- Live site: https://nafes-passport5.web.app
- Firebase project: `nafes-passport5`
- Current scale: ~135 students across Grade 3 and Grade 6

Primary users:
- **Students** — view their own points, rank, and stamps. No login required.
- **Teachers/Admin** — add and edit students, award points, bulk-import from Excel. Gated behind a single shared "edit code", not individual accounts.

---

## Tech Stack

- **Language:** TypeScript throughout, Node 20+, ESM (`"type": "module"`).
- **Frontend:** React 19 + Vite 7. Routing via `wouter`. UI built on Radix UI primitives in a shadcn-style component set, styled with Tailwind CSS 4. Data fetching/caching via TanStack Query. Animations via Framer Motion. Forms via `react-hook-form` + `zod`. Excel import via `xlsx`. Toasts via `sonner`.
- **Backend:** A minimal Express server (`server/index.ts`) that only serves the built SPA and falls through every route to `index.html`. There is no REST/API layer — the browser talks to Firebase directly.
- **Data/Auth/Storage:** Firebase — Firestore (Native mode, default database, region `nam5`) for data, Firebase Storage for avatar images, Firebase Hosting for production. Firebase Authentication is initialized in code but not actually used anywhere (see "Access Control" below).
- **Build tooling:** Vite for the client bundle, `esbuild` to bundle the Express server for production, `pnpm` as package manager, Prettier for formatting. No ESLint config. `vitest` is a dependency but nothing is wired to run through it — see "Known Quirks".
- **Origin note:** the project was scaffolded on the "Manus" AI app-builder platform. Some leftovers from that template are still present but unused (see "Known Quirks").

---

## Architecture

```
client/               React SPA (Vite root)
  src/
    App.tsx            Router setup (wouter), theme, query provider, toaster
    main.tsx            React entry point
    pages/               Home, StudentDashboard, AdminDashboard, Leaderboard, NotFound
    components/          Feature components + components/ui (shadcn/Radix wrappers)
    hooks/                useStudents.ts (React Query + Firestore), useMobile, etc.
    contexts/ThemeContext.tsx
    lib/
      firebaseConfig.ts     Firebase app/Firestore/Auth init (tolerant of missing env vars)
      firestoreService.ts   All Firestore CRUD for the students collection
      data.ts                 Domain types, RANKS, STATIONS, SAMPLE_STUDENTS fallback, EDIT_CODE
      pointsLimits.ts         Per-grade max-points logic and validation
server/
  index.ts             Express app: static file serving + SPA fallback only, no API routes
shared/
  const.ts             Two constants only (COOKIE_NAME, ONE_YEAR_MS) — thin, mostly unused
scripts/               One-off Node/Firebase admin scripts (seeding, deletion, load tests)
tests/                 Ad-hoc Node scripts exercising points/rank logic (not wired to vitest)
patches/                pnpm patch for the wouter package
```

Path aliases (in `vite.config.ts` and `tsconfig.json`): `@` → `client/src`, `@shared` → `shared`.

The `shared/` folder is not a real client/server-shared schema layer — almost all domain logic (types, ranks, points math) lives in `client/src/lib/` and is consumed directly by the browser, since there's no backend API.

**Routes** (`client/src/App.tsx`):
| Route | Page | Access |
|---|---|---|
| `/` | Home — stats, searchable student grid, rank ladder, stamps showcase | Public |
| `/student/:id` | StudentDashboard — per-student progress, rank, stamps, comments | Public |
| `/leaderboard` | Top 3 students per grade | Public |
| `/admin` | AdminDashboard — full CRUD, bulk points, Excel import, change history | Gated by edit code |
| `/404`, catch-all | NotFound | — |

---

## Data Model

Firestore project `nafes-passport5`, default database, region `nam5`. Two collections:

### `students` (~135 documents)
- `name`, `grade` (3 or 6), `avatar` (optional image URL)
- `points` — an object keyed by subject/"station": `arabic`, `math`, `science` (grade 6 only), `morningAssembly`, `nafesExams`
- `totalPoints` — sum of the above
- `rank` — embedded snapshot of the matching entry from the `RANKS` table (id, Arabic/English name, min/max points, icon)
- `stamps` — `{ silver, gold, diamond }` booleans
- `viewCount` — incremented each time a student's dashboard page is opened
- `comments` — array of `{ id, text, author, createdAt }`
- `createdAt` / `updatedAt` — ISO date strings (not Firestore Timestamps)

### `change_logs`
An audit trail written on every add/update/delete/bulk update from the admin dashboard: `action`, `studentId`, `studentName`, a field-level `changes` list, a full `snapshotBefore` (used for undo/restore), and optional `bulkOperation`/`restoredFrom` metadata. Read by `ChangeHistoryDialog.tsx` to display history and restore a prior snapshot.

There is no schema file — the Firestore documents are schemaless, and the "schema" is just the TypeScript interfaces in `client/src/lib/data.ts` (`Student`, `StationPoints`, `Stamps`, `Rank`, `Comment`), mapped manually to/from Firestore in `firestoreService.ts`.

### Grading model (`client/src/lib/data.ts`, `pointsLimits.ts`)
- **Grade 6:** 5 stations, 20 points max each (100 total) — Arabic, Math, Science, Morning Assembly, Nafes Exams.
- **Grade 3:** 4 stations, no Science, max 30/30/20/20 (100 total).
- `pointsLimits.ts` clamps point edits to each grade's per-subject max and prevents negative values (`applyPointsWithLimit`, `calculateActualPoints`, `validatePoints`).
- An 8-tier `RANKS` table maps total points (0–100) to a named, iconified rank, from "Junior Explorer" to "Nafes Expert".
- Stamp thresholds (silver/gold/diamond) are applied in `ExcelUploader.tsx` at 70/85/95 points — note this scale is separate from the `RANKS` table and worth reconciling if you touch either.

### Fallback / demo mode
If Firebase env vars are missing or Firestore is unreachable, the app silently falls back to a hardcoded `SAMPLE_STUDENTS` array (10 demo students) in `data.ts`, so the UI never fully breaks.

---

## Features

- **Home** — live stats (totals, per-grade counts, average points), searchable/filterable student grid with Arabic-aware text normalization, a visual rank ladder, and a stamps showcase.
- **StudentDashboard** — circular progress per subject, current rank card, stamps display, comments. Increments `viewCount` in the background.
- **Leaderboard** — top 3 students per grade with medal styling.
- **AdminDashboard** (behind the edit code):
  - Realtime student list via Firestore `onSnapshot`
  - Add/edit/delete student, per-subject point editing with automatic total/rank recalculation
  - Comment management
  - Excel import (`ExcelUploader.tsx`) — bulk import points/students from `.xlsx`, with diff detection against the current roster
  - Bulk points (`BulkPointsDialog.tsx`) — apply +/- points to multiple selected students at once, respecting per-subject caps
  - Change history (`ChangeHistoryDialog.tsx`) — view and restore from `change_logs`
  - A connectivity banner (`DatabaseStatus.tsx`) showing live Firestore vs. local fallback data

### Utility scripts (`scripts/`, run via `npm run ...` or `node scripts/...`)
- `addStudents.js` / `addGrade3Students.js` — seed Firestore with each grade's roster
- `deleteAllData.js` / `.ts` — wipe the `students` collection. **Irreversible** — Firebase Console lets you delete a single collection manually as a safer alternative (Firestore Database → Data → select collection → Delete collection).
- `fixNames.js`, `students_backup.js`
- `testConcurrentAccess.js`, `testFirestoreSync.mjs` — load/stress-test scripts, run via `npm run test:concurrent` / `test:firestore` / `test:all`

---

## Access Control & Security

There are two different "auth" stories here — one implemented, one only ever documented as a future upgrade:

**What's actually running:** `AdminDashboard.tsx` gates its UI behind a single shared secret ("edit code") checked client-side against `VITE_EDIT_CODE` (`data.ts`: `EDIT_CODE`, `verifyEditCode()`). This is not Firebase Authentication and is not enforced by any backend — it's a UI gate, not real access control. The Firebase Auth SDK is initialized in `firebaseConfig.ts` (`getAuth`, emulator support) but `auth` is never consumed anywhere else in the app.

**Firestore security rules** (`firestore.rules`) are what actually enforces write access: reads on `students` and `change_logs` are open to everyone; writes are allowed to anyone as long as the request happens before a hardcoded date — currently `timestamp.date(2030, 12, 31)`. Security here is a self-expiring deadline, not identity-based. `storage.rules` similarly time-boxes writes to avatar/image uploads.

**Why this design:** it avoids requiring teachers to log in, at the cost of anyone with the URL being able to write to Firestore until the rules expire — acceptable for a small, trusted school deployment, not for a public-internet app with many untrusted users.

**Renewing the write-rule deadline** (needed periodically, otherwise writes silently stop working while reads keep working):
1. Open `firestore.rules`, find `allow write: if request.time < timestamp.date(2030, 12, 31);`
2. Push the date further out, e.g. to `2035`
3. Deploy: `firebase deploy --only firestore:rules`
4. Same edit can be made directly in Firebase Console → Firestore Database → Rules → Publish

**Upgrading to real authentication** (not currently built, but the shape of the change is well understood):
1. Enable Email/Password sign-in in Firebase Console → Authentication
2. Change the write rule to `allow write: if request.auth != null;`
3. Add a login page using `signInWithEmailAndPassword`, guard `/admin` with `onAuthStateChanged`
4. Create teacher accounts in Firebase Console → Authentication → Add User (or a small script using `createUserWithEmailAndPassword`)

This removes the need to renew a date every year, at the cost of teachers needing individual accounts and a login step.

---

## Environment Variables

No `.env` file ships in the repo (gitignored). Required variables, read via Vite's `import.meta.env`:

**Firebase client config** (app falls back to demo data if any of these are missing):
```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID       # nafes-passport5
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID   # optional, for Analytics
```

**App-specific:**
```
VITE_EDIT_CODE                 # shared secret to unlock /admin
VITE_USE_FIREBASE_EMULATOR     # 'true' to point at local Firestore/Auth emulators in dev
```

**Server / Node scripts:**
```
NODE_ENV                       # toggles static path resolution in server/index.ts
PORT                            # Express listen port, defaults to 3000
```

**Present but currently dormant** (leftovers from the Manus scaffolding, not used by any active route): `VITE_OAUTH_PORTAL_URL`, `VITE_APP_ID`, `VITE_FRONTEND_FORGE_API_KEY`, `VITE_FRONTEND_FORGE_API_URL`.

To set up a fresh Firebase project instead of reusing `nafes-passport5`: create a project in the Firebase Console, enable Firestore (Native mode), register a Web app to get the config values above, then deploy rules with `firebase deploy --only firestore:rules`.

---

## Development

```bash
pnpm install
pnpm dev              # Vite dev server
pnpm build            # Vite build + esbuild bundle of server/index.ts
pnpm preview           # Preview the production build
pnpm check              # tsc --noEmit
pnpm format             # Prettier

npm run delete-data     # wipe students collection — irreversible
npm run add-students     # seed grade 6 roster
npm run add-grade3        # seed grade 3 roster

npm run test:concurrent   # simulate concurrent site visits
npm run test:firestore      # simulate concurrent Firestore reads/writes
npm run test:all              # both of the above
```

---

## Deployment

Two deployment paths exist in the repo; Firebase Hosting is the one actually live in production.

**Firebase Hosting (primary):**
- `firebase.json` serves `dist/public` as a static SPA with an all-routes-to-`index.html` rewrite (client-side routing) and long-lived cache headers for static assets.
- `.firebaserc` pins the default project to `nafes-passport5`.
- Deploy flow: `pnpm build`, then `firebase deploy --only hosting`. For rule changes: `firebase deploy --only firestore:rules`.
- If the local Firebase CLI isn't linked to the right account: `firebase logout && firebase login && firebase use nafes-passport5`.

**Railway (alternate/secondary):**
- `railway.json` runs a Nixpacks build with `npm run start`, which actually uses `server/index.ts` (unlike the Firebase Hosting path, where the Express server is irrelevant). This path would only matter if a real Node process is needed — e.g., to add server-side API routes in the future.

---

## Known Quirks / Technical Debt

- **No real backend API.** `server/index.ts` only serves static files; all reads/writes go straight from the browser to Firestore using client-side security rules as the only gate.
- **"Edit code" is not authentication.** It gates the UI, not the database. See "Access Control" above.
- **Firebase Auth is initialized but unused.** `auth` is exported from `firebaseConfig.ts` and never consumed.
- **Manus platform leftovers:** `vite-plugin-manus-runtime`, `ManusDialog.tsx`, and OAuth-related env vars/`getLoginUrl()` in `client/src/const.ts` are inert scaffolding from the original app-builder template — safe to remove if you want to clean up, but currently harmless.
- **Stamp thresholds vs. rank thresholds are two separate scales** (70/85/95 for stamps in `ExcelUploader.tsx` vs. the 8-tier 0–100 `RANKS` table) — worth reconciling before making changes to either.
- **`tests/` scripts aren't wired to `vitest`.** `vitest` is a devDependency but `tests/pointsLogic.test.js` and `tests/comprehensiveTest.js` are plain Node scripts, not run through any test runner config.
- **`shared/const.ts`** only has two constants and isn't a meaningful shared schema layer — most domain logic lives in `client/src/lib/`.
