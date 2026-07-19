const assert = require("node:assert/strict");
const test = require("node:test");

const {
  deriveEvidence,
  recommendNextRep,
} = require("../recommendation-engine.js");

const TODAY = "2026-07-18";

function problem(overrides = {}) {
  const title = overrides.title || "Example Problem";
  const slug = overrides.titleSlug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return {
    id: overrides.id || slug,
    title,
    titleSlug: slug,
    url: `https://leetcode.com/problems/${slug}/`,
    topic: "Arrays and Hashing",
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
    algorithmVersion: "readiness-v1",
    trainingProfile: { defaultSessionMinutes: 45, horizonWeeks: 8 },
    practicePlan: { onboardingComplete: true, baselineStatus: "partial" },
    problems,
    sessions: [],
    recoveryProblemIds: [],
    ...overrides,
  };
}

function grade(date, value, overrides = {}) {
  return { id: `${date}-${value}`, date, createdAt: `${date}T12:00:00.000Z`, grade: value, ...overrides };
}

test("recommendations are deterministic and public output does not reveal the skill or task type", () => {
  const input = {
    today: TODAY,
    state: state([problem({ title: "Contains Duplicate", titleSlug: "contains-duplicate", difficulty: "Easy" })]),
    capacityMinutes: 45,
  };

  const first = recommendNextRep(input);
  const second = recommendNextRep(input);

  assert.deepEqual(second, first);
  assert.deepEqual(Object.keys(first.public).sort(), [
    "difficulty",
    "evidenceStatus",
    "problemId",
    "publicReason",
    "recommendationId",
    "timeBoxMinutes",
    "title",
    "url",
  ]);
  assert.equal("topic" in first.public, false);
  assert.equal("skill" in first.public, false);
  assert.equal("taskType" in first.public, false);
  assert.equal(first.private.taskType, "learn");
});

test("recommendation selection is input-order independent and does not mutate state", () => {
  const first = problem({ id: "first", title: "First", order: 1, difficulty: "Easy" });
  const second = problem({ id: "second", title: "Second", order: 2, topic: "Trees" });
  const originalState = state([first, second]);
  const before = structuredClone(originalState);

  const forward = recommendNextRep({ today: TODAY, state: originalState, capacityMinutes: 45 });
  const reversed = recommendNextRep({
    today: TODAY,
    state: state([structuredClone(second), structuredClone(first)]),
    capacityMinutes: 45,
  });

  assert.deepEqual(originalState, before);
  assert.equal(reversed.public.problemId, forward.public.problemId);
  assert.equal(reversed.public.recommendationId, forward.public.recommendationId);
});

test("public recommendation text does not leak topic or internal reason labels", () => {
  const input = problem({
    id: "concealed",
    title: "Concealed Candidate",
    topic: "Secret Hash Map Pattern",
    difficulty: "Medium",
    reviewHistory: [grade("2026-07-17", "red")],
    completionCount: 1,
  });

  const recommendation = recommendNextRep({ today: TODAY, state: state([input]), capacityMinutes: 45 });
  const publicText = JSON.stringify(recommendation.public).toLowerCase();

  assert.equal(publicText.includes("secret hash map pattern"), false);
  assert.equal(publicText.includes("repair"), false);
  assert.equal(publicText.includes("retention"), false);
  assert.equal(publicText.includes("transfer"), false);
});

test("imported-only history becomes an assessment, never clean evidence", () => {
  const imported = problem({
    title: "Longest Consecutive Sequence",
    titleSlug: "longest-consecutive-sequence",
    completionCount: 1,
    reviewHistory: [{ date: "2025-12-01", grade: "imported" }],
  });

  const recommendation = recommendNextRep({ today: TODAY, state: state([imported]), capacityMinutes: 45 });
  const evidence = deriveEvidence(state([imported]), { today: TODAY });

  assert.equal(recommendation.private.taskType, "assessment");
  assert.ok(recommendation.private.reasonCodes.includes("historical-exposure-unverified"));
  assert.deepEqual(evidence.independentSkillIds, []);
});

