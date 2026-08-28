# Local Development

This project is deliberately small so the moving pieces are easy to understand.

## Architecture

The browser loads a static single-page app and three shared logic modules:

```text
index.html
  -> app.js + styles.css
  -> state-v4.js
  -> recommendation-engine.js
  -> practice-v2-workflow.js
```

`state-v4.js` owns backward-compatible migration, `recommendation-engine.js` owns pure
evidence derivation and candidate selection, and `practice-v2-workflow.js` owns the visible
Ready -> Attempt -> Reflect -> Complete state machine. All three also export CommonJS APIs so
the Node test suite can exercise them without a build system.

The Node server does two jobs in local mode:

1. Serve static files.
2. Read and write tracker state through `/api/state`.

There is no bundler. The server uses Express so the same codebase can support both local
file persistence and hosted Google-authenticated SQLite persistence.

## Server Modes

`server.js` chooses a mode from environment variables.

### Production/local mode

```bash
npm start
```

Equivalent to:

```bash
node server.js
```

Defaults:

```text
PORT=5173
TRACKER_ENV=prod
state file: data/tracker-state.json
backups:    data/backups/
```

### QA mode

```bash
npm run start:qa
```

Equivalent to:

```bash
TRACKER_ENV=qa PORT=5174 node server.js
```

Defaults:

```text
PORT=5174
TRACKER_ENV=qa
state file: data/qa-tracker-state.json
backups:    data/qa-backups/
fixture:    data/fixtures/qa-state.json
```

QA mode exists so feature testing does not mutate real tracker progress.

### Hosted private-beta mode

Hosted mode is opt-in:

```bash
npm run start:hosted
```

It requires these environment variables:

```text
NODE_ENV=production
AUTH_REQUIRED=true
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_CALLBACK_URL
SESSION_SECRET
ALLOWED_EMAILS
SQLITE_PATH
```

Optional hosted-only phone reminder variables:

```text
VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY
VAPID_SUBJECT=https://your-hosted-app.example.com
```

Optional experiment flags:

```text
FEATURE_PHONE_REMINDERS=true
FEATURE_FRIEND_PULSE=true
FEATURE_LEETCODE_IMPORT=true
FEATURE_RECOVERY_LANE=true
FEATURE_PRACTICE_V2=true
FEATURE_PRACTICE_V2_SHADOW=true
FEATURE_LIST_PROGRESS=true
```

All experiment flags default to off. The default product should stay focused on Practice, Library,
Memory, Leaderboard, and Settings. Turn these flags on only when actively testing or
shipping the experiment.

`FEATURE_PRACTICE_V2_SHADOW` runs the deterministic `readiness-v1.9` recommender without changing
the visible recommendation, grades, scheduling, or saved state. QA enables shadow mode
automatically. Its latest comparison is available to developers at
`window.__practiceV2Shadow` and in the browser console.

QA also enables the visible `FEATURE_PRACTICE_V2` workflow automatically. The QA Practice page
therefore shows one adaptive rep instead of the V0 review/new grid. Local and hosted production
enable Practice V2 only when `FEATURE_PRACTICE_V2=true`; the current private-beta deployment sets
that flag explicitly. `FEATURE_LIST_PROGRESS` similarly enables current-evidence Blind 75 and
NeetCode 150 progress bars and is automatic in QA.

The visible workflow keeps the recommendation non-spoiling before completion. It may show the
title, difficulty, time box, and neutral evidence language, but it must not expose topic, task
type, stage, due date, list membership, saved notes, solution details, or private ranking reasons.
Choosing a grade is provisional. Tracker state is written only after the reflection is valid and
the user chooses Save. Back navigation retains drafts, interrupted workflows resume after a
same-tab reload, and Undo removes only the history/activity pair created by the saved rep. It never
restores a whole pre-attempt snapshot, because doing so could erase unrelated edits or another
tab's work.

Practice V2 runtime is stored per user in the current tab's `sessionStorage`. It is not part of
the tracker JSON or hosted SQLite blob. A different tab has an independent draft but shares the
same persisted tracker revision. Idle recommendations are invalidated after a newer revision is
loaded; active stale attempts remain visible but Save is blocked until the user returns to Ready
and receives a fresh recommendation.

`VAPID_SUBJECT` must be a real contact value, such as `mailto:you@example.com` or the
hosted `https://...` origin. Avoid fake `.local` values because push services may reject
their signed tokens.

Hosted mode changes storage and trust boundaries:

```text
storage: SQLite state blobs, one row per Google user
auth:    Google OAuth through Passport
access:  server-side email allowlist
backups: rolling SQLite backup rows per user
```

Hosted mode does not read or write `data/tracker-state.json`. Local state and hosted state
are intentionally separate. To move progress online, export JSON from local mode and import
it after signing in to hosted mode.

Phone reminders are only available when `FEATURE_PHONE_REMINDERS=true` in hosted mode and
VAPID keys are configured. Local and QA file-backed servers hide reminder controls because
they do not have authenticated cloud users or push subscriptions.

## API Endpoints

### `GET /api/env`

Returns the active mode:

```json
{
  "env": "prod",
  "isQa": false,
  "authRequired": false,
  "storageMode": "local"
}
```

The frontend uses this to show QA tools only in QA and cloud account UI only in hosted mode.

