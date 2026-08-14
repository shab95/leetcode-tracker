const assert = require("node:assert/strict");
const test = require("node:test");

const {
  deriveEvidence,
  localDateKey,
  properAttempts,
  recommendNextRep,
  summarizeStudyListEvidence,
} = require("../recommendation-engine.js");

const TODAY = "2026-07-18";

test("the engine derives default dates from the user's local calendar", () => {
  const lateLocalEvening = new Date(2026, 6, 18, 23, 30, 0);
  assert.equal(localDateKey(lateLocalEvening), "2026-07-18");
});

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
    "independentCheckpointMinutes",
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

test("recommendations expose an independent checkpoint before the full attempt ceiling", () => {
  const easy = recommendNextRep({
    today: TODAY,
    state: state([problem({ id: "easy", title: "Easy Candidate", difficulty: "Easy" })]),
    capacityMinutes: 45,
  });
  const medium = recommendNextRep({
    today: TODAY,
    state: state([problem({ id: "medium", title: "Medium Candidate", difficulty: "Medium" })]),
    capacityMinutes: 45,
  });
  const hard = recommendNextRep({
    today: TODAY,
    state: state([problem({ id: "hard", title: "Hard Candidate", difficulty: "Hard" })]),
    capacityMinutes: 60,
  });

  assert.deepEqual(
    [easy.public.independentCheckpointMinutes, medium.public.independentCheckpointMinutes, hard.public.independentCheckpointMinutes],
    [10, 15, 20],
  );
  assert.deepEqual(
    [easy.public.timeBoxMinutes, medium.public.timeBoxMinutes, hard.public.timeBoxMinutes],
    [20, 30, 45],
  );
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

test("same-day attempts use their real timestamps instead of source array order", () => {
  const earlier = grade(TODAY, "red", {
    id: "earlier-attempt",
    occurredAt: `${TODAY}T09:00:00.000Z`,
    createdAt: `${TODAY}T09:00:00.000Z`,
  });
  const later = grade(TODAY, "green", {
    id: "later-attempt",
    occurredAt: `${TODAY}T10:00:00.000Z`,
    createdAt: `${TODAY}T10:00:00.000Z`,
    assistance: "none",
  });

  const forward = properAttempts(problem({ reviewHistory: [earlier, later] }));
  const reversed = properAttempts(problem({ reviewHistory: [later, earlier] }));

  assert.deepEqual(forward.map((attempt) => attempt.id), ["earlier-attempt", "later-attempt"]);
  assert.deepEqual(reversed.map((attempt) => attempt.id), ["earlier-attempt", "later-attempt"]);
  assert.equal(reversed.at(-1).grade, "green");
});

test("legacy date-only attempts have a deterministic fallback order", () => {
  const alpha = {
    id: "alpha",
    date: TODAY,
    createdAt: `${TODAY}T20:00:00.000Z`,
    grade: "yellow",
    backfilled: true,
  };
  const omega = {
    id: "omega",
    date: TODAY,
    createdAt: `${TODAY}T08:00:00.000Z`,
    grade: "green",
    assistance: "none",
    backfilled: true,
  };

  const forward = properAttempts(problem({ reviewHistory: [omega, alpha] }));
  const reversed = properAttempts(problem({ reviewHistory: [alpha, omega] }));

  assert.deepEqual(forward.map((attempt) => attempt.id), ["alpha", "omega"]);
  assert.deepEqual(reversed.map((attempt) => attempt.id), ["alpha", "omega"]);
});

test("transfer debt is stable when its twelve-attempt boundary falls within one day", () => {
  const sameDayProblems = Array.from({ length: 13 }, (_, index) => problem({
    id: `same-day-${index}`,
    title: `Same Day ${index}`,
    topic: `Skill ${index}`,
    reviewHistory: [grade(TODAY, "green", {
      id: `attempt-${index}`,
      occurredAt: `${TODAY}T${String(index).padStart(2, "0")}:00:00.000Z`,
      createdAt: `${TODAY}T${String(index).padStart(2, "0")}:00:00.000Z`,
      taskType: index === 0 ? "transfer" : "assessment",
      assistance: "none",
    })],
  }));

  const forward = deriveEvidence(state(sameDayProblems), { today: TODAY });
  const reversed = deriveEvidence(state([...sameDayProblems].reverse()), { today: TODAY });

  assert.equal(forward.transferDebt, true);
  assert.equal(reversed.transferDebt, true);
  assert.deepEqual(
    forward.recentAttempts.map((attempt) => attempt.id),
    reversed.recentAttempts.map((attempt) => attempt.id),
  );
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

  const recommendation = recommendNextRep({
    today: TODAY,
    now: "2026-07-18T13:00:00.000Z",
    state: state([retention, repair]),
    capacityMinutes: 45,
  });

  assert.equal(recommendation.public.problemId, "repair");
  assert.equal(recommendation.private.taskType, "repair");
  assert.ok(recommendation.private.rankedCandidates.some((candidate) => candidate.problemId === "retention"));
});

test("a recent independent but suboptimal solution creates an optimization repair gap", () => {
  const optimizationGap = problem({
    id: "optimization-gap",
    title: "Optimization Gap",
    titleSlug: "optimization-gap",
    order: 1,
    reviewHistory: [grade("2026-07-16", "green", {
      assistance: "none",
      taskType: "assessment",
      solutionQuality: "suboptimal",
    })],
    completionCount: 1,
    nextReview: TODAY,
  });
  const alternative = problem({
    id: "alternative",
    title: "Alternative",
    titleSlug: "alternative",
    order: 2,
    difficulty: "Easy",
    topic: "Trees",
  });

  const recommendation = recommendNextRep({
    today: TODAY,
    now: "2026-07-18T13:00:00.000Z",
    state: state([optimizationGap, alternative]),
    capacityMinutes: 45,
  });
  const evidence = deriveEvidence(state([optimizationGap]), { today: TODAY });

  assert.equal(recommendation.public.problemId, "optimization-gap");
  assert.equal(recommendation.private.taskType, "repair");
  assert.ok(recommendation.private.reasonCodes.includes("recent-optimization-gap"));
  assert.ok(evidence.independentSkillIds.includes("arrays-and-hashing"));
});

test("a red repair cannot repeat the same title before 24 elapsed hours", () => {
  const recentRepair = problem({
    id: "recent-repair",
    title: "Pacific Atlantic Water Flow",
    titleSlug: "pacific-atlantic-water-flow",
    reviewHistory: [grade("2026-07-17", "red", { createdAt: "2026-07-17T11:00:00.000Z" })],
    completionCount: 1,
    nextReview: "2026-07-18",
  });
  const alternative = problem({
    id: "alternative",
    title: "Maximum Depth of Binary Tree",
    titleSlug: "maximum-depth-of-binary-tree",
    difficulty: "Easy",
    topic: "Trees",
  });

  const recommendation = recommendNextRep({
    today: TODAY,
    now: "2026-07-18T04:00:00.000Z",
    state: state([recentRepair, alternative]),
    capacityMinutes: 30,
  });

  assert.equal(recommendation.public.problemId, "alternative");
  assert.equal(recommendation.private.rankedCandidates.some((candidate) => candidate.problemId === "recent-repair"), false);
});

test("a red repair becomes eligible after 24 elapsed hours", () => {
  const repair = problem({
    id: "repair",
    title: "Pacific Atlantic Water Flow",
    titleSlug: "pacific-atlantic-water-flow",
    reviewHistory: [grade("2026-07-17", "red", { createdAt: "2026-07-17T11:00:00.000Z" })],
    completionCount: 1,
    nextReview: "2026-07-18",
  });
  const alternative = problem({
    id: "alternative",
    title: "Maximum Depth of Binary Tree",
    titleSlug: "maximum-depth-of-binary-tree",
    difficulty: "Easy",
    topic: "Trees",
  });

  const recommendation = recommendNextRep({
    today: TODAY,
    now: "2026-07-18T12:00:00.000Z",
    state: state([repair, alternative]),
    capacityMinutes: 30,
  });

  assert.equal(recommendation.public.problemId, "repair");
  assert.equal(recommendation.private.taskType, "repair");
});

test("all real grades respect a 24-hour exact-title cooldown across midnight", () => {
  for (const value of ["red", "yellow", "green"]) {
    const recent = problem({
      id: `recent-${value}`,
      title: `Recent ${value}`,
      titleSlug: `recent-${value}`,
      reviewHistory: [grade("2026-07-17", value, { createdAt: "2026-07-17T11:00:00.000Z" })],
      completionCount: 1,
      nextReview: TODAY,
    });
    const alternative = problem({
      id: `midnight-alternative-${value}`,
      title: `Midnight alternative ${value}`,
      titleSlug: `midnight-alternative-${value}`,
      difficulty: "Easy",
      topic: "Trees",
    });

    const recommendation = recommendNextRep({
      today: TODAY,
      now: "2026-07-18T04:00:00.000Z",
      state: state([recent, alternative]),
      capacityMinutes: 45,
    });

    assert.equal(recommendation.public.problemId, `midnight-alternative-${value}`);
  }
});

test("yellow and green attempts also wait for their scheduled review", () => {
  for (const value of ["yellow", "green"]) {
    const scheduled = problem({
      id: `scheduled-${value}`,
      title: `Scheduled ${value}`,
      titleSlug: `scheduled-${value}`,
      reviewHistory: [grade("2026-07-17", value)],
      completionCount: 1,
      nextReview: "2026-07-20",
    });
    const alternative = problem({
      id: `alternative-${value}`,
      title: `Alternative ${value}`,
      titleSlug: `alternative-${value}`,
      difficulty: "Easy",
      topic: "Trees",
    });

    const recommendation = recommendNextRep({
      today: TODAY,
      now: "2026-07-18T12:00:00.000Z",
      state: state([scheduled, alternative]),
      capacityMinutes: 45,
    });

    assert.equal(recommendation.public.problemId, `alternative-${value}`);
  }
});

test("transfer debt guarantees an eligible transfer rep after twelve recent non-transfer reps", () => {
  const repeated = problem({
    id: "repeated",
    title: "Repeated Evidence",
    titleSlug: "repeated-evidence",
    topic: "Arrays and Hashing",
    difficulty: "Easy",
    completionCount: 12,
    nextReview: "2026-07-30",
    reviewHistory: Array.from({ length: 12 }, (_, index) => grade(
      `2026-07-${String(index + 1).padStart(2, "0")}`,
      "green",
      { taskType: "assessment", assistance: "none" },
    )),
  });
  const transfer = problem({
    id: "transfer",
    title: "Unfamiliar Candidate",
    titleSlug: "unfamiliar-candidate",
    topic: "Arrays and Hashing",
    difficulty: "Medium",
  });
  const urgentRepair = problem({
    id: "urgent-repair",
    title: "Urgent Repair",
    titleSlug: "urgent-repair",
    topic: "Trees",
    difficulty: "Easy",
    completionCount: 1,
    nextReview: TODAY,
    reviewHistory: [grade("2026-07-17", "red", {
      createdAt: "2026-07-17T10:00:00.000Z",
      taskType: "assessment",
    })],
  });

  const recommendation = recommendNextRep({
    today: TODAY,
    now: "2026-07-18T12:00:00.000Z",
    state: state([repeated, transfer, urgentRepair]),
    capacityMinutes: 45,
  });

  assert.equal(recommendation.public.problemId, "transfer");
  assert.equal(recommendation.private.taskType, "transfer");
  assert.ok(recommendation.private.reasonCodes.includes("transfer-cadence-due"));
  assert.equal(JSON.stringify(recommendation.public).includes("Arrays and Hashing"), false);
});

test("transfer debt never relabels the same independent title as transfer", () => {
  const memorizedTitle = problem({
    id: "memorized-title",
    title: "Memorized Title",
    titleSlug: "memorized-title",
    topic: "Arrays and Hashing",
    difficulty: "Easy",
    completionCount: 12,
    reviewHistory: Array.from({ length: 12 }, (_, index) => grade(
      `2026-07-${String(index + 1).padStart(2, "0")}`,
      "green",
      { taskType: "assessment", assistance: "none" },
    )),
  });
  const urgentRepair = problem({
    id: "urgent-repair",
    title: "Urgent Repair",
    titleSlug: "urgent-repair",
    topic: "Trees",
    difficulty: "Easy",
    completionCount: 1,
    nextReview: TODAY,
    reviewHistory: [grade("2026-07-17", "red", {
      createdAt: "2026-07-17T10:00:00.000Z",
      taskType: "assessment",
    })],
  });

  const recommendation = recommendNextRep({
    today: TODAY,
    now: "2026-07-18T12:00:00.000Z",
    state: state([memorizedTitle, urgentRepair]),
    capacityMinutes: 45,
  });

  assert.equal(recommendation.public.problemId, "urgent-repair");
  assert.equal(recommendation.private.taskType, "repair");
  const memorizedTrace = recommendation.private.rankedCandidates.find(
    (candidate) => candidate.problemId === "memorized-title",
  );
  assert.equal(memorizedTrace.taskType, "assessment");
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

test("study list progress counts only recent real graded evidence", () => {
  const catalog = [
    { title: "Recent Independent", slug: "recent-independent" },
    { title: "Recent Developing", slug: "recent-developing" },
    { title: "Assisted Green", slug: "assisted-green" },
    { title: "Imported Only", slug: "imported-only" },
    { title: "Stale Independent", slug: "stale-independent" },
    { title: "Unseen", slug: "unseen" },
  ];
  const problems = [
    problem({
      title: "Recent Independent",
      titleSlug: "recent-independent",
      reviewHistory: [
        grade("2026-07-05", "green", { assistance: "none" }),
        grade("2026-07-16", "red"),
      ],
    }),
    problem({
      title: "Recent Developing",
      titleSlug: "recent-developing",
      reviewHistory: [grade("2026-07-12", "yellow")],
    }),
    problem({
      title: "Assisted Green",
      titleSlug: "assisted-green",
      reviewHistory: [grade("2026-07-10", "green", { assistance: "hint" })],
    }),
    problem({
      title: "Imported Only",
      titleSlug: "imported-only",
      reviewHistory: [{ date: "2026-07-15", grade: "imported" }],
    }),
    problem({
      title: "Stale Independent",
      titleSlug: "stale-independent",
      reviewHistory: [grade("2026-05-01", "green", { assistance: "none" })],
    }),
  ];

  const summary = summarizeStudyListEvidence({
    problems,
    catalog,
    today: TODAY,
    windowDays: 30,
  });

  assert.deepEqual(summary, {
    total: 6,
    measured: 3,
    independent: 1,
    developing: 2,
    unmeasured: 3,
    windowDays: 30,
  });
});

test("study list progress excludes future-dated grades", () => {
  const summary = summarizeStudyListEvidence({
    problems: [
      problem({
        title: "Future Attempt",
        titleSlug: "future-attempt",
        reviewHistory: [grade("2026-07-19", "green", { assistance: "none" })],
      }),
    ],
    catalog: [{ title: "Future Attempt", slug: "future-attempt" }],
    today: TODAY,
  });

  assert.equal(summary.independent, 0);
  assert.equal(summary.developing, 0);
  assert.equal(summary.unmeasured, 1);
});

test("a future-dated grade cannot hide an otherwise eligible recommendation", () => {
  const futureAttempt = problem({
    id: "future-attempt",
    title: "Future Attempt",
    titleSlug: "future-attempt",
    nextReview: "2026-07-22",
    reviewHistory: [grade("2026-07-19", "green", {
      assistance: "none",
      occurredAt: "2026-07-19T12:00:00.000Z",
      nextReview: "2026-07-22",
    })],
  });

  const recommendation = recommendNextRep({
    today: TODAY,
    now: "2026-07-18T12:00:00.000Z",
    state: state([futureAttempt]),
    capacityMinutes: 45,
  });

  assert.equal(recommendation.public.problemId, "future-attempt");
  assert.equal(recommendation.private.taskType, "learn");
  assert.equal(recommendation.private.reasonCodes.includes("exact-review-due"), false);
});

test("the current problem schedule stays authoritative when no future evidence exists", () => {
  const rescheduled = problem({
    id: "rescheduled-current-state",
    title: "Rescheduled Current State",
    titleSlug: "rescheduled-current-state",
    nextReview: TODAY,
    reviewHistory: [grade("2026-07-15", "green", {
      assistance: "none",
      occurredAt: "2026-07-15T12:00:00.000Z",
      nextReview: "2026-07-20",
    })],
  });

  const recommendation = recommendNextRep({
    today: TODAY,
    now: "2026-07-18T12:00:00.000Z",
    state: state([rescheduled]),
    capacityMinutes: 45,
  });

  assert.equal(recommendation.public.problemId, "rescheduled-current-state");
  assert.equal(recommendation.private.taskType, "retention");
  assert.ok(recommendation.private.reasonCodes.includes("exact-review-due"));
});

test("a later same-day timestamp cannot replace valid current evidence", () => {
  const candidate = problem({
    id: "clock-skew",
    title: "Clock Skew Candidate",
    titleSlug: "clock-skew-candidate",
    nextReview: "2026-07-21",
    reviewHistory: [
      grade("2026-07-17", "red", {
        id: "valid-red",
        occurredAt: "2026-07-17T10:00:00.000Z",
        nextReview: TODAY,
      }),
      grade(TODAY, "green", {
        id: "future-green",
        assistance: "none",
        occurredAt: "2026-07-18T18:00:00.000Z",
        nextReview: "2026-07-21",
      }),
    ],
  });

  const recommendation = recommendNextRep({
    today: TODAY,
    now: "2026-07-18T12:00:00.000Z",
    state: state([candidate]),
    capacityMinutes: 45,
  });

  assert.equal(recommendation.public.problemId, "clock-skew");
  assert.equal(recommendation.private.taskType, "repair");
  assert.ok(recommendation.private.reasonCodes.includes("exact-review-due"));
});

test("same-day future occurrence times are excluded from Memory evidence", () => {
  const evidence = deriveEvidence(state([
    problem({
      id: "future-clock-evidence",
      title: "Future Clock Evidence",
      reviewHistory: [grade(TODAY, "green", {
        assistance: "none",
        occurredAt: "2026-07-18T18:00:00.000Z",
      })],
    }),
  ]), {
    today: TODAY,
    now: "2026-07-18T12:00:00.000Z",
  });

  assert.deepEqual(evidence.checkedSkillIds, []);
  assert.deepEqual(evidence.independentSkillIds, []);
  assert.equal(evidence.recentAttempts.length, 0);
});
