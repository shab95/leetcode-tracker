# Local Development

This project is deliberately small so the moving pieces are easy to understand.

## Architecture

The browser loads a static single-page app:

```text
index.html -> app.js + styles.css
```

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
  "version": 3,
  "savedAt": "2026-05-12T00:00:00.000Z",
  "importMeta": null,
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

Manual backfill uses the same JSON state file. A backfilled attempt is stored in the
problem's `reviewHistory` with a real grade, then the frontend rebuilds that problem's
stage and next review from chronological graded history. Backfills do not add rows to
`sessions`, because diagnostics use sessions for attempts made inside the app.

The replay uses the same spaced-repetition transition as Today grading. Clean attempts
before the scheduled review date are stored with `heldForEarly: true`, keep the existing
`nextReview`, and do not increase `greenStreak`. Extremely overdue clean attempts are
stored with `heldForOverdue: true`. Red and yellow attempts always reschedule from the
attempt date.

## Routes

The app has client-side routes served by the same `index.html` file:

```text
/index.html
/diagnostics
/data-management
```

`server.js` maps those routes back to `index.html`, then `app.js` chooses which view to
show.

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
