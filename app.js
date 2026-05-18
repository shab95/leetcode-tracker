const STORAGE_KEY = "leetcode-tracker.problems.v3";
const LEGACY_STORAGE_KEYS = ["leetcode-tracker.problems.v2", "leetcode-tracker.problems.v1"];
const IMPORT_META_KEY = "leetcode-tracker.import.v1";
const SESSION_KEY = "leetcode-tracker.sessions.v1";
const EXPORT_VERSION = 3;
const API_STATE_URL = "/api/state";
const API_ENV_URL = "/api/env";
const API_RESET_QA_URL = "/api/reset-qa";

const BLIND_75 = window.BLIND_75 || [];
const NEETCODE_150 = window.NEETCODE_150 || [];
const STUDY_LISTS = {
  blind75: { label: "Blind 75", membership: "blind75", problems: BLIND_75 },
  neetcode150: { label: "NeetCode 150", membership: "neetcode150", problems: NEETCODE_150 },
};
const SLUG_ALIASES = {
  "generate-parenthesis": "generate-parentheses",
};
const GRADED_ATTEMPT_GRADES = ["red", "yellow", "green"];
const DIFFICULTIES = ["Easy", "Medium", "Hard"];
const STATUSES = ["todo", "solving", "solved", "review"];
const STAGES = [
  { label: "Learning", intervalDays: 1 },
  { label: "First Recall", intervalDays: 3 },
  { label: "Pattern", intervalDays: 7 },
  { label: "Transfer", intervalDays: 14 },
  { label: "Durable", intervalDays: 30 },
  { label: "Maintenance", intervalDays: 60 },
];
const MASTERY_ATTEMPT_THRESHOLDS = {
  Easy: 3,
  Medium: 4,
  Hard: 5,
};

const els = {
  addProblemBtn: document.querySelector("#addProblemBtn"),
  addBackfillBtn: document.querySelector("#addBackfillBtn"),
  attentionDialog: document.querySelector("#attentionDialog"),
  backfillDateInput: document.querySelector("#backfillDateInput"),
  backfillGradeInput: document.querySelector("#backfillGradeInput"),
  backfillHelp: document.querySelector("#backfillHelp"),
  backfillNoteInput: document.querySelector("#backfillNoteInput"),
  blindAttempted: document.querySelector("#blindAttempted"),
  blindMastered: document.querySelector("#blindMastered"),
  attentionTopics: document.querySelector("#attentionTopics"),
  attentionTopicRows: document.querySelector("#attentionTopicRows"),
  backlogDueCount: document.querySelector("#backlogDueCount"),
  backlogExtremeCount: document.querySelector("#backlogExtremeCount"),
  backlogOldest: document.querySelector("#backlogOldest"),
  cancelBtn: document.querySelector("#cancelBtn"),
  closeDialogBtn: document.querySelector("#closeDialogBtn"),
  closeAttentionDialogBtn: document.querySelector("#closeAttentionDialogBtn"),
  clearFilterBtn: document.querySelector("#clearFilterBtn"),
  completionInput: document.querySelector("#completionInput"),
  complexityInput: document.querySelector("#complexityInput"),
  csvImportInput: document.querySelector("#csvImportInput"),
  dashboardQaTools: document.querySelector("#dashboardQaTools"),
  dashboardView: document.querySelector("#dashboardView"),
  dataBackupDir: document.querySelector("#dataBackupDir"),
  dataEnvLabel: document.querySelector("#dataEnvLabel"),
  dataManagementView: document.querySelector("#dataManagementView"),
  dataStateFile: document.querySelector("#dataStateFile"),
  deleteBtn: document.querySelector("#deleteBtn"),
  diagnosticsView: document.querySelector("#diagnosticsView"),
  dialogTitle: document.querySelector("#dialogTitle"),
  difficultyFilter: document.querySelector("#difficultyFilter"),
  difficultyInput: document.querySelector("#difficultyInput"),
  emptyState: document.querySelector("#emptyState"),
  exportBtn: document.querySelector("#exportBtn"),
  filterBanner: document.querySelector("#filterBanner"),
  filterBannerText: document.querySelector("#filterBannerText"),
  importMeta: document.querySelector("#importMeta"),
  gradeResult: document.querySelector("#gradeResult"),
  historyList: document.querySelector("#historyList"),
  jsonImportInput: document.querySelector("#jsonImportInput"),
  listFilter: document.querySelector("#listFilter"),
  newCard: document.querySelector("#newCard"),
  newMeta: document.querySelector("#newMeta"),
  neetcodeAttempted: document.querySelector("#neetcodeAttempted"),
  neetcodeMastered: document.querySelector("#neetcodeMastered"),
  newSourceSelect: document.querySelector("#newSourceSelect"),
  newOpenLink: document.querySelector("#newOpenLink"),
  newTitle: document.querySelector("#newTitle"),
  notesInput: document.querySelector("#notesInput"),
  postGradeNote: document.querySelector("#postGradeNote"),
  postGradeComplexityField: document.querySelector("#postGradeComplexityField"),
  postGradeComplexityInput: document.querySelector("#postGradeComplexityInput"),
  postGradeNotesInput: document.querySelector("#postGradeNotesInput"),
  postGradeTitle: document.querySelector("#postGradeTitle"),
  problemDialog: document.querySelector("#problemDialog"),
  problemForm: document.querySelector("#problemForm"),
  problemId: document.querySelector("#problemId"),
  problemRows: document.querySelector("#problemRows"),
  qaTools: document.querySelector("#qaTools"),
  resultCount: document.querySelector("#resultCount"),
  resetQaBtn: document.querySelector("#resetQaBtn"),
  reviewCard: document.querySelector("#reviewCard"),
  reviewDue: document.querySelector("#reviewDue"),
  reviewInput: document.querySelector("#reviewInput"),
  reviewMeta: document.querySelector("#reviewMeta"),
  reviewOpenLink: document.querySelector("#reviewOpenLink"),
  reviewReason: document.querySelector("#reviewReason"),
  reviewSummaryStats: document.querySelector("#reviewSummaryStats"),
  reviewTitle: document.querySelector("#reviewTitle"),
  recentGradeChart: document.querySelector("#recentGradeChart"),
  recentGradeEmpty: document.querySelector("#recentGradeEmpty"),
  masteryBlockers: document.querySelector("#masteryBlockers"),
  savePostGradeNoteBtn: document.querySelector("#savePostGradeNoteBtn"),
  saveStatus: document.querySelector("#saveStatus"),
  searchInput: document.querySelector("#searchInput"),
  seedBlindBtn: document.querySelector("#seedBlindBtn"),
  seedNeetcodeBtn: document.querySelector("#seedNeetcodeBtn"),
  solutionApproachInput: document.querySelector("#solutionApproachInput"),
  solutionExplanationInput: document.querySelector("#solutionExplanationInput"),
  skipNewBtn: document.querySelector("#skipNewBtn"),
  skipPostGradeNoteBtn: document.querySelector("#skipPostGradeNoteBtn"),
  skipReviewBtn: document.querySelector("#skipReviewBtn"),
  sortSelect: document.querySelector("#sortSelect"),
  stageChart: document.querySelector("#stageChart"),
  statusFilter: document.querySelector("#statusFilter"),
  statusInput: document.querySelector("#statusInput"),
  titleInput: document.querySelector("#titleInput"),
  todaySummary: document.querySelector("#todaySummary"),
  topicFilter: document.querySelector("#topicFilter"),
  topicInput: document.querySelector("#topicInput"),
  totalSolved: document.querySelector("#totalSolved"),
  timeComplexityInput: document.querySelector("#timeComplexityInput"),
  undoGradeBtn: document.querySelector("#undoGradeBtn"),
  urlInput: document.querySelector("#urlInput"),
  viewAllTopicsBtn: document.querySelector("#viewAllTopicsBtn"),
  weeklySolved: document.querySelector("#weeklySolved"),
  spaceComplexityInput: document.querySelector("#spaceComplexityInput"),
};
const routeLinks = document.querySelectorAll("[data-route]");
const dialogTabButtons = document.querySelectorAll("[data-dialog-tab]");
const dialogTabPanels = document.querySelectorAll("[data-dialog-panel]");

let problems = [];
let importMeta = null;
let sessions = [];
let dailyPicks = { review: null, newProblem: null };
let skippedDailyPicks = { review: new Set(), new: new Set() };
let lastServerSavedAt = "";
let appEnv = { env: "prod", isQa: false };
let diagnosticsTopicFilter = "";
let pendingNoteProblemId = "";
let lastGradeUndo = null;

els.addProblemBtn.addEventListener("click", () => openDialog());
els.addBackfillBtn.addEventListener("click", addBackfillAttempt);
els.cancelBtn.addEventListener("click", () => els.problemDialog.close());
els.closeAttentionDialogBtn.addEventListener("click", () => els.attentionDialog.close());
els.clearFilterBtn.addEventListener("click", clearDiagnosticsTopicFilter);
els.closeDialogBtn.addEventListener("click", () => els.problemDialog.close());
els.csvImportInput.addEventListener("change", importCsv);
els.deleteBtn.addEventListener("click", deleteCurrentProblem);
els.exportBtn.addEventListener("click", exportJson);
els.jsonImportInput.addEventListener("change", importJson);
els.newSourceSelect.addEventListener("input", () => {
  skippedDailyPicks.new = new Set();
  renderDailyPicks();
});
els.problemForm.addEventListener("submit", saveProblem);
els.resetQaBtn.addEventListener("click", resetQaData);
els.seedBlindBtn.addEventListener("click", seedBlind75);
els.seedNeetcodeBtn.addEventListener("click", seedNeetcode150);
els.savePostGradeNoteBtn.addEventListener("click", savePostGradeNote);
els.skipNewBtn.addEventListener("click", () => skipDailyPick("new"));
els.skipPostGradeNoteBtn.addEventListener("click", clearPostGradeNote);
els.skipReviewBtn.addEventListener("click", () => skipDailyPick("review"));
els.undoGradeBtn.addEventListener("click", undoLastGrade);
els.viewAllTopicsBtn.addEventListener("click", openAttentionDialog);
dialogTabButtons.forEach((button) => {
  button.addEventListener("click", () => setProblemDialogTab(button.dataset.dialogTab));
});
els.attentionTopicRows.addEventListener("click", (event) => {
  const button = event.target.closest("[data-topic-filter]");
  if (!button) return;
  filterDashboardByTopic(button.dataset.topicFilter);
});
routeLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    navigateToRoute(link.dataset.route);
  });
});
window.addEventListener("popstate", renderAppRoute);

