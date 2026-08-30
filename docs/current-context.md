# Current Product Context

**As of:** August 28, 2026

This is the short handoff for the product as it exists now. It describes current behavior and
the invariants future work must preserve. It is not a replacement for the detailed algorithm or
Practice V2 specification.

## Product In One Sentence

DSA Tracker is an adaptive interview-practice coach that chooses one high-value LeetCode rep from
the user's current evidence, available time, and seeded problem lists, then records an honest,
multi-dimensional reflection.

## Sources Of Truth

- [`practice-v2-spec.md`](practice-v2-spec.md): Practice V2 UX, recommendation contract, state,
  edge cases, and acceptance criteria.
- [`review-algorithm.md`](review-algorithm.md): exact-title scheduler, grading, mastery, imports,
  activity, and explanatory metrics.
- [`product-roadmap.md`](product-roadmap.md): product direction and priorities.
- [`local-development.md`](local-development.md): architecture, runtime modes, persistence, and
  local testing.
- [`online-hosting-plan.md`](online-hosting-plan.md): implemented hosted architecture and Railway
  operations.

## Current Experience

### Practice

- Shows one adaptive `Next rep`, not one fixed review plus one fixed new problem.
- Uses available time to filter and rank feasible work; changing time may select a different rep.
- Can recommend independent evidence, exact-title retention, transfer, repair, optimization,
  assessment, or new coverage.
- Does not reveal topic/pattern rationale before the attempt when that would leak the solution.
- Runs Ready -> Attempt -> Reflect -> Complete.
- Captures elapsed stopwatch time or `not tracked`, independent outcome, blocker/friction,
  approach efficiency, complexity confidence, and an optional note.
- Keeps grade independent from time and optimality. A correct independent solve may be slower or
  suboptimal without being relabeled as assisted.
- Supports a targeted Undo for the most recently saved rep in the same tab.

### Library

- Search, filter, sort, inspect, and edit all problems.
- Shows evidence-oriented state such as independent/assisted/missed evidence, freshness, last
  checked date, and exact-title next review where relevant.
- Preserves list memberships, notes, solutions, history, and manual backfill.

### Memory

- Explains readiness and learning pressure without controlling the recommendation directly.
- List progress uses real graded evidence only. Imported historical context does not fill the
  readiness bar.
- Keeps detailed signals away from the Practice decision point.

### Leaderboard And Optional Features

- Leaderboard visibility is user-controlled and can be hidden without changing opt-in data.
- Recovery Lane, Friend Pulse/pacts, phone reminders, and related experiments remain feature
  gated and may be hidden while preserving their stored data.
- Minimum Practice remains a gentle `showed up today` signal. It does not affect scheduling,
  mastery, or recommendation scores.

## Data And Algorithm Versions

- Tracker document schema: **v4**.
- Current recommendation engine: **`readiness-v2.0` when `recommendationV2` is enabled; otherwise `readiness-v1.9`**.
- Core document fields include `trainingProfile`, `practicePlan`, `problems`, and `sessions`.
- `sessions` is a legacy internal name for saved graded activity events, not a user-managed study
  session.
- Old v3/V0 state is normalized in memory without deleting history, notes, list memberships, or
  review dates.

## Module Ownership

- [`app.js`](../app.js): UI, normalization integration, persistence orchestration, imports, and
  legacy V0 fallback.
- [`state-v4.js`](../state-v4.js): v4 state defaults and migration.
- [`recommendation-engine.js`](../recommendation-engine.js): deterministic candidate generation,
  ranking, reason codes, cooldowns, and time fit.
- [`practice-v2-workflow.js`](../practice-v2-workflow.js): Practice V2 draft state and workflow
  transitions.
- [`server.js`](../server.js): local/QA JSON persistence, hosted auth/SQLite persistence, backups,
  revisions, feature flags, static allowlist, and optional hosted APIs.

## Critical Recommendation Invariants

- A recommendation is derived from current saved state; candidate score queues are not persisted.
- A recently completed title cannot immediately reappear inside its elapsed-hour cooldown.
- Future-dated evidence is ignored for recency, cooldown, activity, and readiness calculations.
- A saved exact-title `nextReview` is authoritative unless it is invalid/corrupt.
- Due reviews remain eligible after their due date; missing a date does not remove them.
- Repeated exact-title recall must not crowd out breadth and transfer once sufficient evidence
  exists.
