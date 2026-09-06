(function initTrackerStateV4(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.TrackerStateV4 = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createTrackerStateV4() {
  "use strict";

  const STATE_VERSION = 4;
  const ALGORITHM_VERSION = "readiness-v1.3";
  const DEFAULT_TRAINING_PROFILE = Object.freeze({
    roleTarget: "general-swe",
    levelTarget: "entry-mid",
    horizonMode: "weeks",
    targetDate: null,
    horizonWeeks: 8,
    practiceDaysPerWeek: 4,
    defaultSessionMinutes: 45,
    preferredLanguage: "python3",
    timezone: "America/New_York",
  });
  const DEFAULT_PRACTICE_PLAN = Object.freeze({
    onboardingComplete: false,
    baselineStatus: "partial",
    studyListScope: "blind75",
  });

  const STUDY_LIST_SCOPES = Object.freeze(["blind75", "neetcode150", "all"]);

  function migrateStateToV4(input = {}, options = {}) {
    const source = isObject(input) ? cloneValue(input) : {};
    const timezone = String(source.trainingProfile?.timezone || options.timezone || DEFAULT_TRAINING_PROFILE.timezone);

    return {
      ...source,
      version: STATE_VERSION,
      savedAt: source.savedAt ?? null,
      revision: finiteNumber(source.revision, 0),
      importMeta: source.importMeta ?? null,
      problems: Array.isArray(source.problems) ? source.problems : [],
      sessions: Array.isArray(source.sessions) ? source.sessions : [],
      recoveryProblemIds: Array.isArray(source.recoveryProblemIds) ? source.recoveryProblemIds : [],
      algorithmVersion: nonEmptyString(source.algorithmVersion) || ALGORITHM_VERSION,
      trainingProfile: {
        ...cloneValue(DEFAULT_TRAINING_PROFILE),
        ...(isObject(source.trainingProfile) ? source.trainingProfile : {}),
        timezone,
      },
      practicePlan: {
        ...cloneValue(DEFAULT_PRACTICE_PLAN),
        ...(isObject(source.practicePlan) ? source.practicePlan : {}),
        studyListScope: normalizeStudyListScope(source.practicePlan?.studyListScope, source.problems),
      },
    };
  }

  function createEmptyState(overrides = {}) {
    return migrateStateToV4({
      savedAt: null,
      revision: 0,
      importMeta: null,
      problems: [],
      sessions: [],
      recoveryProblemIds: [],
      ...overrides,
    });
  }

  function needsMigration(state) {
    return finiteNumber(state?.version, 0) < STATE_VERSION ||
      !isObject(state?.trainingProfile) ||
      !isObject(state?.practicePlan) ||
      !nonEmptyString(state?.algorithmVersion);
  }

  function cloneValue(value) {
    if (Array.isArray(value)) return value.map(cloneValue);
    if (!isObject(value)) return value;
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, cloneValue(item)]));
  }

  function isObject(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }

  function nonEmptyString(value) {
    return typeof value === "string" && value.trim() ? value.trim() : "";
  }

  function finiteNumber(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function normalizeStudyListScope(value, problems = []) {
    if (STUDY_LIST_SCOPES.includes(value)) return value;
    const memberships = new Set(
      (Array.isArray(problems) ? problems : []).flatMap((problem) => (
        Array.isArray(problem?.listMemberships) ? problem.listMemberships : []
      )),
    );
    if (memberships.has("blind75") && memberships.has("neetcode150")) return "all";
    if (memberships.has("neetcode150")) return "neetcode150";
    return "blind75";
  }

  return Object.freeze({
    STATE_VERSION,
    ALGORITHM_VERSION,
    DEFAULT_TRAINING_PROFILE,
    DEFAULT_PRACTICE_PLAN,
    STUDY_LIST_SCOPES,
    migrateStateToV4,
    createEmptyState,
    needsMigration,
    normalizeStudyListScope,
    cloneValue,
  });
});