document.querySelectorAll(".grade-actions").forEach((group) => {
  group.addEventListener("click", (event) => {
    const button = event.target.closest("[data-grade]");
    if (!button) return;
    gradeDailyPick(group.dataset.card, button.dataset.grade);
  });
});

[
  els.searchInput,
  els.statusFilter,
  els.difficultyFilter,
  els.topicFilter,
  els.listFilter,
  els.sortSelect,
].forEach((control) => control.addEventListener("input", render));
els.topicFilter.addEventListener("input", () => {
  if (els.topicFilter.value !== diagnosticsTopicFilter) diagnosticsTopicFilter = "";
});

initApp();

async function initApp() {
  setSaveStatus("loading", "Loading saved data...");
  appEnv = await loadAppEnv();
  renderQaTools();
  renderDataManagementInfo();
  const localProblems = loadProblemsFromStorage();
  const localImportMeta = loadJson(IMPORT_META_KEY, null);
  const localSessions = loadJson(SESSION_KEY, []);
  const remoteState = await loadRemoteState();

  const hasRemoteData =
    remoteState &&
    (remoteState.savedAt || remoteState.importMeta || remoteState.problems?.length > 0 || remoteState.sessions?.length > 0);

  if (hasRemoteData) {
    applyRemoteState(remoteState);
    setSaveStatus("saved", buildSavedMessage(lastServerSavedAt));
  } else {
    problems = localProblems;
    importMeta = localImportMeta;
    sessions = Array.isArray(localSessions) ? localSessions : [];
    if (problems.length > 0 || importMeta || sessions.length > 0) {
      setSaveStatus("saving", "Migrating browser data to local file...");
      persist();
    } else {
      setSaveStatus("saved", "Ready to save to local file.");
    }
  }

  render();
  renderAppRoute();
}

function applyRemoteState(state) {
  problems = Array.isArray(state.problems) ? state.problems.map(normalizeProblem) : [];
  importMeta = state.importMeta || null;
  sessions = Array.isArray(state.sessions) ? state.sessions : [];
  lastServerSavedAt = state.savedAt || "";
}

function loadProblems() {
  return loadProblemsFromStorage();
}

function loadProblemsFromStorage() {
  const current = loadJson(STORAGE_KEY, null);
  if (Array.isArray(current)) return current.map(normalizeProblem);

  for (const key of LEGACY_STORAGE_KEYS) {
    const legacy = loadJson(key, []);
    if (Array.isArray(legacy) && legacy.length > 0) {
      const migrated = legacy.map(normalizeProblem);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }
  }

  return [];
}

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(problems));
  localStorage.setItem(SESSION_KEY, JSON.stringify(sessions));
  if (importMeta) localStorage.setItem(IMPORT_META_KEY, JSON.stringify(importMeta));
  saveRemoteState();
}

function persistImportMeta() {
  localStorage.setItem(IMPORT_META_KEY, JSON.stringify(importMeta));
  saveRemoteState();
}

async function loadRemoteState() {
  try {
    const response = await fetch(API_STATE_URL, { cache: "no-store" });
    if (!response.ok) return null;
    const state = await response.json();
    return Array.isArray(state.problems) ? state : null;
  } catch {
    return null;
  }
}

async function loadAppEnv() {
  try {
    const response = await fetch(API_ENV_URL, { cache: "no-store" });
    if (!response.ok) throw new Error("Environment unavailable");
    return await response.json();
  } catch {
    return { env: "prod", isQa: false };
  }
}

function renderQaTools() {
  if (els.qaTools) els.qaTools.hidden = !appEnv.isQa;
  if (els.dashboardQaTools) els.dashboardQaTools.hidden = !appEnv.isQa;
}

async function resetQaData() {
  if (!appEnv.isQa) return;
  if (!window.confirm("Reset QA data back to the clean fixture?")) return;

  setSaveStatus("saving", "Resetting QA data...");

  try {
    const response = await fetch(API_RESET_QA_URL, { method: "POST" });
    if (!response.ok) throw new Error("QA reset failed");
    const state = await response.json();
    applyRemoteState(state);
    skippedDailyPicks = { review: new Set(), new: new Set() };
    setSaveStatus("saved", buildSavedMessage(lastServerSavedAt));
    render();
  } catch {
    setSaveStatus("warning", "QA reset failed. Check the local server.");
  }
}

