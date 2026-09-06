const assert = require("node:assert/strict");
const test = require("node:test");

const {
  calculateFamiliarityTransition,
  filterCatalogByStudyScope,
  recommendNextRepV2,
  deriveV2Evidence,
} = require("../recommendation-engine.js");

const TODAY = "2026-08-30";

function problem(overrides = {}) {
  const title = overrides.title || "Example Problem";
  const slug = overrides.titleSlug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return {
    id: overrides.id || slug,
    title,
    titleSlug: slug,
    url: `https://leetcode.com/problems/${slug}/`,
    topic: "Arrays and Hashing",
    patternId: "hash-map",
    difficulty: "Medium",
    stage: 0,
    nextReview: "",
    completionCount: 0,
    reviewHistory: [],
    ...overrides,
  };
}

function state(problems, overrides = {}) {
  return {
    version: 4,
    algorithmVersion: "readiness-v1.9",
    trainingProfile: { defaultSessionMinutes: 45, horizonWeeks: 8 },
    problems,
    sessions: [],
    ...overrides,
  };
}

function grade(date, gradeValue, overrides = {}) {
  return {
    id: `${date}-${gradeValue}`,
    date,
    createdAt: `${date}T12:00:00.000Z`,
    occurredAt: `${date}T12:00:00.000Z`,
    grade: gradeValue,
    assistance: gradeValue === "green" ? "none" : "heavy",
    solutionQuality: gradeValue === "green" ? "expected" : "suboptimal",
    ...overrides,
  };
}

function familiarity(date, overrides = {}) {
  return {
    id: `familiar-${date}-${overrides.familiaritySequence || 1}`,
    kind: "familiarity",
    date,
    occurredAt: `${date}T12:00:00.000Z`,
    createdAt: `${date}T12:00:00.000Z`,
    intervalDays: 14,
    eligibleAgainAt: "2026-09-13",
    familiaritySequence: 1,
    revokedAt: "",
    ...overrides,
  };
}

test("familiarity uses a separate adaptive ladder without creating grade evidence", () => {
  const unseen = problem();
  const first = calculateFamiliarityTransition(unseen, {
    today: TODAY,
    now: `${TODAY}T13:00:00.000Z`,
  });
  assert.equal(first.intervalDays, 14);
  assert.equal(first.eligibleAgainAt, "2026-09-13");
  assert.equal(first.familiaritySequence, 1);

  const laterExistingReview = calculateFamiliarityTransition(problem({ nextReview: "2026-10-01" }), {
    today: TODAY,
    now: `${TODAY}T13:00:00.000Z`,
  });
  assert.equal(laterExistingReview.eligibleAgainAt, "2026-10-01");

  const repeated = problem({ reviewHistory: [familiarity(TODAY)] });
  const second = calculateFamiliarityTransition(repeated, {
    today: "2026-09-13",
    now: "2026-09-13T13:00:00.000Z",
  });
  assert.equal(second.intervalDays, 30);
  assert.equal(second.familiaritySequence, 2);

  const weak = problem({
    reviewHistory: [grade("2026-08-29", "yellow")],
    nextReview: "2026-09-02",
  });
  const weakTransition = calculateFamiliarityTransition(weak, {
    today: TODAY,
    now: `${TODAY}T13:00:00.000Z`,
  });
  assert.equal(weakTransition.intervalDays, 7);
  assert.equal(weakTransition.eligibleAgainAt, "2026-09-06");

  const verified = problem({
    stage: 4,
    reviewHistory: [grade("2026-08-20", "green")],
  });
  assert.equal(calculateFamiliarityTransition(verified, {
    today: TODAY,
    now: `${TODAY}T13:00:00.000Z`,
  }).intervalDays, 60);
});

