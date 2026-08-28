# Manual Backfill V2: Workflow Audit And Implementation Plan

**Date:** August 28, 2026  
**Status:** Proposed; not implemented. Testing and documentation only.  
**Scope:** History -> manually record an attempt completed outside Practice. Not CSV/extension import,
adding an unattempted problem, or changing the recommendation algorithm.

## Decision

Replace the legacy date/grade/note backfill form with **Log past attempt**. Use the same outcome
and reflection semantics as Practice V2, plus the actual attempt date. Do not make the user
replay Ready/Attempt or start a stopwatch for work already completed.

There must be one clear save boundary: **Save past attempt**. Cancel before that action writes
nothing. The existing problem editor's Save must never be mistaken for saving an attempt.

Preserve all existing problems, history, IDs, notes, solutions, imports, and scheduling rules.
No automatic regrading or bulk historical migration is part of this work.

## Audit Findings

| Finding | Evidence | Impact |
| --- | --- | --- |
| Backfill collects only date, legacy grade, and note | `index.html` History panel; `app.js:addBackfillAttempt` | No minutes, assistance, blocker, efficiency, or complexity observation, unlike normal practice. |
| Grade defaults to green | Live QA; `openProblemDialog` | A date and one click can accidentally assert an independent solve. |
| Add saves immediately, but parent Cancel remains | Live QA: added Aug 1 yellow to Valid Sudoku, canceled, reopened | Cancel does not undo the attempt; the form suggests a different transaction boundary. |
| Parent Save discards an unsubmitted backfill draft | Live QA: drafted Aug 10, clicked Save, reloaded; only Aug 1 remained | A user can reasonably believe they logged an attempt when they did not. |
| Backfill ignores unsaved Problem/Optimal Solution edits | Isolated actual-handler test | Another confusing split between saved and unsaved changes in one dialog. |
| Out-of-order history replay and its activity row can disagree | Isolated actual-handler test | The inserted activity uses final `problem.stage`, not that entry's `newStage`; later manual activity can keep a stale new/review classification. |
| Reconstructed activity loses reflection details | `getActivitySessions` in app and server; isolated frontend fallback test | Imports/exports with history but missing linked activity must not lose timing/efficiency evidence. Server and frontend projections also differ. |

The activity inconsistency is a stored-data finding, not proof that every visible leaderboard
column is currently wrong: some server aggregates infer classification again from history.

### What Already Works

- Date/grade validation rejects missing date, future date, invalid grade, and `imported` as a
  manually entered grade.
- One graded attempt per problem/calendar date is enforced by the date-only backfill form.
- Early green holds, early red/yellow rescheduling, due-date advancement, and extremely overdue
  green holds behave correctly in the tested cases.
- Imported-only history is retained; the first real grade calibrates the baseline.
- Save rejection rolls back the problem and activity while keeping the draft.
- Deleting a graded history entry removes its linked activity and replays history. Imported
  context cannot be deleted through the graded-history delete action.

### Verification Performed

- `npm run check`: 53 existing tests passed, plus syntax checks.
- 27 isolated assertions exercised the actual application functions with persistence/rendering
  stubbed. These included reproductions of the defects above; passing assertions do not mean
  all current behavior is desirable.
- Codex in-app browser, local QA: History fields/defaults, Add -> Cancel -> reopen, parent Save
  with an unsubmitted attempt, reload persistence, and saved JSON inspection.
- The temporary QA change was removed by restoring the original state snapshot. The local
  production file hash stayed unchanged; no hosted production writes were made.
- Native-alert validation, deletion, save failures, and conflicts were principally tested in the
  isolated harness, not end-to-end hosted browser tests. Mobile, keyboard, and hosted conflict
  acceptance checks below remain requirements for implementation.
- The audit harness was temporary and is not a committed regression suite. Port its relevant
  cases into repository tests; do not depend on a developer's temporary files.

## User Journey

```text
Library -> Problem details -> History -> Log past attempt
  -> Resolve unsaved problem edits, if any
  -> Date + explicit outcome + reflection
     -> Cancel / close: discard only after confirming a dirty draft
     -> Invalid: inline error; keep all inputs
     -> Save past attempt
        -> Saving: prevent duplicate submissions
        -> Failure/conflict: keep draft; no false success
        -> Acknowledged: return to History, highlight saved entry
```