- Recommendation V2 is a reversible policy layer: imported-only exposure is unverified current
  work, recent red/yellow or optimization friction gets repair priority, unseen work in a
  familiar skill gets transfer priority, and ordinary recent green repeats are deferred until a
  meaningful gap. Future-dated attempts never make a title appear due in a replay or live queue.
- Imported acceptance is context, not independent proof, a real grade, habit completion, or
  mastery evidence.
- Recommendation explanations may name the tested skill after completion, but should not give
  away the category before an independent attempt.

## Date And Time Semantics

- Habit days and weekly activity use the user's local/profile calendar date.
- Cooldowns use elapsed time, not a midnight boundary.
- Exact-title scheduling uses date-only review dates; an overdue item remains overdue until done.
- Future backfills are rejected, and future evidence already present in old data is excluded from
  decisions.
- The selected time budget affects the next recommendation. It does not rewrite the time box of
  an attempt already in progress.

## Persistence And Multi-Tab Safety

- Local mode writes `data/tracker-state.json`; QA writes `data/qa-tracker-state.json`.
- Hosted mode stores one v4 blob per Google user in SQLite and never uses the local state files.
- State-changing saves are serialized and acknowledged before success is shown.
- Hosted writes include the last seen revision; stale writes return `409` and never overwrite
  newer cloud state.
- Practice drafts live in per-user, per-tab `sessionStorage`. They are not synced to SQLite.
- An idle tab may refresh newer state. It never refreshes over a queued save or active attempt.
- An active stale attempt remains visible for recovery but cannot be saved as current evidence.
- Undo removes only the matching history/activity events and recomputes derived state; it never
  restores an entire old tracker snapshot.

## Runtime Modes And Flags

- `npm start`: local production-like mode on port 5173.
- `npm run start:qa`: disposable QA mode on port 5174 using the committed fixture.
- Hosted mode: `AUTH_REQUIRED=true`, Google OAuth, allowlist, and durable SQLite path.
- `FEATURE_PRACTICE_V2=true`: enables adaptive Practice V2 outside QA.
- `FEATURE_PRACTICE_V2_SHADOW=true`: computes comparison/audit data where supported.
- `FEATURE_LIST_PROGRESS=true`: enables graded-evidence Blind 75/NeetCode 150 progress.
- Optional social, reminder, Recovery Lane, and leaderboard-nav flags do not alter core state.

## Current Limitations

- Manual backfill now opens a dedicated `Log past attempt` dialog from a problem's History tab.
  It requires a date and real grade, allows unknown historical reflection details, replays proper
  history chronologically, and projects the saved attempt into app activity. Imported rows remain
  context only. See [`manual-backfill-v2-plan.md`](manual-backfill-v2-plan.md) for the behavior
  contract and acceptance matrix.
- The frontend still persists the full tracker blob; there is no dedicated atomic attempt API.
- Active drafts do not follow the user across tabs or devices.
- SQLite hosting is intentionally single-replica.
- Imported historical rows cannot establish current independent readiness by themselves.
- Recommendation quality still needs ongoing audits against real usage; algorithm versioning and
  deterministic tests exist so discovered failures become regression fixtures.
- The August 28 read-only audit prioritizes distinguishing remembered-code execution from
  reconstruction, preventing repeated overdue-green holds, and protecting both short repair and
  later checks after initial success without letting reviews dominate. Time-fit boundaries are a
  separate general issue, not an explanation for fixed-60-minute usage. These are proposals,
  not shipped fixes; the one-recommendation flow and original grades remain intact. Review/new-work
  and subject-order tuners remain deferred. See the dated section in
  [`product-roadmap.md`](product-roadmap.md); personal audit data is not stored in this repository.

## Verification Before Release

```bash
npm run check
```

This runs syntax checks and the Node regression suite. For behavior or layout changes, also test
QA at `http://127.0.0.1:5174`, verify local state remains untouched, and inspect the affected
desktop/mobile workflows. Before a high-risk hosted release, create and verify a named SQLite
startup snapshot as described in the hosting guide.
