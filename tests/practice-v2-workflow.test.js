const test = require("node:test");
const assert = require("node:assert/strict");

const workflow = require("../practice-v2-workflow.js");

function draft(overrides = {}) {
  return {
    shared: {
      elapsedMinutes: "12",
      timeTracked: true,
      note: "Watch the invariant.",
      complexityStatus: "explained",
      complexityKnown: true,
      solutionQuality: "expected",
      ...overrides.shared,
    },
    independent: { friction: "none", ...overrides.independent },
    nonIndependent: {
      assistance: "hint",
      blocker: "strategy",
      ...overrides.nonIndependent,
    },
  };
}

test("ready-to-reflection navigation is reversible without discarding drafts", () => {
  let runtime = workflow.createRuntime({
    recommendation: { public: { problemId: "two-sum" } },
    reflectionDrafts: draft(),
  });

  for (const event of ["begin", "finish", "continue"]) {
    const result = workflow.transition(runtime, event);
    assert.equal(result.ok, true);
    runtime = result.runtime;
  }
  assert.equal(runtime.phase, "reflecting");

  runtime = workflow.transition(runtime, "back").runtime;
  assert.equal(runtime.phase, "grading");
  runtime = workflow.transition(runtime, "back").runtime;
  assert.equal(runtime.phase, "attempting");
  assert.deepEqual(runtime.reflectionDrafts, draft());
});

test("invalid transitions fail without changing the current phase", () => {
  const runtime = workflow.createRuntime();
  const result = workflow.transition(runtime, "save");
  assert.equal(result.ok, false);
  assert.equal(result.runtime.phase, "ready");
});

test("reload recovery returns an interrupted save to reflection", () => {
  const runtime = workflow.normalizeRuntime({
    phase: "saving",
    provisionalGrade: "yellow",
    reflectionDrafts: draft(),
  });
  assert.equal(runtime.phase, "reflecting");
  assert.equal(runtime.provisionalGrade, "yellow");
  assert.deepEqual(runtime.reflectionDrafts, draft());
});

test("a newer tracker revision invalidates an idle cached recommendation", () => {
  const runtime = workflow.reconcileRuntimeRevision(workflow.createRuntime({
    expectedRevision: 4,
    recommendation: { public: { problemId: "generate-parentheses" } },
    skippedProblemIds: ["two-sum"],
  }), 5);

  assert.equal(runtime.phase, "ready");
  assert.equal(runtime.expectedRevision, 5);
  assert.equal(runtime.recommendation, null);
  assert.deepEqual(runtime.skippedProblemIds, []);
});

test("the same tracker revision preserves an idle recommendation", () => {
  const recommendation = { public: { problemId: "generate-parentheses" } };
  const runtime = workflow.reconcileRuntimeRevision(workflow.createRuntime({
    expectedRevision: 5,
    recommendation,
  }), 5);

  assert.deepEqual(runtime.recommendation, recommendation);
});

test("revision reconciliation never discards an attempt in progress", () => {
  const runtime = workflow.reconcileRuntimeRevision(workflow.createRuntime({
    phase: "reflecting",
    expectedRevision: 4,
    attemptId: "attempt-1",
    recommendation: { public: { problemId: "generate-parentheses" } },
    reflectionDrafts: draft(),
  }), 5);

  assert.equal(runtime.phase, "reflecting");
  assert.equal(runtime.expectedRevision, 4);
  assert.equal(runtime.attemptId, "attempt-1");
  assert.deepEqual(runtime.reflectionDrafts, draft());
});

test("red and yellow require assistance, blocker, and stopwatch evidence", () => {
  const missing = workflow.validateReflection({
    grade: "yellow",
    draft: draft({
      shared: { elapsedMinutes: "" },
      nonIndependent: { assistance: "", blocker: "" },
    }),
    lockedTimeBoxMinutes: 30,
  });
  assert.equal(missing.ok, false);
  assert.ok(missing.errors.elapsedMinutes);
  assert.ok(missing.errors.assistance);
  assert.ok(missing.errors.blocker);

  const valid = workflow.validateReflection({
    grade: "red",
    draft: draft({ shared: { timeTracked: false, elapsedMinutes: "" } }),
    lockedTimeBoxMinutes: 30,
  });
  assert.equal(valid.ok, true);
  assert.equal(valid.metadata.timeTracked, false);
  assert.equal(valid.metadata.durationMinutes, null);
});

test("a failed independent attempt may record no assistance", () => {
  const result = workflow.validateReflection({
    grade: "red",
    draft: draft({ nonIndependent: { assistance: "none", blocker: "getting-started" } }),
    lockedTimeBoxMinutes: 30,
  });
  assert.equal(result.ok, true);
  assert.equal(result.metadata.assistance, "none");
  assert.equal(result.metadata.blocker, "getting-started");
});

test("a missed optimal solution is preserved as the main blocker", () => {
  const result = workflow.validateReflection({
    grade: "yellow",
    draft: draft({
      nonIndependent: { assistance: "hint", blocker: "optimization" },
      shared: { solutionQuality: "suboptimal" },
    }),
    lockedTimeBoxMinutes: 30,
  });
  assert.equal(result.ok, true);
  assert.equal(result.metadata.blocker, "optimization");
  assert.equal(result.metadata.solutionQuality, "suboptimal");
});

