#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const engine = require(path.join(root, "recommendation-engine.js"));
const today = process.env.REPLAY_START || "2026-08-01";
const repCount = Number(process.env.REPLAY_REPS || 30);
const budgets = (process.env.REPLAY_BUDGETS || "30,45,60")
  .split(",")
  .map(Number)
  .filter((value) => Number.isFinite(value) && value > 0);

function loadJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function loadCatalog(file, globalName) {
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync(file, "utf8"), context, { filename: file });
  return context.window[globalName] || [];
}

function addDays(dateString, days) {
  const date = new Date(`${dateString}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function clone(value) {
  return structuredClone(value);
}

function findProblem(state, result) {
  return state.problems.find((problem) =>
    String(problem.id) === String(result.public?.problemId) ||
    String(problem.titleSlug || "") === String(result.public?.title || "").toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  );
}

function ensureProblem(state, result, catalog) {
  const existing = findProblem(state, result);
  if (existing) return existing;

  const planned = catalog.find((candidate) => candidate.slug === result.public?.title?.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
  const slug = planned?.slug || result.public?.title?.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const created = {
    id: String(result.public.problemId),
    title: String(result.public.title),
    titleSlug: slug,
    url: String(result.public.url || ""),
    topic: planned?.topic || "",
    difficulty: result.public.difficulty,
    patternId: planned?.patternId || planned?.pattern || "",
    stage: 0,
    nextReview: "",
    completionCount: 0,
    reviewHistory: [],
    listMemberships: planned?.listMemberships || [],
  };
  state.problems.push(created);
  return created;
}

function applySyntheticGrade(state, result, date, index, catalog) {
  const problem = ensureProblem(state, result, catalog);
  const previousStage = Number.isFinite(Number(problem.stage)) ? Number(problem.stage) : 0;
  const grade = index % 9 === 8 ? "red" : index % 5 === 4 ? "yellow" : "green";
  const nextStage = grade === "red" ? 0 : grade === "yellow" ? Math.max(0, previousStage - 1) : Math.min(5, previousStage + 1);
  const intervals = [1, 3, 7, 14, 30, 60];
  const attemptType = Array.isArray(problem.reviewHistory) && problem.reviewHistory.some((entry) => ["red", "yellow", "green"].includes(entry.grade))
    ? "review"
    : "new";
  problem.reviewHistory = Array.isArray(problem.reviewHistory) ? problem.reviewHistory : [];
  problem.reviewHistory.push({
    id: `replay-${index}`,
    date,
    occurredAt: `${date}T12:00:00.000Z`,
    createdAt: `${date}T12:00:00.000Z`,
    grade,
    taskType: result.private?.taskType || "",
    attemptType,
    assistance: grade === "green" ? "none" : "heavy",
    solutionQuality: grade === "green" ? "expected" : "suboptimal",
    nextReview: addDays(date, intervals[nextStage]),
  });
  problem.stage = nextStage;
  problem.nextReview = addDays(date, intervals[nextStage]);
  problem.lastGrade = grade;
  problem.lastReviewedAt = date;
  problem.completionCount = Number(problem.completionCount || 0) + 1;
}

function simulate(label, recommender, baseline, catalog) {
  const state = clone(baseline);
  const trace = [];
  const laneCounts = {};
  const taskCounts = {};
  const difficultyCounts = {};
  let previousTitle = "";
  let exactRepeats = 0;
  let noOps = 0;

  for (let index = 0; index < repCount; index += 1) {
    const date = addDays(today, index);
    const capacityMinutes = budgets[index % budgets.length] || 45;
    const result = recommender({
      today: date,
      now: `${date}T12:00:00.000Z`,
      state,
      catalog,
      capacityMinutes,
    });
    const row = {
      rep: index + 1,
      date,
      capacityMinutes,
      title: result.public?.title || null,
      difficulty: result.public?.difficulty || null,
      lane: result.private?.lane || null,
      taskType: result.private?.taskType || null,
      reasonCodes: result.private?.reasonCodes || [],
    };
    trace.push(row);
    if (!result.public) {
      noOps += 1;
      continue;
    }
    if (row.title === previousTitle) exactRepeats += 1;
    previousTitle = row.title;
    laneCounts[row.lane] = (laneCounts[row.lane] || 0) + 1;
    taskCounts[row.taskType] = (taskCounts[row.taskType] || 0) + 1;
    difficultyCounts[row.difficulty] = (difficultyCounts[row.difficulty] || 0) + 1;
    applySyntheticGrade(state, result, date, index, catalog);
  }

  const served = trace.filter((row) => row.title);
  const uniqueTitles = new Set(served.map((row) => row.title)).size;
  return {
    label,
    reps: repCount,
    served: served.length,
    noOps,
    uniqueTitles,
    exactRepeatTransitions: exactRepeats,
    noveltyRate: served.length ? Number((uniqueTitles / served.length).toFixed(3)) : 0,
    laneCounts,
    taskCounts,
    difficultyCounts,
    trace,
  };
}

const stateFile = fs.existsSync(path.join(root, "data/tracker-state.json"))
  ? path.join(root, "data/tracker-state.json")
  : path.join(root, "data/qa-tracker-state.json");
const baseline = loadJson(stateFile);
const catalog = [
  ...loadCatalog(path.join(root, "data/blind-75.js"), "BLIND_75"),
  ...loadCatalog(path.join(root, "data/neetcode-150.js"), "NEETCODE_150"),
];

const legacy = simulate("readiness-v1.9", engine.recommendNextRep, baseline, catalog);
const v2 = simulate("readiness-v2.0", engine.recommendNextRepV2, baseline, catalog);

console.log(JSON.stringify({ stateFile, startDate: today, repCount, budgets, comparisons: [legacy, v2] }, null, 2));
