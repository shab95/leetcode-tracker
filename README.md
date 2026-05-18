# LeetCode Tracker

A local-first DSA anti-forgetting tracker. The app is designed around a simple daily loop:
do one due review, do one new problem, grade honestly, and let spaced repetition handle
the next review date.

The project intentionally starts small: static HTML/CSS/JavaScript plus a tiny Node
server that saves tracker state to a local JSON file. There is no build system and no
database yet.

## What It Does

- Tracks LeetCode/DSA problems, notes, review history, stages, and mastery.
- Recommends exactly one due review and one new problem on the Dashboard.
- Lets you backfill real graded attempts from the edit modal's History tab.
- Supports Blind 75 and NeetCode 150 as selectable study lists.
- Uses grading buttons after an attempt:
  - `Could not solve`
  - `Solved with hints / slow`
  - `Solved cleanly`
- Hides notes and solution references before grading so they do not become hints.
- Shows Diagnostics for backlog pressure, attention topics, stage distribution, and
  recent grade quality.
- Provides a Data Management page for CSV import, JSON backup/restore, and list seeding.
- Includes QA mode with disposable fixture data.

The review algorithm is documented in [docs/review-algorithm.md](docs/review-algorithm.md).

## Requirements

- Node.js 18 or newer
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

1. Open `Data Management`.
2. Choose one or more setup actions:
   - `Seed Blind 75` to add the built-in Blind 75 list.
   - `Seed NeetCode 150` to add the built-in NeetCode 150 list.
   - `Import CSV once` if you already have historical tracker data.
   - `Import JSON` if you are restoring from a previous app export.
3. Return to `Dashboard`.

You do not need to seed both lists. Seed only the study lists you want to track. If you seed
both Blind 75 and NeetCode 150, overlapping problems are merged into one row with both
badges and one shared review history.

The Dashboard's `New problem source` selector controls whether the daily new-problem pick
comes from Blind 75 or NeetCode 150.

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

Use `Data Management -> Reset QA data` to restore QA to the fixture state.

## Data Management

Open `Data Management` in the top navigation for rare/admin actions:

- `Import CSV once`: migrates an existing tracker CSV into app state.
- `Seed Blind 75`: adds/merges built-in Blind 75 problems.
- `Seed NeetCode 150`: adds/merges built-in NeetCode 150 problems.
- `Export JSON`: downloads a full backup of the current state.
- `Import JSON`: restores a previously exported state.

Imported solved CSV rows count as prior attempts, not automatic mastery.

You can also backfill individual attempts from a problem's `Edit -> History` tab. Manual
backfill is for attempts completed outside the app and uses real grades only, so the review
schedule is rebuilt from the most recent graded attempt date.

## Safety Notes

This app is local-first. The current server trusts whoever can reach it. Do not expose
`server.js` directly to the public internet.

Git ignores real runtime data:

```text
data/tracker-state.json
data/qa-tracker-state.json
data/backups/
data/qa-backups/
```

Commit only source files, built-in study lists, docs, and safe fixtures.

## Project Structure

```text
index.html                  App shell and views
styles.css                  App styling
app.js                      Frontend state, rendering, grading, import/export
server.js                   Local static server and JSON persistence API
data/blind-75.js            Built-in Blind 75 list
data/neetcode-150.js        Built-in NeetCode 150 list
data/fixtures/qa-state.json Safe QA fixture state
docs/review-algorithm.md    Scheduling and mastery source of truth
docs/local-development.md   Local architecture notes
docs/online-hosting-plan.md Future hosted-app plan
```

## Useful Commands

```bash
npm start
npm run start:qa
npm run check
```

`npm run check` runs JavaScript syntax checks for the app and server.

## Future Online Version

The current local app can evolve into a hosted multi-user app. The recommended path is
Railway + Google OAuth + SQLite on a persistent volume. See
[docs/online-hosting-plan.md](docs/online-hosting-plan.md).
