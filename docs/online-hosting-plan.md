# Private Beta Hosting And Operations Guide

**Status:** Implemented. This document describes the current hosted private-beta architecture
and its operating constraints, not a future proposal.

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
algorithmVersion
savedAt
revision
importMeta
trainingProfile
practicePlan
problems
sessions
```

The current document schema is v4 and the recommendation engine identifies itself separately
(currently `readiness-v1.9`). `sessions` is a legacy internal name for saved graded activity
events; the Practice UI no longer asks the user to start or end a study session.

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
FEATURE_PRACTICE_V2=true
FEATURE_PRACTICE_V2_SHADOW=true
FEATURE_LIST_PROGRESS=true
SQLITE_STARTUP_SNAPSHOT=pre-release-snapshot-name
VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY
VAPID_SUBJECT=https://your-hosted-app.example.com
NOTIFICATION_CHECK_INTERVAL_MS=60000
```

Practice V2 and list-progress surfaces are independently flaggable so the hosted release can
fall back without rewriting tracker data. QA enables them automatically. Reminder, pact,
Recovery Lane, and leaderboard navigation features have their own flags/preferences and are not
required for the core adaptive practice flow.

`ALLOWED_EMAILS` is comma-separated:

```text
you@example.com,friend@example.com
```

`SQLITE_PATH` must point to durable storage. On Railway, put it under the mounted volume.

Phone reminders are optional. Generate Web Push VAPID keys locally:

```bash
npx web-push generate-vapid-keys
```

Store the public key in `VAPID_PUBLIC_KEY`, the private key in `VAPID_PRIVATE_KEY`, and
set `VAPID_SUBJECT` to a real contact value: either `mailto:you@example.com` or the
hosted `https://...` origin. Do not use fake `.local` values, and do not commit the
private key.

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
FEATURE_PRACTICE_V2=true
FEATURE_PRACTICE_V2_SHADOW=true
FEATURE_LIST_PROGRESS=true
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=https://your-hosted-app.example.com
```

For a major state-schema rollout, an operator may also set a one-time snapshot name before
deploying:

```text
SQLITE_STARTUP_SNAPSHOT=pre-release-snapshot-name
```

On startup, the server creates `<snapshot-name>.sqlite` beside the active database with
SQLite's transactional `VACUUM INTO`, verifies it with `PRAGMA integrity_check`, and refuses
to start if the snapshot is invalid. Reusing the same name is idempotent. Remove the variable
after the release is verified; normal per-user rolling backups continue independently.

5. Use one app replica while SQLite is the database.
6. Deploy.
7. Open the app, sign in with an allowlisted email, then import a JSON backup or seed built-in
   lists from Settings.

## Phone Reminders

Hosted mode can send an optional daily practice reminder. The reminder is motivational
only: it checks whether the user has already logged an honest rep for their local date and
sends a notification only when today's rep is still open.

To use reminders on iPhone:

1. Open the hosted site in Safari.
2. Add it to the Home Screen.
3. Launch the tracker from the Home Screen icon.
4. Enable reminders from Settings.

The app uses an in-process reminder loop, SQLite, and Web Push subscriptions, so keep the
Railway service at one replica for this version.

## First User Flow

Hosted state starts empty. That is deliberate because local and hosted data are separate.

To move your current progress online:

1. Run local mode.
2. Go to Settings.
3. Export JSON.
4. Open the hosted app and sign in.
5. Go to Settings.
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

The frontend also serializes state-changing requests so rapid actions cannot reuse the same
revision. It reports success only after acknowledgement. Idle tabs may refresh newer state when
they regain focus, but never while a save is queued or an active Practice V2 attempt is open.
Active stale attempts stay visible for recovery and are blocked from saving until recalculated.

This is not real-time collaboration. It is a guardrail for one person using multiple tabs or
devices.

## Static File Safety

Hosted mode only serves app assets:

```text
index.html
app.js
state-v4.js
recommendation-engine.js
practice-v2-workflow.js
styles.css
manifest.webmanifest
pwa-icon.svg
service-worker.js
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

Additional leaderboard, social, and Web Push endpoints are exposed only when their hosted
mode and feature requirements are satisfied. They do not bypass the authenticated allowlist or
gain access to another user's private tracker document.

## What This Does Not Solve Yet

- Multi-replica SQLite writes. Keep Railway replicas at one.
- Public self-service signup. Access is allowlist-only.
- Relational analytics queries. Tracker state is still stored as a blob.
- Automatic local-to-cloud sync. Use JSON export/import intentionally.
- Server-side synchronization of an in-progress Practice V2 draft. Drafts are deliberately
  scoped to one browser tab; only completed evidence is shared across tabs and devices.
