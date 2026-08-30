const assert = require("node:assert/strict");
const test = require("node:test");

const {
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