### Dialog And Save Boundaries

1. Keep History as a read-only list with delete actions and one **Log past attempt** command.
2. Open a dedicated sibling dialog with its own form, outside the problem editor form. Close
   the problem dialog while it is open; do not stack modals or nest forms.
3. Before opening it, resolve dirty Problem/Optimal Solution edits with **Save changes and
   continue**, **Discard changes**, or **Keep editing**. Continue after save acknowledgement
   only. Failed editor saves leave the editor intact.
4. Show the problem name and fixed identity. New manual problems must be saved before logging
   attempts; creating a problem alone must not create evidence or activity.
5. Use one form, not a second four-step practice wizard. Selecting/changing the grade reveals
   appropriate reflection fields and retains drafts for each grade.
6. On success, reopen the latest saved problem on History, show a short receipt, and focus the
   saved row. Example: `Saved Aug 1: solved with help or heavy friction.` No second Save is needed.
7. Cancel, Escape, and close share a dirty-draft guard. An untouched form closes directly.
   The parent dialog's next Cancel cannot undo an already acknowledged past attempt.
8. Keep the existing History delete route for correcting a saved mistake. Do not add a new
   history-edit or undo system in this pass.

### Fields And Grade Semantics

| Field | Behavior |
| --- | --- |
| Attempt date | Required; default local today; editable; never a future date. |
| Outcome | Required, initially unselected; use the same labels/help as Practice V2. |
| Minutes | Actual elapsed attempt time, not time spent entering history. Same 1-180 validation when recorded; explicit Not tracked/Don't remember is allowed. |
| Assistance | Red/yellow only; same choices as Practice, including no help. Also allow explicit Don't remember for historical entries. |
| Main blocker | Red/yellow only; same choices, including optimization and time management. Explicit Don't remember is allowed. |
| Minor friction | Green only, optional; retain existing choices. A small self-corrected syntax issue is not automatically assisted. |
| Approach efficiency | Yellow/green only: expected, suboptimal, or unknown. A suboptimal independent solution may remain green. |
| Complexity | Existing not-checked/partial/explained choices. Store the observation for this attempt. |
| Attempt note | Optional; belongs to this history entry. Do not overwrite the problem's existing freeform notes or solution. |

Outcomes remain `red` = Could not solve, `yellow` = Solved with help or heavy friction,
`green` = Solved independently. The new flow must not use timing alone to downgrade green.

Past attempts do not have a recorded recommendation time box. Do not infer one from today's
capacity, current difficulty, or current recommendation. Store elapsed minutes when known,
but omit target comparisons. Do not label known elapsed minutes as unknown just because the
original target is absent. A future historical-target input is out of scope.

Historical uncertainty is explicit, not fabricated. Internally omit unknown assistance/blocker
metadata rather than storing a made-up assistance type or guessing a blocker. Preserve the
selected real grade. Share Practice's reflection contract, with a narrowly scoped historical
validation option for these unknowns; do not relax normal Practice validation.

Suggested defaults: no grade, time untracked, quality unknown, complexity not checked.
Red/yellow require an explicit assistance/blocker answer or Don't remember. Grade switching
must not leak hidden yellow/red fields into green metadata or vice versa.

## Persistence And Evidence Contract

### Attempt Record

- Keep the existing `id`, `date`, `grade`, `backfilled: true`, and `createdAt` fields. Allocate
  the entry ID once for a draft and retain it across retries; deduplicate by ID as well as date.
- Reuse existing reflection keys: `elapsedMinutes`, `durationMinutes`, `timeTracked`,
  `assistance`, `blocker`, `friction`, `solutionQuality`, `complexityStatus`, `complexityKnown`,
  and `note`, where known/applicable. Keep target ratio/overage null without a real target.
- `date` is the user-selected calendar day. `createdAt` is when the record was entered, never
  the practice occurrence. Do not stamp `occurredAt`, `startedAt`, or `completedAt` with now.