test("revoked familiarity is ignored and a later real grade supersedes prior familiarity", () => {
  const revoked = problem({
    reviewHistory: [familiarity(TODAY, { revokedAt: `${TODAY}T13:00:00.000Z` })],
  });
  assert.equal(calculateFamiliarityTransition(revoked, {
    today: TODAY,
    now: `${TODAY}T14:00:00.000Z`,
  }).familiaritySequence, 1);

  const superseded = problem({
    stage: 2,
    reviewHistory: [
      familiarity("2026-08-01", { eligibleAgainAt: "2026-09-19" }),
      grade("2026-08-15", "green", { occurredAt: "2026-08-15T12:00:00.000Z" }),
    ],
    nextReview: "2026-09-01",
  });
  const recommendation = recommendNextRepV2({
    today: "2026-09-01",
    now: "2026-09-01T12:00:00.000Z",
    state: state([superseded]),
    capacityMinutes: 45,
  });
  assert.equal(recommendation.public.problemId, superseded.id);

  const sameDayBackfill = problem({
    reviewHistory: [
      familiarity(TODAY),
      grade(TODAY, "green", { backfilled: true, occurredAt: "", createdAt: "" }),
    ],
  });
  assert.equal(calculateFamiliarityTransition(sameDayBackfill, {
    today: TODAY,
    now: `${TODAY}T14:00:00.000Z`,
  }).familiaritySequence, 1);
});

test("familiarity defers only the exact title and can be explicitly overridden", () => {
  const deferred = problem({
    id: "deferred",
    title: "Deferred Problem",
    reviewHistory: [familiarity(TODAY)],
  });
  const normal = recommendNextRepV2({
    today: TODAY,
    now: `${TODAY}T13:00:00.000Z`,
    state: state([deferred]),
    capacityMinutes: 45,
  });
  assert.equal(normal.public, null);
  assert.ok(normal.private.reasonCodes.includes("all-candidates-familiar-deferred"));
  assert.equal(normal.private.earliestFamiliarEligibleAt, "2026-09-13");
  const evidence = deriveV2Evidence(state([deferred]), { today: TODAY, now: `${TODAY}T13:00:00.000Z` });
  assert.equal(evidence.skills.get("arrays-and-hashing").checked, false);
  assert.equal(evidence.skills.get("arrays-and-hashing").independent, false);

  const override = recommendNextRepV2({
    today: TODAY,
    now: `${TODAY}T13:00:00.000Z`,
    state: state([deferred]),
    capacityMinutes: 45,
    includeFamiliarDeferred: true,
  });
  assert.equal(override.public.problemId, "deferred");

  const deferredAfterGreen = problem({
    id: "deferred-green",
    title: "Deferred After Green",
    stage: 3,
    nextReview: "2026-09-13",
    reviewHistory: [
      grade("2026-08-15", "green"),
      familiarity(TODAY, { eligibleAgainAt: "2026-09-29", intervalDays: 30 }),
    ],
  });
  const greenOverride = recommendNextRepV2({
    today: TODAY,
    now: `${TODAY}T13:00:00.000Z`,
    state: state([deferredAfterGreen]),
    capacityMinutes: 45,
    includeFamiliarDeferred: true,
  });
  assert.equal(greenOverride.public.problemId, "deferred-green");
});

test("a scoped materialized familiarity event suppresses its matching catalog title", () => {
  const saved = problem({
    id: "saved-two-sum",
    title: "Two Sum",
    titleSlug: "two-sum",
    listMemberships: ["blind75", "neetcode150"],
    reviewHistory: [familiarity(TODAY)],
  });
  const recommendation = recommendNextRepV2({
    today: TODAY,
    now: `${TODAY}T13:00:00.000Z`,
    state: state([saved], { practicePlan: { studyListScope: "blind75" } }),
    catalog: [{
      title: "Two Sum",
      slug: "two-sum",
      topic: "Arrays and Hashing",
      difficulty: "Easy",
      listMemberships: ["blind75", "neetcode150"],
    }],
    capacityMinutes: 45,
  });

  assert.equal(recommendation.public, null);
  assert.ok(recommendation.private.reasonCodes.includes("all-candidates-familiar-deferred"));
});

