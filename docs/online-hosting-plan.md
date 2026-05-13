# Online Hosting Plan

This document is future work. It describes how the local-first tracker can become a
hosted multi-user app without rewriting the whole product at once.

## Goal

Host the tracker online so multiple users can sign in from different browsers/devices and
keep their data separate.

The hosted version should preserve the current product loop:

```text
1 due review + 1 new problem -> attempt -> grade -> schedule next review
```

## Recommended Stack

- Hosting: Railway
- Auth: Google OAuth
- Storage: SQLite on a Railway persistent volume
- Runtime: Node.js

This keeps the first hosted version small while adding the missing production pieces:

- identity
- per-user data isolation
- durable server-side storage
- HTTPS through the hosting platform

## Why Not Expose the Current Server?

The current `server.js` is a local-trust server:

- no login
- no authorization
- one shared state file
- anyone who can reach `/api/state` can read or write data

That is fine for localhost. It is not safe as a public internet service.

## V1 Hosted Architecture

Keep the static frontend mostly the same. Replace shared file state with authenticated,
user-scoped state.

Suggested endpoints:

```text
GET  /auth/google
GET  /auth/google/callback
POST /auth/logout
GET  /api/me
GET  /api/state
POST /api/state
GET  /api/health
```

`/api/state` can keep the current full JSON state shape in v1, but it must be scoped to
the signed-in user.

## Suggested SQLite Tables

Start with a state-blob model to reduce migration risk:

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  google_sub TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  name TEXT,
  created_at TEXT NOT NULL,
  last_login_at TEXT NOT NULL
);

CREATE TABLE tracker_state (
  user_id INTEGER PRIMARY KEY,
  version INTEGER NOT NULL,
  state_json TEXT NOT NULL,
  saved_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

Later, the state blob can be split into relational tables if analytics or collaboration
needs it:

```text
problems
review_history
sessions
settings
```

## Railway Environment Variables

Expected variables:

```text
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_REDIRECT_URI
SESSION_SECRET
NODE_ENV=production
```

Use Railway's volume mount path for SQLite. If Railway exposes `RAILWAY_VOLUME_MOUNT_PATH`,
store the database there. In local development, keep using `data/`.

## Migration Strategy

1. Export current local data from Data Management.
2. Deploy hosted app with Google login.
3. Sign in.
4. Import the exported JSON into the signed-in account.
5. Confirm Dashboard, Diagnostics, grading, and Data Management work online.
6. Keep local JSON export as an emergency backup path.

## Security Requirements

Before public hosting:

- require sign-in for all app routes or all state endpoints
- scope all state reads/writes to the authenticated user
- use secure session cookies in production
- reject oversized state payloads
- keep secrets in Railway environment variables
- do not commit real tracker state or OAuth secrets

## What Stays the Same

- Daily workflow
- Review stages
- Mastery rule
- Blind 75 and NeetCode 150 built-in lists
- JSON import/export
- Diagnostics as explanatory signals only

## What Changes

- Data is no longer one local JSON file.
- State becomes per-user.
- The server needs auth/session middleware.
- Deployment uses a real host and persistent volume.

## Open Questions for Implementation

- Whether to support invite-only Google accounts or any Google account.
- Whether QA should remain local-only or get a hosted staging environment.
- Whether to keep the state-blob table long term or migrate to relational problem tables.
