const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const {
  ALGORITHM_VERSION,
  DEFAULT_PRACTICE_PLAN,
  DEFAULT_TRAINING_PROFILE,
  STATE_VERSION,
  createEmptyState,
  migrateStateToV4,
  needsMigration,
} = require("../state-v4.js");

const FIXTURE_PATH = path.join(__dirname, "..", "data", "fixtures", "qa-state.json");

function loadFixture() {
  return JSON.parse(fs.readFileSync(FIXTURE_PATH, "utf8"));
}

test("v3 migration is lossless below the version boundary", () => {
  const source = loadFixture();
  source.revision = 7;
  source.futureTopLevel = { retained: true, nested: [1, { value: "sentinel" }] };
  source.problems[0].topics = [source.problems[0].topic, "Prefix Sum"];
  source.problems[0].futureProblemField = { retained: "problem" };
  source.problems[0].solution = {
    approach: "Prefix and suffix products",
    timeComplexity: "O(n)",
    spaceComplexity: "O(1) auxiliary",
    explanation: "Keep output arrays only.",
    futureSolutionField: "retained",
  };
  source.problems[0].reviewHistory[0].futureHistoryField = { retained: "history" };
  source.sessions[0].futureSessionField = { retained: "session" };
  source.sessions.push(...Array.from({ length: 125 }, (_, index) => ({
    sessionId: `session-${index}`,
    date: "2026-05-01",
    grade: "green",
  })));

  const before = structuredClone(source);
  const migrated = migrateStateToV4(source);

  assert.deepEqual(source, before, "migration must not mutate caller state");
  assert.equal(migrated.version, STATE_VERSION);
  assert.equal(migrated.algorithmVersion, ALGORITHM_VERSION);
  assert.deepEqual(migrated.importMeta, before.importMeta);
  assert.deepEqual(migrated.problems, before.problems);
  assert.deepEqual(migrated.sessions, before.sessions);
  assert.deepEqual(migrated.recoveryProblemIds, before.recoveryProblemIds);
  assert.deepEqual(migrated.futureTopLevel, before.futureTopLevel);
  assert.equal(migrated.problems[0].confidence, before.problems[0].confidence);
  assert.deepEqual(migrated.problems[0].topics, before.problems[0].topics);
  assert.equal(migrated.sessions.length, before.sessions.length, "session history must not be capped");
});

test("migration adds profile defaults without overwriting supplied values", () => {
  const migrated = migrateStateToV4({
    version: 3,
    problems: [],
    sessions: [],
    trainingProfile: {
      horizonWeeks: 12,
      timezone: "America/Los_Angeles",
      futurePreference: "retained",
    },
    practicePlan: {
      onboardingComplete: true,
      futurePlanField: "retained",
    },
  });

  assert.equal(migrated.trainingProfile.horizonWeeks, 12);
  assert.equal(migrated.trainingProfile.timezone, "America/Los_Angeles");
  assert.equal(migrated.trainingProfile.futurePreference, "retained");
  assert.equal(migrated.trainingProfile.defaultSessionMinutes, DEFAULT_TRAINING_PROFILE.defaultSessionMinutes);
  assert.equal(migrated.practicePlan.onboardingComplete, true);
  assert.equal(migrated.practicePlan.baselineStatus, DEFAULT_PRACTICE_PLAN.baselineStatus);
  assert.equal(migrated.practicePlan.futurePlanField, "retained");
});

test("migration is idempotent", () => {
  const once = migrateStateToV4(loadFixture());
  const twice = migrateStateToV4(once);

  assert.deepEqual(twice, once);
  assert.equal(needsMigration(once), false);
  assert.equal(needsMigration(loadFixture()), true);
});

test("empty V4 state has an explicit training profile and plan", () => {
  const empty = createEmptyState();

  assert.equal(empty.version, STATE_VERSION);
  assert.equal(empty.algorithmVersion, ALGORITHM_VERSION);
  assert.deepEqual(empty.problems, []);
  assert.deepEqual(empty.sessions, []);
  assert.deepEqual(empty.recoveryProblemIds, []);
  assert.deepEqual(empty.trainingProfile, DEFAULT_TRAINING_PROFILE);
  assert.deepEqual(empty.practicePlan, DEFAULT_PRACTICE_PLAN);
});

test("study-list scope preserves explicit values and infers legacy list usage", () => {
  assert.equal(
    migrateStateToV4({ practicePlan: { studyListScope: "neetcode150" } }).practicePlan.studyListScope,
    "neetcode150",
  );
  assert.equal(
    migrateStateToV4({ problems: [{ listMemberships: ["neetcode150"] }] }).practicePlan.studyListScope,
    "neetcode150",
  );
  assert.equal(
    migrateStateToV4({ problems: [{ listMemberships: ["blind75", "neetcode150"] }] }).practicePlan.studyListScope,
    "all",
  );
});

test("familiarity history remains lossless without changing the V4 state boundary", () => {
  const event = {
    id: "familiar-1",
    kind: "familiarity",
    date: "2026-09-05",
    occurredAt: "2026-09-05T12:00:00.000Z",
    intervalDays: 14,
    eligibleAgainAt: "2026-09-19",
    familiaritySequence: 1,
    revokedAt: "",
  };
  const migrated = migrateStateToV4({
    version: STATE_VERSION,
    problems: [{ id: "two-sum", reviewHistory: [event] }],
    sessions: [],
  });

  assert.equal(migrated.version, STATE_VERSION);
  assert.deepEqual(migrated.problems[0].reviewHistory[0], event);
  assert.deepEqual(migrated.sessions, []);
});

test("timezone can be supplied by the runtime only when state has none", () => {
  const withRuntimeTimezone = migrateStateToV4(
    { version: 3, problems: [], sessions: [] },
    { timezone: "Europe/London" },
  );
  const withSavedTimezone = migrateStateToV4(
    {
      version: 4,
      problems: [],
      sessions: [],
      trainingProfile: { timezone: "Asia/Tokyo" },
    },
    { timezone: "Europe/London" },
  );

  assert.equal(withRuntimeTimezone.trainingProfile.timezone, "Europe/London");
  assert.equal(withSavedTimezone.trainingProfile.timezone, "Asia/Tokyo");
});
