# Product Roadmap

This roadmap is about the product shape, not the review algorithm itself. The tracker
should still keep full history, stages, notes, memory signals, settings, reminders, and
leaderboard data. The main product change is that the first screen should feel like a
practice launchpad instead of a management dashboard.

The core question for the app is:

```text
What should I do right now?
```

Everything else should support that answer without creating guilt, noise, or extra
decisions before practice begins.

## Product Principles

- Keep the spaced-repetition tracker as the engine.
- Make the Practice tab action-first and low-friction.
- Preserve memory signals, library browsing, settings, and leaderboard, but move them away
  from the first decision point.
- Treat motivation as momentum protection, not pressure.
- Reward honest effort, including misses and slow solves, because those are useful memory
  signals.
- Avoid public shame mechanics. Social features should create commitment and support, not
  punishment.
- Prefer small daily wins over large planning surfaces.

## Roadmap Overview

### Phase 1: Practice-First Front Door

Refocus the first screen around starting work.

- Put the daily practice surface before stats and tables.
- Rename the main tab to `Practice` and the main practice section to `Daily Rep`.
- Keep one review and one new problem, but make the review/recovery action feel primary.
- Move the problem table and heavy browsing controls to a separate `Library` route.
- Move stats to `Memory` so they stay useful without becoming the front door.
- Hide empty Recovery Lane UI.
- Keep due review counts de-emphasized so a large backlog does not become the first thing
  the user sees.
- Tuck skip/source controls into a smaller `Change pick` area.

### Phase 2: Strong Completion Loop

Make the moment after grading feel satisfying and useful.

- Show a calm completion message after any real grade:
  `Today complete. Momentum protected.`
- Keep grade-specific feedback constructive:
  - Missed: `Good signal. We will bring it back sooner.`
  - Slow/hints: `Useful rep. The path is getting clearer.`
  - Clean: `Clean recall logged.`
- Continue showing the stage result, next review date, and any hold reason.
- Keep `Undo grade` available for accidental clicks.
- Ask for one optional future-you note after grading.

### Phase 3: Learning Signals

Capture why a rep was hard without turning the app into a journal.

- Add optional post-grade tags:
  - wrong pattern
  - missed invariant
  - edge case
  - implementation bug
  - needed hint
  - too slow
  - could not explain complexity
- Store tags in review history.
- Show tags in the History tab and Memory.
- Use tags later to suggest targeted drills.

### Phase 4: Return Rituals

Let the user choose an energy level instead of choosing from the full app.

- Add lightweight session modes:
  - `10 min reset`: one honest review or recovery rep.
  - `25 min session`: review plus optional new problem.
  - `60 min deep work`: review, new problem, and repair notes.
- Make reminders deep-link to the smallest useful action.
- Keep the default path as one click into practice.

### Phase 5: Memory Page

Continue redesigning Memory into a calmer learning view.

- Keep backlog, stages, attention topics, and recent grades.
- Add learning-signal breakdowns after Phase 3.
- Make each chart answer an action question, not just report a number.
- Keep dense details expandable.

### Phase 6: Library

Move browsing and editing into a dedicated place.

- Add a `Library` route for the full problem table, filters, sorting, and editing.
- Keep quick filters:
  - due
  - recovery lane
  - weak signals
  - unattempted
  - mastered
  - Blind 75
  - NeetCode 150
- Keep edit, backfill, notes, solution reference, and list memberships here.

### Phase 7: Accountability

Add social pressure only where it helps.

- Add an optional `15-Minute Pact` with a friend.
- Share intent and completion status, not raw private history.
- Completion options should be humane:
  - done
  - got stuck
  - reschedule
- Missed pacts should shrink the next ask instead of shaming the user.

### Phase 8: Flash Gym

Add short non-LeetCode drills for weak concepts.

- Pattern recognition drills.
- Complexity drills.
- Edge-case spotting.
- Invariant recall.
- Bug diagnosis.
- These should support practice, not replace real problem attempts.

## Phase 1 Detailed Spec

Phase 1 should make the app feel like it opens straight into practice while preserving all
existing data and power-user surfaces.

### Navigation

Target top-level tabs:

```text
Practice
Library
Memory
Leaderboard
Settings
```

Current mapping:

- `Practice` stays `/index.html`.
- `Library` should be a new route, likely `/library`.
- `Memory` uses `/memory`, while `/diagnostics` remains compatible.
- `Settings` uses `/settings`, while `/data-management` remains compatible.

### Practice Order

Practice should render in this order:

1. Daily practice surface.
2. Minimum Practice habit panel.
3. Recovery Lane only if there are active recovery problems.

Practice should not show the full problem table or stats grid by default.

### Daily Practice Surface

Rename the current `Today` panel to `Daily Rep` or `Today's Rep`.

Keep the existing behavior:

- exactly one review recommendation
- exactly one new recommendation
- grading buttons
- Open on LeetCode
- skip review
- skip new
- new-problem source selector

Adjust the hierarchy:

- The review/recovery card should feel like the primary action.
- The new problem card should feel like an optional second rep.
- The summary should be short:
  `Review: Add Two Numbers. New: Minimum Window Substring.`
- Avoid backlog warning copy inside the practice surface.

### Change Pick Controls

Move the new-problem source selector and skip buttons into a compact control area, such as
an expandable `Change pick` control.

The default view should not imply the user needs to tune the system before practicing.

### Stats

Stats move to Memory. They should answer:

- What have I built?
- What needs attention?

They should not dominate the first viewport.

The due count can remain hidden by default or become a click-to-reveal stat so the user is
not greeted by a scary backlog.

### Library Route

Move the current workspace/table section to `Library`.

The Library should contain:

- search
- status filter
- difficulty filter
- topic filter
- list filter
- sort dropdown
- problem table
- Open/Edit actions

This keeps the tracker powerful without making Practice feel like a spreadsheet.

### Recovery Lane

Recovery Lane should only appear when it is useful:

- Show it if there are manually pinned recovery problems.
- Hide it if empty.
- Keep a maximum of three problems.
- A problem leaves recovery when it reaches `Transfer (Stage 3)`.

### Acceptance Checks

- Opening `/index.html` shows the daily practice surface first.
- The problem table and stats grid are not on Practice.
- Opening `/library` shows the table and all existing filters/sorts.
- Existing table actions still work from Library.
- Daily grading still saves state and updates habit/stats.
- Skip controls and new source still work.
- Recovery Lane is hidden when empty.
- `/memory` and `/diagnostics` open Memory.
- `/settings` and `/data-management` open Settings.
- `npm run check` passes.

## Not Now

These ideas are intentionally deferred:

- Full in-app code runner.
- LeetCode submitter.
- Public leaderboard as the central product loop.
- A giant AI coach surface.
- Heavy analytics on the first screen.

They may become useful later, but Phase 1 is about reducing the distance between opening
the app and starting one honest rep.
