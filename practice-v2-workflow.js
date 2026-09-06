(function initPracticeV2Workflow(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.PracticeV2Workflow = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createPracticeV2Workflow() {
  "use strict";

  const PHASES = Object.freeze(["ready", "attempting", "grading", "reflecting", "saving", "completed"]);
  const GRADES = Object.freeze(["red", "yellow", "green"]);
  const COMPLEXITY_STATUSES = Object.freeze(["not-checked", "partial", "explained"]);
  const SOLUTION_QUALITY = Object.freeze(["expected", "suboptimal", "unknown"]);
  const HISTORICAL_UNKNOWN = "unknown";
  const ASSISTANCE = Object.freeze(["none", "hint", "solution", "editorial", "ai", "person"]);
  const BLOCKERS = Object.freeze([
    "getting-started",
    "strategy",
    "optimization",
    "implementation",
    "syntax-api",
    "edge-cases",
    "explanation",
    "time-management",
  ]);

  function createRuntime(overrides = {}) {
    return {
      version: 2,
      phase: "ready",
      recommendation: null,
      skippedProblemIds: [],
      rotationHistory: [],
      familiarOverrideProblemId: "",
      actionNotice: "",
      capacityMinutes: 45,
      attemptId: "",
      startedAt: "",
      lockedTimeBoxMinutes: null,
      expectedRevision: 0,
      recommendationDate: "",
      staleRevision: false,
      provisionalGrade: "",
      reflectionDrafts: {
        shared: {
          elapsedMinutes: "",
          timeTracked: true,
          note: "",
          complexityStatus: "not-checked",
          complexityKnown: false,
          solutionQuality: "",
        },
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
    const savedPhase = value.phase === "session-complete" ? "completed" : value.phase;
    const phase = PHASES.includes(savedPhase) ? savedPhase : "ready";
    const skippedProblemIds = uniqueStrings(value.skippedProblemIds);
    return createRuntime({
      ...value,
      phase: phase === "saving" ? "reflecting" : phase,
      capacityMinutes: positiveNumber(value.capacityMinutes, 45),
      lockedTimeBoxMinutes: value.lockedTimeBoxMinutes == null ? null : positiveNumber(value.lockedTimeBoxMinutes, null),
      skippedProblemIds,
      rotationHistory: normalizeRotationHistory(value.rotationHistory, skippedProblemIds),
      familiarOverrideProblemId: String(value.familiarOverrideProblemId || ""),
      actionNotice: String(value.actionNotice || ""),
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
        rotationHistory: [],
        familiarOverrideProblemId: "",
        actionNotice: "",
        expectedRevision: revision,
        recommendationDate: "",
        staleRevision: false,
      };
    }

    return { ...runtime, staleRevision: true };
  }

  function restorePreviousPick(runtime) {
    const current = normalizeRuntime(runtime);
    if (current.phase !== "ready" || current.rotationHistory.length === 0) {
      return { ok: false, runtime: current, previousAction: null, error: "There is no previous pick to restore." };
    }

    const previousAction = current.rotationHistory.at(-1);
    const rotationHistory = current.rotationHistory.slice(0, -1);
    const skippedProblemIds = uniqueStrings(
      rotationHistory.filter((action) => action.type === "choose-another").map((action) => action.problemId),
    );

    return {
      ok: true,
      runtime: {
        ...current,
        recommendation: null,
        recommendationDate: "",
        skippedProblemIds,
        rotationHistory,
        familiarOverrideProblemId: "",
        actionNotice: "",
      },
      previousAction,
      error: "",
    };
  }

  function markFamiliar(runtime, problemId, eventId, persistedProblemId = problemId) {
    const current = normalizeRuntime(runtime);
    const id = String(problemId || "").trim();
    const familiarityEventId = String(eventId || "").trim();
    const restoreProblemId = String(persistedProblemId || "").trim();
    if (
      !id ||
      !familiarityEventId ||
      !restoreProblemId ||
      current.phase !== "ready" ||
      String(current.recommendation?.public?.problemId || "") !== id
    ) {
      return { ok: false, runtime: current, error: "There is no active recommendation to mark familiar." };
    }

    return {
      ok: true,
      runtime: {
        ...current,
        phase: "ready",
        recommendation: null,
        recommendationDate: "",
        rotationHistory: [
          ...current.rotationHistory,
          { type: "familiarity", problemId: restoreProblemId, familiarityEventId },
        ],
        familiarOverrideProblemId: "",
        actionNotice: "",
        completion: null,
        undoReceipt: null,
      },
      error: "",
    };
  }

  function chooseAnother(runtime, problemId) {
    const current = normalizeRuntime(runtime);
    const id = String(problemId || "").trim();
    if (!id || current.phase !== "ready" || String(current.recommendation?.public?.problemId || "") !== id) {
      return { ok: false, runtime: current, error: "There is no active recommendation to skip." };
    }
    return {
      ok: true,
      runtime: {
        ...current,
        recommendation: null,
        recommendationDate: "",
        skippedProblemIds: uniqueStrings([...current.skippedProblemIds, id]),
        rotationHistory: [...current.rotationHistory, { type: "choose-another", problemId: id }],
        familiarOverrideProblemId: "",
      },
      error: "",
    };
  }

  function transition(runtime, event) {
    const current = normalizeRuntime(runtime);
    const allowed = {
      ready: { begin: "attempting", chooseAnother: "ready" },
      attempting: { finish: "grading", cancel: "ready" },
      grading: { back: "attempting", continue: "reflecting" },
      reflecting: { back: "grading", save: "saving" },
      saving: { saved: "completed", failed: "reflecting" },
      completed: { next: "ready", undo: "reflecting" },
    };
    const next = allowed[current.phase]?.[event];
    if (!next) return { ok: false, runtime: current, error: `Cannot ${event} from ${current.phase}.` };
    return { ok: true, runtime: { ...current, phase: next }, error: "" };
  }

  function validateReflection({ grade, draft, lockedTimeBoxMinutes, historical = false }) {
    const normalizedGrade = GRADES.includes(grade) ? grade : "";
    const drafts = normalizeDrafts(draft);
    const errors = {};
    if (!normalizedGrade) errors.grade = "Choose a grade that describes the full attempt.";

    const timeTracked = Boolean(drafts.shared.timeTracked);
    const elapsed = timeTracked ? Number(drafts.shared.elapsedMinutes) : null;
    if (timeTracked && (!Number.isFinite(elapsed) || elapsed < 1 || elapsed > 180)) {
      errors.elapsedMinutes = "Enter 1-180 stopwatch minutes, or choose Not tracked.";
    }
    const timing = timingSignal({ elapsedMinutes: elapsed, lockedTimeBoxMinutes });

    if (normalizedGrade === "red" || normalizedGrade === "yellow") {
      const assistance = drafts.nonIndependent.assistance;
      const blocker = drafts.nonIndependent.blocker;
      if (!ASSISTANCE.includes(assistance) && !(historical && assistance === HISTORICAL_UNKNOWN)) {
        errors.assistance = "Choose whether you used help.";
      }
      if (!BLOCKERS.includes(blocker) && !(historical && blocker === HISTORICAL_UNKNOWN)) {
        errors.blocker = "Choose the main blocker for this result.";
      }
    }
    const solutionQualityKnown = SOLUTION_QUALITY.includes(drafts.shared.solutionQuality)
      && (historical || drafts.shared.solutionQuality !== HISTORICAL_UNKNOWN);
    if (["yellow", "green"].includes(normalizedGrade) && !solutionQualityKnown) {
      errors.solutionQuality = "Choose whether the working solution used the expected optimization.";
    }

    return {
      ok: Object.keys(errors).length === 0,
      errors,
      metadata: {
        durationMinutes: elapsed,
        elapsedMinutes: elapsed,
        timeTracked,
        timingStatus: timing.status,
        minutesOverTarget: timing.minutesOverTarget,
        timeBoxRatio: timing.ratio,
        assistance: normalizedGrade === "green" ? "none" : drafts.nonIndependent.assistance,
        blocker: normalizedGrade === "green" ? null : drafts.nonIndependent.blocker,
        friction: normalizedGrade === "green" ? drafts.independent.friction || "none" : null,
        note: String(drafts.shared.note || "").trim(),
        complexityStatus: drafts.shared.complexityStatus,
        complexityKnown: drafts.shared.complexityStatus === "explained",
        solutionQuality: normalizedGrade === "red" ? "not-applicable" : drafts.shared.solutionQuality,
      },
    };
  }

  function timingSignal({ elapsedMinutes, lockedTimeBoxMinutes } = {}) {
    const elapsed = Number(elapsedMinutes);
    const target = Number(lockedTimeBoxMinutes);
    if (!Number.isFinite(elapsed) || elapsed < 1 || !Number.isFinite(target) || target < 1) {
      return { status: "untracked", minutesOverTarget: null, ratio: null };
    }
    const minutesOverTarget = Math.max(0, Math.round((elapsed - target) * 100) / 100);
    return {
      status: minutesOverTarget > 0 ? "over-target" : "within-target",
      minutesOverTarget,
      ratio: Math.round((elapsed / target) * 100) / 100,
    };
  }

  function normalizeDrafts(value = {}) {
    return {
      shared: {
        elapsedMinutes: value.shared?.elapsedMinutes ?? "",
        timeTracked: value.shared?.timeTracked !== false,
        note: String(value.shared?.note || ""),
        complexityStatus: normalizeComplexityStatus(value.shared),
        complexityKnown: normalizeComplexityStatus(value.shared) === "explained",
        solutionQuality: SOLUTION_QUALITY.includes(value.shared?.solutionQuality)
          ? value.shared.solutionQuality
          : value.shared?.solutionQuality === HISTORICAL_UNKNOWN
            ? HISTORICAL_UNKNOWN
            : "",
      },
      independent: { friction: String(value.independent?.friction || "none") },
      nonIndependent: {
        assistance: String(value.nonIndependent?.assistance || ""),
        blocker: String(value.nonIndependent?.blocker || ""),
      },
    };
  }

  function normalizeComplexityStatus(shared = {}) {
    if (COMPLEXITY_STATUSES.includes(shared?.complexityStatus)) return shared.complexityStatus;
    return shared?.complexityKnown ? "explained" : "not-checked";
  }

  function completionPlanUpdate({ grade, solutionQuality, timingStatus, minutesOverTarget } = {}) {
    if (grade === "red") {
      return "The plan will prioritize the recorded blocker before another independent check.";
    }
    if (solutionQuality === "suboptimal") {
      return "A working but suboptimal result leaves an optimization gap for a future follow-up.";
    }
    if (solutionQuality === "unknown") {
      return "Independent evidence was recorded, but approach efficiency still needs verification.";
    }
    if (grade === "yellow") {
      return "The plan will reinforce the recorded weak point before another independent check.";
    }
    if (grade === "green" && timingStatus === "over-target") {
      const overage = Number(minutesOverTarget);
      const detail = Number.isFinite(overage) && overage > 0 ? ` by ${overage} ${overage === 1 ? "minute" : "minutes"}` : "";
      return `Independent evidence is now current. The target was exceeded${detail}, so speed remains a separate improvement signal.`;
    }
    if (grade === "green" && solutionQuality === "expected") {
      return "Efficient independent evidence is now current. The plan can shift toward broader transfer.";
    }
    return "The saved result will guide the next recommendation.";
  }

  function positiveNumber(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? number : fallback;
  }

  function uniqueStrings(values) {
    return [...new Set((Array.isArray(values) ? values : []).filter(Boolean).map(String))];
  }

  function normalizeRotationHistory(value, skippedProblemIds = []) {
    if (!Array.isArray(value) || (value.length === 0 && skippedProblemIds.length > 0)) {
      return skippedProblemIds.map((problemId) => ({ type: "choose-another", problemId }));
    }
    return value
      .map((action) => ({
        type: action?.type === "familiarity" ? "familiarity" : "choose-another",
        problemId: String(action?.problemId || ""),
        ...(action?.type === "familiarity"
          ? { familiarityEventId: String(action?.familiarityEventId || "") }
          : {}),
      }))
      .filter((action) => action.problemId && (action.type !== "familiarity" || action.familiarityEventId));
  }

  return Object.freeze({
    ASSISTANCE,
    BLOCKERS,
    COMPLEXITY_STATUSES,
    GRADES,
    HISTORICAL_UNKNOWN,
    PHASES,
    SOLUTION_QUALITY,
    completionPlanUpdate,
    chooseAnother,
    createRuntime,
    markFamiliar,
    normalizeRuntime,
    reconcileRuntimeRevision,
    restorePreviousPick,
    transition,
    timingSignal,
    validateReflection,
  });
});