function saveRemoteState() {
  const payload = {
    version: EXPORT_VERSION,
    savedAt: new Date().toISOString(),
    importMeta,
    problems,
    sessions,
  };

  setSaveStatus("saving", "Saving to local file...");
  fetch(API_STATE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
    .then((response) => {
      if (!response.ok) throw new Error("Save failed");
      return response.json();
    })
    .then((result) => {
      lastServerSavedAt = result.savedAt || new Date().toISOString();
      setSaveStatus("saved", buildSavedMessage(lastServerSavedAt));
    })
    .catch(() => {
      setSaveStatus("warning", "Local file save failed. Browser fallback updated.");
      console.warn("Could not save tracker data to the local server. LocalStorage fallback was updated.");
    });
}

function setSaveStatus(status, message) {
  if (!els.saveStatus) return;
  els.saveStatus.dataset.status = status;
  els.saveStatus.textContent = message;
}

function buildSavedMessage(savedAt) {
  return savedAt ? `Saved to local file - last saved ${formatDateTime(savedAt)}` : "Saved to local file.";
}

function navigateToRoute(route) {
  const paths = {
    dashboard: "/index.html",
    diagnostics: "/diagnostics",
    data: "/data-management",
  };
  const path = paths[route] || paths.dashboard;
  if (window.location.pathname !== path) window.history.pushState({}, "", path);
  renderAppRoute();
}

function getCurrentRoute() {
  if (window.location.pathname === "/diagnostics") return "diagnostics";
  return window.location.pathname === "/data-management" ? "data" : "dashboard";
}

function renderAppRoute() {
  const route = getCurrentRoute();
  const isDataRoute = route === "data";
  const isDiagnosticsRoute = route === "diagnostics";

  els.dashboardView.hidden = isDataRoute || isDiagnosticsRoute;
  els.diagnosticsView.hidden = !isDiagnosticsRoute;
  els.dataManagementView.hidden = !isDataRoute;
  els.addProblemBtn.classList.toggle("is-invisible", isDataRoute);
  els.addProblemBtn.setAttribute("aria-hidden", isDataRoute ? "true" : "false");
  els.addProblemBtn.tabIndex = isDataRoute ? -1 : 0;

  routeLinks.forEach((link) => {
    const isActive = link.dataset.route === route;
    link.classList.toggle("active", isActive);
    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

function renderDataManagementInfo() {
  if (els.dataEnvLabel) els.dataEnvLabel.textContent = appEnv.isQa ? "QA" : "Production";
  if (els.dataStateFile) els.dataStateFile.textContent = appEnv.isQa ? "data/qa-tracker-state.json" : "data/tracker-state.json";
  if (els.dataBackupDir) els.dataBackupDir.textContent = appEnv.isQa ? "data/qa-backups/" : "data/backups/";
}

function render() {
  renderTopicOptions();
  renderImportMeta();
  renderStats();
  renderMemoryHealth();
  renderDailyPicks();
  renderRows(getFilteredProblems());
}

function renderStats() {
  const today = dateOnly(new Date());
  const weekStart = addDays(today, -6);
  const mastered = problems.filter((problem) => isMastered(problem));
  const due = getDueReviews();
  const recent = problems.filter((problem) => {
    if (!problem.lastReviewedAt && !problem.solvedAt) return false;
    const date = dateOnly(new Date(problem.lastReviewedAt || problem.solvedAt));
    return date >= weekStart && date <= today;
  });
  const blindAttempted = BLIND_75.filter((planProblem) => {
    const row = findProblemByPlan(planProblem);
    return row && isAttempted(row);
  }).length;
  const blindMastered = BLIND_75.filter((planProblem) => {
    const row = findProblemByPlan(planProblem);
    return row && isMastered(row);
  }).length;
  const neetcodeAttempted = NEETCODE_150.filter((planProblem) => {
    const row = findProblemByPlan(planProblem);
    return row && isAttempted(row);
  }).length;
  const neetcodeMastered = NEETCODE_150.filter((planProblem) => {
    const row = findProblemByPlan(planProblem);
    return row && isMastered(row);
  }).length;

  els.totalSolved.textContent = mastered.length;
  els.reviewDue.textContent = due.length;
  els.blindAttempted.textContent = `${blindAttempted}/${BLIND_75.length}`;
  els.blindMastered.textContent = `${blindMastered}/${BLIND_75.length}`;
  els.neetcodeAttempted.textContent = `${neetcodeAttempted}/${NEETCODE_150.length}`;
  els.neetcodeMastered.textContent = `${neetcodeMastered}/${NEETCODE_150.length}`;
  els.weeklySolved.textContent = recent.length;
}

function renderMemoryHealth() {
  const dueReviews = getDueReviews();
  const extremeReviews = dueReviews.filter((problem) => isExtremelyOverdue(problem.stage, getDaysOverdue(problem.nextReview)));
  const oldestReview = dueReviews[0] || null;

  els.backlogDueCount.textContent = `${dueReviews.length} ${dueReviews.length === 1 ? "review" : "reviews"} due`;
  els.backlogExtremeCount.textContent = extremeReviews.length;
  els.backlogOldest.textContent = oldestReview
    ? `${oldestReview.title} is ${reviewTimingLabel(oldestReview.nextReview)}.`
    : "Nothing is overdue right now.";

  renderAttentionTopics();
  renderStageChart();
  renderRecentGradeChart();
}

function renderAttentionTopics() {
  const topics = buildAttentionTopics().slice(0, 4);
  els.viewAllTopicsBtn.disabled = buildAttentionTopics().length === 0;

  if (topics.length === 0) {
    els.attentionTopics.innerHTML = `<p class="memory-empty">Attention topics appear once attempted problems enter the review loop.</p>`;
    return;
  }

  const maxScore = Math.max(...topics.map((topic) => topic.score), 1);
  els.attentionTopics.innerHTML = topics
    .map((topic) => {
      const width = Math.max(8, Math.round((topic.score / maxScore) * 100));
      return `
        <div class="attention-item">
          <div class="attention-row">
            <strong>${escapeHtml(topic.topic)}</strong>
            <span class="attention-level ${attentionLevelClass(topic)}">${attentionLevel(topic)} attention</span>
          </div>
          <div class="memory-bar" aria-hidden="true"><span style="width: ${width}%"></span></div>
          <p>${escapeHtml(topic.reasons.join(" · "))}</p>
        </div>
      `;
    })
    .join("");
}

function openAttentionDialog() {
  renderAttentionTopicRows();
  els.attentionDialog.showModal();
}

function renderAttentionTopicRows() {
  const topics = buildAttentionTopics();
  if (topics.length === 0) {
    els.attentionTopicRows.innerHTML = `<p class="memory-empty">No attention topics yet.</p>`;
    return;
  }

  els.attentionTopicRows.innerHTML = topics
    .map((topic) => `
      <button class="attention-topic-row" type="button" data-topic-filter="${escapeAttr(topic.topic)}">
        <span>
          <strong>${escapeHtml(topic.topic)}</strong>
          <em>${attentionLevel(topic)} attention · Score ${topic.score}</em>
        </span>
        <small>${escapeHtml(topic.reasons.join(" · "))}</small>
      </button>
    `)
    .join("");
}

function filterDashboardByTopic(topic) {
  if (!topic) return;
  els.attentionDialog.close();
  diagnosticsTopicFilter = topic;
  navigateToRoute("dashboard");
  els.topicFilter.value = topic;
  render();
  scrollProblemsIntoView();
}

function clearDiagnosticsTopicFilter() {
  diagnosticsTopicFilter = "";
  els.topicFilter.value = "all";
  render();
}

function renderFilterBanner() {
  const isActive = diagnosticsTopicFilter && els.topicFilter.value === diagnosticsTopicFilter;
  els.filterBanner.hidden = !isActive;
  if (isActive) els.filterBannerText.textContent = `Filtered to ${diagnosticsTopicFilter} from Diagnostics.`;
}

function scrollProblemsIntoView() {
  requestAnimationFrame(() => {
    document.querySelector(".table-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function buildAttentionTopics() {
  const byTopic = new Map();

  problems.filter(isAttempted).forEach((problem) => {
    const topicName = problem.topic || "General";
    const topic = byTopic.get(topicName) || {
      topic: topicName,
      score: 0,
      due: 0,
      extreme: 0,
      early: 0,
      recentRed: 0,
      recentYellow: 0,
    };
    const recent = (problem.reviewHistory || []).slice(-3);
    const redCount = recent.filter((entry) => entry.grade === "red").length;
    const yellowCount = recent.filter((entry) => entry.grade === "yellow").length;
    const daysOverdue = getDaysOverdue(problem.nextReview);
    const due = Boolean(problem.nextReview && isReviewDue(problem.nextReview));
    const extreme = due && isExtremelyOverdue(problem.stage, daysOverdue);
    const early = clampStage(problem.stage) <= 1;

    topic.recentRed += redCount;
    topic.recentYellow += yellowCount;
    if (due) topic.due += 1;
    if (extreme) topic.extreme += 1;
    if (early) topic.early += 1;
    topic.score += redCount * 4 + yellowCount * 2 + (due ? 3 : 0) + (extreme ? 3 : 0) + (early ? 2 : 0);
    byTopic.set(topicName, topic);
  });

  return [...byTopic.values()]
    .filter((topic) => topic.score > 0)
    .map((topic) => ({
      ...topic,
      reasons: buildAttentionReasons(topic),
    }))
    .sort((a, b) => b.score - a.score || a.topic.localeCompare(b.topic));
}

function buildAttentionReasons(topic) {
  const reasons = [];
  if (topic.due) reasons.push(`${topic.due} due`);
  if (topic.extreme) reasons.push(`${topic.extreme} extremely overdue`);
  if (topic.early) reasons.push(`${topic.early} early-stage`);
  if (topic.recentRed) reasons.push(`${topic.recentRed} recent missed`);
  if (topic.recentYellow) reasons.push(`${topic.recentYellow} recent slow`);
  return reasons.length ? reasons : ["stable right now"];
}

function attentionLevel(topic) {
  if (topic.score >= 40 || topic.extreme >= 5) return "High";
  if (topic.score >= 15) return "Medium";
  return "Low";
}

function attentionLevelClass(topic) {
  return `attention-${attentionLevel(topic).toLowerCase()}`;
}

function renderStageChart() {
  const counts = STAGES.map(() => 0);
  problems.filter(isAttempted).forEach((problem) => {
    counts[clampStage(problem.stage)] += 1;
  });
  const maxCount = Math.max(...counts, 1);

  els.stageChart.innerHTML = counts
    .map((count, index) => {
      const width = count === 0 ? 0 : Math.max(6, Math.round((count / maxCount) * 100));
      return `
        <div class="stage-chart-row">
          <span title="${escapeAttr(stageName(index))}">${escapeHtml(compactStageName(index))}</span>
          <div class="memory-bar" aria-hidden="true"><span style="width: ${width}%"></span></div>
          <strong>${count}</strong>
        </div>
      `;
    })
    .join("");
}

function renderRecentGradeChart() {
  const weekStart = addDays(dateOnly(new Date()), -6);
  const recent = sessions.filter((session) => {
    const date = session.date ? parseIsoDate(session.date) : null;
    return date && date >= weekStart && date <= dateOnly(new Date()) && ["green", "yellow", "red"].includes(session.grade);
  });
  const counts = {
    green: recent.filter((session) => session.grade === "green").length,
    yellow: recent.filter((session) => session.grade === "yellow").length,
    red: recent.filter((session) => session.grade === "red").length,
  };
  const total = counts.green + counts.yellow + counts.red;

  els.recentGradeEmpty.hidden = total > 0;
  els.recentGradeChart.hidden = total === 0;
  if (total === 0) {
    els.recentGradeChart.innerHTML = "";
    return;
  }

  const grades = [
    { key: "green", label: "Clean", className: "grade-green" },
    { key: "yellow", label: "Slow", className: "grade-yellow" },
    { key: "red", label: "Missed", className: "grade-red" },
  ];

  els.recentGradeChart.innerHTML = grades
    .map((grade) => {
      const count = counts[grade.key];
      const width = count === 0 ? 0 : Math.max(8, Math.round((count / total) * 100));
      return `
        <div class="grade-chart-row ${grade.className}">
          <div class="attention-row">
            <strong>${grade.label}</strong>
            <span>${count}</span>
          </div>
          <div class="memory-bar" aria-hidden="true"><span style="width: ${width}%"></span></div>
        </div>
      `;
    })
    .join("");
}

function renderDailyPicks(options = {}) {
  dailyPicks = getDailyPicks(options);
  renderRecommendationCard("review", dailyPicks.review);
  renderRecommendationCard("new", dailyPicks.newProblem);
  renderSkipControls();

  const reviewText = dailyPicks.review ? dailyPicks.review.title : "no due review";
  const newText = dailyPicks.newProblem ? dailyPicks.newProblem.title : `no new ${getSelectedStudyList().label} pick`;
  els.todaySummary.textContent = `Review: ${reviewText}. New: ${newText}.`;
}

function renderSkipControls() {
  els.skipReviewBtn.disabled = !dailyPicks.review;
  els.skipNewBtn.disabled = !dailyPicks.newProblem;
}

function skipDailyPick(type) {
  const item = type === "review" ? dailyPicks.review : dailyPicks.newProblem;
  const key = item ? dailyPickKey(type, item) : "";
  if (!key) return;

  skippedDailyPicks[type].add(key);
  renderDailyPicks({
    preserveNew: type === "review",
    preserveReview: type === "new",
  });
}

function renderRecommendationCard(type, item) {
  const card = type === "review" ? els.reviewCard : els.newCard;
  const title = type === "review" ? els.reviewTitle : els.newTitle;
  const meta = type === "review" ? els.reviewMeta : els.newMeta;
  const openLink = type === "review" ? els.reviewOpenLink : els.newOpenLink;
  const buttons = card.querySelectorAll("[data-grade]");

  if (!item) {
    card.dataset.problemId = "";
    title.textContent = type === "review" ? "No due review" : `No unattempted ${getSelectedStudyList().label}`;
    meta.textContent =
      type === "review"
        ? "Nothing is due today. New graded work will schedule future reviews."
        : `Seed ${getSelectedStudyList().label} or add more problems when you want a larger queue.`;
    if (type === "review") els.reviewReason.textContent = "";
    openLink.hidden = true;
    openLink.removeAttribute("href");
    buttons.forEach((button) => (button.disabled = true));
    return;
  }

  card.dataset.problemId = item.id || "";
  card.dataset.slug = item.titleSlug || "";
  title.textContent = item.title;
  meta.textContent = [
    item.topic || "General",
    item.difficulty || "Medium",
    type === "review" ? reviewTimingLabel(item.nextReview) : `Next unattempted ${getSelectedStudyList().label}`,
    `Stage: ${stageName(item.stage)}`,
  ].join(" | ");
  if (type === "review") els.reviewReason.textContent = explainReviewPick(item);
  if (item.url) {
    openLink.href = item.url;
    openLink.hidden = false;
  } else {
    openLink.hidden = true;
    openLink.removeAttribute("href");
  }
  buttons.forEach((button) => (button.disabled = false));
}

function explainReviewPick(item) {
  if (!item?.nextReview) return "";

  const daysOverdue = getDaysOverdue(item.nextReview);
  const timing =
    daysOverdue > 0
      ? `Why this review: it has the earliest due date and is ${daysOverdue} ${daysOverdue === 1 ? "day" : "days"} overdue.`
      : "Why this review: it has the earliest due date and is due today.";
  const sameDateReviews = getDueReviews().filter((problem) => problem.nextReview === item.nextReview);
  if (sameDateReviews.length <= 1) return timing;

  const recentTopics = getRecentTopics(7);
  const pickedPenalty = topicPenalty(item.topic, recentTopics);
  const minPenalty = Math.min(...sameDateReviews.map((problem) => topicPenalty(problem.topic, recentTopics)));
  return pickedPenalty === minPenalty
    ? `${timing} It also fits the same-day topic balance.`
    : timing;
}

function renderRows(rows) {
  renderFilterBanner();
  els.problemRows.innerHTML = "";
  els.resultCount.textContent = `${rows.length} ${rows.length === 1 ? "problem" : "problems"}`;
  els.emptyState.style.display = problems.length === 0 ? "block" : "none";

  rows.forEach((problem) => {
    const tr = document.createElement("tr");
    const reviewClass = isReviewDue(problem.nextReview) ? "review-due" : "";
    const titleNode = `<button type="button" data-edit="${problem.id}">${escapeHtml(problem.title)}</button>`;
    const openNode = problem.url
      ? `<a class="icon-btn row-open-link" href="${escapeAttr(problem.url)}" target="_blank" rel="noreferrer" aria-label="Open ${escapeAttr(problem.title)} on LeetCode">Open</a>`
      : "";
    const memberships = renderMembershipBadges(problem);

    tr.innerHTML = `
      <td>
        <div class="problem-title">
          ${titleNode}
          <span class="notes-preview">${escapeHtml(problem.notes || "No notes yet")}</span>
          ${memberships}
        </div>
      </td>
      <td><span class="pill status-${problem.status}">${statusLabel(problem.status)}</span></td>
      <td><span class="stage-pill">${stageName(problem.stage)}</span></td>
      <td><span class="difficulty-${problem.difficulty}">${problem.difficulty}</span></td>
      <td>${escapeHtml(problem.topic || "General")}</td>
      <td>${Number(problem.completionCount || 0)}</td>
      <td class="${reviewClass}">${formatDate(problem.nextReview)}</td>
      <td>
        <div class="row-actions">
          ${openNode}
          <button class="icon-btn" type="button" data-edit="${problem.id}" aria-label="Edit ${escapeAttr(problem.title)}">Edit</button>
        </div>
      </td>
    `;

    els.problemRows.appendChild(tr);
  });

  els.problemRows.querySelectorAll("[data-edit]").forEach((button) => {
    button.addEventListener("click", () => openDialog(button.dataset.edit));
  });
}

function renderMembershipBadges(problem) {
  const memberships = problem.listMemberships || [];
  return Object.values(STUDY_LISTS)
    .filter((list) => memberships.includes(list.membership))
    .map((list) => `<span class="mini-pill">${escapeHtml(list.label)}</span>`)
    .join("");
}

function renderTopicOptions() {
  const current = els.topicFilter.value;
  const topics = getKnownTopics();
  els.topicFilter.innerHTML = `<option value="all">All topics</option>`;

  topics.forEach((topic) => {
    const option = document.createElement("option");
    option.value = topic;
    option.textContent = topic;
    els.topicFilter.appendChild(option);
  });

  els.topicFilter.value = topics.includes(current) ? current : "all";
}

function renderProblemTopicOptions(selectedTopic = "") {
  const normalizedSelected = String(selectedTopic || "General").trim() || "General";
  const topics = getKnownTopics(normalizedSelected);
  els.topicInput.innerHTML = "";

  topics.forEach((topic) => {
    const option = document.createElement("option");
    option.value = topic;
    option.textContent = topic;
    els.topicInput.appendChild(option);
  });

  els.topicInput.value = normalizedSelected;
}

function getKnownTopics(extraTopic = "") {
  return [
    ...new Set(
      [
        "General",
        extraTopic,
        ...problems.map((problem) => problem.topic),
        ...Object.values(STUDY_LISTS).flatMap((list) => list.problems.map((problem) => problem.topic)),
      ]
        .map((topic) => String(topic || "").trim())
        .filter(Boolean),
    ),
  ].sort((a, b) => a.localeCompare(b));
}

function renderImportMeta() {
  if (!importMeta) {
    els.importMeta.textContent = "No CSV imported yet.";
    return;
  }

  els.importMeta.textContent = `Imported ${importMeta.rowCount} rows from ${importMeta.sourceFileName} on ${formatDate(importMeta.importedAt)}. Saved to the local server file; imported solved problems count as prior attempts.`;
}

function getFilteredProblems() {
  const query = els.searchInput.value.trim().toLowerCase();
  const status = els.statusFilter.value;
  const difficulty = els.difficultyFilter.value;
  const topic = els.topicFilter.value;
  const list = els.listFilter.value;

  return problems
    .filter((problem) => {
      const haystack = [problem.title, problem.topic, problem.notes, problem.difficulty, problem.status, stageName(problem.stage)]
        .join(" ")
        .toLowerCase();
      return (
        (!query || haystack.includes(query)) &&
        (status === "all" || problem.status === status) &&
        (difficulty === "all" || problem.difficulty === difficulty) &&
        (topic === "all" || problem.topic === topic) &&
        (list === "all" ||
          (list === "blind75" && problem.listMemberships?.includes("blind75")) ||
          (list === "neetcode150" && problem.listMemberships?.includes("neetcode150")) ||
          (list === "due" && isReviewDue(problem.nextReview)))
      );
    })
    .sort(sortProblems);
}

function sortProblems(a, b) {
  const sort = els.sortSelect.value;
  const difficultyRank = { Easy: 1, Medium: 2, Hard: 3 };

  if (sort === "due") {
    return dateValue(a.nextReview) - dateValue(b.nextReview) || a.title.localeCompare(b.title);
  }

  if (sort === "difficulty") {
    return difficultyRank[b.difficulty] - difficultyRank[a.difficulty] || a.title.localeCompare(b.title);
  }

  if (sort === "topic") {
    return (a.topic || "").localeCompare(b.topic || "") || a.title.localeCompare(b.title);
  }

  return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
}

function getDailyPicks(options = {}) {
  const review =
    options.preserveReview && isCurrentReviewPickAvailable(dailyPicks.review)
      ? dailyPicks.review
      : getNextReviewPick();
  const newProblem =
    options.preserveNew && isCurrentNewPickAvailable(dailyPicks.newProblem)
      ? dailyPicks.newProblem
      : getNextStudyListProblem(review?.topic, getSelectedStudyListId());
  return { review, newProblem };
}

function getNextReviewPick() {
  return getDueReviews().find((problem) => !skippedDailyPicks.review.has(problem.id)) || null;
}

function getDueReviews() {
  const recentTopics = getRecentTopics(7);
  return problems
    .filter((problem) => problem.nextReview && isReviewDue(problem.nextReview))
    .sort((a, b) => {
      const dateDiff = dateValue(a.nextReview) - dateValue(b.nextReview);
      if (dateDiff !== 0) return dateDiff;
      return topicPenalty(a.topic, recentTopics) - topicPenalty(b.topic, recentTopics);
    });
}

function getSelectedStudyListId() {
  return STUDY_LISTS[els.newSourceSelect.value] ? els.newSourceSelect.value : "blind75";
}

function getSelectedStudyList() {
  return STUDY_LISTS[getSelectedStudyListId()];
}

function getNextStudyListProblem(reviewTopic = "", listId = "blind75") {
  const studyList = STUDY_LISTS[listId] || STUDY_LISTS.blind75;
  const recentTopics = getRecentTopics(7);
  const candidates = studyList.problems.map((planProblem) => {
    const existing = findProblemByPlan(planProblem);
    return existing || planToProblem(planProblem, studyList.membership);
  }).filter((problem) => !isAttempted(problem) && !skippedDailyPicks.new.has(problem.titleSlug));

  if (candidates.length === 0) return null;

  const sorted = candidates.sort((a, b) => {
    const orderA = getStudyListOrder(a, studyList);
    const orderB = getStudyListOrder(b, studyList);
    const balanceA = topicPenalty(a.topic, recentTopics) + (a.topic && a.topic === reviewTopic ? 2 : 0);
    const balanceB = topicPenalty(b.topic, recentTopics) + (b.topic && b.topic === reviewTopic ? 2 : 0);
    return orderA + balanceA * 5 - (orderB + balanceB * 5);
  });

  return sorted[0];
}

function isCurrentReviewPickAvailable(item) {
  if (!item?.id || skippedDailyPicks.review.has(item.id)) return false;
  return problems.some((problem) => problem.id === item.id && problem.nextReview && isReviewDue(problem.nextReview));
}

function isCurrentNewPickAvailable(item) {
  const key = item ? dailyPickKey("new", item) : "";
  if (!key || skippedDailyPicks.new.has(key)) return false;
  if (!item.listMemberships?.includes(getSelectedStudyList().membership)) return false;
  const existing = findProblemBySlug(item.titleSlug) || findProblemByTitle(item.title);
  return !existing || !isAttempted(existing);
}

function dailyPickKey(type, item) {
  return type === "review" ? item.id || "" : item.titleSlug || slugifyTitle(item.title);
}

function getRecentTopics(days) {
  const cutoff = addDays(dateOnly(new Date()), -days).getTime();
  return sessions
    .filter((session) => dateValue(session.date) >= cutoff)
    .map((session) => session.topic)
    .filter(Boolean);
}

function topicPenalty(topic, recentTopics) {
  return recentTopics.filter((recentTopic) => recentTopic === topic).length;
}

function gradeDailyPick(cardType, grade) {
  const pick = cardType === "review" ? dailyPicks.review : dailyPicks.newProblem;
  if (!pick) return;

  const existing = pick.id ? problems.find((problem) => problem.id === pick.id) : findProblemBySlug(pick.titleSlug);
  const problemSnapshot = existing ? cloneState(existing) : null;
  const sessionsSnapshot = cloneState(sessions);
  if (existing && cardType === "new") {
    existing.listMemberships = mergeMemberships(existing.listMemberships, [getSelectedStudyList().membership]);
  }
  const problem = existing || addProblemFromPlan(pick);
  applyGrade(problem.id, grade, {
    createdProblemId: existing ? "" : problem.id,
    problemSnapshot,
    sessionsSnapshot,
  });
}

function applyGrade(id, grade, undoContext = {}) {
  const today = toIsoDate(new Date());
  const now = new Date().toISOString();

  let gradeMessage = "";

  problems = problems.map((problem) => {
    if (problem.id !== id) return problem;

    const previousCount = Number(problem.completionCount || 0);
    const previousStage = clampStage(problem.stage);
    const daysOverdue = getDaysOverdue(problem.nextReview);
    const newStage = nextStageForGrade(grade, previousStage, daysOverdue);
    const intervalDays = STAGES[newStage].intervalDays;
    const nextReview = toIsoDate(addDays(dateOnly(new Date()), intervalDays));
    const nextGreenStreak = grade === "green" ? Number(problem.greenStreak || 0) + 1 : 0;
    const heldForOverdue = grade === "green" && newStage === previousStage && isExtremelyOverdue(previousStage, daysOverdue);
    const reviewEntry = {
      date: today,
      grade,
      previousStage,
      newStage,
      wasOverdue: daysOverdue > 0,
      daysOverdue,
      heldForOverdue,
      intervalDays,
      nextReview,
    };
    gradeMessage = buildGradeMessage(grade, previousStage, newStage, daysOverdue, nextReview, heldForOverdue);
    const nextProblem = normalizeProblem({
      ...problem,
      status: "review",
      completionCount: previousCount + 1,
      stage: newStage,
      currentIntervalDays: intervalDays,
      greenStreak: nextGreenStreak,
      lastGrade: grade,
      lastReviewedAt: today,
      firstAttemptAt: problem.firstAttemptAt || today,
      nextReview,
      reviewHistory: [...(problem.reviewHistory || []), reviewEntry],
      solvedAt: grade === "green" ? problem.solvedAt || now : problem.solvedAt || "",
      updatedAt: now,
    });

    return applyMasteryStatus(nextProblem);
  });

  const gradedProblem = problems.find((problem) => problem.id === id);
  if (gradedProblem) {
    lastGradeUndo = {
      problemId: id,
      title: gradedProblem.title,
      createdProblemId: undoContext.createdProblemId || "",
      problemSnapshot: undoContext.problemSnapshot || null,
      sessionsSnapshot: undoContext.sessionsSnapshot || cloneState(sessions),
    };
    sessions = [
      {
        date: today,
        problemId: id,
        title: gradedProblem.title,
        topic: gradedProblem.topic,
        grade,
        stage: gradedProblem.stage,
        status: gradedProblem.status,
      },
      ...sessions,
    ].slice(0, 100);
  }

  persist();
  render();
  if (els.gradeResult) els.gradeResult.textContent = gradeMessage;
  showPostGradeNotePrompt(gradedProblem);
}

function undoLastGrade() {
  if (!lastGradeUndo) return;

  const { problemId, createdProblemId, problemSnapshot, sessionsSnapshot, title } = lastGradeUndo;
  problems = createdProblemId
    ? problems.filter((problem) => problem.id !== createdProblemId)
    : problems.map((problem) => (problem.id === problemId ? normalizeProblem(problemSnapshot) : problem));
  sessions = sessionsSnapshot;
  lastGradeUndo = null;

  persist();
  clearPostGradeNote();
  render();
  if (els.gradeResult) els.gradeResult.textContent = `Undid last grade for ${title}.`;
}

function showPostGradeNotePrompt(problem) {
  if (!problem) return;
  const shouldShowComplexity = problem.lastGrade === "green" || problem.lastGrade === "yellow";
  pendingNoteProblemId = problem.id;
  els.postGradeTitle.textContent = `Add a quick note for ${problem.title}?`;
  els.postGradeNotesInput.value = problem.notes || "";
  els.postGradeComplexityInput.checked = Boolean(problem.complexityKnown);
  els.postGradeComplexityField.hidden = !shouldShowComplexity;
  els.postGradeNote.hidden = false;
}

function clearPostGradeNote() {
  pendingNoteProblemId = "";
  els.postGradeNotesInput.value = "";
  els.postGradeComplexityInput.checked = false;
  els.postGradeComplexityField.hidden = true;
  els.postGradeNote.hidden = true;
}

function savePostGradeNote() {
  const note = els.postGradeNotesInput.value.trim();
  if (!pendingNoteProblemId) return;

  const now = new Date().toISOString();
  const shouldUpdateComplexity = !els.postGradeComplexityField.hidden;
  problems = problems.map((problem) =>
    problem.id === pendingNoteProblemId
      ? normalizeProblem({
          ...problem,
          notes: note,
          complexityKnown: shouldUpdateComplexity ? els.postGradeComplexityInput.checked : problem.complexityKnown,
          updatedAt: now,
        })
      : problem,
  );

  persist();
  clearPostGradeNote();
  render();
  if (els.gradeResult) els.gradeResult.textContent = note ? "Note saved." : "Note cleared.";
}

function buildGradeMessage(grade, previousStage, newStage, daysOverdue, nextReview, heldForOverdue) {
  const gradeLabels = {
    red: "Could not solve",
    yellow: "Solved with hints / slow",
    green: "Solved cleanly",
  };
  const movement =
    newStage > previousStage
      ? `advanced to ${stageName(newStage)}`
      : newStage < previousStage
        ? `moved to ${stageName(newStage)}`
        : `stayed at ${stageName(newStage)}`;
  const overdueNote = heldForOverdue
    ? ` Held because it was ${daysOverdue} days overdue.`
    : daysOverdue > 0
      ? ` It was ${daysOverdue} days overdue.`
      : "";
  return `${gradeLabels[grade]}: ${movement}. Next review ${formatDate(nextReview)}.${overdueNote}`;
}

function historyGradeLabel(grade) {
  const labels = {
    red: "Could not solve",
    yellow: "Solved with hints / slow",
    green: "Solved cleanly",
    imported: "Imported prior attempt",
  };
  return labels[grade] || "Prior attempt";
}

function historyStageSummary(entry) {
  if (!isProperGrade(entry.grade)) return "Historical context";
  const nextReview = entry.nextReview ? ` · next ${formatDate(entry.nextReview)}` : "";
  return `${stageName(entry.previousStage)} -> ${stageName(entry.newStage)}${nextReview}`;
}

function isProperGrade(grade) {
  return GRADED_ATTEMPT_GRADES.includes(grade);
}

function nextStageForGrade(grade, currentStage, daysOverdue = 0) {
  const stage = clampStage(currentStage);
  if (grade === "red") return 0;
  if (grade === "yellow") return stage <= 1 ? stage : stage - 1;
  if (isExtremelyOverdue(stage, daysOverdue)) return stage;
  return Math.min(stage + 1, STAGES.length - 1);
}

function isExtremelyOverdue(stage, daysOverdue) {
  return daysOverdue > STAGES[clampStage(stage)].intervalDays * 2;
}

function getDaysOverdueOnDate(nextReview, attemptDate) {
  if (!nextReview || !attemptDate) return 0;
  const diff = Math.floor((parseIsoDate(attemptDate) - parseIsoDate(nextReview)) / 86400000);
  return Math.max(0, diff);
}

function openDialog(id = "") {
  const problem = problems.find((item) => item.id === id);
  els.problemForm.reset();
  els.problemId.value = problem?.id || "";
  els.dialogTitle.textContent = problem ? "Edit Problem" : "Add Problem";
  els.deleteBtn.style.visibility = problem ? "visible" : "hidden";
  renderReviewSummary(problem);
  setProblemDialogTab("problem");

  els.titleInput.value = problem?.title || "";
  els.urlInput.value = problem?.url || "";
  els.statusInput.value = problem?.status || "todo";
  els.difficultyInput.value = problem?.difficulty || "Medium";
  renderProblemTopicOptions(problem?.topic || "General");
  els.reviewInput.value = problem?.nextReview || "";
  els.completionInput.value = problem?.completionCount ?? 0;
  els.complexityInput.checked = Boolean(problem?.complexityKnown);
  els.notesInput.value = problem?.notes || "";
  els.backfillDateInput.value = toIsoDate(new Date());
  els.backfillGradeInput.value = "green";
  els.backfillNoteInput.value = "";
  renderHistoryTab(problem);
  els.solutionApproachInput.value = problem?.solution?.approach || "";
  els.timeComplexityInput.value = problem?.solution?.timeComplexity || "";
  els.spaceComplexityInput.value = problem?.solution?.spaceComplexity || "";
  els.solutionExplanationInput.value = problem?.solution?.explanation || "";
  els.problemDialog.showModal();
}

function setProblemDialogTab(tabName) {
  const activeTab = ["problem", "solution", "history"].includes(tabName) ? tabName : "problem";

  dialogTabButtons.forEach((button) => {
    const isActive = button.dataset.dialogTab === activeTab;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });

  dialogTabPanels.forEach((panel) => {
    panel.hidden = panel.dataset.dialogPanel !== activeTab;
  });
}

function renderHistoryTab(problem) {
  if (!problem) {
    els.historyList.innerHTML = `
      <div class="history-empty">
        <strong>Save this problem first</strong>
        <span>Backfill is available after the problem exists in the tracker.</span>
      </div>
    `;
    els.addBackfillBtn.disabled = true;
    els.backfillHelp.textContent = "Save this problem before adding backfilled attempts.";
    return;
  }

  const history = [...(problem.reviewHistory || [])].sort((a, b) => dateValue(b.date) - dateValue(a.date));
  els.addBackfillBtn.disabled = false;
  els.backfillHelp.textContent =
    "Add a real graded attempt you completed elsewhere. Imported CSV rows stay visible above, but only real grades drive scheduling.";

  if (history.length === 0) {
    els.historyList.innerHTML = `
      <div class="history-empty">
        <strong>No review history yet</strong>
        <span>Backfilled attempts will appear here after you add them.</span>
      </div>
    `;
    return;
  }

  els.historyList.innerHTML = history
    .map((entry) => `
      <div class="history-row">
        <div>
          <strong>${escapeHtml(formatDate(entry.date))}</strong>
          <span>${escapeHtml(historyGradeLabel(entry.grade))}</span>
          ${entry.note ? `<p>${escapeHtml(entry.note)}</p>` : ""}
        </div>
        <small>${escapeHtml(historyStageSummary(entry))}</small>
      </div>
    `)
    .join("");
}

function addBackfillAttempt() {
  const id = els.problemId.value;
  const problem = problems.find((item) => item.id === id);
  if (!problem) return;

  const date = normalizeDate(els.backfillDateInput.value);
  const grade = els.backfillGradeInput.value;
  const note = els.backfillNoteInput.value.trim();

  if (!date) {
    alert("Choose a valid attempt date.");
    return;
  }

  if (parseIsoDate(date) > dateOnly(new Date())) {
    alert("Backfilled attempts cannot be in the future.");
    return;
  }

  if (!isProperGrade(grade)) {
    alert("Choose a real grade for the backfilled attempt.");
    return;
  }

  const now = new Date().toISOString();
  const entry = {
    date,
    grade,
    backfilled: true,
    note,
  };

  const nextProblem = rebuildProblemFromHistory({
    ...problem,
    reviewHistory: [...(problem.reviewHistory || []), entry],
    updatedAt: now,
  });

  problems = problems.map((item) => (item.id === id ? nextProblem : item));
  lastGradeUndo = null;
  clearPostGradeNote();

  persist();
  render();
  renderReviewSummary(nextProblem);
  els.statusInput.value = nextProblem.status;
  els.reviewInput.value = nextProblem.nextReview;
  els.completionInput.value = nextProblem.completionCount;
  renderHistoryTab(nextProblem);
  els.backfillNoteInput.value = "";
  els.gradeResult.textContent = `Backfilled ${historyGradeLabel(grade).toLowerCase()} for ${nextProblem.title}.`;
}

function rebuildProblemFromHistory(problem) {
  const sortedHistory = [...(problem.reviewHistory || [])].sort((a, b) => dateValue(a.date) - dateValue(b.date));
  const importedCount = sortedHistory.filter((entry) => !isProperGrade(entry.grade)).length;
  const firstAttemptAt = sortedHistory[0]?.date || problem.firstAttemptAt || "";
  let stage = inferStageFromCount(importedCount);
  let greenStreak = 0;
  let scheduledReview = "";
  let lastProperEntry = null;

  const replayedHistory = sortedHistory.map((entry) => {
    if (!isProperGrade(entry.grade)) return entry;

    const previousStage = stage;
    const daysOverdue = scheduledReview ? getDaysOverdueOnDate(scheduledReview, entry.date) : 0;
    const newStage = nextStageForGrade(entry.grade, previousStage, daysOverdue);
    const intervalDays = STAGES[newStage].intervalDays;
    const nextReview = toIsoDate(addDays(parseIsoDate(entry.date), intervalDays));
    const heldForOverdue =
      entry.grade === "green" && newStage === previousStage && isExtremelyOverdue(previousStage, daysOverdue);

    stage = newStage;
    greenStreak = entry.grade === "green" ? greenStreak + 1 : 0;
    scheduledReview = nextReview;
    lastProperEntry = {
      ...entry,
      previousStage,
      newStage,
      wasOverdue: daysOverdue > 0,
      daysOverdue,
      heldForOverdue,
      intervalDays,
      nextReview,
    };
    return lastProperEntry;
  });

  const normalized = normalizeProblem({
    ...problem,
    status: lastProperEntry ? "review" : problem.status,
    firstAttemptAt,
    reviewHistory: replayedHistory,
    completionCount: replayedHistory.length,
    stage,
    greenStreak,
    lastReviewedAt: lastProperEntry?.date || problem.lastReviewedAt,
    lastGrade: lastProperEntry?.grade || problem.lastGrade,
    nextReview: lastProperEntry?.nextReview || problem.nextReview,
    currentIntervalDays: STAGES[stage].intervalDays,
    solvedAt: problem.solvedAt || replayedHistory.find((entry) => entry.grade === "green")?.date || "",
    updatedAt: new Date().toISOString(),
  });

  return applyMasteryStatus(normalized);
}

function renderReviewSummary(problem) {
  if (!problem || !isAttempted(problem)) {
    els.reviewSummaryStats.innerHTML = `
      <div class="summary-empty">
        <strong>Not in the review loop yet</strong>
        <span>Grade this problem to start attempts, stages, and review timing.</span>
      </div>
    `;
    els.masteryBlockers.innerHTML = "";
    return;
  }

  const stage = clampStage(problem.stage);
  const intervalDays = STAGES[stage].intervalDays;
  const stats = [
    ["Status", statusLabel(problem.status)],
    ["Stage", stageName(stage)],
    ["Next review", reviewTimingLabel(problem.nextReview)],
    ["Attempts", Number(problem.completionCount || 0)],
    ["Green streak", Number(problem.greenStreak || 0)],
    ["Next interval", `${intervalDays} ${intervalDays === 1 ? "day" : "days"}`],
  ];

  els.reviewSummaryStats.innerHTML = stats
    .map(([label, value]) => `
      <div class="summary-stat">
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(value)}</strong>
      </div>
    `)
    .join("");
  renderMasteryBlockers(problem);
}

function renderMasteryBlockers(problem) {
  if (isMastered(problem)) {
    els.masteryBlockers.innerHTML = `<p class="mastery-ready">Mastered. Keep long-interval maintenance honest.</p>`;
    return;
  }

  const blockers = getMasteryBlockers(problem);
  els.masteryBlockers.innerHTML = `
    <span>Mastery blockers</span>
    <div>
      ${
        blockers.length
          ? blockers.map((blocker) => `<span class="blocker-pill">${escapeHtml(blocker)}</span>`).join("")
          : `<span class="mastery-ready">Eligible for mastery after save.</span>`
      }
    </div>
  `;
}

function getMasteryBlockers(problem) {
  const blockers = [];
  const attempts = Number(problem.completionCount || 0);
  const threshold = MASTERY_ATTEMPT_THRESHOLDS[problem.difficulty] || MASTERY_ATTEMPT_THRESHOLDS.Medium;
  const recent = (problem.reviewHistory || []).slice(-3);
  const hasRecentRed = recent.some((entry) => entry.grade === "red");
  const firstAttemptAt = problem.firstAttemptAt || problem.reviewHistory?.[0]?.date || "";
  const daysSinceFirstAttempt = firstAttemptAt
    ? Math.floor((dateOnly(new Date()) - parseIsoDate(firstAttemptAt)) / 86400000)
    : 0;

  if (attempts < threshold) blockers.push(`${threshold - attempts} more ${threshold - attempts === 1 ? "attempt" : "attempts"}`);
  if (Number(problem.greenStreak || 0) < 2) blockers.push("2 clean-solve streak");
  if (clampStage(problem.stage) < 4) blockers.push("Durable stage");
  if (daysSinceFirstAttempt < 14) blockers.push(`${14 - daysSinceFirstAttempt} more days since first attempt`);
  if (hasRecentRed) blockers.push("no recent missed solves");
  if (!problem.complexityKnown) blockers.push("complexity checkbox");
  return blockers;
}

function saveProblem(event) {
  event.preventDefault();
  const id = els.problemId.value || crypto.randomUUID();
  const existing = problems.find((problem) => problem.id === id);
  const status = els.statusInput.value;
  const now = new Date().toISOString();
  const title = els.titleInput.value.trim();
  const url = safeUrl(els.urlInput.value.trim());
  const titleSlug = existing?.titleSlug || slugFromUrl(url) || slugifyTitle(title);

  const next = normalizeProblem({
    ...existing,
    id,
    title,
    titleSlug,
    url,
    status,
    difficulty: els.difficultyInput.value,
    topic: els.topicInput.value.trim(),
    nextReview: els.reviewInput.value,
    completionCount: Number(els.completionInput.value || 0),
    complexityKnown: els.complexityInput.checked,
    notes: els.notesInput.value.trim(),
    solution: {
      approach: els.solutionApproachInput.value.trim(),
      timeComplexity: els.timeComplexityInput.value.trim(),
      spaceComplexity: els.spaceComplexityInput.value.trim(),
      explanation: els.solutionExplanationInput.value.trim(),
    },
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    source: existing?.source || "manual",
    solvedAt: existing?.solvedAt || "",
  });
  next.status = status === "solved" ? "solved" : next.status;
  const masteredNext = applyMasteryStatus(next);

  masteredNext.listMemberships = mergeMemberships(masteredNext.listMemberships, getBuiltInMemberships(next.titleSlug, next.title));

  problems = existing
    ? problems.map((problem) => (problem.id === id ? masteredNext : problem))
    : [masteredNext, ...problems];

  persist();
  render();
  els.problemDialog.close();
}

function deleteCurrentProblem() {
  const id = els.problemId.value;
  problems = problems.filter((problem) => problem.id !== id);
  sessions = sessions.filter((session) => session.problemId !== id);
  persist();
  render();
  els.problemDialog.close();
}

function seedBlind75() {
  seedStudyList("blind75");
}

function seedNeetcode150() {
  seedStudyList("neetcode150");
}

function seedStudyList(listId) {
  const studyList = STUDY_LISTS[listId];
  if (!studyList) return;

  const now = new Date().toISOString();
  let added = 0;

  studyList.problems.forEach((planProblem) => {
    const existing = findProblemByPlan(planProblem);
    if (existing) {
      existing.listMemberships = mergeMemberships(existing.listMemberships, [studyList.membership]);
      existing.titleSlug = existing.titleSlug || planProblem.slug;
      existing.url = existing.url || planProblem.url || leetcodeUrl(planProblem.slug);
      existing.topic = existing.topic || planProblem.topic;
      existing.difficulty = existing.difficulty || planProblem.difficulty;
      existing.updatedAt = now;
      return;
    }

    problems.push(
      normalizeProblem({
        ...planToProblem(planProblem, studyList.membership),
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
        source: studyList.membership,
      }),
    );
    added += 1;
  });

  persist();
  render();
  alert(`${studyList.label} seeded. Added ${added} new problems.`);
}

function addProblemFromPlan(planProblem) {
  const now = new Date().toISOString();
  const problem = normalizeProblem({
    ...planProblem,
    id: crypto.randomUUID(),
    status: "solving",
    nextReview: "",
    completionCount: 0,
    stage: 0,
    greenStreak: 0,
    complexityKnown: false,
    reviewHistory: [],
    createdAt: now,
    updatedAt: now,
    source: planProblem.source || "study-list",
  });
  problems = [problem, ...problems];
  return problem;
}

function planToProblem(planProblem, membership = "blind75") {
  return normalizeProblem({
    title: planProblem.title,
    titleSlug: planProblem.slug || planProblem.titleSlug,
    url: planProblem.url || leetcodeUrl(planProblem.slug || planProblem.titleSlug),
    status: "todo",
    difficulty: planProblem.difficulty,
    topic: planProblem.topic,
    notes: "",
    nextReview: "",
    completionCount: 0,
    stage: 0,
    greenStreak: 0,
    complexityKnown: false,
    reviewHistory: [],
    listMemberships: planProblem.listMemberships || [membership],
    source: membership,
  });
}

function importCsv(event) {
  const [file] = event.target.files;
  if (!file) return;

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      const rows = parseCsv(String(reader.result));
      if (rows.length === 0) throw new Error("No CSV rows found");
      const imported = rows.map(csvRowToProblem).filter(Boolean);
      mergeImportedProblems(imported);
      importMeta = {
        importedAt: toIsoDate(new Date()),
        sourceFileName: file.name,
        rowCount: imported.length,
        schemaVersion: EXPORT_VERSION,
      };
      persist();
      persistImportMeta();
      render();
      alert(`Imported ${imported.length} CSV rows. The local server file is now the source of truth.`);
    } catch (error) {
      console.error(error);
      alert("That CSV could not be imported. Check the file format and try again.");
    } finally {
      els.csvImportInput.value = "";
    }
  });
  reader.readAsText(file);
}

function csvRowToProblem(row) {
  const title = getCsvValue(row, "Problem").trim();
  if (!title) return null;

  const firstAttemptAt = normalizeDate(getCsvValue(row, "First time attempt"));
  const reviewDates = [
    firstAttemptAt,
    normalizeDate(getCsvValue(row, "Second time reviewed")),
    normalizeDate(getCsvValue(row, "Third time reviewed")),
    normalizeDate(getCsvValue(row, "Fourth Time reviewed")),
  ].filter(Boolean);
  const completionCount = Number(getCsvValue(row, "Completion Count") || reviewDates.length || 0);
  const explicitNextReview = normalizeDate(getCsvValue(row, "Next Review"));
  const stage = inferStageFromCount(completionCount);
  const currentIntervalDays = STAGES[stage].intervalDays;
  const nextReview =
    explicitNextReview || (reviewDates.length > 0 ? toIsoDate(addDays(parseIsoDate(reviewDates.at(-1)), currentIntervalDays)) : "");
  const url = normalizeCsvUrl(getCsvValue(row, "Link"), title);
  const titleSlug = slugFromUrl(url) || slugifyTitle(title);
  const builtInPlan = findBuiltInPlan(titleSlug, title);
  const reviewHistory = reviewDates.map((date, index) => ({
    date,
    grade: "imported",
    previousStage: Math.max(0, inferStageFromCount(index)),
    newStage: Math.max(0, inferStageFromCount(index + 1)),
    wasOverdue: false,
    daysOverdue: 0,
    intervalDays: index === reviewDates.length - 1 ? currentIntervalDays : null,
  }));

  return normalizeProblem({
    id: crypto.randomUUID(),
    title: builtInPlan?.title || title,
    titleSlug: builtInPlan?.slug || titleSlug,
    url: builtInPlan?.url || url,
    topic: getCsvValue(row, "Topic") || builtInPlan?.topic || "General",
    difficulty: normalizeDifficulty(getCsvValue(row, "Difficulty") || builtInPlan?.difficulty),
    status: normalizeStatus(getCsvValue(row, "Status"), completionCount),
    notes: getCsvValue(row, "Notes / Gotchas"),
    firstAttemptAt,
    reviewHistory,
    completionCount,
    stage,
    currentIntervalDays,
    greenStreak: 0,
    lastReviewedAt: reviewDates.at(-1) || "",
    lastGrade: "imported",
    nextReview,
    complexityKnown: false,
    source: "csv",
    listMemberships: getBuiltInMemberships(titleSlug, title),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    solvedAt: "",
  });
}

function mergeImportedProblems(imported) {
  imported.forEach((incoming) => {
    const existing = findProblemBySlug(incoming.titleSlug) || findProblemByTitle(incoming.title);
    if (!existing) {
      problems.push(incoming);
      return;
    }

    Object.assign(existing, normalizeProblem({
      ...incoming,
      ...existing,
      id: existing.id,
      title: existing.title || incoming.title,
      titleSlug: existing.titleSlug || incoming.titleSlug,
      url: existing.url || incoming.url,
      topic: existing.topic || incoming.topic,
      difficulty: existing.difficulty || incoming.difficulty,
      notes: existing.notes || incoming.notes,
      source: existing.source === "manual" ? "manual" : "csv",
      listMemberships: mergeMemberships(existing.listMemberships, incoming.listMemberships),
      firstAttemptAt: existing.firstAttemptAt || incoming.firstAttemptAt,
      reviewHistory: existing.reviewHistory?.length ? existing.reviewHistory : incoming.reviewHistory,
      completionCount: Math.max(Number(existing.completionCount || 0), Number(incoming.completionCount || 0)),
      stage: existing.stage ?? incoming.stage,
      greenStreak: existing.greenStreak ?? incoming.greenStreak,
      complexityKnown: Boolean(existing.complexityKnown),
      masteredAt: existing.masteredAt || "",
      currentIntervalDays: existing.currentIntervalDays || incoming.currentIntervalDays,
      lastReviewedAt: existing.lastReviewedAt || incoming.lastReviewedAt,
      nextReview: existing.nextReview || incoming.nextReview,
      updatedAt: new Date().toISOString(),
    }));
  });
}

function exportJson() {
  const payload = {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    importMeta,
    problems,
    sessions,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "dsa-anti-forgetting-tracker.json";
  link.click();
  URL.revokeObjectURL(link.href);
}

function importJson(event) {
  const [file] = event.target.files;
  if (!file) return;

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      const imported = JSON.parse(String(reader.result));
      const importedProblems = Array.isArray(imported) ? imported : imported.problems;
      if (!Array.isArray(importedProblems)) throw new Error("Expected problems array");
      problems = importedProblems.map(normalizeProblem);
      sessions = Array.isArray(imported.sessions) ? imported.sessions : [];
      importMeta = imported.importMeta || importMeta;
      persist();
      if (importMeta) persistImportMeta();
      render();
    } catch (error) {
      console.error(error);
      alert("That JSON file does not look like a tracker export.");
    } finally {
      els.jsonImportInput.value = "";
    }
  });
  reader.readAsText(file);
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(cell);
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  row.push(cell);
  if (row.some((value) => value.trim() !== "")) rows.push(row);
  if (rows.length < 2) return [];

  const headers = rows[0].map((header) => header.trim());
  return rows.slice(1).map((values) => {
    const entry = {};
    headers.forEach((header, index) => {
      entry[header] = values[index]?.trim() || "";
    });
    return entry;
  });
}

function getCsvValue(row, header) {
  return row[header] || "";
}

function normalizeProblem(problem) {
  const title = String(problem.title || "Untitled").trim();
  const url = safeUrl(problem.url || "");
  const titleSlug = canonicalSlug(slugFromUrl(url) || problem.titleSlug || problem.slug || slugifyTitle(title));
  const nextReview = normalizeDate(problem.nextReview || problem.reviewDate || "");
  const completionCount = Math.max(0, Number(problem.completionCount || 0));
  const listMemberships = mergeMemberships(problem.listMemberships || [], []);
  const inferredStage = Number.isFinite(Number(problem.stage))
    ? Number(problem.stage)
    : intervalToStage(Number(problem.currentIntervalDays || 0)) || inferStageFromCount(completionCount);
  const stage = clampStage(inferredStage);
  const greenStreak = Number.isFinite(Number(problem.greenStreak))
    ? Math.max(0, Number(problem.greenStreak))
    : computeGreenStreak(problem.reviewHistory || []);
  const baseStatus = STATUSES.includes(problem.status) ? problem.status : normalizeStatus(problem.status, completionCount);
  const normalized = {
    id: problem.id || crypto.randomUUID(),
    title,
    titleSlug,
    url,
    status: baseStatus,
    difficulty: normalizeDifficulty(problem.difficulty),
    topic: String(problem.topic || "General").trim(),
    notes: String(problem.notes || ""),
    solution: normalizeSolution(problem.solution),
    firstAttemptAt: normalizeDate(problem.firstAttemptAt || problem.solvedAt || ""),
    reviewHistory: Array.isArray(problem.reviewHistory) ? problem.reviewHistory : [],
    completionCount,
    stage,
    greenStreak,
    complexityKnown: Boolean(problem.complexityKnown),
    currentIntervalDays: STAGES[stage].intervalDays,
    lastReviewedAt: normalizeDate(problem.lastReviewedAt || ""),
    lastGrade: problem.lastGrade || "",
    nextReview,
    masteredAt: normalizeDate(problem.masteredAt || ""),
    source: problem.source || "manual",
    listMemberships,
    createdAt: problem.createdAt || new Date().toISOString(),
    updatedAt: problem.updatedAt || new Date().toISOString(),
    solvedAt: problem.solvedAt || "",
  };

  return applyMasteryStatus(normalized);
}

function normalizeSolution(solution = {}) {
  return {
    approach: String(solution.approach || ""),
    timeComplexity: String(solution.timeComplexity || ""),
    spaceComplexity: String(solution.spaceComplexity || ""),
    explanation: String(solution.explanation || ""),
  };
}

function normalizeStatus(value, completionCount) {
  const status = String(value || "").trim().toLowerCase();
  if (status === "mastered") return "solved";
  if (status === "done" || status === "solved") return completionCount > 0 ? "review" : "todo";
  if (status === "redo" || status === "review") return "review";
  if (status === "solving") return "solving";
  return completionCount > 0 ? "review" : "todo";
}

function normalizeDifficulty(value) {
  const difficulty = String(value || "Medium").trim();
  return DIFFICULTIES.includes(difficulty) ? difficulty : "Medium";
}

function normalizeCsvUrl(value, title) {
  const trimmed = String(value || "").trim();
  if (trimmed.startsWith("http")) return safeUrl(trimmed);
  const builtInPlan = findBuiltInPlan("", title);
  return builtInPlan?.url || `https://leetcode.com/problems/${slugifyTitle(title)}/`;
}

function safeUrl(value) {
  const url = String(value || "").trim();
  if (!url) return "";

  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.href : "";
  } catch {
    return "";
  }
}

function findProblemByPlan(planProblem) {
  return findProblemBySlug(planProblem.slug) || findProblemByTitle(planProblem.title);
}

function findBuiltInPlan(slug, title) {
  const canonical = canonicalSlug(slug);
  const normalizedTitle = normalizeTitle(title);
  for (const studyList of Object.values(STUDY_LISTS)) {
    const planProblem = studyList.problems.find(
      (problem) => (canonical && canonicalSlug(problem.slug) === canonical) || normalizeTitle(problem.title) === normalizedTitle,
    );
    if (planProblem) return planProblem;
  }
  return null;
}

function getBuiltInMemberships(slug, title) {
  const canonical = canonicalSlug(slug);
  const normalizedTitle = normalizeTitle(title);
  return Object.values(STUDY_LISTS)
    .filter((studyList) =>
      studyList.problems.some(
        (problem) => (canonical && canonicalSlug(problem.slug) === canonical) || normalizeTitle(problem.title) === normalizedTitle,
      ),
    )
    .map((studyList) => studyList.membership);
}

function findProblemBySlug(slug) {
  const canonical = canonicalSlug(slug);
  if (!canonical) return null;
  return problems.find((problem) => problemIdentitySlug(problem) === canonical) || null;
}

function findProblemByTitle(title) {
  const normalized = normalizeTitle(title);
  return problems.find((problem) => normalizeTitle(problem.title) === normalized) || null;
}

function isAttempted(problem) {
  return Number(problem.completionCount || 0) > 0 || Boolean(problem.firstAttemptAt || problem.lastReviewedAt);
}

function isMastered(problem) {
  return problem.status === "solved" || Boolean(problem.masteredAt);
}

function applyMasteryStatus(problem) {
  const mastered = isMasteryEligible(problem);
  return {
    ...problem,
    status: mastered ? "solved" : isAttempted(problem) ? "review" : problem.status === "solving" ? "solving" : "todo",
    masteredAt: mastered ? problem.masteredAt || toIsoDate(new Date()) : "",
    solvedAt: mastered ? problem.solvedAt || new Date().toISOString() : problem.solvedAt || "",
  };
}

function isMasteryEligible(problem) {
  const attempts = Number(problem.completionCount || 0);
  const threshold = MASTERY_ATTEMPT_THRESHOLDS[problem.difficulty] || MASTERY_ATTEMPT_THRESHOLDS.Medium;
  const recent = (problem.reviewHistory || []).slice(-3);
  const hasRecentRed = recent.some((entry) => entry.grade === "red");
  const firstAttemptAt = problem.firstAttemptAt || problem.reviewHistory?.[0]?.date || "";
  const daysSinceFirstAttempt = firstAttemptAt
    ? Math.floor((dateOnly(new Date()) - parseIsoDate(firstAttemptAt)) / 86400000)
    : 0;

  return (
    attempts >= threshold &&
    Number(problem.greenStreak || 0) >= 2 &&
    clampStage(problem.stage) >= 4 &&
    daysSinceFirstAttempt >= 14 &&
    !hasRecentRed &&
    Boolean(problem.complexityKnown)
  );
}

function getBlindOrder(problem) {
  return BLIND_75.find((planProblem) => planProblem.slug === problem.titleSlug)?.order || Number.MAX_SAFE_INTEGER;
}

function getStudyListOrder(problem, studyList) {
  return studyList.problems.find((planProblem) => planProblem.slug === problem.titleSlug)?.order || Number.MAX_SAFE_INTEGER;
}

function mergeMemberships(a = [], b = []) {
  return [...new Set([...(a || []), ...(b || [])].filter(Boolean))];
}

function inferStageFromCount(count) {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count === 3) return 3;
  return 4;
}