test("imported-only history is unverified current work, not independent evidence", () => {
  const imported = problem({
    id: "imported",
    title: "Imported Problem",
    reviewHistory: [{ id: "csv-1", date: "2026-08-01", grade: "imported" }],
  });

  const evidence = deriveV2Evidence(state([imported]), { today: TODAY, now: `${TODAY}T12:00:00.000Z` });
  const recommendation = recommendNextRepV2({ today: TODAY, now: `${TODAY}T12:00:00.000Z`, state: state([imported]), capacityMinutes: 45 });

  assert.equal(evidence.skills.get("arrays-and-hashing").independent, false);
  assert.equal(recommendation.public.problemId, "imported");
  assert.equal(recommendation.private.taskType, "learn");
  assert.equal(recommendation.public.topic, undefined);
  assert.ok(recommendation.private.reasonCodes.includes("historical-exposure-unverified"));
});

test("Blind 75 scope excludes NeetCode-only catalog candidates", () => {
  const catalog = [
    {
      title: "Valid Sudoku",
      slug: "valid-sudoku",
      listMemberships: ["neetcode150"],
      topic: "Arrays and Hashing",
      difficulty: "Medium",
    },
    {
      title: "Two Sum",
      slug: "two-sum",
      listMemberships: ["blind75"],
      topic: "Arrays and Hashing",
      difficulty: "Easy",
    },
  ];
  assert.deepEqual(filterCatalogByStudyScope(catalog, "blind75").map((item) => item.slug), ["two-sum"]);
  const recommendation = recommendNextRepV2({
    today: TODAY,
    now: `${TODAY}T12:00:00.000Z`,
    state: state([
      problem({
        id: "saved-valid-sudoku",
        title: "Valid Sudoku",
        titleSlug: "valid-sudoku",
        listMemberships: ["neetcode150"],
      }),
    ], { practicePlan: { studyListScope: "blind75" } }),
    catalog,
    capacityMinutes: 45,
  });
  assert.equal(recommendation.public.title, "Two Sum");
});

test("unseen work in a familiar skill is preferred over a recent exact green repeat", () => {
  const familiar = problem({
    id: "familiar",
    title: "Familiar Problem",
    reviewHistory: [grade("2026-08-27", "green")],
    nextReview: "2026-08-31",
  });
  const unseen = problem({ id: "unseen", title: "Unseen Problem", patternId: "sliding-window" });
  const recommendation = recommendNextRepV2({
    today: TODAY,
    now: `${TODAY}T12:00:00.000Z`,
    state: state([familiar, unseen]),
    capacityMinutes: 45,
  });

  assert.equal(recommendation.public.problemId, "unseen");
  assert.equal(recommendation.private.taskType, "transfer");
});

test("a recent yellow repair wins over new work", () => {
  const repair = problem({
    id: "repair",
    title: "Repair Problem",
    difficulty: "Easy",
    reviewHistory: [grade("2026-08-28", "yellow")],
    nextReview: "2026-08-29",
  });
  const unseen = problem({ id: "unseen", title: "Unseen Problem", difficulty: "Easy" });
  const recommendation = recommendNextRepV2({
    today: TODAY,
    now: `${TODAY}T12:00:00.000Z`,
    state: state([repair, unseen]),
    capacityMinutes: 30,
  });

  assert.equal(recommendation.public.problemId, "repair");
  assert.equal(recommendation.private.taskType, "repair");
  assert.ok(recommendation.private.reasonCodes.includes("recent-friction"));
});

test("healthy exact retention requires a meaningful gap", () => {
  const recent = problem({
    id: "recent",
    title: "Recent Green",
    difficulty: "Easy",
    reviewHistory: [grade("2026-08-28", "green")],
    nextReview: TODAY,
  });
  const recommendation = recommendNextRepV2({
    today: TODAY,
    now: `${TODAY}T12:00:00.000Z`,
    state: state([recent]),
    capacityMinutes: 30,
  });

  assert.equal(recommendation.public, null);
  assert.ok(recommendation.private.reasonCodes.includes("no-eligible-candidate"));

  const old = problem({
    id: "old",
    title: "Old Green",
    difficulty: "Easy",
    reviewHistory: [grade("2026-08-10", "green")],
    nextReview: TODAY,
  });
  const retention = recommendNextRepV2({
    today: TODAY,
    now: `${TODAY}T12:00:00.000Z`,
    state: state([old]),
    capacityMinutes: 30,
  });

  assert.equal(retention.public.problemId, "old");
  assert.equal(retention.private.taskType, "retention");
});

