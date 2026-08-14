# LeetCode Tracker

A local-first DSA interview-practice tracker. Practice V2 chooses the strongest next rep for
the user's available time, records honest evidence, and balances coverage, repair, transfer,
and same-title recall without discarding the existing spaced-repetition history.

The project intentionally stays small: static HTML/CSS/JavaScript plus a Node server.
By default it saves tracker state to a local JSON file. It can also run in a private-beta
hosted mode with Google OAuth and per-user SQLite storage.

## What It Does

- Tracks LeetCode/DSA problems, notes, honest attempt evidence, and exact-title review history.
- Recommends one adaptive next rep based on time, coverage, recent evidence, transfer gaps,
  and same-title recall pressure when Practice V2 is enabled.
- Lets you backfill real graded attempts from the edit modal's History tab.
- Supports Blind 75 and NeetCode 150 as shared built-in coverage lists.
- Uses evidence-oriented outcomes after an attempt:
  - `Could not solve`
  - `Solved with help or heavy friction`
  - `Solved independently`
- Records elapsed time, implementation friction, approach efficiency, and complexity confidence
  separately so a correct independent solve is not mislabeled solely for being slow or suboptimal.
- Hides notes and solution references before grading so they do not become hints.
- Shows Memory for checked, independent, and transfer-supported skill evidence plus recent
  outcomes and evidence gaps.
- Provides a Settings page for CSV import, JSON backup/restore, list seeding, and optional experiments.
- Includes QA mode with disposable fixture data.
- Supports an optional private-beta cloud mode for invited Google accounts.
- Keeps experimental motivation features behind flags so the default app stays focused.

The review algorithm is documented in [docs/review-algorithm.md](docs/review-algorithm.md).
The next adaptive practice flow is specified in
[docs/practice-v2-spec.md](docs/practice-v2-spec.md).
Product direction and upcoming UX work live in
[docs/product-roadmap.md](docs/product-roadmap.md).
The concise implementation handoff and current invariants live in
[docs/current-context.md](docs/current-context.md).

## Requirements

- Node.js 22 or newer
- A modern browser