- Do not fabricate `recommendationId`, `taskType`, a locked time box, or designated
  transfer/assessment evidence. Keep the existing backfill/calibration provenance.
- A manual independent grade is evidence of that solve, not evidence the app assigned an
  unfamiliar transfer test. Imported rows remain context only.
- Preserve unknown legacy fields through normalization, export/import, and persistence.

### Replay And Linked Activity

Use the existing scheduler/replay, not `applyGrade` as-is: that path assumes the attempt happened
today. Share reflection validation and activity projection without changing the scheduling rules.

1. Validate the complete draft before mutating state. Check for any existing proper grade on
   that problem/date, including a normal timestamped attempt.
2. Append one history entry to the saved problem, then replay chronologically using the existing
   comparator and `getGradeTransition`.
3. Preserve authoritative stored `scheduledReview` snapshots and the existing
   `shouldUseCurrentScheduleForBackfill` behavior. Earlier insertion is not permission to erase
   manually established schedule anchors.
4. Derive each manual activity's stage from its own replayed history entry. Refresh inferred
   new/review classification for linked manual events on the affected problem after insertion
   or deletion. Preserve truthful recorded normal-Practice provenance and unknown legacy data.
5. Use the same metadata projection for saved manual events and history-only fallback events
   in both app and server. Deduplicate by historyEntryId. Never recreate deleted events.
6. Do not recalculate unrelated problems or rewrite historical reflections. The latest real
   attempt still controls the final scheduling state; an older inserted attempt can legitimately
   change the replayed path, but cannot masquerade as the most recent attempt.
7. Treat attempt complexity as dated evidence. An older backfill must not replace the current
   problem-level complexity checkbox. For a newly latest real attempt, use the same
   complexityKnown mapping as normal Practice. Do not globally backfill this checkbox from old
   missing metadata or rewrite it on unrelated history deletion in this pass.
8. Persist problem/history/activity together through the existing revision-checked full-state
   save. Show success only after acknowledgement; restore state on failure and retain the draft.

No database table, endpoint, schema-version increment, or recommender scoring change is expected.
The existing state payload retains full problem objects. Server-side activity projection may
need a small matching update; that is not a new API or a leaderboard rule change.

### Preserve Scheduling Outcomes

| Scenario | Required result |
| --- | --- |
| Truly unattempted, first green | Stage 1; review three days after the attempt. |
| Imported-only, first real grade | Existing calibration: red Stage 0, yellow Stage 1, green Stage 2. No import-derived early/overdue penalty. |
| Early green | Record it; hold stage/streak and existing due date. |
| Early red/yellow | Apply existing weakness rule immediately, from the attempt date. |
| Green on/after due date | Advance unless the existing extremely-overdue hold applies. |
| Latest computed review is already past | Remains eligible/overdue; do not move it to today automatically. |
| Older out-of-order entry | Replay in chronological order; final state is based on latest real grade, respecting saved schedule anchors. |

## Errors, Drafts, And Conflicts

- Inline errors next to date/grade/reflection fields; focus the first invalid field. Replace
  native alerts in this new flow. Use the existing local-date helpers, not UTC slicing.
- Keep one date-only manual grade per problem/day. A collision says a graded attempt exists
  and offers **View existing attempt**. Preserve the draft if navigating back. Never silently
  overwrite, delete, or merge an attempt; same-day timestamp support is deferred.
- Disable duplicate save clicks while pending. Retain the same draft ID on retry; an ambiguous
  network response requires checking refreshed state for that ID before retrying a write.
- Retain revision conflict protections. On 409, keep a recoverable copy of the draft, load fresh
  state only with user agreement, revalidate date collisions, and require an explicit retry.
  Never silently rebase and overwrite another device's state.
- For v1, do not open this flow while any Practice V2 attempt/grading/reflection/save is active.
  Offer a return to that rep so the user can finish or cancel it first. This avoids silently
  invalidating a locked recommendation, even when logging a different problem.
- Ready and Complete may open it. A successful save recomputes the idle next recommendation.
  Do not erase unrelated completion/undo records; apply existing targeted-undo safety checks.