function intervalToStage(days) {
  const index = STAGES.findIndex((stage) => stage.intervalDays === days);
  return index >= 0 ? index : 0;
}

function clampStage(stage) {
  return Math.round(clamp(Number(stage || 0), 0, STAGES.length - 1));
}

function stageLabel(stage) {
  return STAGES[clampStage(stage)].label;
}

function stageName(stage) {
  const index = clampStage(stage);
  return `${STAGES[index].label} (Stage ${index})`;
}

function compactStageName(stage) {
  const index = clampStage(stage);
  const labels = ["Learning", "Recall", "Pattern", "Transfer", "Durable", "Maint."];
  return `S${index} ${labels[index]}`;
}

function computeGreenStreak(history) {
  let streak = 0;
  for (let i = history.length - 1; i >= 0; i -= 1) {
    if (history[i]?.grade !== "green") break;
    streak += 1;
  }
  return streak;
}

function getDaysOverdue(value) {
  if (!value) return 0;
  return Math.max(0, Math.floor((dateOnly(new Date()) - parseIsoDate(value)) / 86400000));
}

function reviewTimingLabel(value) {
  if (!value) return "not scheduled";
  const daysOverdue = getDaysOverdue(value);
  if (daysOverdue > 0) return `${daysOverdue} ${daysOverdue === 1 ? "day" : "days"} overdue`;
  if (isReviewDue(value)) return "due today";
  return `due ${formatDate(value)}`;
}