test("a recent weak result can outrank an old due review", () => {
  const repair = problem({
    id: "repair",
    title: "Repair Candidate",
    titleSlug: "repair-candidate",
    order: 1,
    reviewHistory: [grade("2026-07-17", "red")],
    completionCount: 1,
    nextReview: "2026-07-19",
  });
  const retention = problem({
    id: "retention",
    title: "Due Candidate",
    titleSlug: "due-candidate",
    topic: "Trees",
    order: 2,
    reviewHistory: [grade("2026-06-25", "green")],
    completionCount: 1,
    nextReview: "2026-07-01",
  });

  const recommendation = recommendNextRep({ today: TODAY, state: state([retention, repair]), capacityMinutes: 45 });

  assert.equal(recommendation.public.problemId, "repair");
  assert.equal(recommendation.private.taskType, "repair");
  assert.ok(recommendation.private.rankedCandidates.some((candidate) => candidate.problemId === "retention"));
});

test("an exact-title due review remains eligible as retention", () => {
  const due = problem({
    id: "due",
    title: "Due Candidate",
    reviewHistory: [grade("2026-06-01", "green")],
    completionCount: 1,
    nextReview: "2026-07-17",
  });

  const recommendation = recommendNextRep({ today: TODAY, state: state([due]), capacityMinutes: 45 });

  assert.equal(recommendation.public.problemId, "due");
  assert.equal(recommendation.private.taskType, "retention");
  assert.ok(recommendation.private.reasonCodes.includes("exact-review-due"));
});

test("capacity excludes reps that do not fit", () => {
  const quickReview = problem({
    id: "quick",
    title: "Quick Review",
    difficulty: "Easy",
    topic: "Trees",
    reviewHistory: [grade("2026-06-01", "green")],
    completionCount: 1,
    nextReview: "2026-07-17",
  });
  const newMedium = problem({ id: "new-medium", title: "New Medium", difficulty: "Medium" });

  const recommendation = recommendNextRep({
    today: TODAY,
    state: state([newMedium, quickReview]),
    capacityMinutes: 15,
  });

  assert.equal(recommendation.public.problemId, "quick");
  assert.equal(recommendation.public.timeBoxMinutes, 10);
});

test("skip exclusions rotate deterministically", () => {
  const first = problem({ id: "first", title: "First", order: 1, difficulty: "Easy" });
  const second = problem({ id: "second", title: "Second", order: 2, difficulty: "Easy", topic: "Trees" });
  const initial = recommendNextRep({ today: TODAY, state: state([first, second]), capacityMinutes: 45 });
  const rotated = recommendNextRep({
    today: TODAY,
    state: state([first, second]),
    capacityMinutes: 45,
    skippedProblemIds: [initial.public.problemId],
  });

  assert.notEqual(rotated.public.problemId, initial.public.problemId);
});

test("transfer evidence requires distinct titles and a designated transfer attempt", () => {
  const repeatedTitle = problem({
    id: "same",
    title: "Same Title",
    reviewHistory: [
      grade("2026-07-10", "green", { taskType: "assessment", assistance: "none" }),
      grade("2026-07-12", "green", { taskType: "transfer", assistance: "none" }),
    ],
  });
  const distinctTitle = problem({
    id: "different",
    title: "Different Title",
    reviewHistory: [grade("2026-07-14", "green", { taskType: "transfer", assistance: "none" })],
  });

  const repeatedEvidence = deriveEvidence(state([repeatedTitle]), { today: TODAY });
  const distinctEvidence = deriveEvidence(state([repeatedTitle, distinctTitle]), { today: TODAY });
  const skillId = "arrays-and-hashing";

  assert.equal(repeatedEvidence.skills.get(skillId).checkedTitles.size, 1);
  assert.equal(repeatedEvidence.skills.get(skillId).transferSupported, false);
  assert.equal(distinctEvidence.skills.get(skillId).checkedTitles.size, 2);
  assert.equal(distinctEvidence.skills.get(skillId).transferSupported, true);
});