Install Node from [nodejs.org](https://nodejs.org/) or with Homebrew:

```bash
brew install node
```

Check the install:

```bash
node --version
npm --version
```

## Run Locally

From the project folder:

```bash
npm start
```

Open:

```text
http://127.0.0.1:5173/index.html
```

Production/local mode saves to:

```text
data/tracker-state.json
```

Backups are written to:

```text
data/backups/
```

Those runtime files are intentionally ignored by Git because they may contain personal
progress, notes, and solution references.

## First Local Setup

A fresh clone does not include personal tracker state. That is intentional.

On first run, if `data/tracker-state.json` does not exist, the app starts with an empty
state. The file is created automatically the first time you save data, import data, seed a
study list, grade a problem, or edit a problem.

To populate the app:

1. Open `Settings`.
2. Choose one or more setup actions:
   - `Seed Blind 75` to add the built-in Blind 75 list.
   - `Seed NeetCode 150` to add the built-in NeetCode 150 list.
   - `Import CSV once` if you already have historical tracker data.
   - `Import JSON` if you are restoring from a previous app export.
3. Return to `Practice`.

You do not need to seed both lists. Seed only the study lists you want to track. If you seed
both Blind 75 and NeetCode 150, overlapping problems are merged into one row with both
badges and one shared review history.

When Practice V2 is enabled, every seeded list contributes candidates to the adaptive plan.
The plan uses current evidence, available time, exact-title recall pressure, transfer need,
and recent work to choose one rep. List progress remains visible in Memory; seeding a list
does not make imported exposure count as trusted evidence.

## Run QA Mode

QA mode uses fake fixture data so you can test without touching real progress:

```bash
npm run start:qa
```

Open:

```text
http://127.0.0.1:5174/index.html
```

QA mode saves to:

```text
data/qa-tracker-state.json
```

QA backups are written to:

```text
data/qa-backups/
```

The clean QA fixture lives at:

```text
data/fixtures/qa-state.json
```

Use `Settings -> Reset QA data` to restore QA to the fixture state.

## Settings

Open `Settings` in the top navigation for rare/admin actions:

- `Import CSV once`: migrates an existing tracker CSV into app state.
- `Import from LeetCode history`: reviews progress rows captured by the optional Chrome
  extension and imports them as historical context.
- `Seed Blind 75`: adds/merges built-in Blind 75 problems.
- `Seed NeetCode 150`: adds/merges built-in NeetCode 150 problems.
- `Export JSON`: downloads a full backup of the current state.
- `Import JSON`: restores a previously exported state.

Imported solved CSV rows count as prior exposure, not automatic mastery or trusted review
evidence. Until a real grade is recorded, Library labels them `Seen, unverified` and keeps
them out of the due-review backlog.
LeetCode progress imports follow the same idea: Accepted submissions are not treated as
`Solved cleanly`, failed submissions are not treated as real missed solves, and no imported
row counts toward Minimum Practice, Friend Pulse, leaderboard weekly stats, or mastery
green streaks.

During import review, LeetCode rows can carry a provisional confidence level and you can
remove rows you do not want to track. Under Practice V2, imported-only titles appear as
`Assessment pending`; the adaptive plan decides when an honest assessment is the best next
rep. In the legacy V0 fallback, `Library -> Practice now` launches the older cold-check
workflow. Imported history remains exposure-only in either mode.
The Practice card shows two timing landmarks before you begin:

| Difficulty | Independent checkpoint | Full attempt ceiling |
| --- | ---: | ---: |
| Easy | 10 minutes | 20 minutes |
| Medium | 15 minutes | 30 minutes |
| Hard | 20 minutes | 45 minutes |

At the checkpoint, stop and learn when no coherent approach has formed. When the approach
is making real progress, continue up to the full ceiling. These are guides rather than a
solution lock. The timer itself is LeetCode's stopwatch; the tracker records its final
minute value after the grade.

The available-time control is not a session timer. Changing it recalculates the next adaptive
rep and may select a different problem. After saving one honest rep, you can stop or choose
`Do another rep`; there is no separate session to end.

You can also backfill individual attempts from a problem's `Edit -> History` tab. Manual
backfill is for attempts completed outside the app and uses real grades only, so the review
schedule is rebuilt from the most recent graded attempt date.

Early clean solves are recorded, but they do not advance the review stage until the
scheduled review date arrives. This keeps the app honest about spaced recall: practicing
early can help, but it does not prove durability. Early missed or slow solves still update
the schedule immediately because they reveal weakness.

### Optional Chrome Extension Import

The unpacked extension in `extension/leetcode-history/` can capture LeetCode submission
history while you are already logged in to LeetCode. You can click it from any Chrome tab.
It first reads LeetCode's signed-in submissions API, then falls back to briefly opening
LeetCode progress pages in the background if the API is unavailable.

To install it locally:

1. Open Chrome at `chrome://extensions`.
2. Enable `Developer mode`.
3. Choose `Load unpacked`.
4. Select `extension/leetcode-history`.
5. Sign in to LeetCode in that Chrome profile.
6. Click the extension's `Capture Practice History` action from any Chrome tab.
7. Open tracker `Settings`, review the captured rows, remove anything irrelevant, choose
   the starting stage if needed, and import them.

The extension does not ask for LeetCode credentials and does not capture submitted code.

## Safety Notes

This app is local-first by default. Local mode trusts whoever can reach it, so do not expose
local mode directly to the public internet.

Git ignores real runtime data:

```text
data/tracker-state.json
data/qa-tracker-state.json
data/backups/
data/qa-backups/
data/*.sqlite
.env
```

Commit only source files, built-in study lists, docs, and safe fixtures.

## Private Beta Hosted Mode

Hosted mode is for a small invite-only deployment. It keeps local mode working, but changes
storage and access control:

- Google OAuth is required.
- Only emails in `ALLOWED_EMAILS` can use the app.
- Each user gets a separate SQLite-backed tracker state.
- Local JSON files are not read or written in hosted mode.
- Saves include a `revision`; stale saves return a conflict instead of overwriting newer data.
- Imports and normal saves create rolling server-side backups.

Required environment variables:

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
VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY
VAPID_SUBJECT=https://your-hosted-app.example.com
NOTIFICATION_CHECK_INTERVAL_MS=60000
FEATURE_PHONE_REMINDERS=false
FEATURE_FRIEND_PULSE=false
FEATURE_LEETCODE_IMPORT=false
FEATURE_RECOVERY_LANE=false
FEATURE_PRACTICE_V2=false
FEATURE_PRACTICE_V2_SHADOW=false
FEATURE_LIST_PROGRESS=false
```

### Experimental Feature Flags

The default hosted app keeps the main practice loop clean. These experiments are hidden
unless explicitly enabled:

- `FEATURE_PHONE_REMINDERS=true`: hosted push reminders when today's honest rep is still open.
  Requires valid `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY`.
- `FEATURE_FRIEND_PULSE=true`: the `Pacts` tab, exact-handle search, pact requests, and
  Friend Pulse panel.
- `FEATURE_LEETCODE_IMPORT=true`: the Settings card and review flow for importing LeetCode
  progress captured by the Chrome extension.
- `FEATURE_RECOVERY_LANE=true`: the manual Recovery Lane focus list and its priority rule.
- `FEATURE_PRACTICE_V2_SHADOW=true`: computes a developer comparison recommendation without
  changing the visible pick or persisted state. QA enables this automatically.
- `FEATURE_PRACTICE_V2=true`: enables the visible single-rep Practice V2 workflow. QA enables
  it automatically. Local and hosted production use V0 only when this flag is absent or false;
  the current private-beta deployment enables it explicitly.
- `FEATURE_LIST_PROGRESS=true`: shows current-evidence progress for Blind 75 and NeetCode 150.
  QA enables it automatically. Imported-only and stale evidence do not color these bars.

Phone reminders require VAPID keys. Generate keys with:

```bash
npx web-push generate-vapid-keys
```

Hosted users can optionally enable the leaderboard. Its V2 views use aggregate signals only:

- `This week`: practice days, real graded reps, distinct skill areas, and independent reps.
- `Readiness`: skill areas checked, solved independently, and supported by transfer evidence
  during the rolling 30-day evidence window, plus current Blind 75 and NeetCode 150 coverage.
- `All Time`: cumulative unique graded titles, independent titles, total real reps, and
  lifetime uniquely graded Blind 75 and NeetCode 150 coverage.
- There is no composite score. Problem names, topics practiced by a person, notes, grades,
  timing, assistance details, and raw history stay private.

When Friend Pulse is enabled, hosted users can opt into social features from `Pacts`:

- `Show on leaderboard` shares aggregate practice stats only.
- `Allow daily pacts` lets other opted-in users find an exact `@handle` and request a
  daily pact.
- Pending outgoing pact requests can be retracted from `Pacts`.
- Friend Pulse pacts show only whether each person completed Minimum Practice today.
  Problem names, grades, notes, timestamps, and raw history stay private.

Set `VAPID_SUBJECT` to a real contact value, either `mailto:you@example.com` or the
hosted `https://...` origin. Do not use fake `.local` values; some push services reject
those tokens.

For phone reminders, install the hosted tracker as a Home Screen web app first:

- iPhone: open the hosted tracker in Safari, tap Share, choose Add to Home Screen,
  then open the tracker from the new icon.
- Android: open the hosted tracker in Chrome, tap the menu, choose Add to Home screen,
  then open the tracker from the new icon.

Run hosted mode locally for smoke testing:

```bash
npm run start:hosted
```

That command needs the hosted environment variables above. For Railway deployment,
store `SQLITE_PATH` on a persistent volume and run one app replica while using SQLite.
See [docs/online-hosting-plan.md](docs/online-hosting-plan.md) for the full setup guide.

## Project Structure

```text
index.html                  App shell and views
styles.css                  App styling
app.js                      Frontend orchestration, rendering, persistence, import/export
server.js                   Express server for local JSON persistence and hosted SQLite mode
state-v4.js                 Backward-compatible state migration and normalization
recommendation-engine.js    Pure Practice V2 evidence and recommendation rules
practice-v2-workflow.js     Practice V2 state machine and runtime normalization
data/blind-75.js            Built-in Blind 75 list
data/neetcode-150.js        Built-in NeetCode 150 list
data/fixtures/qa-state.json Safe QA fixture state
docs/review-algorithm.md    Scheduling and mastery source of truth
docs/practice-v2-spec.md    Adaptive practice product and implementation contract
docs/current-context.md     Current architecture, invariants, and handoff context
docs/local-development.md   Local architecture notes
docs/online-hosting-plan.md Implemented private-beta hosting and operations guide
tests/                      Node regression tests for state, scheduling, and workflows
```

## Useful Commands

```bash
npm start
npm run start:qa
npm run start:hosted
npm run check
```

`npm run check` runs JavaScript syntax checks for the app, server, state migration,
recommendation engine, and workflow, then runs the Node regression suite.

## Online Version

The hosted private-beta path is Railway + Google OAuth + SQLite on a persistent volume.
Local and hosted state are intentionally separate, so export JSON locally and import it
after signing in online. See [docs/online-hosting-plan.md](docs/online-hosting-plan.md).