function statusLabel(status) {
  const labels = {
    todo: "Unattempted",
    solving: "Learning",
    solved: "Mastered",
    review: "Reviewing",
  };
  return labels[status] || status;
}

function formatDate(value) {
  if (!value) return "Not set";
  const date = parseIsoDate(value);
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "just now";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function normalizeDate(value) {
  const date = String(value || "").trim();
  if (!date) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? "" : toIsoDate(parsed);
}

function parseIsoDate(value) {
  return new Date(`${value}T00:00:00`);
}

function isReviewDue(value) {
  if (!value) return false;
  return parseIsoDate(value) <= dateOnly(new Date());
}

function dateOnly(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function dateValue(value) {
  return value ? parseIsoDate(value).getTime() : Number.MAX_SAFE_INTEGER;
}

function addDays(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function toIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

function slugFromUrl(url) {
  const match = String(url || "").match(/leetcode\.com\/problems\/([^/]+)/);
  return canonicalSlug(match?.[1] || "");
}

function leetcodeUrl(slug) {
  return slug ? `https://leetcode.com/problems/${slug}/` : "";
}

function slugifyTitle(title) {
  return canonicalSlug(
    normalizeTitle(title)
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, ""),
  );
}

function problemIdentitySlug(problem) {
  return canonicalSlug(slugFromUrl(problem.url) || problem.titleSlug || problem.slug || slugifyTitle(problem.title));
}

function canonicalSlug(slug) {
  const normalized = String(slug || "").trim().toLowerCase().replace(/\/+$/g, "");
  return SLUG_ALIASES[normalized] || normalized;
}

function normalizeTitle(title) {
  return String(title || "")
    .toLowerCase()
    .replace(/\bsoduku\b/g, "sudoku")
    .replace(/\bstrings\b/g, "strings")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}

function cloneState(value) {
  return JSON.parse(JSON.stringify(value));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}
