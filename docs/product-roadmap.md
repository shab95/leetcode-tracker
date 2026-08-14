# Product Roadmap

**Updated:** August 14, 2026

## North Star

The product should answer one question immediately:

> What is the highest-value problem I can practice with the time I have today?

The tracker is no longer centered on clearing a due queue or carrying a small set of exact
problems to mastery. Its job is to build interview readiness through a balanced sequence of
independent problem solving, spaced exact-title recall, transfer across related problems,
targeted repair, and honest reflection.

Success is not the number of rows, stages, or hours logged. Success means the user can solve
unfamiliar interview problems independently, within a useful time range, explain the approach
and complexity, and retain that ability over time.

## Product Principles

- Recommend one adaptive rep, not a dashboard of choices.
- Respect the user's available time without mistaking short availability for low ambition.
- Separate correctness, independence, speed, solution quality, and explanation quality.
- Preserve misses and friction as useful evidence; never turn them into guilt.
- Prefer transfer and breadth once exact-title recall is sufficiently established.
- Conceal problem-family hints before an attempt when they would give away the approach.
- Make every recommendation auditable after the attempt, without exposing the solution before it.
- Keep all historical data and provide a rollback path for algorithm and UI changes.
- Add a feature only when it improves practice quality, return rate, or trustworthy measurement.

## Shipped Foundation

### Durable Tracker

- Local JSON mode, QA fixtures/reset, and hosted per-user SQLite state.
- Google OAuth, email allowlist, revisions, rolling backups, and safe static serving.
- CSV, JSON, and LeetCode historical imports without treating imported acceptance as mastery.
- Blind 75 and NeetCode 150 membership on shared problem records.
- Notes, optimal-solution reference, history, manual backfill, and targeted history deletion.

### Adaptive Practice V2

- One `Next rep` selected from the current state, available time, and training profile.
- Recommendation types for independent evidence, exact-title retention, transfer, repair,
  optimization follow-up, assessment, and new coverage.
- A Ready -> Attempt -> Reflect -> Complete workflow with tab-scoped draft recovery.
- Reflection that records grade, elapsed time, blocker/friction, approach efficiency,
  complexity confidence, and an optional note as separate evidence dimensions.
- Same-title cooldowns, future-evidence exclusion, authoritative due dates, and safeguards
  against repeatedly recommending a recently completed problem.
- A concise completion explanation and targeted Undo that removes only the saved rep.

### Supporting Surfaces

- Library for search, filtering, editing, and evidence-oriented problem status.
- Memory for readiness coverage, recent evidence, skill pressure, and list progress based only
  on real graded evidence.
- Optional leaderboard with current and lifetime views.
- Settings for theme, imports, backups, feature preferences, and hosted controls.
- Minimum Practice as a gentle return signal, not a scheduling input.

## Current Priority: Validate The Coach

The next phase is not another large surface. It is proving that the adaptive coach consistently
chooses useful work and learns from outcomes.

### 1. Recommendation Quality Audits

- Store and inspect the reason codes, candidate type, evidence age, time fit, and algorithm
  version for every completed recommendation.
- Regularly review sequences for repeated titles, topic overconcentration, neglected coverage,
  stale evidence, and mismatches between the stated rationale and the actual saved result.
- Add deterministic regression fixtures for every recommendation bug found in real use.
- Compare expected and actual time without forcing an honest independent solve into a weaker
  grade solely for exceeding a time box.

**Release gate:** no known path may recommend a title inside its cooldown, use future evidence,
discard an authoritative due review, or overwrite newer state.

### 2. Close The Learning Loop

When a user reaches a correct but suboptimal solution or needs outside help, the product should
make the next learning action explicit without keeping them on the same problem too long.

- Distinguish `correct but suboptimal`, `needed help`, `implementation friction`, and
  `could not form the approach`.
- Offer a short reconstruction step after learning an optimal solution.
- Schedule a later transfer or retention check instead of immediate repeated regurgitation.
- Use blocker history to choose the kind of follow-up, not to reveal the hidden pattern in
  advance.

**Success signal:** fewer repeated blocker types and stronger independent results on different
problems that require related reasoning.

### 3. Interview Calibration

Once enough independent evidence exists, add periodic calibration that resembles an interview
more closely than ordinary practice.

- One unseen or stale problem under a clear time ceiling.
- No pattern/topic reveal before the attempt.
- Evaluate problem framing, implementation, testing, complexity explanation, and communication.
- Report readiness bands and gaps, not a single pseudo-precise score.

**Prerequisite:** recommendation and reflection data must be reliable enough that calibration
does not merely measure UI usage.

### 4. Readiness Explanations

- Make Blind 75 and NeetCode 150 progress distinguish independent, assisted/repair, stale, and
  missing real evidence.
- Keep historical imports outside readiness progress until a real grade exists.
- Explain what would improve a readiness segment without turning Memory into another task list.
- Keep detailed due dates and exact-title schedules available in Library rather than making a
  backlog count the motivational center of the product.

### 5. Reliability And Operations

- Keep the mutation, save-queue, stale-tab, and targeted-undo regression suite growing.
- Add hosted error visibility for state conflicts, failed saves, and recommendation exceptions.
- Continue single-replica SQLite operation until a deliberate database migration is justified.
- Require a verified SQLite snapshot before high-risk schema or recommendation releases.

## Experiments Behind Flags

These features may remain in the codebase, but they should not compete with adaptive practice
unless usage proves their value:

- Recovery Lane
- Friend Pulse and daily pacts
- Phone reminders
- Leaderboard navigation
- Chrome history import after onboarding

Their saved data should remain backward compatible even when the UI is hidden.

## Deliberately Deferred

- An in-app code runner or LeetCode submitter
- Public self-service signup
- A large AI-chat coaching surface
- Heavy analytics on the Practice screen
- Social shame, punitive streaks, or public problem-level activity
- Gamification that rewards volume without independent evidence

## Decision Checklist

Before shipping a product change, answer:

1. Does it improve the next practice decision, the quality of reflection, or the likelihood of
   returning?
2. Does it preserve all existing history and remain safe across local, QA, and hosted modes?
3. Could it accidentally reveal the problem category or approach before the attempt?
4. Could it reward memorization, volume, or backfill instead of current independent ability?
5. Is its behavior deterministic and covered by a regression test?
6. Can it be rolled back without migrating or deleting user data?

The detailed workflow and algorithm contracts live in
[`practice-v2-spec.md`](practice-v2-spec.md) and
[`review-algorithm.md`](review-algorithm.md).