test("hard work stays gated until two independent medium titles share its pattern", () => {
  const first = problem({ id: "medium-1", title: "Medium One", difficulty: "Medium", patternId: "monotonic-stack", reviewHistory: [grade("2026-08-20", "green")] });
  const second = problem({ id: "medium-2", title: "Medium Two", difficulty: "Medium", patternId: "monotonic-stack", reviewHistory: [grade("2026-08-21", "green")] });
  const hard = problem({ id: "hard", title: "Hard Candidate", difficulty: "Hard", patternId: "monotonic-stack" });

  const closed = recommendNextRepV2({ today: TODAY, now: `${TODAY}T12:00:00.000Z`, state: state([first, hard]), capacityMinutes: 60 });
  assert.notEqual(closed.public?.problemId, "hard");
  assert.ok(closed.private.reasonCodes.includes("no-eligible-candidate"));

  const open = recommendNextRepV2({ today: TODAY, now: `${TODAY}T12:00:00.000Z`, state: state([first, second, hard]), capacityMinutes: 60 });
  assert.equal(open.public.problemId, "hard");
  assert.ok(open.private.reasonCodes.includes("hard-gate-open"));
});

test("an unlocked hard fits the documented forty-five-minute solving budget", () => {
  const first = problem({
    id: "medium-1",
    title: "Medium One",
    difficulty: "Medium",
    patternId: "interval-sweep",
    reviewHistory: [grade("2026-08-20", "green")],
  });
  const second = problem({
    id: "medium-2",
    title: "Medium Two",
    difficulty: "Medium",
    patternId: "interval-sweep",
    reviewHistory: [grade("2026-08-21", "green")],
  });
  const hard = problem({
    id: "hard",
    title: "Hard Candidate",
    difficulty: "Hard",
    patternId: "interval-sweep",
  });

  const recommendation = recommendNextRepV2({
    today: TODAY,
    now: `${TODAY}T12:00:00.000Z`,
    state: state([first, second, hard]),
    capacityMinutes: 45,
  });

  assert.equal(recommendation.public.problemId, "hard");
  assert.equal(recommendation.public.timeBoxMinutes, 45);
  assert.equal(recommendation.private.requiredMinutes, 45);
  assert.equal(recommendation.private.hardLockedForAcquisition, false);
});

test("built-in catalog titles provide pattern metadata for hard eligibility", () => {
  const first = problem({
    id: "daily-temperatures",
    title: "Daily Temperatures",
    patternId: "",
    reviewHistory: [grade("2026-08-20", "green")],
  });
  const second = problem({
    id: "car-fleet",
    title: "Car Fleet",
    patternId: "",
    reviewHistory: [grade("2026-08-21", "green")],
  });
  const hard = problem({
    id: "largest-rectangle-in-histogram",
    title: "Largest Rectangle in Histogram",
    difficulty: "Hard",
    patternId: "",
  });
  const catalog = [first, second, hard].map(({ id, title, titleSlug, url, difficulty, topic }) => ({
    id,
    title,
    titleSlug,
    url,
    difficulty,
    topic,
  }));

  const recommendation = recommendNextRepV2({
    today: TODAY,
    now: `${TODAY}T12:00:00.000Z`,
    state: state([first, second, hard]),
    catalog,
    capacityMinutes: 45,
  });

  assert.equal(recommendation.public.problemId, "largest-rectangle-in-histogram");
  assert.equal(recommendation.private.patternId, "monotonic-stack");
  assert.equal(recommendation.private.hardLockedForAcquisition, false);
});

test("an in-progress recommendation can be pinned after a refresh", () => {
  const first = problem({ id: "first", title: "First Candidate", difficulty: "Easy" });
  const second = problem({ id: "second", title: "Second Candidate", difficulty: "Easy" });
  const input = {
    today: TODAY,
    now: `${TODAY}T12:00:00.000Z`,
    state: state([first, second]),
    capacityMinutes: 30,
  };
  const initial = recommendNextRepV2(input);
  const pinned = recommendNextRepV2({ ...input, pinnedProblemId: "second" });

  assert.equal(initial.public.problemId, "first");
  assert.equal(pinned.public.problemId, "second");
});