- Unsaved past-attempt drafts stay local to the dialog in this pass. Warn before dirty close
  and page unload; do not promise cross-tab/device or crash recovery. On an acknowledged save,
  reload must show exactly one history entry and one corresponding activity event.

## Implementation Sequence

1. **Regression baseline.** Add `tests/backfill-workflow.test.js` using synthetic state. Capture
   the confirmed save boundaries, date validation, replay, event mismatch, metadata projection,
   and rollback cases before changing behavior. Keep this in `npm run check`.
2. **Shared reflection contract.** Reuse `practice-v2-workflow.js` enums, normalization, and
   validation with a historical context option. Share field rendering/help where practical,
   without moving the live Practice runtime into the problem editor or rewriting the app.
3. **Dedicated dialog.** Replace the inline History add form in `index.html`; wire independent
   draft/form state in `app.js`. Add scoped light/dark responsive styling in `styles.css`.
   Keep existing editor fields and normal Practice navigation intact.
4. **Atomic save and projection.** Upgrade `addBackfillAttempt`, replay-to-activity projection,
   deletion's affected-manual-event refresh, and matching server fallback. Keep dates,
   provenance, optional metadata, and persistence guards consistent. Test failure before UI polish.
5. **End-to-end QA.** Run the matrix below with isolated synthetic/QA state and snapshots.
   Inspect desktop/mobile, keyboard, and dark/light modes. Run a local hosted-mode check with a
   disposable database for real save/conflict behavior; never use the production volume for QA.
6. **Document shipped behavior.** Update `review-algorithm.md`, `practice-v2-spec.md`,
   `local-development.md`, README's backfill note, and `current-context.md` after implementation.
   Mark this plan completed only once its acceptance checks pass. Deployment is a separate step.

## Acceptance Matrix

| Area | Checks |
| --- | --- |
| Entry | Existing/newly saved/manual/imported-only problem; no grade selected by default; no duplicate parent Save. |
| Validation | No date, no grade, impossible/future date, invalid grade, missing required reflection, invalid minutes, explicit unknown details. Invalid forms write nothing. |
| Grades | All three; switch back and forth; independent 25 minutes remains independent; suboptimal independent remains independent; green doesn't save hidden assistance/blocker. |
| Cancel | Untouched/dirty form, Escape, close, parent editor dirty, cancel after switching grades; no unexpected writes. |
| Keyboard | Tab order, focus trap/return, Enter submits only past-attempt form, multiline notes do not submit, errors announced. |
| Save | Receipt names date/result; one history event + one linked activity; reopen/reload/export/import retains every supplied reflection field. |
| Dates | Yesterday vs today; local midnight; DST boundary; date-only occurrence never becomes createdAt; future evidence remains excluded. |
| Schedule | Every scenario in the scheduling table; exact due-date and extreme-overdue boundaries; saved manual due-date anchors survive replay. |
| Order | Add Aug 4 green then Aug 1 red; verify latest state stays Aug 4, Aug 1 event has its own stage, later manual new/review classification refreshes. Repeat via deletion. |
| Duplicate | Same-day manual and normal-Practice collision; double click; retry after response loss; existing-ID save never doubles history/activity. |
| Legacy | Imported rows stay byte-equivalent where possible; missing reflection remains unknown; history-only fallback matches linked activity without adding transfer credit. |
| Aggregate | Today/backfilled-today completes habit; yesterday affects its own day, not today; import-only does neither; applicable existing leaderboard/pact views agree without privacy changes. |
| Safety | Network failure, 409, deleted problem, stale editor, concurrent tab, active Practice draft; no silent loss, rollback overwrites, or forced reset of unrelated work. |
| Delete | Remove only chosen real history entry + linked event; failure restores both; imported rows untouched; subsequent replay and activity stay coherent. |
| Visual | 375px, 737px, laptop, wide desktop; light/dark; no clipped fields/actions, duplicate IDs, nested forms, or modal overlap. |

## Deliberately Deferred

Multiple manual attempts on the same day with precise ordering, bulk graded backfill, editing
saved attempts, retroactive grading of imported history, historical recommendation targets,
new scheduling heuristics, and a general-purpose form framework. This change is about honest
reflection parity and dependable saving, not a new history-management product.
