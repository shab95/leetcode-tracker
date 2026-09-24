const test = require("node:test");
const assert = require("node:assert/strict");
const { loadStudyCatalog } = require("../study-catalog.js");
const { COUNT_MILESTONES, buildSnapshot, findAchievements } = require("../milestone-celebrations.js");

const catalog = loadStudyCatalog();
const grade = { grade: "green", date: "2026-09-23" };
const problemFromPlan = (plan, graded = true) => ({
  id: `problem-${plan.slug}`,
  title: plan.title,
  titleSlug: plan.slug,
  reviewHistory: graded ? [grade] : [],
});

test("a newly graded distinct title crosses a count milestone once", () => {
  const plans = catalog.catalog.slice(0, 50);
  const before = buildSnapshot(plans.map((plan, index) => problemFromPlan(plan, index < 49)), catalog);
  const after = buildSnapshot(plans.map((plan) => problemFromPlan(plan)), catalog);
  const celebration = findAchievements(before, after);

  assert.equal(before.gradedTitles, 49);
  assert.equal(after.gradedTitles, 50);
  assert.deepEqual(celebration.items.map((item) => item.label), ["50 distinct problems graded"]);
  assert.equal(findAchievements(after, after), null);
});

test("reviewing an already graded title does not replay a milestone", () => {
  const plans = catalog.catalog.slice(0, 50);
  const beforeProblems = plans.map((plan) => problemFromPlan(plan));
  const afterProblems = beforeProblems.map((problem, index) => index === 0
    ? { ...problem, reviewHistory: [grade, { ...grade, date: "2026-09-24" }] }
    : problem);
  assert.equal(findAchievements(buildSnapshot(beforeProblems, catalog), buildSnapshot(afterProblems, catalog)), null);
});

test("finishing Blind 75 combines list and count achievements", () => {
  const blind = catalog.catalog.filter((plan) => plan.listMemberships.includes("blind75"));
  const before = buildSnapshot(blind.map((plan, index) => problemFromPlan(plan, index < 74)), catalog);
  const after = buildSnapshot(blind.map((plan) => problemFromPlan(plan)), catalog);
  const celebration = findAchievements(before, after);

  assert.equal(after.lists.blind75.graded, 75);
  assert.equal(celebration.title, "Two milestones. One huge finish.");
  assert.deepEqual(celebration.items.map((item) => item.label), [
    "75 distinct problems graded",
    "Blind 75 complete",
  ]);
  assert.equal(celebration.tier, 3);
});

test("every requested count and study-list milestone is configured", () => {
  assert.deepEqual(COUNT_MILESTONES.map((milestone) => milestone.value), [50, 75, 100, 150, 200, 250]);
  for (const [membership, label] of [
    ["blind75", "Blind 75 complete"],
    ["neetcode150", "NeetCode 150 complete"],
    ["neetcode250", "NeetCode 250 complete"],
  ]) {
    const plans = catalog.catalog.filter((plan) => plan.listMemberships.includes(membership));
    const before = buildSnapshot(plans.map((plan, index) => problemFromPlan(plan, index < plans.length - 1)), catalog);
    const after = buildSnapshot(plans.map((plan) => problemFromPlan(plan)), catalog);
    assert.ok(findAchievements(before, after).items.some((item) => item.label === label));
  }
});

test("custom titles count globally but not toward a built-in list", () => {
  const custom = Array.from({ length: 50 }, (_, index) => ({
    id: `custom-${index}`,
    title: `Custom ${index}`,
    titleSlug: `custom-${index}`,
    reviewHistory: [grade],
  }));
  const snapshot = buildSnapshot(custom, catalog);
  assert.equal(snapshot.gradedTitles, 50);
  assert.equal(snapshot.lists.blind75.graded, 0);
  assert.equal(snapshot.lists.neetcode150.graded, 0);
  assert.equal(snapshot.lists.neetcode250.graded, 0);
});

test("duplicate stored rows count as one distinct title", () => {
  const plan = catalog.catalog.find((item) => item.slug === "two-sum");
  const snapshot = buildSnapshot([
    problemFromPlan(plan, false),
    { ...problemFromPlan(plan), id: "duplicate-two-sum" },
  ], catalog);
  assert.equal(snapshot.gradedTitles, 1);
  assert.equal(snapshot.lists.blind75.graded, 1);
});