test("broad topic evidence does not unlock a hard without pattern metadata", () => {
  const first = problem({ id: "topic-medium-1", title: "Topic Medium One", patternId: "" , reviewHistory: [grade("2026-08-20", "green")] });
  const second = problem({ id: "topic-medium-2", title: "Topic Medium Two", patternId: "", reviewHistory: [grade("2026-08-21", "green")] });
  const hard = problem({ id: "topic-hard", title: "Topic Hard", difficulty: "Hard", patternId: "" });
  const recommendation = recommendNextRepV2({
    today: TODAY,
    now: `${TODAY}T12:00:00.000Z`,
    state: state([first, second, hard]),
    capacityMinutes: 60,
  });

  assert.notEqual(recommendation.public?.problemId, "topic-hard");
  assert.equal(recommendation.public, null);
  assert.ok(recommendation.private.reasonCodes.includes("no-eligible-candidate"));
});

test("learning-signal tags do not masquerade as pattern metadata", () => {
  const first = problem({
    id: "tagged-medium-1",
    title: "Tagged Medium One",
    patternId: "",
    tags: ["syntax"],
    reviewHistory: [grade("2026-08-20", "green")],
  });
  const second = problem({
    id: "tagged-medium-2",
    title: "Tagged Medium Two",
    patternId: "",
    tags: ["edge-case"],
    reviewHistory: [grade("2026-08-21", "green")],
  });
  const hard = problem({ id: "tagged-hard", title: "Tagged Hard", difficulty: "Hard", patternId: "", tags: ["syntax"] });
  const recommendation = recommendNextRepV2({
    today: TODAY,
    now: `${TODAY}T12:00:00.000Z`,
    state: state([first, second, hard]),
    capacityMinutes: 60,
  });

  assert.notEqual(recommendation.public?.problemId, "tagged-hard");
  assert.equal(recommendation.public, null);
});

test("a recent failed hard remains repairable while new hard acquisition stays gated", () => {
  const failedHard = problem({
    id: "failed-hard",
    title: "Failed Hard",
    difficulty: "Hard",
    patternId: "unknown-pattern",
    reviewHistory: [grade("2026-08-29", "red")],
    nextReview: "2026-08-30",
  });
  const unseenHard = problem({
    id: "unseen-hard",
    title: "Unseen Hard",
    difficulty: "Hard",
    patternId: "unknown-pattern",
  });
  const recommendation = recommendNextRepV2({
    today: TODAY,
    now: `${TODAY}T12:00:00.000Z`,
    state: state([failedHard, unseenHard]),
    capacityMinutes: 60,
  });

  assert.equal(recommendation.public.problemId, "failed-hard");
  assert.equal(recommendation.private.taskType, "repair");
  assert.equal(recommendation.private.hardLockedForAcquisition, false);
});

test("a fifteen-minute budget does not silently recommend a new problem that cannot fit", () => {
  const recommendation = recommendNextRepV2({
    today: TODAY,
    now: `${TODAY}T12:00:00.000Z`,
    state: state([problem({ id: "easy", title: "Easy Candidate", difficulty: "Easy" })]),
    capacityMinutes: 15,
  });

  assert.equal(recommendation.public, null);
  assert.ok(recommendation.private.reasonCodes.includes("capacity-too-small-for-new-coverage"));
});

test("future-dated history cannot make a title appear due during replay", () => {
  const future = problem({
    id: "future",
    title: "Future Attempt",
    reviewHistory: [grade("2026-09-02", "green", { nextReview: "2026-09-16" })],
    nextReview: "2026-09-16",
  });
  const unseen = problem({ id: "unseen", title: "Unseen Problem", patternId: "graph-search" });
  const recommendation = recommendNextRepV2({
    today: TODAY,
    now: `${TODAY}T12:00:00.000Z`,
    state: state([future, unseen]),
    capacityMinutes: 45,
  });

  assert.equal(recommendation.public.problemId, "unseen");
  assert.notEqual(recommendation.public.problemId, "future");
});