### `GET /api/me`

Returns the current auth state. In local mode, it returns an allowed anonymous session. In
hosted mode, it tells the frontend whether the user is logged in and invited.

### `GET /api/state`

Returns the current tracker state:

```json
{
  "version": 4,
  "algorithmVersion": "readiness-v1.9",
  "savedAt": "2026-05-12T00:00:00.000Z",
  "importMeta": null,
  "trainingProfile": {},
  "practicePlan": {},
  "problems": [],
  "sessions": []
}
```

If no state file exists yet, the server returns an empty state. In QA mode, the server
creates `data/qa-tracker-state.json` from `data/fixtures/qa-state.json` when needed.
In hosted mode, this endpoint requires an authenticated invited user and returns that
user's SQLite-backed state blob.

### `POST /api/state`

Accepts the full tracker state and writes it to disk. The server also writes a timestamped
backup snapshot.

This is intentionally simple. The frontend owns normalization and sends the complete
state blob after user actions.

In hosted mode, the request must include the last seen `revision`. If another tab or
device has already saved a newer revision, the server returns `409` and does not overwrite
the newer cloud state.

### `POST /api/reset-qa`

Available only in QA mode. Copies the QA fixture into the active QA state file and returns
the reset state.

This endpoint is disabled in hosted mode.

## Persistence Model

The local version stores the whole tracker as a JSON document:

```text
data/tracker-state.json
```

This makes the app easy to inspect and back up. It is not meant to be a public multi-user
storage model.

The browser still writes a localStorage fallback. The server JSON file is the source of
truth once the local server is running.

Hosted mode stores the same tracker state shape as a SQLite blob in `tracker_state`.
The server adds `revision` to prevent stale overwrites from another tab or device.

Frontend writes are serialized through one save queue. A successful message is shown only
after the server acknowledges the write, and failed or conflicting writes restore the affected
in-memory change instead of pretending it was saved. When an idle hosted tab regains focus it
may load a newer cloud revision, but it will not refresh over a queued save or an active Practice
V2 attempt. A stale active attempt remains recoverable in the tab, but cannot be committed as
fresh evidence until the user returns to Ready and receives a current recommendation.

Manual backfill uses the same JSON state file. From a problem's `Edit -> History` tab, choose
`Log past attempt`; the date and real grade are required, while forgotten historical details can
remain unknown. The frontend stores the entry in `reviewHistory`, replays proper graded history
chronologically, and derives the current schedule from the latest graded attempt date. Manual
graded backfills also add projected rows to `sessions` for activity views. Imported CSV history
remains historical context only and does not create session activity.

`sessions` is a legacy internal storage name for one saved graded activity event. The current
Practice UI does not ask users to start or end a study session; available time is simply an
input that recalculates the next recommendation.

LeetCode imports from the optional Chrome extension use the same historical lane as CSV
import. The extension first reads LeetCode's signed-in submissions API and falls back to
rendered progress pages if needed. Captured rows add or merge problem records and
`grade: "imported"` history entries, but they do not create `sessions`, real
red/yellow/green grades, habit completion, Friend Pulse completion, or leaderboard weekly
activity. Imported-only records are derived as `Seen, unverified`, ignored by due-review
selection and backlog calculations, and have no trusted schedule until a real graded attempt is
saved. Practice V2 labels them `Assessment pending` and decides when an assessment is the best
next rep. In the legacy V0 fallback, `Practice now` launches the older cold-check flow, which maps
red/yellow/green to Stage 0/1/2 and atomically stores its benchmark metadata only when
`Finish cold check` is chosen. Individual rows can also
be removed from the pending import; removed rows are skipped and do not change app state.

The replay uses the same spaced-repetition transition as Today grading. Clean attempts
before the scheduled review date are stored with `heldForEarly: true`, keep the existing
`nextReview`, and do not increase `greenStreak`. Extremely overdue clean attempts are
stored with `heldForOverdue: true`. Red and yellow attempts always reschedule from the
attempt date.

## Routes

The app has client-side routes served by the same `index.html` file:

```text
/index.html
/library
/memory
/diagnostics
/settings
/data-management
/leaderboard
```

`/diagnostics` remains a backwards-compatible route for the Memory view, and
`/data-management` remains a backwards-compatible route for Settings.

When `FEATURE_FRIEND_PULSE=true`, the app also serves:

```text
/pacts
```

`server.js` maps those routes back to `index.html`, then `app.js` chooses which view to
show.

Leaderboard APIs are available only in hosted mode and QA mode. Friend Pulse APIs are also
behind `FEATURE_FRIEND_PULSE=true`. Local production mode returns `404` for social
endpoints so a plain local JSON tracker does not accidentally expose social surfaces.

## Safe Git Data Policy

Commit:

```text
data/blind-75.js
data/neetcode-150.js
data/fixtures/qa-state.json
```

Do not commit:

```text
data/tracker-state.json
data/qa-tracker-state.json
data/backups/
data/qa-backups/
```

The ignored files can include personal notes, real progress, and solution references.

## Development Checklist

After code changes:

```bash
npm run check
```

Then manually verify the relevant mode:

```bash
npm start
npm run start:qa
```

Use QA for destructive testing. Use production/local mode for real practice.
