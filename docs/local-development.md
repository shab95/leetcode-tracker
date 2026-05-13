# Local Development

This project is deliberately small so the moving pieces are easy to understand.

## Architecture

The browser loads a static single-page app:

```text
index.html -> app.js + styles.css
```

The Node server does two jobs:

1. Serve static files.
2. Read and write tracker state through `/api/state`.

There is no bundler, framework, database, or package dependency in the local version.

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

## API Endpoints

### `GET /api/env`

Returns the active mode:

```json
{
  "env": "prod",
  "isQa": false
}
```

The frontend uses this to show the QA badge and reset button only in QA.

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

### `POST /api/state`

Accepts the full tracker state and writes it to disk. The server also writes a timestamped
backup snapshot.

This is intentionally simple. The frontend owns normalization and sends the complete
state blob after user actions.

### `POST /api/reset-qa`

Available only in QA mode. Copies the QA fixture into the active QA state file and returns
the reset state.

## Persistence Model

The local version stores the whole tracker as a JSON document:

```text
data/tracker-state.json
```

This makes the app easy to inspect and back up. It is not meant to be a public multi-user
storage model.

The browser still writes a localStorage fallback. The server JSON file is the source of
truth once the local server is running.

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
