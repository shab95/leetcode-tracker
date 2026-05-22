# Private Beta Hosting Guide

This app can run in two intentionally separate modes:

- **Local mode**: no login, JSON file storage, meant for your laptop.
- **Hosted private beta**: Google login, email allowlist, SQLite storage, meant for a
  small invited group.

Do not expose local mode to the internet. Hosted mode exists so the server can enforce
authentication, authorization, safer static serving, per-user storage, and conflict checks.

## Hosted Architecture

Hosted mode uses the same frontend and tracker state shape, but changes the trust boundary:

```text
Browser -> Express server -> Google OAuth session -> allowlist check -> SQLite state blob
```

The app still saves one full tracker document:

```text
version
savedAt
revision
importMeta
problems
sessions
```

The difference is that the blob is scoped to a signed-in Google user instead of a local JSON
file. Local and hosted state are not automatically synced.

## Required Environment

Hosted mode starts only when all required variables are present:

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

Optional:

```text
MAX_STATE_BYTES=5000000
BACKUP_RETENTION=20
```

`ALLOWED_EMAILS` is comma-separated:

```text
you@example.com,friend@example.com
```

`SQLITE_PATH` must point to durable storage. On Railway, put it under the mounted volume.

## Google OAuth Setup

1. Open Google Cloud Console.
2. Create or select a project.
3. Configure the OAuth consent screen.
4. Create an OAuth Client ID for a web application.
5. Add the hosted callback URL:

```text
https://YOUR-APP.up.railway.app/auth/google/callback
```

6. For local smoke testing, you can also add:

```text
http://127.0.0.1:5173/auth/google/callback
```

7. Copy the client ID and secret into environment variables.

## Railway Deployment

1. Push the repo to GitHub.
2. Create a Railway project from the GitHub repo.
3. Attach one persistent volume.
4. Set the environment variables:

```text
NODE_ENV=production
AUTH_REQUIRED=true
PORT=5173
HOST=0.0.0.0
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=https://YOUR-APP.up.railway.app/auth/google/callback
SESSION_SECRET=use-a-long-random-secret
ALLOWED_EMAILS=you@example.com
SQLITE_PATH=/path/to/railway/volume/tracker.sqlite
```

5. Use one app replica while SQLite is the database.
6. Deploy.
7. Open the app, sign in with an allowlisted email, then import a JSON backup or seed built-in
   lists from Data Management.

## First User Flow

Hosted state starts empty. That is deliberate because local and hosted data are separate.

To move your current progress online:

1. Run local mode.
2. Go to Data Management.
3. Export JSON.
4. Open the hosted app and sign in.
5. Go to Data Management.
6. Import JSON.

The hosted import replaces your cloud state and creates a server-side backup first.

## Backups And Recovery

Hosted mode keeps rolling backups in SQLite before replacing state. The default retention is
20 backups per user.

The easiest personal recovery path is still:

1. Export JSON regularly.
2. If cloud state looks wrong, import a known-good JSON export.

The server-side backups are there for operator recovery and accidental import protection.

## Stale Save Protection

Every hosted state has a `revision`.

1. `GET /api/state` returns the current revision.
2. The frontend includes that revision on `POST /api/state`.
3. If another tab or device saved first, the server returns `409`.
4. The app shows a conflict warning and does not silently overwrite cloud state.

This is not real-time collaboration. It is a guardrail for one person using multiple tabs or
devices.

## Static File Safety

Hosted mode only serves app assets:

```text
index.html
app.js
styles.css
data/blind-75.js
data/neetcode-150.js
```

It does not serve runtime JSON state, backups, SQLite files, `.env`, Git internals, package
metadata, or arbitrary repo files.

## API Summary

```text
GET  /api/health
GET  /api/env
GET  /api/me
GET  /auth/google
GET  /auth/google/callback
POST /auth/logout
GET  /api/state
POST /api/state
```

`/api/reset-qa` is local/QA only and is unavailable in hosted production.

## What This Does Not Solve Yet

- Multi-replica SQLite writes. Keep Railway replicas at one.
- Public self-service signup. Access is allowlist-only.
- Relational analytics queries. Tracker state is still stored as a blob.
- Automatic local-to-cloud sync. Use JSON export/import intentionally.
