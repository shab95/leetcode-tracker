(function initPracticeV2Workflow(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.PracticeV2Workflow = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createPracticeV2Workflow() {
  "use strict";

  const PHASES = Object.freeze(["ready", "attempting", "grading", "reflecting", "saving", "completed", "session-complete"]);
  const GRADES = Object.freeze(["red", "yellow", "green"]);
  const ASSISTANCE = Object.freeze(["none", "hint", "solution", "editorial", "ai", "person"]);
  const BLOCKERS = Object.freeze([
    "getting-started",
    "strategy",
    "implementation",
    "syntax-api",
    "edge-cases",
    "explanation",
    "time-management",
  ]);

  function createRuntime(overrides = {}) {
    return {
      version: 1,
      phase: "ready",
      recommendation: null,
      skippedProblemIds: [],
      capacityMinutes: 45,
      attemptId: "",
      startedAt: "",
      lockedTimeBoxMinutes: null,
      expectedRevision: 0,
      provisionalGrade: "",
      reflectionDrafts: {
        shared: { elapsedMinutes: "", timeTracked: true, note: "", complexityKnown: false },
        independent: { friction: "none" },
        nonIndependent: { assistance: "", blocker: "" },
      },
      completion: null,
      undoReceipt: null,
      ...overrides,
      reflectionDrafts: normalizeDrafts(overrides.reflectionDrafts),
    };
  }

  function normalizeRuntime(value = {}) {
    const phase = PHASES.includes(value.phase) ? value.phase : "ready";
    return createRuntime({
      ...value,
      phase: phase === "saving" ? "reflecting" : phase,
      capacityMinutes: positiveNumber(value.capacityMinutes, 45),
      lockedTimeBoxMinutes: value.lockedTimeBoxMinutes == null ? null : positiveNumber(value.lockedTimeBoxMinutes, null),
      skippedProblemIds: uniqueStrings(value.skippedProblemIds),
      provisionalGrade: GRADES.includes(value.provisionalGrade) ? value.provisionalGrade : "",
      reflectionDrafts: normalizeDrafts(value.reflectionDrafts),
    });
  }

  function reconcileRuntimeRevision(value = {}, stateRevision = 0) {
    const runtime = normalizeRuntime(value);
    const revision = Math.max(0, Math.trunc(Number(stateRevision) || 0));
    if (Number(runtime.expectedRevision || 0) === revision) return runtime;

    if (runtime.phase === "ready") {
      return {
        ...runtime,
        recommendation: null,
        skippedProblemIds: [],
        expectedRevision: revision,
      };
    }

    return runtime;
  }

  function transition(runtime, event) {
    const current = normalizeRuntime(runtime);
    const allowed = {
      ready: { begin: "attempting", chooseAnother: "ready" },
      attempting: { finish: "grading", cancel: "ready" },
      grading: { back: "attempting", continue: "reflecting" },
      reflecting: { back: "grading", save: "saving" },
      saving: { saved: "completed", failed: "reflecting" },
      completed: { next: "ready", end: "session-complete", undo: "reflecting" },
      "session-complete": { next: "ready", undo: "reflecting" },
    };
    const next = allowed[current.phase]?.[event];
    if (!next) return { ok: false, runtime: current, error: `Cannot ${event} from ${current.phase}.` };
    return { ok: true, runtime: { ...current, phase: next }, error: "" };
  }

  function validateReflection({ grade, draft, lockedTimeBoxMinutes }) {
    const normalizedGrade = GRADES.includes(grade) ? grade : "";
    const drafts = normalizeDrafts(draft);
    const errors = {};
    if (!normalizedGrade) errors.grade = "Choose the result that describes the full attempt.";

    const timeTracked = Boolean(drafts.shared.timeTracked);
    const elapsed = timeTracked ? Number(drafts.shared.elapsedMinutes) : null;
    if (timeTracked && (!Number.isFinite(elapsed) || elapsed < 1 || elapsed > 180)) {
      errors.elapsedMinutes = "Enter 1-180 stopwatch minutes, or choose Not tracked.";
    }
    if (
      normalizedGrade === "green" &&
      elapsed !== null &&
      Number.isFinite(elapsed) &&
      Number.isFinite(Number(lockedTimeBoxMinutes)) &&
      elapsed > Number(lockedTimeBoxMinutes)
    ) {
      errors.elapsedMinutes = `This exceeded the ${lockedTimeBoxMinutes}-minute time box. Correct the time or choose the friction grade.`;
    }

    if (normalizedGrade === "red" || normalizedGrade === "yellow") {
      const assistance = drafts.nonIndependent.assistance;
      const blocker = drafts.nonIndependent.blocker;
      if (!ASSISTANCE.includes(assistance)) errors.assistance = "Choose whether you used help.";
      if (!BLOCKERS.includes(blocker)) errors.blocker = "Choose the main blocker for this result.";
    }

    return {
      ok: Object.keys(errors).length === 0,
      errors,
      metadata: {
        durationMinutes: elapsed,
        elapsedMinutes: elapsed,
        timeTracked,
        assistance: normalizedGrade === "green" ? "none" : drafts.nonIndependent.assistance,
        blocker: normalizedGrade === "green" ? null : drafts.nonIndependent.blocker,
        friction: normalizedGrade === "green" ? drafts.independent.friction || "none" : null,
        note: String(drafts.shared.note || "").trim(),
        complexityKnown: Boolean(drafts.shared.complexityKnown),
      },
    };
  }

  function normalizeDrafts(value = {}) {
    return {
      shared: {
        elapsedMinutes: value.shared?.elapsedMinutes ?? "",
        timeTracked: value.shared?.timeTracked !== false,
        note: String(value.shared?.note || ""),
        complexityKnown: Boolean(value.shared?.complexityKnown),
      },
      independent: { friction: String(value.independent?.friction || "none") },
      nonIndependent: {
        assistance: String(value.nonIndependent?.assistance || ""),
        blocker: String(value.nonIndependent?.blocker || ""),
      },
    };
  }

  function positiveNumber(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? number : fallback;
  }

  function uniqueStrings(values) {
    return [...new Set((Array.isArray(values) ? values : []).filter(Boolean).map(String))];
  }

  return Object.freeze({
    ASSISTANCE,
    BLOCKERS,
    GRADES,
    PHASES,
    createRuntime,
    normalizeRuntime,
    reconcileRuntimeRevision,
    transition,
    validateReflection,
  });
});