test("independent evidence normalizes assistance and blockers away", () => {
  const result = workflow.validateReflection({
    grade: "green",
    draft: draft({
      independent: { friction: "syntax-api" },
      nonIndependent: { assistance: "solution", blocker: "strategy" },
    }),
    lockedTimeBoxMinutes: 20,
  });
  assert.equal(result.ok, true);
  assert.equal(result.metadata.assistance, "none");
  assert.equal(result.metadata.blocker, null);
  assert.equal(result.metadata.friction, "syntax-api");
});

test("complexity readiness is separate from an independent grade", () => {
  const result = workflow.validateReflection({
    grade: "green",
    draft: draft({
      shared: { complexityStatus: "partial", complexityKnown: false },
      independent: { friction: "explanation" },
    }),
    lockedTimeBoxMinutes: 20,
  });
  assert.equal(result.ok, true);
  assert.equal(result.metadata.complexityStatus, "partial");
  assert.equal(result.metadata.complexityKnown, false);
  assert.equal(result.metadata.friction, "explanation");
});

test("working solutions require a separate approach-efficiency result", () => {
  const missing = workflow.validateReflection({
    grade: "green",
    draft: draft({ shared: { solutionQuality: "" } }),
    lockedTimeBoxMinutes: 20,
  });
  assert.equal(missing.ok, false);
  assert.match(missing.errors.solutionQuality, /expected optimization/i);

  const suboptimal = workflow.validateReflection({
    grade: "green",
    draft: draft({ shared: { solutionQuality: "suboptimal" } }),
    lockedTimeBoxMinutes: 20,
  });
  assert.equal(suboptimal.ok, true);
  assert.equal(suboptimal.metadata.assistance, "none");
  assert.equal(suboptimal.metadata.solutionQuality, "suboptimal");
});

test("a failed attempt does not require or save solution quality", () => {
  const result = workflow.validateReflection({
    grade: "red",
    draft: draft({ shared: { solutionQuality: "" } }),
    lockedTimeBoxMinutes: 20,
  });
  assert.equal(result.ok, true);
  assert.equal(result.metadata.solutionQuality, "not-applicable");
});

test("legacy complexity readiness normalizes to the tri-state value", () => {
  const runtime = workflow.normalizeRuntime({
    reflectionDrafts: {
      shared: { complexityKnown: true },
    },
  });

  assert.equal(runtime.reflectionDrafts.shared.complexityStatus, "explained");
  assert.equal(runtime.reflectionDrafts.shared.complexityKnown, true);
});

test("legacy session completion resumes as a completed rep", () => {
  const runtime = workflow.normalizeRuntime({ phase: "session-complete" });
  assert.equal(runtime.phase, "completed");
});

test("a completed rep can continue or undo but has no session-ending transition", () => {
  const completed = workflow.createRuntime({ phase: "completed" });
  assert.equal(workflow.transition(completed, "next").runtime.phase, "ready");
  assert.equal(workflow.transition(completed, "undo").runtime.phase, "reflecting");
  assert.equal(workflow.transition(completed, "end").ok, false);
});

test("completion plan updates describe the saved result rather than the old recommendation", () => {
  const expected = workflow.completionPlanUpdate({
    grade: "green",
    solutionQuality: "expected",
  });
  const suboptimal = workflow.completionPlanUpdate({
    grade: "green",
    solutionQuality: "suboptimal",
  });

  assert.match(expected, /efficient independent evidence/i);
  assert.doesNotMatch(expected, /suboptimal|optimization gap/i);
  assert.match(suboptimal, /suboptimal result.*optimization gap/i);
});

test("completion plan keeps independence and calls out an over-target speed gap", () => {
  const update = workflow.completionPlanUpdate({
    grade: "green",
    solutionQuality: "expected",
    timingStatus: "over-target",
    minutesOverTarget: 5,
  });
  assert.match(update, /independent evidence is now current/i);
  assert.match(update, /exceeded by 5 minutes/i);
  assert.match(update, /speed remains.*separate improvement signal/i);
});

test("independent grade may exceed the target while preserving honest timing evidence", () => {
  const result = workflow.validateReflection({
    grade: "green",
    draft: draft({ shared: { elapsedMinutes: "31" } }),
    lockedTimeBoxMinutes: 30,
  });
  assert.equal(result.ok, true);
  assert.equal(result.metadata.elapsedMinutes, 31);
  assert.equal(result.metadata.timingStatus, "over-target");
  assert.equal(result.metadata.minutesOverTarget, 1);
  assert.equal(result.metadata.timeBoxRatio, 1.03);
});

test("friction grade may exceed the locked time box", () => {
  const result = workflow.validateReflection({
    grade: "yellow",
    draft: draft({ shared: { elapsedMinutes: "41" } }),
    lockedTimeBoxMinutes: 30,
  });
  assert.equal(result.ok, true);
  assert.equal(result.metadata.elapsedMinutes, 41);
  assert.equal(result.metadata.timingStatus, "over-target");
});

test("timing evidence distinguishes within target, over target, and untracked", () => {
  assert.deepEqual(workflow.timingSignal({ elapsedMinutes: 20, lockedTimeBoxMinutes: 20 }), {
    status: "within-target",
    minutesOverTarget: 0,
    ratio: 1,
  });
  assert.deepEqual(workflow.timingSignal({ elapsedMinutes: 25, lockedTimeBoxMinutes: 20 }), {
    status: "over-target",
    minutesOverTarget: 5,
    ratio: 1.25,
  });
  assert.deepEqual(workflow.timingSignal({ elapsedMinutes: null, lockedTimeBoxMinutes: 20 }), {
    status: "untracked",
    minutesOverTarget: null,
    ratio: null,
  });
});
