const STORAGE_KEY = "leetcode-tracker.problems.v3";
const LEGACY_STORAGE_KEYS = ["leetcode-tracker.problems.v2", "leetcode-tracker.problems.v1"];
const IMPORT_META_KEY = "leetcode-tracker.import.v1";
const SESSION_KEY = "leetcode-tracker.sessions.v1";
const RECOVERY_LANE_KEY = "leetcode-tracker.recovery.v1";
const COLD_WORKFLOW_SESSION_KEY = "leetcode-tracker.cold-workflow.v1";
const NOTIFICATION_BANNER_KEY = "leetcode-tracker.notification-banner-seen.v1";
const THEME_KEY = "leetcode-tracker.theme.v1";
const LEADERBOARD_TAB_KEY = "leetcode-tracker.show-leaderboard-tab.v1";
const STATE_V4 = window.TrackerStateV4;
const PRACTICE_V2_ENGINE = window.PracticeV2Engine;
const PRACTICE_V2_WORKFLOW = window.PracticeV2Workflow;
const PRACTICE_V2_EVIDENCE_WINDOW_DAYS = PRACTICE_V2_ENGINE?.EVIDENCE_WINDOW_DAYS || 30;
const EXPORT_VERSION = STATE_V4?.STATE_VERSION || 4;
const API_STATE_URL = "/api/state";
const API_ENV_URL = "/api/env";
const API_RESET_QA_URL = "/api/reset-qa";
const API_LEADERBOARD_URL = "/api/leaderboard";
const API_LEADERBOARD_PROFILE_URL = "/api/leaderboard/profile";
const API_SOCIAL_PROFILE_URL = "/api/social/profile";
const API_FRIEND_PULSE_URL = "/api/friend-pulse";
const API_FRIEND_PULSE_SEARCH_URL = "/api/friend-pulse/search";
const API_NOTIFICATIONS_CONFIG_URL = "/api/notifications/config";
const API_NOTIFICATIONS_SUBSCRIBE_URL = "/api/notifications/subscribe";
const API_NOTIFICATIONS_SETTINGS_URL = "/api/notifications/settings";
const API_NOTIFICATIONS_UNSUBSCRIBE_URL = "/api/notifications/unsubscribe";
const API_NOTIFICATIONS_TEST_URL = "/api/notifications/test";
const DEFAULT_FEATURES = {
  friendPulse: false,
  leetcodeImport: false,
  phoneReminders: false,
  practiceV2: false,
  practiceV2Shadow: false,
  recoveryLane: false,
};

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
const NEW_ATTEMPT_TIMEBOX_MINUTES = {
  Easy: 20,
  Medium: 30,
  Hard: 45,
};
const WEEKLY_PRACTICE_TARGET = 4;
const RECOVERY_LANE_LIMIT = 3;
const RECOVERY_GRADUATION_STAGE = 3;
const LEARNING_SIGNAL_LABELS = {
  "wrong-pattern": "Wrong pattern",
  "missed-invariant": "Missed invariant",
  "edge-case": "Edge case",
  "implementation-bug": "Syntax / implementation bug",
  "needed-hint": "Needed hint",
  "too-slow": "Too slow",
};
const LEARNING_SIGNAL_KEYS = Object.keys(LEARNING_SIGNAL_LABELS);

const els = {
  addProblemBtn: document.querySelector("#addProblemBtn"),
  addBackfillBtn: document.querySelector("#addBackfillBtn"),
  applyLeetcodeImportBtn: document.querySelector("#applyLeetcodeImportBtn"),
  accountLabel: document.querySelector("#accountLabel"),
  accountMenu: document.querySelector("#accountMenu"),
  appTopbar: document.querySelector("#appTopbar"),
  appStatusStrip: document.querySelector("#appStatusStrip"),
  authView: document.querySelector("#authView"),
  attentionDialog: document.querySelector("#attentionDialog"),
  backfillDateInput: document.querySelector("#backfillDateInput"),
  backfillGradeInput: document.querySelector("#backfillGradeInput"),
  backfillHelp: document.querySelector("#backfillHelp"),
  backfillNoteInput: document.querySelector("#backfillNoteInput"),
  blindAttempted: document.querySelector("#blindAttempted"),
  checkedSkillCount: document.querySelector("#checkedSkillCount"),
  independentSkillCount: document.querySelector("#independentSkillCount"),
  transferSkillCount: document.querySelector("#transferSkillCount"),
  attentionTopics: document.querySelector("#attentionTopics"),
  attentionTopicRows: document.querySelector("#attentionTopicRows"),
  evidenceGapCount: document.querySelector("#evidenceGapCount"),
  evidenceGapCopy: document.querySelector("#evidenceGapCopy"),
  uncheckedSkillCount: document.querySelector("#uncheckedSkillCount"),
  independentGapCount: document.querySelector("#independentGapCount"),
  transferGapCount: document.querySelector("#transferGapCount"),
  cancelBtn: document.querySelector("#cancelBtn"),
  cancelLeetcodeImportBtn: document.querySelector("#cancelLeetcodeImportBtn"),
  closeDialogBtn: document.querySelector("#closeDialogBtn"),
  closeAttentionDialogBtn: document.querySelector("#closeAttentionDialogBtn"),
  closeLeetcodeImportDialogBtn: document.querySelector("#closeLeetcodeImportDialogBtn"),
  clearFilterBtn: document.querySelector("#clearFilterBtn"),
  completionInput: document.querySelector("#completionInput"),
  completionField: document.querySelector("#completionField"),
  complexityInput: document.querySelector("#complexityInput"),
  complexityHelper: document.querySelector("#complexityHelper"),
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
  enableNotificationsBtn: document.querySelector("#enableNotificationsBtn"),
  exportBtn: document.querySelector("#exportBtn"),
  filterBanner: document.querySelector("#filterBanner"),
  filterBannerText: document.querySelector("#filterBannerText"),
  importMeta: document.querySelector("#importMeta"),
  gradeResult: document.querySelector("#gradeResult"),
  historyList: document.querySelector("#historyList"),
  jsonImportInput: document.querySelector("#jsonImportInput"),
  leaderboardDisplayNameInput: document.querySelector("#leaderboardDisplayNameInput"),
  leaderboardEmpty: document.querySelector("#leaderboardEmpty"),
  leaderboardHead: document.querySelector("#leaderboardHead"),
  leaderboardNavLink: document.querySelector("#leaderboardNavLink"),
  leaderboardOptInInput: document.querySelector("#leaderboardOptInInput"),
  leaderboardOptInHelp: document.querySelector("#leaderboardOptInHelp"),
  leaderboardProfileHelp: document.querySelector("#leaderboardProfileHelp"),
  leaderboardRows: document.querySelector("#leaderboardRows"),
  leaderboardSortSelect: document.querySelector("#leaderboardSortSelect"),
  leaderboardTabStatus: document.querySelector("#leaderboardTabStatus"),
  leaderboardTabToggle: document.querySelector("#leaderboardTabToggle"),
  leaderboardView: document.querySelector("#leaderboardView"),
  leaderboardViewNote: document.querySelector("#leaderboardViewNote"),
  leetcodeImportDialog: document.querySelector("#leetcodeImportDialog"),
  leetcodeImportCard: document.querySelector("#leetcodeImportCard"),
  leetcodeImportPreview: document.querySelector("#leetcodeImportPreview"),
  leetcodeImportReviewBtn: document.querySelector("#leetcodeImportReviewBtn"),
  leetcodeImportStatus: document.querySelector("#leetcodeImportStatus"),
  leetcodeImportSummary: document.querySelector("#leetcodeImportSummary"),
  pactDisplayNameInput: document.querySelector("#pactDisplayNameInput"),
  pactsNavLink: document.querySelector("#pactsNavLink"),
  pactsView: document.querySelector("#pactsView"),
  friendIncomingList: document.querySelector("#friendIncomingList"),
  friendOutgoingSummary: document.querySelector("#friendOutgoingSummary"),
  friendPactList: document.querySelector("#friendPactList"),
  friendPactManager: document.querySelector("#friendPactManager"),
  friendPulseList: document.querySelector("#friendPulseList"),
  friendPulseManageBtn: document.querySelector("#friendPulseManageBtn"),
  friendPulseNavBadge: document.querySelector("#friendPulseNavBadge"),
  friendPulsePanel: document.querySelector("#friendPulsePanel"),
  friendPulseSummary: document.querySelector("#friendPulseSummary"),
  friendRequestCount: document.querySelector("#friendRequestCount"),
  friendSearchBtn: document.querySelector("#friendSearchBtn"),
  friendSearchInput: document.querySelector("#friendSearchInput"),
  friendSearchResult: document.querySelector("#friendSearchResult"),
  libraryView: document.querySelector("#libraryView"),
  listFilter: document.querySelector("#listFilter"),
  logoutBtn: document.querySelector("#logoutBtn"),
  logoutDeniedBtn: document.querySelector("#logoutDeniedBtn"),
  newCard: document.querySelector("#newCard"),
  newMeta: document.querySelector("#newMeta"),
  newAttemptState: document.querySelector("#newAttemptState"),
  neetcodeAttempted: document.querySelector("#neetcodeAttempted"),
  newSourceSelect: document.querySelector("#newSourceSelect"),
  newOpenLink: document.querySelector("#newOpenLink"),
  newStartAttemptBtn: document.querySelector("#newStartAttemptBtn"),
  newTitle: document.querySelector("#newTitle"),
  notInvitedCopy: document.querySelector("#notInvitedCopy"),
  notInvitedView: document.querySelector("#notInvitedView"),
  notificationControls: document.querySelector("#notificationControls"),
  notificationBanner: document.querySelector("#notificationBanner"),
  notificationSettingsBtn: document.querySelector("#notificationSettingsBtn"),
  notificationSettingsCard: document.querySelector("#notificationSettingsCard"),
  notificationStatus: document.querySelector("#notificationStatus"),
  notificationTimeInput: document.querySelector("#notificationTimeInput"),
  notesInput: document.querySelector("#notesInput"),
  pactsOptInInput: document.querySelector("#pactsOptInInput"),
  postGradeNote: document.querySelector("#postGradeNote"),
  postGradeComplexityField: document.querySelector("#postGradeComplexityField"),
  postGradeComplexityInput: document.querySelector("#postGradeComplexityInput"),
  postGradeBadge: document.querySelector("#postGradeBadge"),
  postGradeFeedback: document.querySelector("#postGradeFeedback"),
  postGradeHelper: document.querySelector("#postGradeHelper"),
  postGradeNotesInput: document.querySelector("#postGradeNotesInput"),
  postGradeTags: document.querySelector("#postGradeTags"),
  postGradeTitle: document.querySelector("#postGradeTitle"),
  postGradeBenchmarkFields: document.querySelector("#postGradeBenchmarkFields"),
  postGradeDraftGradeInput: document.querySelector("#postGradeDraftGradeInput"),
  postGradeDurationInput: document.querySelector("#postGradeDurationInput"),
  postGradeResultInput: document.querySelector("#postGradeResultInput"),
  postGradeAssistanceInput: document.querySelector("#postGradeAssistanceInput"),
  postGradeBlockerInput: document.querySelector("#postGradeBlockerInput"),
  postGradeColdScoreInput: document.querySelector("#postGradeColdScoreInput"),
  postGradeBenchmarkError: document.querySelector("#postGradeBenchmarkError"),
  practiceV0Content: document.querySelector("#practiceV0Content"),
  practiceV2Experience: document.querySelector("#practiceV2Experience"),
  practiceV2ReadyTitle: document.querySelector("#practiceV2ReadyTitle"),
  practiceV2Difficulty: document.querySelector("#practiceV2Difficulty"),
  practiceV2TimeBox: document.querySelector("#practiceV2TimeBox"),
  practiceV2Evidence: document.querySelector("#practiceV2Evidence"),
  practiceV2Reason: document.querySelector("#practiceV2Reason"),
  practiceV2Capacity: document.querySelector("#practiceV2Capacity"),
  practiceV2CapacityHint: document.querySelector("#practiceV2CapacityHint"),
  practiceV2BeginBtn: document.querySelector("#practiceV2BeginBtn"),
  practiceV2ChangeBtn: document.querySelector("#practiceV2ChangeBtn"),
  practiceV2AttemptTitle: document.querySelector("#practiceV2AttemptTitle"),
  practiceV2LockedTime: document.querySelector("#practiceV2LockedTime"),
  practiceV2OpenLink: document.querySelector("#practiceV2OpenLink"),
  practiceV2FinishBtn: document.querySelector("#practiceV2FinishBtn"),
  practiceV2CancelBtn: document.querySelector("#practiceV2CancelBtn"),
  practiceV2ContinueGradeBtn: document.querySelector("#practiceV2ContinueGradeBtn"),
  practiceV2BackAttemptBtn: document.querySelector("#practiceV2BackAttemptBtn"),
  practiceV2ReflectionForm: document.querySelector("#practiceV2ReflectionForm"),
  practiceV2SelectedGrade: document.querySelector("#practiceV2SelectedGrade"),
  practiceV2Elapsed: document.querySelector("#practiceV2Elapsed"),
  practiceV2TimeUntracked: document.querySelector("#practiceV2TimeUntracked"),
  practiceV2AssistanceField: document.querySelector("#practiceV2AssistanceField"),
  practiceV2Assistance: document.querySelector("#practiceV2Assistance"),
  practiceV2BlockerField: document.querySelector("#practiceV2BlockerField"),
  practiceV2Blocker: document.querySelector("#practiceV2Blocker"),
  practiceV2FrictionField: document.querySelector("#practiceV2FrictionField"),
  practiceV2Friction: document.querySelector("#practiceV2Friction"),
  practiceV2Note: document.querySelector("#practiceV2Note"),
  practiceV2Complexity: document.querySelector("#practiceV2Complexity"),
  practiceV2Error: document.querySelector("#practiceV2Error"),
  practiceV2BackGradeBtn: document.querySelector("#practiceV2BackGradeBtn"),
  practiceV2CompleteTitle: document.querySelector("#practiceV2CompleteTitle"),
  practiceV2CompleteSummary: document.querySelector("#practiceV2CompleteSummary"),
  practiceV2CompleteSkill: document.querySelector("#practiceV2CompleteSkill"),
  practiceV2CompleteEvidence: document.querySelector("#practiceV2CompleteEvidence"),
  practiceV2CompleteReview: document.querySelector("#practiceV2CompleteReview"),
  practiceV2NextBtn: document.querySelector("#practiceV2NextBtn"),
  practiceV2EndBtn: document.querySelector("#practiceV2EndBtn"),
  practiceV2UndoBtn: document.querySelector("#practiceV2UndoBtn"),
  practiceV2RestartBtn: document.querySelector("#practiceV2RestartBtn"),
  practiceV2SessionUndoBtn: document.querySelector("#practiceV2SessionUndoBtn"),
  problemDialog: document.querySelector("#problemDialog"),
  problemForm: document.querySelector("#problemForm"),
  problemId: document.querySelector("#problemId"),
  problemRows: document.querySelector("#problemRows"),
  problemsPanel: document.querySelector("#problemsPanel"),
  qaTools: document.querySelector("#qaTools"),
  resultCount: document.querySelector("#resultCount"),
  resetQaBtn: document.querySelector("#resetQaBtn"),
  recoveryCount: document.querySelector("#recoveryCount"),
  recoveryList: document.querySelector("#recoveryList"),
  recoveryPanel: document.querySelector("#recoveryPanel"),
  recoverySummary: document.querySelector("#recoverySummary"),
  reviewAttemptState: document.querySelector("#reviewAttemptState"),
  reviewCard: document.querySelector("#reviewCard"),
  reviewInput: document.querySelector("#reviewInput"),
  reviewField: document.querySelector("#reviewField"),
  reviewInputLabel: document.querySelector("#reviewInputLabel"),
  reviewMeta: document.querySelector("#reviewMeta"),
  reviewOpenLink: document.querySelector("#reviewOpenLink"),
  reviewReason: document.querySelector("#reviewReason"),
  reviewRecoveryBtn: document.querySelector("#reviewRecoveryBtn"),
  reviewStartAttemptBtn: document.querySelector("#reviewStartAttemptBtn"),
  reviewSummaryStats: document.querySelector("#reviewSummaryStats"),
  reviewSummary: document.querySelector("#reviewSummary"),
  reviewSummaryHint: document.querySelector("#reviewSummaryHint"),
  reviewSummaryLabel: document.querySelector("#reviewSummaryLabel"),
  reviewTitle: document.querySelector("#reviewTitle"),
  recentGradeChart: document.querySelector("#recentGradeChart"),
  recentGradeEmpty: document.querySelector("#recentGradeEmpty"),
  masteryBlockers: document.querySelector("#masteryBlockers"),
  savePostGradeNoteBtn: document.querySelector("#savePostGradeNoteBtn"),
  saveLeaderboardOnlyProfileBtn: document.querySelector("#saveLeaderboardOnlyProfileBtn"),
  saveLeaderboardProfileBtn: document.querySelector("#saveLeaderboardProfileBtn"),
  saveStatus: document.querySelector("#saveStatus"),
  searchInput: document.querySelector("#searchInput"),
  seedBlindBtn: document.querySelector("#seedBlindBtn"),
  seedNeetcodeBtn: document.querySelector("#seedNeetcodeBtn"),
  settingsNotificationNudge: document.querySelector("#settingsNotificationNudge"),
  setupImportJsonBtn: document.querySelector("#setupImportJsonBtn"),
  setupSeedBlindBtn: document.querySelector("#setupSeedBlindBtn"),
  setupSeedNeetcodeBtn: document.querySelector("#setupSeedNeetcodeBtn"),
  hostedSetup: document.querySelector("#hostedSetup"),
  habitActionBtn: document.querySelector("#habitActionBtn"),
  habitCopy: document.querySelector("#habitCopy"),
  habitRhythm: document.querySelector("#habitRhythm"),
  habitTitle: document.querySelector("#habitTitle"),
  habitToday: document.querySelector("#habitToday"),
  habitWeek: document.querySelector("#habitWeek"),
  solutionApproachInput: document.querySelector("#solutionApproachInput"),
  solutionExplanationInput: document.querySelector("#solutionExplanationInput"),
  skipNewBtn: document.querySelector("#skipNewBtn"),
  skipPostGradeNoteBtn: document.querySelector("#skipPostGradeNoteBtn"),
  skipReviewBtn: document.querySelector("#skipReviewBtn"),
  socialHandleInput: document.querySelector("#socialHandleInput"),
  sortSelect: document.querySelector("#sortSelect"),
  stageReference: document.querySelector("#stageReference"),
  stageReferenceSummary: document.querySelector("#stageReferenceSummary"),
  stageSortBtn: document.querySelector("#stageSortBtn"),
  evidenceChart: document.querySelector("#evidenceChart"),
  statusFilter: document.querySelector("#statusFilter"),
  statusField: document.querySelector("#statusField"),
  statusFilterLabel: document.querySelector("#statusFilterLabel"),
  statusInput: document.querySelector("#statusInput"),
  titleInput: document.querySelector("#titleInput"),
  todayPanel: document.querySelector("#todayPanel"),
  todaySummary: document.querySelector("#todaySummary"),
  topicFilter: document.querySelector("#topicFilter"),
  topicInput: document.querySelector("#topicInput"),
  timeComplexityInput: document.querySelector("#timeComplexityInput"),
  testNotificationBtn: document.querySelector("#testNotificationBtn"),
  themeStatus: document.querySelector("#themeStatus"),
  disableNotificationsBtn: document.querySelector("#disableNotificationsBtn"),
  undoGradeBtn: document.querySelector("#undoGradeBtn"),
  urlInput: document.querySelector("#urlInput"),
  viewAllTopicsBtn: document.querySelector("#viewAllTopicsBtn"),
  weeklySolved: document.querySelector("#weeklySolved"),
  spaceComplexityInput: document.querySelector("#spaceComplexityInput"),
  listFilterLabel: document.querySelector("#listFilterLabel"),
  legacyProblemTableHead: document.querySelector("#legacyProblemTableHead"),
  practiceV2ProblemTableHead: document.querySelector("#practiceV2ProblemTableHead"),
};
const routeLinks = document.querySelectorAll("[data-route]");
const dialogTabButtons = document.querySelectorAll("[data-dialog-tab]");
const dialogTabPanels = document.querySelectorAll("[data-dialog-panel]");
const tableSortButtons = document.querySelectorAll("[data-table-sort]");
const tableSortHeaders = document.querySelectorAll("[data-sort-column]");
const themeModeInputs = document.querySelectorAll("input[name='themeMode']");

let problems = [];
let importMeta = null;
let sessions = [];
let recoveryProblemIds = [];
let algorithmVersion = STATE_V4?.ALGORITHM_VERSION || "readiness-v1";
let trainingProfile = cloneState(STATE_V4?.DEFAULT_TRAINING_PROFILE || {});
let practicePlan = cloneState(STATE_V4?.DEFAULT_PRACTICE_PLAN || {});
let trackerStateExtras = {};
let dailyPicks = { review: null, newProblem: null };
let skippedDailyPicks = { review: new Set(), new: new Set() };
let lastServerSavedAt = "";
let currentRevision = 0;
let remoteStateRefreshInFlight = false;
let lastRemoteStateRefreshAt = 0;
let appEnv = { env: "prod", isQa: false, authRequired: false, storageMode: "local", features: { ...DEFAULT_FEATURES } };
let currentUser = null;
let isHostedAllowed = true;
let diagnosticsTopicFilter = "";
let pendingNoteProblemId = "";
let pendingNoteHistoryEntryId = "";
let pendingAttemptContext = "";
let coldPracticeProblemId = "";
let activeAttempt = null;
let coldGradeDraft = null;
let lastGradeUndo = null;
let practiceV2Runtime = PRACTICE_V2_WORKFLOW?.createRuntime() || null;
let currentNewSourceId = els.newSourceSelect.value || "blind75";
let tableSort = { column: "nextReview", direction: "asc" };
let leaderboardProfile = {
  displayName: "",
  handle: "",
  optedIn: false,
  leaderboardOptedIn: false,
  pactsOptedIn: false,
  timezone: "America/New_York",
};
let leaderboardData = { rows: [], weekStart: "", today: "" };
let friendPulseData = {
  profile: leaderboardProfile,
  currentUser: { completedToday: false, pactsOptedIn: false },
  incoming: [],
  outgoing: [],
  pacts: [],
  incomingCount: 0,
};
let friendSearchNonce = 0;
let leaderboardViewMode = "weekly";
let pendingLeetcodeImportRows = [];
let pendingLeetcodeImportPlan = null;
let pendingLeetcodeImportStages = {};
let pendingLeetcodeImportExcluded = new Set();
let leaderboardSort = {
  weekly: { column: "practiceDays", direction: "desc" },
  readiness: { column: "independentSkills", direction: "desc" },
};
let notificationConfig = { available: false, configured: false, vapidPublicKey: "", settings: null, reason: "" };
let currentPushSubscription = null;
const themeMedia = window.matchMedia?.("(prefers-color-scheme: dark)");

applyThemePreference(loadThemePreference());

els.addProblemBtn.addEventListener("click", () => openDialog());
els.addBackfillBtn.addEventListener("click", addBackfillAttempt);
els.applyLeetcodeImportBtn?.addEventListener("click", applyLeetcodeProgressImport);
els.cancelBtn.addEventListener("click", () => els.problemDialog.close());
els.cancelLeetcodeImportBtn?.addEventListener("click", () => els.leetcodeImportDialog?.close());
els.closeAttentionDialogBtn.addEventListener("click", () => els.attentionDialog.close());
els.closeLeetcodeImportDialogBtn?.addEventListener("click", () => els.leetcodeImportDialog?.close());
els.clearFilterBtn.addEventListener("click", clearDiagnosticsTopicFilter);
els.closeDialogBtn.addEventListener("click", () => els.problemDialog.close());
els.csvImportInput.addEventListener("change", importCsv);
els.deleteBtn.addEventListener("click", deleteCurrentProblem);
els.disableNotificationsBtn?.addEventListener("click", disableNotifications);
els.enableNotificationsBtn?.addEventListener("click", enableNotifications);
els.exportBtn.addEventListener("click", exportJson);
els.historyList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-delete-history-key]");
  if (button) deleteHistoryEntry(button.dataset.deleteHistoryKey);
});
els.habitActionBtn?.addEventListener("click", startMinimumPractice);
els.jsonImportInput.addEventListener("change", importJson);
els.leetcodeImportPreview?.addEventListener("click", handleLeetcodeImportPreviewClick);
els.leetcodeImportPreview?.addEventListener("change", handleLeetcodeImportPreviewChange);
els.notificationSettingsBtn?.addEventListener("click", openNotificationSettings);
els.leaderboardHead?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-leaderboard-sort]");
  if (button) sortLeaderboard(button.dataset.leaderboardSort);
});
els.leaderboardDisplayNameInput?.addEventListener("input", () => {
  if (els.pactDisplayNameInput) els.pactDisplayNameInput.value = els.leaderboardDisplayNameInput.value;
  markLeaderboardProfileDirty();
});
els.leaderboardOptInInput?.addEventListener("input", markLeaderboardProfileDirty);
els.leaderboardSortSelect?.addEventListener("change", () => {
  leaderboardSort[leaderboardViewMode] = {
    column: els.leaderboardSortSelect.value,
    direction: "desc",
  };
  renderLeaderboard();
});
els.leetcodeImportReviewBtn?.addEventListener("click", openLeetcodeImportReview);
els.pactDisplayNameInput?.addEventListener("input", () => {
  if (els.leaderboardDisplayNameInput) els.leaderboardDisplayNameInput.value = els.pactDisplayNameInput.value;
  markLeaderboardProfileDirty();
});
els.pactsOptInInput?.addEventListener("input", markLeaderboardProfileDirty);
els.socialHandleInput?.addEventListener("input", markLeaderboardProfileDirty);
els.saveLeaderboardProfileBtn?.addEventListener("click", saveLeaderboardProfile);
els.saveLeaderboardOnlyProfileBtn?.addEventListener("click", saveLeaderboardProfile);
els.friendPulseManageBtn?.addEventListener("click", () => navigateToRoute("pacts"));
els.friendSearchBtn?.addEventListener("click", searchFriendPact);
els.friendSearchInput?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    searchFriendPact();
  }
});
els.friendSearchInput?.addEventListener("input", () => {
  friendSearchNonce += 1;
  if (els.friendSearchResult) els.friendSearchResult.innerHTML = "";
});
els.friendIncomingList?.addEventListener("click", handleFriendPulseAction);
els.friendOutgoingSummary?.addEventListener("click", handleFriendPulseAction);
els.friendPactList?.addEventListener("click", handleFriendPulseAction);
els.friendSearchResult?.addEventListener("click", handleFriendPulseAction);
els.logoutBtn?.addEventListener("click", logout);
els.logoutDeniedBtn?.addEventListener("click", logout);
els.newSourceSelect.addEventListener("input", () => {
  const nextSourceId = getSelectedStudyListId();
  if (activeAttempt?.type === "new") {
    const activeProblem = dailyPicks.newProblem;
    const shouldSwitch = !activeProblem || window.confirm(
      `You started ${activeProblem.title}. Change the new-problem source and leave that attempt?`,
    );
    if (!shouldSwitch) {
      els.newSourceSelect.value = currentNewSourceId;
      return;
    }
    activeAttempt = null;
    persistColdWorkflowSession();
  }
  currentNewSourceId = nextSourceId;
  skippedDailyPicks.new = new Set();
  renderDailyPicks();
});
[
  els.postGradeDraftGradeInput,
  els.postGradeDurationInput,
  els.postGradeResultInput,
  els.postGradeAssistanceInput,
  els.postGradeBlockerInput,
  els.postGradeColdScoreInput,
  els.postGradeNotesInput,
  els.postGradeComplexityInput,
].forEach((control) => control?.addEventListener("input", handleColdDraftInput));
els.postGradeTags?.addEventListener("input", captureColdDraftForm);
els.problemForm.addEventListener("submit", saveProblem);
els.resetQaBtn.addEventListener("click", resetQaData);
els.recoveryList?.addEventListener("click", (event) => {
  const removeButton = event.target.closest("[data-recovery-remove]");
  if (removeButton) removeFromRecoveryLane(removeButton.dataset.recoveryRemove);
});
els.reviewRecoveryBtn?.addEventListener("click", () => addToRecoveryLane(dailyPicks.review?.id));
els.reviewStartAttemptBtn?.addEventListener("click", () => startAttempt("review"));
els.seedBlindBtn.addEventListener("click", seedBlind75);
els.seedNeetcodeBtn.addEventListener("click", seedNeetcode150);
els.setupImportJsonBtn?.addEventListener("click", () => els.jsonImportInput.click());
els.setupSeedBlindBtn?.addEventListener("click", seedBlind75);
els.setupSeedNeetcodeBtn?.addEventListener("click", seedNeetcode150);
els.savePostGradeNoteBtn.addEventListener("click", savePostGradeNote);
els.skipNewBtn.addEventListener("click", () => skipDailyPick("new"));
els.skipPostGradeNoteBtn.addEventListener("click", clearPostGradeNote);
els.skipReviewBtn.addEventListener("click", () => skipDailyPick("review"));
els.newStartAttemptBtn?.addEventListener("click", () => startAttempt("new"));
els.undoGradeBtn.addEventListener("click", handlePostGradeUndo);
els.practiceV2BeginBtn?.addEventListener("click", beginPracticeV2Rep);
els.practiceV2ChangeBtn?.addEventListener("click", chooseAnotherPracticeV2Rep);
els.practiceV2FinishBtn?.addEventListener("click", () => movePracticeV2("finish"));
els.practiceV2CancelBtn?.addEventListener("click", () => movePracticeV2("cancel"));
els.practiceV2BackAttemptBtn?.addEventListener("click", () => movePracticeV2("back"));
els.practiceV2ContinueGradeBtn?.addEventListener("click", continuePracticeV2Grade);
els.practiceV2BackGradeBtn?.addEventListener("click", () => movePracticeV2("back"));
els.practiceV2ReflectionForm?.addEventListener("submit", savePracticeV2Rep);
els.practiceV2NextBtn?.addEventListener("click", getNextPracticeV2Rep);
els.practiceV2EndBtn?.addEventListener("click", () => movePracticeV2("end"));
els.practiceV2UndoBtn?.addEventListener("click", undoPracticeV2Rep);
els.practiceV2RestartBtn?.addEventListener("click", getNextPracticeV2Rep);
els.practiceV2SessionUndoBtn?.addEventListener("click", undoPracticeV2Rep);
els.practiceV2Capacity?.addEventListener("change", changePracticeV2Capacity);
els.practiceV2TimeUntracked?.addEventListener("change", capturePracticeV2Reflection);
[
  els.practiceV2Elapsed,
  els.practiceV2Assistance,
  els.practiceV2Blocker,
  els.practiceV2Friction,
  els.practiceV2Note,
  els.practiceV2Complexity,
].forEach((control) => control?.addEventListener("input", capturePracticeV2Reflection));
document.querySelectorAll("[data-v2-grade]").forEach((button) => {
  button.addEventListener("click", () => selectPracticeV2Grade(button.dataset.v2Grade));
});
els.viewAllTopicsBtn.addEventListener("click", openAttentionDialog);
document.querySelectorAll("[data-leaderboard-view]").forEach((button) => {
  button.addEventListener("click", () => {
    leaderboardViewMode = button.dataset.leaderboardView;
    renderLeaderboard();
  });
});
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
window.addEventListener("message", handleLeetcodeExtensionMessage);
window.addEventListener("focus", refreshHostedStateIfIdle);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") refreshHostedStateIfIdle();
});

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
].forEach((control) => control.addEventListener("input", render));
els.sortSelect.addEventListener("input", () => {
  tableSort = sortSelectValueToTableSort(els.sortSelect.value);
  render();
});
tableSortButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const column = button.dataset.tableSort;
    tableSort = {
      column,
      direction: tableSort.column === column && tableSort.direction === "asc" ? "desc" : "asc",
    };
    syncSortSelect();
    render();
  });
});
els.topicFilter.addEventListener("input", () => {
  if (els.topicFilter.value !== diagnosticsTopicFilter) diagnosticsTopicFilter = "";
});
els.testNotificationBtn?.addEventListener("click", sendTestNotification);
els.notificationTimeInput?.addEventListener("change", saveNotificationSettings);
themeModeInputs.forEach((input) => {
  input.addEventListener("change", () => {
    if (input.checked) setThemePreference(input.value);
  });
});
els.leaderboardTabToggle?.addEventListener("change", () => {
  setLeaderboardTabPreference(Boolean(els.leaderboardTabToggle.checked));
});
const handleSystemThemeChange = () => {
  if (loadThemePreference() === "system") applyThemePreference("system");
};
if (themeMedia?.addEventListener) {
  themeMedia.addEventListener("change", handleSystemThemeChange);
} else if (themeMedia?.addListener) {
  themeMedia.addListener(handleSystemThemeChange);
}

initApp();

function loadThemePreference() {
  try {
    const value = localStorage.getItem(THEME_KEY);
    return ["system", "light", "dark"].includes(value) ? value : "system";
  } catch {
    return "system";
  }
}

function setThemePreference(mode) {
  const nextMode = ["system", "light", "dark"].includes(mode) ? mode : "system";
  try {
    localStorage.setItem(THEME_KEY, nextMode);
  } catch {
    // Theme is a browser preference only; if storage is unavailable, still apply it for this page.
  }
  applyThemePreference(nextMode);
}

function applyThemePreference(mode) {
  const preference = ["system", "light", "dark"].includes(mode) ? mode : "system";
  const resolvedTheme = preference === "system" ? (themeMedia?.matches ? "dark" : "light") : preference;
  document.documentElement.dataset.themePreference = preference;
  document.documentElement.dataset.theme = resolvedTheme;
  document.documentElement.style.colorScheme = resolvedTheme;

  const metaTheme = document.querySelector("meta[name='theme-color']");
  if (metaTheme) metaTheme.setAttribute("content", resolvedTheme === "dark" ? "#0c1110" : "#f7f8f6");

  themeModeInputs.forEach((input) => {
    input.checked = input.value === preference;
  });

  if (els.themeStatus) {
    const labels = {
      system: `Following your system setting (${resolvedTheme}).`,
      light: "Light mode selected.",
      dark: "Dark mode selected.",
    };
    els.themeStatus.textContent = labels[preference];
  }
}

function loadLeaderboardTabPreference() {
  try {
    return localStorage.getItem(LEADERBOARD_TAB_KEY) === "true";
  } catch {
    return false;
  }
}

function setLeaderboardTabPreference(showTab) {
  try {
    localStorage.setItem(LEADERBOARD_TAB_KEY, showTab ? "true" : "false");
  } catch {
    // This is a local navigation preference only.
  }
  syncLeaderboardTabPreference();
  renderAuthState({ authRequired: appEnv.authRequired, authenticated: true, allowed: isHostedAllowed, user: currentUser });
  renderAppRoute();
}

function syncLeaderboardTabPreference() {
  const showTab = loadLeaderboardTabPreference();
  if (els.leaderboardTabToggle) {
    els.leaderboardTabToggle.checked = showTab;
    els.leaderboardTabToggle.disabled = !canUseLeaderboard();
  }
  if (els.leaderboardTabStatus) {
    els.leaderboardTabStatus.textContent = !canUseLeaderboard()
      ? "Leaderboard is available in hosted and QA mode."
      : showTab
        ? "Leaderboard is visible in navigation."
        : "Leaderboard is hidden from navigation. Your opt-in setting is unchanged.";
  }
}

function canShowLeaderboardTab() {
  return canUseLeaderboard() && loadLeaderboardTabPreference();
}

async function initApp() {
  setSaveStatus("loading", "Loading saved data...");
  appEnv = await loadAppEnv();
  const sessionInfo = await loadSessionInfo();
  currentUser = sessionInfo.user || null;
  isHostedAllowed = !appEnv.authRequired || Boolean(sessionInfo.allowed);
  renderAuthState(sessionInfo);
  if (appEnv.authRequired && (!sessionInfo.authenticated || !sessionInfo.allowed)) return;
  await loadLeaderboardProfile();
  if (canUseFriendPulse()) await loadFriendPulseData();
  if (canUsePhoneReminders()) await loadNotificationConfig();

  renderQaTools();
  renderDataManagementInfo();
  syncLeaderboardTabPreference();
  const localProblems = appEnv.authRequired ? [] : loadProblemsFromStorage();
  const localImportMeta = appEnv.authRequired ? null : loadJson(IMPORT_META_KEY, null);
  const localSessions = appEnv.authRequired ? [] : loadJson(SESSION_KEY, []);
  const localRecoveryProblemIds = appEnv.authRequired ? [] : loadJson(RECOVERY_LANE_KEY, []);
  const remoteState = await loadRemoteState();

  const hasRemoteData =
    remoteState &&
    (
      remoteState.savedAt ||
      remoteState.importMeta ||
      remoteState.problems?.length > 0 ||
      remoteState.sessions?.length > 0 ||
      remoteState.practicePlan?.onboardingComplete
    );

  if (hasRemoteData) {
    applyRemoteState(remoteState);
    setSaveStatus("saved", buildSavedMessage(lastServerSavedAt));
  } else {
    problems = localProblems;
    importMeta = localImportMeta;
    sessions = Array.isArray(localSessions) ? localSessions : [];
    recoveryProblemIds = normalizeRecoveryProblemIds(localRecoveryProblemIds);
    if (appEnv.authRequired) {
      setSaveStatus("saved", "Ready to save to your cloud account.");
    } else if (problems.length > 0 || importMeta || sessions.length > 0) {
      setSaveStatus("saving", "Migrating browser data to local file...");
      persist();
    } else {
      setSaveStatus("saved", "Ready to save to local file.");
    }
  }

  restoreColdWorkflowSession();
  restorePracticeV2Runtime();
  render();
  renderAppRoute();
}

function applyRemoteState(state) {
  const migrated = migrateTrackerState(state);
  problems = cloneState(migrated.problems);
  importMeta = cloneState(migrated.importMeta);
  sessions = cloneState(migrated.sessions);
  recoveryProblemIds = normalizeRecoveryProblemIds(migrated.recoveryProblemIds);
  algorithmVersion = migrated.algorithmVersion;
  trainingProfile = cloneState(migrated.trainingProfile);
  practicePlan = cloneState(migrated.practicePlan);
  trackerStateExtras = extractTrackerStateExtras(migrated);
  lastServerSavedAt = migrated.savedAt || "";
  currentRevision = Number(migrated.revision || 0);
}

function migrateTrackerState(state) {
  if (!STATE_V4) throw new Error("Tracker state migration module is unavailable");
  return STATE_V4.migrateStateToV4(state, { timezone: browserTimezone() });
}

function browserTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York";
  } catch {
    return "America/New_York";
  }
}

function extractTrackerStateExtras(state) {
  const coreKeys = new Set([
    "version",
    "savedAt",
    "revision",
    "importMeta",
    "problems",
    "sessions",
    "recoveryProblemIds",
    "algorithmVersion",
    "trainingProfile",
    "practicePlan",
    "exportedAt",
  ]);
  return Object.fromEntries(
    Object.entries(state || {})
      .filter(([key]) => !coreKeys.has(key))
      .map(([key, value]) => [key, cloneState(value)]),
  );
}

function buildTrackerStatePayload(overrides = {}) {
  return migrateTrackerState({
    ...trackerStateExtras,
    version: EXPORT_VERSION,
    savedAt: overrides.savedAt ?? lastServerSavedAt ?? null,
    revision: overrides.revision ?? currentRevision,
    importMeta,
    problems,
    sessions,
    recoveryProblemIds,
    algorithmVersion,
    trainingProfile,
    practicePlan,
    ...overrides,
  });
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

function coldWorkflowOwner() {
  return currentUser?.id || currentUser?.email || (appEnv.isQa ? "qa" : "local");
}

function persistColdWorkflowSession() {
  try {
    sessionStorage.setItem(COLD_WORKFLOW_SESSION_KEY, JSON.stringify({
      owner: coldWorkflowOwner(),
      selectedProblemId: coldPracticeProblemId || "",
      activeAttempt: activeAttempt || null,
      draft: coldGradeDraft || null,
      newSourceId: getSelectedStudyListId(),
    }));
  } catch {
    // Cold-check progress is session convenience; tracker data remains the source of truth.
  }
}

function restoreColdWorkflowSession() {
  let saved = null;
  try {
    saved = JSON.parse(sessionStorage.getItem(COLD_WORKFLOW_SESSION_KEY) || "null");
  } catch {
    saved = null;
  }

  if (!saved || saved.owner !== coldWorkflowOwner()) {
    clearColdWorkflowSession();
    return;
  }

  const selected = problems.find((problem) => problem.id === saved.selectedProblemId && isSeenUnverified(problem));
  coldPracticeProblemId = selected?.id || "";

  if (STUDY_LISTS[saved.newSourceId]) {
    els.newSourceSelect.value = saved.newSourceId;
    currentNewSourceId = saved.newSourceId;
  }

  const savedActive = saved.activeAttempt;
  const activeProblem = savedActive?.problemId
    ? problems.find((problem) => problem.id === savedActive.problemId)
    : null;
  const canRestorePlannedNew = savedActive?.type === "new" && String(savedActive.problemId || "").startsWith("planned-");
  activeAttempt = (activeProblem || canRestorePlannedNew) && ["review", "new", "cold"].includes(savedActive.type)
    ? {
        type: savedActive.type,
        problemId: activeProblem?.id || savedActive.problemId,
        title: activeProblem?.title || savedActive.title || "",
      }
    : null;

  const savedDraft = saved.draft;
  const draftProblem = savedDraft?.problemId
    ? problems.find((problem) => problem.id === savedDraft.problemId && isSeenUnverified(problem))
    : null;
  coldGradeDraft = draftProblem && isProperGrade(savedDraft.grade)
    ? {
        problemId: draftProblem.id,
        grade: savedDraft.grade,
        durationMinutes: savedDraft.durationMinutes || "",
        result: savedDraft.result || "",
        assistance: savedDraft.assistance || "",
        blocker: savedDraft.blocker || "",
        coldScore: savedDraft.coldScore ?? "",
        note: savedDraft.note || "",
        tags: Array.isArray(savedDraft.tags) ? savedDraft.tags.filter((tag) => LEARNING_SIGNAL_KEYS.includes(tag)) : [],
        complexityKnown: Boolean(savedDraft.complexityKnown),
      }
    : null;

  if (coldGradeDraft) {
    coldPracticeProblemId = coldGradeDraft.problemId;
    activeAttempt = { type: "cold", problemId: coldGradeDraft.problemId, title: draftProblem.title };
  }
  persistColdWorkflowSession();
}

function clearColdWorkflowSession() {
  coldPracticeProblemId = "";
  activeAttempt = null;
  coldGradeDraft = null;
  try {
    sessionStorage.removeItem(COLD_WORKFLOW_SESSION_KEY);
  } catch {
    // Nothing else to clear.
  }
}

function persist() {
  if (!appEnv.authRequired) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(problems));
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessions));
    localStorage.setItem(RECOVERY_LANE_KEY, JSON.stringify(recoveryProblemIds));
    if (importMeta) localStorage.setItem(IMPORT_META_KEY, JSON.stringify(importMeta));
  }
  saveRemoteState();
}

function persistImportMeta() {
  if (!appEnv.authRequired) localStorage.setItem(IMPORT_META_KEY, JSON.stringify(importMeta));
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

async function refreshHostedStateIfIdle() {
  if (!appEnv.authRequired || !isHostedAllowed || remoteStateRefreshInFlight) return;
  if (Date.now() - lastRemoteStateRefreshAt < 1000) return;

  const practiceV2Phase = practiceV2Runtime?.phase || "ready";
  const hasUnfinishedWork = ["attempting", "grading", "reflecting", "saving"].includes(practiceV2Phase)
    || Boolean(activeAttempt)
    || Boolean(coldGradeDraft)
    || Boolean(els.problemDialog?.open)
    || Boolean(els.leetcodeImportDialog?.open);
  if (hasUnfinishedWork) return;

  remoteStateRefreshInFlight = true;
  lastRemoteStateRefreshAt = Date.now();
  try {
    const remoteState = await loadRemoteState();
    const remoteRevision = Number(remoteState?.revision || 0);
    if (!remoteState || remoteRevision <= currentRevision) return;

    applyRemoteState(remoteState);
    reconcilePracticeV2RuntimeRevision();
    setSaveStatus("saved", buildSavedMessage(lastServerSavedAt));
    render();
  } finally {
    remoteStateRefreshInFlight = false;
  }
}

async function loadAppEnv() {
  try {
    const response = await fetch(API_ENV_URL, { cache: "no-store" });
    if (!response.ok) throw new Error("Environment unavailable");
    return normalizeAppEnv(await response.json());
  } catch {
    return normalizeAppEnv({ env: "prod", isQa: false });
  }
}

function normalizeAppEnv(env) {
  return {
    env: env?.env || "prod",
    isQa: Boolean(env?.isQa),
    authRequired: Boolean(env?.authRequired),
    storageMode: env?.storageMode || "local",
    features: {
      ...DEFAULT_FEATURES,
      ...(env?.features || {}),
    },
  };
}

function isFeatureEnabled(feature) {
  return Boolean(appEnv.features?.[feature]);
}

function canUseFriendPulse() {
  return isFeatureEnabled("friendPulse") && canUseLeaderboard();
}

function canUseLeetcodeImport() {
  return isFeatureEnabled("leetcodeImport");
}

function canUsePhoneReminders() {
  return isFeatureEnabled("phoneReminders");
}

function canUseRecoveryLane() {
  return isFeatureEnabled("recoveryLane");
}

async function loadSessionInfo() {
  if (!appEnv.authRequired) return { authRequired: false, authenticated: true, allowed: true, user: null };

  try {
    const response = await fetch("/api/me", { cache: "no-store" });
    if (!response.ok) throw new Error("Session unavailable");
    return await response.json();
  } catch {
    return { authRequired: true, authenticated: false, allowed: false, user: null };
  }
}

function renderAuthState(sessionInfo) {
  const needsLogin = appEnv.authRequired && !sessionInfo.authenticated;
  const denied = appEnv.authRequired && sessionInfo.authenticated && !sessionInfo.allowed;
  const showApp = !needsLogin && !denied;

  els.authView.hidden = !needsLogin;
  els.notInvitedView.hidden = !denied;
  els.appTopbar.hidden = !showApp;
  if (els.appStatusStrip) els.appStatusStrip.hidden = !showApp;
  els.hostedSetup.hidden = true;
  els.dashboardView.hidden = !showApp;
  if (els.libraryView) els.libraryView.hidden = true;
  els.diagnosticsView.hidden = true;
  if (els.leaderboardView) els.leaderboardView.hidden = true;
  if (els.pactsView) els.pactsView.hidden = true;
  els.dataManagementView.hidden = true;

  if (denied) {
    const email = sessionInfo.user?.email || "this Google account";
    els.notInvitedCopy.textContent = `You signed in as ${email}, but this email is not invited yet.`;
  }

  if (els.accountMenu) {
    els.accountMenu.hidden = !appEnv.authRequired || !sessionInfo.user;
    els.accountLabel.textContent = sessionInfo.user?.email || "";
  }
  if (els.leaderboardNavLink) els.leaderboardNavLink.hidden = !canShowLeaderboardTab() || !showApp;
  if (els.pactsNavLink) els.pactsNavLink.hidden = !canUseFriendPulse() || !showApp;
}

async function logout() {
  if (!appEnv.authRequired) return;
  try {
    await fetch("/auth/logout", { method: "POST" });
  } finally {
    window.location.href = "/index.html";
  }
}

function renderQaTools() {
  const showQa = appEnv.isQa && !appEnv.authRequired;
  if (els.qaTools) els.qaTools.hidden = !showQa;
  if (els.dashboardQaTools) els.dashboardQaTools.hidden = !showQa;
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
    clearColdWorkflowSession();
    clearPracticeV2Runtime();
    setSaveStatus("saved", buildSavedMessage(lastServerSavedAt));
    render();
  } catch {
    setSaveStatus("warning", "QA reset failed. Check the local server.");
  }
}

function saveRemoteState() {
  const payload = buildTrackerStatePayload({
    savedAt: new Date().toISOString(),
    revision: currentRevision,
  });

  setSaveStatus("saving", appEnv.authRequired ? "Saving to your cloud account..." : "Saving to local file...");
  fetch(API_STATE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
    .then((response) => {
      if (response.status === 409) {
        const error = new Error("conflict");
        error.isConflict = true;
        throw error;
      }
      if (!response.ok) throw new Error("Save failed");
      return response.json();
    })
    .then((result) => {
      lastServerSavedAt = result.savedAt || new Date().toISOString();
      currentRevision = Number(result.revision || currentRevision);
      setSaveStatus("saved", buildSavedMessage(lastServerSavedAt));
      if (canUseFriendPulse()) loadFriendPulseData().then(renderFriendPulse);
    })
    .catch((error) => {
      if (error.isConflict) {
        setSaveStatus("warning", "Cloud save conflict. Another tab or device saved newer data. Export if needed, then reload.");
        return;
      }
      setSaveStatus(
        "warning",
        appEnv.authRequired ? "Cloud save failed. Your account was not updated." : "Local file save failed. Browser fallback updated.",
      );
      console.warn("Could not save tracker data to the server.");
    });
}

function setSaveStatus(status, message) {
  if (!els.saveStatus) return;
  els.saveStatus.dataset.status = status;
  els.saveStatus.textContent = message;
}

function buildSavedMessage(savedAt) {
  const target = appEnv.authRequired ? "your cloud account" : "local file";
  return savedAt ? `Saved to ${target} - last saved ${formatDateTime(savedAt)}` : `Saved to ${target}.`;
}

function navigateToRoute(route) {
  let targetRoute = route;
  if (route === "pacts" && !canUseFriendPulse()) targetRoute = "dashboard";
  if (route === "leaderboard" && !canShowLeaderboardTab()) targetRoute = "dashboard";
  const paths = {
    dashboard: "/index.html",
    library: "/library",
    diagnostics: "/memory",
    leaderboard: "/leaderboard",
    pacts: "/pacts",
    data: "/settings",
  };
  const path = paths[targetRoute] || paths.dashboard;
  if (window.location.pathname !== path) window.history.pushState({}, "", path);
  renderAppRoute();
}

function getCurrentRoute() {
  if (window.location.pathname === "/leaderboard") return canShowLeaderboardTab() ? "leaderboard" : "dashboard";
  if (window.location.pathname === "/pacts") return canUseFriendPulse() ? "pacts" : "dashboard";
  if (window.location.pathname === "/library") return "library";
  if (window.location.pathname === "/diagnostics" || window.location.pathname === "/memory") return "diagnostics";
  return window.location.pathname === "/data-management" || window.location.pathname === "/settings" ? "data" : "dashboard";
}

function renderAppRoute() {
  if (appEnv.authRequired && !isHostedAllowed) return;
  if (window.location.pathname === "/leaderboard" && !canShowLeaderboardTab()) {
    window.history.replaceState({}, "", "/index.html");
  }
  if (window.location.pathname === "/pacts" && !canUseFriendPulse()) {
    window.history.replaceState({}, "", "/index.html");
  }
  const route = getCurrentRoute();
  const isLibraryRoute = route === "library";
  const isDataRoute = route === "data";
  const isDiagnosticsRoute = route === "diagnostics";
  const isLeaderboardRoute = route === "leaderboard";
  const isPactsRoute = route === "pacts";

  els.dashboardView.hidden = isLibraryRoute || isDataRoute || isDiagnosticsRoute || isLeaderboardRoute || isPactsRoute;
  if (els.libraryView) els.libraryView.hidden = !isLibraryRoute;
  els.diagnosticsView.hidden = !isDiagnosticsRoute;
  if (els.leaderboardView) els.leaderboardView.hidden = !isLeaderboardRoute;
  if (els.pactsView) els.pactsView.hidden = !isPactsRoute;
  els.dataManagementView.hidden = !isDataRoute;
  els.addProblemBtn.classList.toggle("is-invisible", isDataRoute);
  els.addProblemBtn.setAttribute("aria-hidden", isDataRoute ? "true" : "false");
  els.addProblemBtn.tabIndex = isDataRoute ? -1 : 0;

  if (isLeaderboardRoute || isPactsRoute) {
    const loaders = [loadLeaderboardData()];
    if (canUseFriendPulse()) loaders.push(loadFriendPulseData());
    Promise.all(loaders).then(() => {
      renderLeaderboard();
      renderFriendPulse();
      renderFriendPactManager();
    });
  }

  let activeRouteLink = null;
  routeLinks.forEach((link) => {
    const isActive = link.dataset.route === route;
    link.classList.toggle("active", isActive);
    if (isActive) {
      link.setAttribute("aria-current", "page");
      activeRouteLink = link;
    } else {
      link.removeAttribute("aria-current");
    }
  });
  if (activeRouteLink) {
    requestAnimationFrame(() => {
      activeRouteLink.scrollIntoView({ block: "nearest", inline: "center" });
    });
  }
  if (route === "dashboard") {
    if (coldGradeDraft) resumeColdGradeDraft();
    else resumePendingColdBenchmark();
  }
}

function renderDataManagementInfo() {
  if (els.dataEnvLabel) els.dataEnvLabel.textContent = appEnv.authRequired ? "Private beta cloud" : appEnv.isQa ? "QA" : "Production";
  if (els.dataStateFile) {
    els.dataStateFile.textContent = appEnv.authRequired
      ? "Your Google account"
      : appEnv.isQa
        ? "data/qa-tracker-state.json"
        : "data/tracker-state.json";
  }
  if (els.dataBackupDir) {
    els.dataBackupDir.textContent = appEnv.authRequired
      ? "Cloud rolling backups"
      : appEnv.isQa
        ? "data/qa-backups/"
        : "data/backups/";
  }
  renderLeetcodeImportControls();
}

function renderLeetcodeImportControls() {
  if (els.leetcodeImportCard) els.leetcodeImportCard.hidden = !canUseLeetcodeImport();
}

async function loadLeaderboardProfile() {
  if (!canUseLeaderboard()) return;

  try {
    const response = await fetch(API_SOCIAL_PROFILE_URL, { cache: "no-store" });
    if (!response.ok) throw new Error("Leaderboard profile unavailable");
    leaderboardProfile = normalizeSocialProfile(await response.json());
  } catch {
    leaderboardProfile = normalizeSocialProfile({});
  }
}

async function loadFriendPulseData() {
  if (!canUseFriendPulse()) {
    friendPulseData = {
      profile: leaderboardProfile,
      currentUser: { completedToday: false, pactsOptedIn: false },
      incoming: [],
      outgoing: [],
      pacts: [],
      incomingCount: 0,
    };
    return;
  }

  try {
    const response = await fetch(API_FRIEND_PULSE_URL, { cache: "no-store" });
    if (!response.ok) throw new Error("Friend Pulse unavailable");
    friendPulseData = await response.json();
  } catch {
    friendPulseData = {
      profile: leaderboardProfile,
      currentUser: { completedToday: false, pactsOptedIn: false },
      incoming: [],
      outgoing: [],
      pacts: [],
      incomingCount: 0,
    };
  }
}

async function loadLeaderboardData() {
  if (!canUseLeaderboard()) return;

  try {
    const response = await fetch(API_LEADERBOARD_URL, { cache: "no-store" });
    if (!response.ok) throw new Error("Leaderboard unavailable");
    leaderboardData = await response.json();
  } catch {
    leaderboardData = { rows: [], weekStart: "", today: "" };
  }
}

async function saveLeaderboardProfile() {
  if (!canUseLeaderboard()) return;
  const displayName = (
    els.leaderboardDisplayNameInput?.value ||
    els.pactDisplayNameInput?.value ||
    leaderboardProfile.displayName ||
    ""
  ).trim();
  const handle = canUseFriendPulse()
    ? normalizeClientHandle(els.socialHandleInput?.value || "")
    : leaderboardProfile.handle || "";
  const leaderboardOptedIn = Boolean(els.leaderboardOptInInput?.checked);
  const pactsOptedIn = canUseFriendPulse()
    ? Boolean(els.pactsOptInInput?.checked)
    : Boolean(leaderboardProfile.pactsOptedIn);
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York";
  const shouldValidatePactProfile = canUseFriendPulse() && pactsOptedIn;

  if ((leaderboardOptedIn || shouldValidatePactProfile) && displayName.length < 2) {
    setSocialProfileHelp("Choose a display name before opting in.");
    return;
  }

  if (shouldValidatePactProfile && !/^[a-z]{3,24}$/.test(handle)) {
    setSocialProfileHelp("Choose a handle with 3-24 letters only before enabling pacts.");
    return;
  }

  try {
    setSocialSaveButtons("Saving...", true);
    const payload = { displayName, leaderboardOptedIn, timezone };
    if (canUseFriendPulse()) {
      payload.handle = handle;
      payload.pactsOptedIn = pactsOptedIn;
    }
    const response = await fetch(API_SOCIAL_PROFILE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Profile save failed");
    leaderboardProfile = normalizeSocialProfile(result);
    setSocialProfileHelp(canUseFriendPulse()
      ? leaderboardProfile.pactsOptedIn
        ? "Daily pacts are on. Friends can see whether you showed up today."
        : "Daily pacts let people find your @handle and see whether you showed up today."
      : "Leaderboard preferences saved. Only aggregate practice stats are shared when you opt in.");
    if (els.leaderboardOptInHelp) {
      els.leaderboardOptInHelp.textContent = leaderboardProfile.leaderboardOptedIn
        ? "Leaderboard is on. Your aggregate practice stats are visible."
        : "Leaderboard is off. Your aggregate practice stats are hidden.";
    }
    setSocialSaveButtons("Saved", false);
    await loadLeaderboardData();
    if (canUseFriendPulse()) await loadFriendPulseData();
    renderLeaderboard();
    renderFriendPulse();
  } catch (error) {
    setSocialProfileHelp(error.message || "Could not save social profile. Try again.");
    setSocialSaveButtons(null, false);
  } finally {
    setSocialSaveButtonsDisabled(false);
  }
}

function markLeaderboardProfileDirty() {
  setSocialSaveButtons(null, false);
}

function setSocialSaveButtons(label, disabled) {
  [
    [els.saveLeaderboardProfileBtn, label || "Save profile"],
    [els.saveLeaderboardOnlyProfileBtn, label || "Save leaderboard"],
  ].forEach(([button, text]) => {
    if (!button) return;
    button.textContent = text;
    button.disabled = Boolean(disabled);
  });
}

function setSocialSaveButtonsDisabled(disabled) {
  [els.saveLeaderboardProfileBtn, els.saveLeaderboardOnlyProfileBtn].forEach((button) => {
    if (button) button.disabled = Boolean(disabled);
  });
}

function setSocialProfileHelp(message) {
  if (els.leaderboardProfileHelp) els.leaderboardProfileHelp.textContent = message;
  if (els.leaderboardOptInHelp) els.leaderboardOptInHelp.textContent = message;
}

function normalizeSocialProfile(profile) {
  const leaderboardOptedIn = profile.leaderboardOptedIn === undefined
    ? Boolean(profile.optedIn)
    : Boolean(profile.leaderboardOptedIn);
  return {
    displayName: profile.displayName || "",
    handle: profile.handle || "",
    optedIn: leaderboardOptedIn,
    leaderboardOptedIn,
    pactsOptedIn: Boolean(profile.pactsOptedIn),
    timezone: profile.timezone || "America/New_York",
  };
}

function normalizeClientHandle(value) {
  return String(value || "").trim().replace(/^@/, "").toLowerCase();
}

async function loadNotificationConfig() {
  try {
    const response = await fetch(API_NOTIFICATIONS_CONFIG_URL, { cache: "no-store" });
    if (!response.ok) throw new Error("Notifications unavailable");
    notificationConfig = await response.json();
  } catch {
    notificationConfig = { available: false, configured: false, vapidPublicKey: "", settings: null, reason: "Phone reminders are unavailable." };
  }
}

function renderNotificationControls() {
  if (!canUsePhoneReminders()) {
    if (els.notificationSettingsCard) els.notificationSettingsCard.hidden = true;
    if (els.notificationBanner) els.notificationBanner.hidden = true;
    if (els.settingsNotificationNudge) els.settingsNotificationNudge.hidden = true;
    return;
  }

  if (els.notificationSettingsCard) els.notificationSettingsCard.hidden = false;
  if (els.settingsNotificationNudge) {
    els.settingsNotificationNudge.hidden = notificationBannerRecentlySeen();
  }
  if (!els.notificationControls || !els.notificationSettingsBtn) return;

  const browserSupported = supportsPushNotifications();
  const canUseNotifications = Boolean(appEnv.authRequired && notificationConfig.available);
  els.notificationControls.hidden = false;

  const settings = notificationConfig.settings || {};
  if (settings.reminderTime && document.activeElement !== els.notificationTimeInput) {
    els.notificationTimeInput.value = settings.reminderTime;
  }

  const enabled = Boolean(settings.enabled && settings.subscriptionCount > 0);
  els.enableNotificationsBtn.hidden = enabled;
  els.testNotificationBtn.hidden = !enabled;
  els.disableNotificationsBtn.hidden = !enabled;
  els.notificationTimeInput.disabled = !browserSupported || !canUseNotifications || !notificationConfig.configured;
  if (els.notificationBanner) {
    els.notificationBanner.hidden = enabled || notificationBannerRecentlySeen();
  }
  if (els.settingsNotificationNudge) {
    els.settingsNotificationNudge.hidden = enabled || notificationBannerRecentlySeen();
  }

  if (!browserSupported) {
    els.notificationStatus.textContent = "This browser does not support web push reminders.";
  } else if (!canUseNotifications) {
    els.notificationStatus.textContent = "Phone reminders work from the hosted app on your phone.";
  } else if (!notificationConfig.configured) {
    els.notificationStatus.textContent = notificationConfig.reason || "Server push keys are not configured yet.";
  } else if (Notification.permission === "denied") {
    els.notificationStatus.textContent = "Notifications are blocked in this browser's settings.";
  } else if (enabled) {
    els.notificationStatus.textContent = `Reminder on at ${els.notificationTimeInput.value || settings.reminderTime}. Only sends if today is still open.`;
  } else {
    els.notificationStatus.textContent = "Enable a phone reminder for days when today's honest rep is still open.";
  }
}

function supportsPushNotifications() {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

function openNotificationSettings() {
  if (!canUsePhoneReminders()) return;
  localStorage.setItem(notificationBannerStorageKey(), new Date().toISOString());
  if (els.notificationBanner) els.notificationBanner.hidden = true;
  navigateToRoute("data");
  window.requestAnimationFrame(() => {
    els.notificationSettingsCard?.scrollIntoView({ behavior: "smooth", block: "start" });
    els.notificationTimeInput?.focus({ preventScroll: true });
  });
}

function notificationBannerRecentlySeen() {
  const value = localStorage.getItem(notificationBannerStorageKey());
  if (!value) return false;
  const seenAt = new Date(value);
  if (Number.isNaN(seenAt.getTime())) return false;
  const fourteenDays = 14 * 24 * 60 * 60 * 1000;
  return Date.now() - seenAt.getTime() < fourteenDays;
}

function notificationBannerStorageKey() {
  return `${NOTIFICATION_BANNER_KEY}.${appEnv.env || "prod"}.${appEnv.authRequired ? "hosted" : "local"}`;
}

async function enableNotifications() {
  if (!supportsPushNotifications() || !notificationConfig.configured) {
    renderNotificationControls();
    return;
  }

  els.notificationStatus.textContent = "Setting up reminders...";
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      els.notificationStatus.textContent = "Notifications were not allowed.";
      return;
    }

    const registration = await navigator.serviceWorker.register("/service-worker.js");
    const existing = await registration.pushManager.getSubscription();
    if (existing) await existing.unsubscribe();

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(notificationConfig.vapidPublicKey),
    });
    currentPushSubscription = subscription;

    const response = await fetch(API_NOTIFICATIONS_SUBSCRIBE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subscription,
        reminderTime: els.notificationTimeInput.value || "20:30",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York",
        enabled: true,
      }),
    });
    if (!response.ok) throw new Error("Subscription save failed");

    const result = await response.json();
    notificationConfig.settings = result.settings;
    renderNotificationControls();
  } catch (error) {
    console.error(error);
    els.notificationStatus.textContent = "Could not enable reminders. Try again from the installed phone app.";
  }
}

async function disableNotifications() {
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = await registration?.pushManager.getSubscription();
    const endpoint = subscription?.endpoint || currentPushSubscription?.endpoint || "";
    if (subscription) await subscription.unsubscribe();

    const response = await fetch(API_NOTIFICATIONS_UNSUBSCRIBE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint }),
    });
    if (response.ok) {
      const result = await response.json();
      notificationConfig.settings = result.settings;
    }
    currentPushSubscription = null;
  } catch (error) {
    console.warn(error);
  }
  renderNotificationControls();
}

async function saveNotificationSettings() {
  if (!notificationConfig.settings?.enabled || !notificationConfig.configured) return;

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = await registration?.pushManager.getSubscription();
    const response = await fetch(API_NOTIFICATIONS_SETTINGS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: subscription?.endpoint || currentPushSubscription?.endpoint || "",
        reminderTime: els.notificationTimeInput.value || "20:30",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York",
        enabled: true,
      }),
    });
    if (!response.ok) throw new Error("Settings save failed");
    const result = await response.json();
    notificationConfig.settings = result.settings;
    renderNotificationControls();
  } catch {
    els.notificationStatus.textContent = "Could not save reminder time.";
  }
}

async function sendTestNotification() {
  els.notificationStatus.textContent = "Sending test notification...";
  try {
    const response = await fetch(API_NOTIFICATIONS_TEST_URL, { method: "POST" });
    if (!response.ok) throw new Error("Test notification failed");
    const result = await response.json();
    if ((result.sent || 0) > 0) {
      if ((result.stale || 0) > 0) {
        const label = result.stale === 1 ? "subscription was" : "subscriptions were";
        els.notificationStatus.textContent = `Test sent. ${result.stale} old phone ${label} cleared.`;
      } else {
        els.notificationStatus.textContent = result.failed
          ? "Test sent, but one phone endpoint failed."
          : "Test sent. Check your phone.";
      }
      return;
    }

    if ((result.stale || 0) > 0) {
      await loadNotificationConfig();
      renderNotificationControls();
      els.notificationStatus.textContent = "The old phone subscription was cleared. Tap Enable again to create a fresh one.";
      return;
    }

    els.notificationStatus.textContent = result.failed
      ? "The test could not reach your phone. Try disabling and enabling reminders again."
      : "No active reminder subscription yet. Try Enable first.";
  } catch {
    els.notificationStatus.textContent = "Could not send a test notification.";
  }
}

function urlBase64ToUint8Array(value) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = `${value}${padding}`.replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
}

function render() {
  if (appEnv.authRequired && !isHostedAllowed) return;
  if (els.hostedSetup) els.hostedSetup.hidden = !(appEnv.authRequired && problems.length === 0);
  renderTopicOptions();
  renderImportMeta();
  renderNotificationControls();
  renderStats();
  renderDailyPicks();
  renderMinimumPractice();
  renderFriendPulse();
  renderRecoveryLane();
  renderMemoryHealth();
  renderLibraryTerminology();
  renderRows(getFilteredProblems());
  renderLeaderboard();
}

function renderLibraryTerminology() {
  const usesAdaptivePractice = isFeatureEnabled("practiceV2");
  const mode = usesAdaptivePractice ? "v2" : "legacy";
  els.libraryView?.classList.toggle("library-v2", usesAdaptivePractice);
  if (els.practiceV2ProblemTableHead) els.practiceV2ProblemTableHead.hidden = !usesAdaptivePractice;
  if (els.legacyProblemTableHead) els.legacyProblemTableHead.hidden = usesAdaptivePractice;
  if (els.stageReference) els.stageReference.hidden = usesAdaptivePractice;
  if (els.statusFilterLabel) els.statusFilterLabel.textContent = usesAdaptivePractice ? "Evidence" : "Status";
  if (els.listFilterLabel) els.listFilterLabel.textContent = usesAdaptivePractice ? "Study list" : "List";
  if (els.searchInput) {
    els.searchInput.placeholder = usesAdaptivePractice ? "Problem or topic..." : "Problem, topic, note...";
  }
  if (els.stageSortBtn) els.stageSortBtn.textContent = usesAdaptivePractice ? "Retention" : "Stage";
  if (els.stageReferenceSummary) {
    els.stageReferenceSummary.textContent = usesAdaptivePractice ? "Exact-title schedule" : "Review Stages";
  }

  if (els.libraryView?.dataset.libraryMode === mode) return;
  if (els.libraryView) els.libraryView.dataset.libraryMode = mode;

  if (usesAdaptivePractice) {
    els.statusFilter.innerHTML = `
      <option value="all">All evidence</option>
      <option value="unseen">Unseen</option>
      <option value="unverified">Assessment pending</option>
      <option value="repair">Needs repair</option>
      <option value="assisted">Assisted</option>
      <option value="independent">Independent</option>
      <option value="stale">Stale evidence</option>
    `;
    els.listFilter.innerHTML = `
      <option value="all">All problems</option>
      <option value="blind75">Blind 75</option>
      <option value="neetcode150">NeetCode 150</option>
    `;
    els.sortSelect.innerHTML = `
      <option value="recentPractice">Recently practiced</option>
      <option value="title">A-Z</option>
      <option value="due">Next exact-title review</option>
      <option value="difficulty">Difficulty</option>
      <option value="topic">Topic</option>
    `;
    tableSort = { column: "lastActivity", direction: "desc" };
    els.sortSelect.value = "recentPractice";
    return;
  }

  els.statusFilter.innerHTML = `
    <option value="all">All statuses</option>
    <option value="todo">Unattempted</option>
    <option value="solving">Learning</option>
    <option value="unverified">Seen, unverified</option>
    <option value="review">Reviewing</option>
    <option value="solved">Mastered</option>
  `;
  els.listFilter.innerHTML = `
    <option value="all">All problems</option>
    <option value="blind75">Blind 75</option>
    <option value="neetcode150">NeetCode 150</option>
    <option value="due">Due reviews</option>
  `;
  els.sortSelect.innerHTML = `
    <option value="due">Due first</option>
    <option value="dueDesc">Due last</option>
    <option value="updated">Recently updated</option>
    <option value="difficulty">Difficulty</option>
    <option value="topic">Topic</option>
  `;
  tableSort = { column: "nextReview", direction: "asc" };
  els.sortSelect.value = "due";
}

function renderLeaderboard() {
  if (!els.leaderboardView || !canUseLeaderboard()) return;

  if (els.leaderboardDisplayNameInput) els.leaderboardDisplayNameInput.value = leaderboardProfile.displayName || "";
  if (els.pactDisplayNameInput) els.pactDisplayNameInput.value = leaderboardProfile.displayName || "";
  if (els.socialHandleInput) els.socialHandleInput.value = leaderboardProfile.handle ? `@${leaderboardProfile.handle}` : "";
  if (els.leaderboardOptInInput) els.leaderboardOptInInput.checked = Boolean(leaderboardProfile.leaderboardOptedIn);
  if (els.pactsOptInInput) els.pactsOptInInput.checked = Boolean(leaderboardProfile.pactsOptedIn);
  if (els.leaderboardProfileHelp) {
    els.leaderboardProfileHelp.textContent = canUseFriendPulse()
      ? leaderboardProfile.pactsOptedIn
        ? "Daily pacts are on. Problem names, grades, notes, and history stay private."
        : "Daily pacts let people find your @handle and see whether you showed up today."
      : "Show aggregate practice stats with your display name. Problem names, grades, notes, and history stay private.";
  }
  if (els.leaderboardOptInHelp) {
    els.leaderboardOptInHelp.textContent = leaderboardProfile.leaderboardOptedIn
      ? "Leaderboard is on. Your aggregate practice stats are visible."
      : "Show aggregate practice stats with your display name. Problem names, grades, notes, and history stay private.";
  }

  document.querySelectorAll("[data-leaderboard-view]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.leaderboardView === leaderboardViewMode);
  });

  renderFriendPactManager();

  const columns = leaderboardColumns(leaderboardViewMode);
  renderLeaderboardSortControl(columns);
  if (els.leaderboardViewNote) {
    els.leaderboardViewNote.textContent =
      leaderboardViewMode === "readiness"
        ? "Readiness uses the same rolling 30-day evidence window as Practice."
        : "Weekly signals reset Monday. Imported history does not count.";
  }
  const rows = sortedLeaderboardRows();
  els.leaderboardHead.innerHTML = `
    <tr>
      <th>Rank</th>
      <th>Name</th>
      ${columns
        .map((column) => `
          <th>
            <span class="leaderboard-header">
              <button class="sort-header" type="button" data-leaderboard-sort="${column.key}">
                ${column.label}${leaderboardSort[leaderboardViewMode].column === column.key ? sortArrow(leaderboardSort[leaderboardViewMode].direction) : ""}
              </button>
              ${column.description ? renderInfoButton(column.description) : ""}
            </span>
          </th>
        `)
        .join("")}
    </tr>
  `;

  els.leaderboardRows.innerHTML = rows
    .map((row, index) => `
      <tr class="${row.isCurrentUser ? "leaderboard-current-user" : ""}">
        <td class="leaderboard-rank" data-label="Rank"><span>#${index + 1}</span></td>
        <td class="leaderboard-person" data-label="Name">
          <strong>${escapeHtml(row.displayName)}</strong>
          ${canUseFriendPulse() && row.handle ? `<span class="leaderboard-handle">@${escapeHtml(row.handle)}</span>` : ""}
          ${row.isCurrentUser ? `<span class="leaderboard-you">You</span>` : ""}
        </td>
        ${columns
          .map(
            (column) => `
              <td class="leaderboard-metric" data-label="${escapeAttr(column.shortLabel || column.label)}">
                <strong>${escapeHtml(formatLeaderboardValue(column, leaderboardMetricValue(row, column.key)))}</strong>
              </td>
            `,
          )
          .join("")}
      </tr>
    `)
    .join("");

  els.leaderboardEmpty.hidden = rows.length > 0;
}

function canUseLeaderboard() {
  return Boolean(appEnv.authRequired || appEnv.isQa);
}

function leaderboardColumns(viewMode) {
  if (viewMode === "readiness") {
    return [
      {
        key: "checkedSkills",
        label: "Checked skills",
        shortLabel: "Checked",
        description: "Skill areas with at least one real graded attempt in the last 30 days.",
      },
      {
        key: "independentSkills",
        label: "Independent skills",
        shortLabel: "Independent",
        description: "Skill areas with a clean, unassisted result in the last 30 days.",
      },
      {
        key: "transferSkills",
        label: "Transfer skills",
        shortLabel: "Transfer",
        description: "Skill areas supported by independent results on distinct titles, including a designated transfer-style rep, in the last 30 days.",
      },
    ];
  }

  return [
    {
      key: "practiceDays",
      label: "Practice days",
      shortLabel: "Days",
      description: "Distinct days this week with at least one real graded attempt.",
    },
    {
      key: "repsCompleted",
      label: "Reps completed",
      shortLabel: "Reps",
      description: "Real graded attempts completed this week. Imported history is excluded.",
    },
    {
      key: "skillBreadth",
      label: "Skill breadth",
      shortLabel: "Skills",
      description: "Distinct skill areas practiced this week. Breadth helps prevent repeatedly memorizing only a few exact solutions.",
    },
    {
      key: "independentReps",
      label: "Independent reps",
      shortLabel: "Independent",
      description: "Clean attempts completed without hints, solutions, editorials, people, or AI this week.",
    },
  ];
}

function renderLeaderboardSortControl(columns) {
  if (!els.leaderboardSortSelect) return;
  els.leaderboardSortSelect.innerHTML = columns
    .map((column) => `<option value="${escapeAttr(column.key)}">${escapeHtml(column.label)}</option>`)
    .join("");
  els.leaderboardSortSelect.value = leaderboardSort[leaderboardViewMode].column;
}

function leaderboardMetricValue(row, key) {
  const current = row?.[leaderboardViewMode];
  if (current && current[key] != null) return current[key];

  if (leaderboardViewMode === "weekly") {
    if (key === "repsCompleted") {
      return Number(row?.weekly?.reviewsCompleted || 0) + Number(row?.weekly?.newAttempts || 0);
    }
    if (key === "skillBreadth" || key === "independentReps") return 0;
  }

  if (leaderboardViewMode === "readiness") {
    if (key === "checkedSkills") return Number(row?.lifetime?.durablePlus || 0);
    if (key === "independentSkills") return Number(row?.lifetime?.mastered || 0);
    if (key === "transferSkills") return 0;
  }

  return 0;
}

function renderInfoButton(description) {
  return `
    <button
      class="info-btn leaderboard-info-btn"
      type="button"
      aria-label="${escapeAttr(description)}"
      data-tooltip="${escapeAttr(description)}"
      tabindex="-1"
    >
      i
    </button>
  `;
}

function sortedLeaderboardRows() {
  const sort = leaderboardSort[leaderboardViewMode];
  const direction = sort.direction === "asc" ? 1 : -1;
  return [...(leaderboardData.rows || [])].sort((a, b) => {
    const aValue = Number(leaderboardMetricValue(a, sort.column) || 0);
    const bValue = Number(leaderboardMetricValue(b, sort.column) || 0);
    return (aValue - bValue) * direction || a.displayName.localeCompare(b.displayName);
  });
}

function sortLeaderboard(column) {
  const current = leaderboardSort[leaderboardViewMode];
  leaderboardSort[leaderboardViewMode] = {
    column,
    direction: current.column === column && current.direction === "desc" ? "asc" : "desc",
  };
  if (els.leaderboardSortSelect) els.leaderboardSortSelect.value = column;
  renderLeaderboard();
}

function formatLeaderboardValue(column, value) {
  return String(Number(value || 0));
}

function renderFriendPulse() {
  if (!els.friendPulsePanel || !canUseFriendPulse()) {
    if (els.friendPulsePanel) els.friendPulsePanel.hidden = true;
    if (els.friendPulseNavBadge) els.friendPulseNavBadge.hidden = true;
    return;
  }

  const pactsOptedIn = Boolean(friendPulseData.currentUser?.pactsOptedIn || leaderboardProfile.pactsOptedIn);
  const incomingCount = Number(friendPulseData.incomingCount || 0);
  if (els.friendPulseNavBadge) {
    els.friendPulseNavBadge.hidden = incomingCount <= 0;
    els.friendPulseNavBadge.textContent = String(incomingCount);
  }

  els.friendPulsePanel.hidden = false;
  const currentStatus = friendPulseData.currentUser?.completedToday ? "Done today" : "Open";
  const pacts = friendPulseData.pacts || [];
  els.friendPulseSummary.textContent = pactsOptedIn
    ? `${currentStatus}. ${pacts.length ? "Your pact circle is here too." : "Find a pact friend when you want social momentum."}`
    : "Enable daily pacts on Pacts to let friends see whether you showed up today.";

  const currentRow = `
    <div class="friend-pulse-row is-you">
      <div>
        <strong>You</strong>
        <span>${escapeHtml(leaderboardProfile.handle ? `@${leaderboardProfile.handle}` : "Set a handle on Pacts")}</span>
      </div>
      ${pactsOptedIn
        ? renderFriendCompletionPill(Boolean(friendPulseData.currentUser?.completedToday), false)
        : `<span class="friend-status-pill paused">Private</span>`}
    </div>
  `;

  const pactRows = pacts.length
    ? pacts.map((pact) => `
      <div class="friend-pulse-row">
        <div>
          <strong>${escapeHtml(pact.displayName)}</strong>
          <span>@${escapeHtml(pact.handle)}${pact.paused ? " · paused" : ""}</span>
        </div>
        ${pact.paused ? `<span class="friend-status-pill paused">Paused</span>` : renderFriendCompletionPill(Boolean(pact.completedToday), false)}
      </div>
    `).join("")
    : `<p class="friend-pulse-empty">${pactsOptedIn ? "No pact friends yet. Find someone on Pacts." : "Daily pacts are off right now."}</p>`;

  els.friendPulseList.innerHTML = `${currentRow}${pactRows}`;
}

function renderFriendCompletionPill(done, short = false) {
  return `<span class="friend-status-pill ${done ? "done" : "open"}">${done ? (short ? "Done" : "Showed up") : "Open"}</span>`;
}

function renderFriendPactManager() {
  if (!els.friendPactManager || !canUseFriendPulse()) return;
  const incoming = friendPulseData.incoming || [];
  const outgoing = friendPulseData.outgoing || [];
  const pacts = friendPulseData.pacts || [];
  const pactsOptedIn = Boolean(leaderboardProfile.pactsOptedIn);

  if (els.friendRequestCount) els.friendRequestCount.textContent = String(incoming.length);
  if (els.friendIncomingList) {
    els.friendIncomingList.innerHTML = incoming.length
      ? incoming.map((request) => `
        <div class="friend-request-row">
          <div>
            <strong>${escapeHtml(request.displayName)}</strong>
            <span>@${escapeHtml(request.handle)} wants to start a daily pact.</span>
          </div>
          <div class="friend-request-actions">
            <button class="primary-btn small-btn" type="button" data-friend-accept="${escapeAttr(request.id)}">Accept</button>
            <button class="ghost-btn small-btn" type="button" data-friend-decline="${escapeAttr(request.id)}">Decline</button>
          </div>
        </div>
      `).join("")
      : `<p class="friend-pulse-empty">${pactsOptedIn ? "No incoming pact requests." : "Enable daily pacts to receive requests."}</p>`;
  }

  if (els.friendPactList) {
    els.friendPactList.innerHTML = pacts.length
      ? pacts.map((pact) => `
        <div class="friend-request-row">
          <div>
            <strong>${escapeHtml(pact.displayName)}</strong>
            <span>@${escapeHtml(pact.handle)} · ${pact.paused ? "paused" : pact.completedToday ? "showed up today" : "still open"}</span>
          </div>
          <div class="friend-request-actions">
            ${pact.paused ? `<span class="friend-status-pill paused">Paused</span>` : renderFriendCompletionPill(Boolean(pact.completedToday), true)}
            <button class="ghost-btn small-btn" type="button" data-friend-remove="${escapeAttr(pact.id)}">Remove</button>
          </div>
        </div>
      `).join("")
      : `<p class="friend-pulse-empty">No active pact friends yet.</p>`;
  }

  if (els.friendOutgoingSummary) {
    els.friendOutgoingSummary.innerHTML = outgoing.length
      ? `
        <span class="friend-pulse-muted">Outgoing requests</span>
        <span class="friend-outgoing-list">
          ${outgoing.map((request) => `
            <span class="friend-outgoing-item">
              <span>@${escapeHtml(request.handle)} pending</span>
              <button class="ghost-btn small-btn" type="button" data-friend-retract="${escapeAttr(request.id)}">Retract</button>
            </span>
          `).join("")}
        </span>
      `
      : "";
  }
}

async function searchFriendPact() {
  if (!canUseFriendPulse() || !els.friendSearchResult) return;
  const handle = normalizeClientHandle(els.friendSearchInput?.value || "");
  const nonce = friendSearchNonce + 1;
  friendSearchNonce = nonce;
  if (!/^[a-z]{3,24}$/.test(handle)) {
    els.friendSearchResult.innerHTML = `<p class="friend-pulse-empty">Enter an exact handle with 3-24 letters.</p>`;
    return;
  }

  els.friendSearchResult.innerHTML = `<p class="friend-pulse-empty">Searching @${escapeHtml(handle)}...</p>`;
  try {
    const response = await fetch(`${API_FRIEND_PULSE_SEARCH_URL}?handle=${encodeURIComponent(handle)}`, { cache: "no-store" });
    if (!response.ok) throw new Error("Search failed");
    const result = await response.json();
    if (nonce !== friendSearchNonce) return;
    const match = result.results?.[0];
    els.friendSearchResult.innerHTML = match
      ? renderFriendSearchMatch(match)
      : `<p class="friend-pulse-empty">No pact-enabled user found for @${escapeHtml(handle)}.</p>`;
  } catch {
    if (nonce !== friendSearchNonce) return;
    els.friendSearchResult.innerHTML = `<p class="friend-pulse-empty">Could not search right now.</p>`;
  }
}

function renderFriendSearchMatch(match) {
  const status = match.status || "available";
  let action = `<span class="friend-status-pill open">${escapeHtml(statusLabel(status))}</span>`;
  if (status === "available" && leaderboardProfile.pactsOptedIn) {
    action = `<button class="primary-btn small-btn" type="button" data-friend-request="${escapeAttr(match.handle)}">Request pact</button>`;
  } else if (status === "available") {
    action = `<span class="friend-status-pill paused">Enable pacts first</span>`;
  }
  return `
    <div class="friend-request-row">
      <div>
        <strong>${escapeHtml(match.displayName)}</strong>
        <span>@${escapeHtml(match.handle)}</span>
      </div>
      ${action}
    </div>
  `;
}

function statusLabel(status) {
  const labels = {
    active: "Active",
    pending: "Pending",
    incoming: "Respond",
    paused: "Paused",
    available: "Available",
    unavailable: "Unavailable",
  };
  return labels[status] || "Unavailable";
}

async function handleFriendPulseAction(event) {
  if (!canUseFriendPulse()) return;
  const requestButton = event.target.closest("[data-friend-request]");
  const acceptButton = event.target.closest("[data-friend-accept]");
  const declineButton = event.target.closest("[data-friend-decline]");
  const retractButton = event.target.closest("[data-friend-retract]");
  const removeButton = event.target.closest("[data-friend-remove]");
  if (!requestButton && !acceptButton && !declineButton && !retractButton && !removeButton) return;
  const actionButton = requestButton || acceptButton || declineButton || retractButton || removeButton;
  if (actionButton.disabled) return;

  let url = "";
  if (requestButton) url = `${API_FRIEND_PULSE_URL}/requests`;
  if (acceptButton) url = `${API_FRIEND_PULSE_URL}/requests/${encodeURIComponent(acceptButton.dataset.friendAccept)}/accept`;
  if (declineButton) url = `${API_FRIEND_PULSE_URL}/requests/${encodeURIComponent(declineButton.dataset.friendDecline)}/decline`;
  if (retractButton) url = `${API_FRIEND_PULSE_URL}/requests/${encodeURIComponent(retractButton.dataset.friendRetract)}/retract`;
  if (removeButton) url = `${API_FRIEND_PULSE_URL}/pacts/${encodeURIComponent(removeButton.dataset.friendRemove)}/remove`;

  try {
    actionButton.disabled = true;
    actionButton.setAttribute("aria-busy", "true");
    const body = requestButton ? JSON.stringify({ handle: requestButton.dataset.friendRequest }) : null;
    const response = await fetch(url, {
      method: "POST",
      headers: body ? { "Content-Type": "application/json" } : {},
      body,
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Friend Pulse action failed");
    await loadFriendPulseData();
    await loadLeaderboardData();
    renderFriendPulse();
    renderLeaderboard();
    if (els.friendSearchResult && requestButton) {
      els.friendSearchResult.innerHTML = `<p class="friend-pulse-empty">Pact request sent.</p>`;
    } else if (els.friendSearchResult && (retractButton || removeButton || acceptButton || declineButton)) {
      friendSearchNonce += 1;
      els.friendSearchResult.innerHTML = "";
    }
  } catch (error) {
    if (els.friendSearchResult && requestButton) {
      els.friendSearchResult.innerHTML = `<p class="friend-pulse-empty">${escapeHtml(error.message || "Could not update pact. Try again.")}</p>`;
    } else if (actionButton) {
      actionButton.disabled = false;
      actionButton.removeAttribute("aria-busy");
    }
  }
}

function sortArrow(direction) {
  return direction === "asc" ? " ↑" : " ↓";
}

function renderStats() {
  const today = dateOnly(new Date());
  const weekStart = addDays(today, -6);
  const recentReps = getActivitySessions()
    .filter((session) => isProperGrade(session.grade))
    .filter((session) => {
      const normalized = normalizeDate(session.date);
      if (!normalized) return false;
      const date = dateOnly(parseIsoDate(normalized));
      return date >= weekStart && date <= today;
    });
  const blindAttempted = BLIND_75.filter((planProblem) => {
    const row = findProblemByPlan(planProblem);
    return row && isAttempted(row);
  }).length;
  const neetcodeAttempted = NEETCODE_150.filter((planProblem) => {
    const row = findProblemByPlan(planProblem);
    return row && isAttempted(row);
  }).length;
  const evidence = buildMemoryEvidenceModel();

  els.blindAttempted.textContent = `${blindAttempted}/${BLIND_75.length}`;
  els.neetcodeAttempted.textContent = `${neetcodeAttempted}/${NEETCODE_150.length}`;
  els.checkedSkillCount.textContent = `${evidence.checkedCount}/${evidence.skillCount}`;
  els.independentSkillCount.textContent = `${evidence.independentCount}/${evidence.skillCount}`;
  els.transferSkillCount.textContent = `${evidence.transferCount}/${evidence.skillCount}`;
  els.weeklySolved.textContent = recentReps.length;
}

function buildMemoryEvidenceModel() {
  const evidence = PRACTICE_V2_ENGINE?.deriveEvidence
    ? PRACTICE_V2_ENGINE.deriveEvidence(buildTrackerStatePayload(), {
        today: toIsoDate(new Date()),
        catalog: practiceV2Catalog(),
      })
    : { skills: new Map(), checkedSkillIds: [], independentSkillIds: [], transferSupportedSkillIds: [], recentAttempts: [] };
  const skills = [...evidence.skills.values()];
  const skillCount = skills.length;
  const checkedCount = evidence.checkedSkillIds.length;
  const independentCount = evidence.independentSkillIds.length;
  const transferCount = evidence.transferSupportedSkillIds.length;

  return {
    ...evidence,
    skills,
    skillCount,
    checkedCount,
    independentCount,
    transferCount,
    uncheckedCount: skillCount - checkedCount,
    independentGapCount: skills.filter((skill) => skill.checked && !skill.independent).length,
    transferGapCount: skills.filter((skill) => skill.independent && !skill.transferSupported).length,
  };
}

function renderMinimumPractice() {
  if (!els.habitToday) return;

  const habit = buildMinimumPracticeState();
  const hasPracticePick = hasActionablePracticePick();
  els.habitToday.textContent = habit.todayComplete ? "Complete" : "Open";
  els.habitWeek.textContent = `${habit.weekPracticeDays}/${WEEKLY_PRACTICE_TARGET} rhythm days`;
  els.habitRhythm.textContent = `${habit.rhythmDays} ${habit.rhythmDays === 1 ? "day" : "days"}`;
  els.habitTitle.textContent = habit.todayComplete ? "Minimum day complete" : "One honest attempt completes today";
  els.habitCopy.textContent = habit.comeback
    ? "Comeback day logged. The loop is alive again."
    : habit.todayComplete
      ? "Minimum day complete. Momentum protected."
      : "One real grade is enough to keep the loop alive.";
  els.habitActionBtn.textContent = hasPracticePick
    ? isFeatureEnabled("practiceV2") ? "Start today's rep" : "Start with today's picks"
    : "Find a problem to backfill";
}

function hasActionablePracticePick() {
  if (isFeatureEnabled("practiceV2")) {
    return Boolean(practiceV2Runtime?.recommendation?.public);
  }
  return Boolean(dailyPicks.review || dailyPicks.newProblem);
}

function buildMinimumPracticeState() {
  const today = toIsoDate(new Date());
  const weekStart = toIsoDate(startOfWeekMonday(dateOnly(new Date())));
  const weekEnd = toIsoDate(addDays(parseIsoDate(weekStart), 6));
  const practiceDates = [
    ...new Set(
      getActivitySessions()
        .filter((session) => isProperGrade(session.grade))
        .map((session) => normalizeDate(session.date))
        .filter(Boolean),
    ),
  ].sort((a, b) => a.localeCompare(b));

  const todayComplete = practiceDates.includes(today);
  const weekPracticeDays = practiceDates.filter((date) => date >= weekStart && date <= weekEnd).length;
  const rhythmDays = currentPracticeRhythm(practiceDates, today);
  const previousPracticeDate = practiceDates.filter((date) => date < today).at(-1) || "";
  const daysSincePrevious = previousPracticeDate
    ? Math.floor((parseIsoDate(today) - parseIsoDate(previousPracticeDate)) / 86400000)
    : 0;

  return {
    todayComplete,
    weekPracticeDays,
    rhythmDays,
    comeback: todayComplete && daysSincePrevious >= 3,
  };
}

function currentPracticeRhythm(practiceDates, today) {
  const dates = new Set(practiceDates);
  let cursor = dates.has(today) ? today : toIsoDate(addDays(parseIsoDate(today), -1));
  let rhythm = 0;

  while (dates.has(cursor)) {
    rhythm += 1;
    cursor = toIsoDate(addDays(parseIsoDate(cursor), -1));
  }

  return rhythm;
}

function startMinimumPractice() {
  const hasTodayPick = hasActionablePracticePick();
  if (!hasTodayPick) navigateToRoute("library");
  const target = hasTodayPick ? els.todayPanel : els.problemsPanel;

  target?.scrollIntoView({ behavior: "smooth", block: "start" });

  if (hasTodayPick) {
    window.setTimeout(() => {
      const firstStart = isFeatureEnabled("practiceV2")
        ? els.practiceV2Experience?.querySelector("[data-v2-state]:not([hidden]) .primary-btn:not([disabled])")
        : dailyPicks.review ? els.reviewStartAttemptBtn : els.newStartAttemptBtn;
      firstStart?.focus({ preventScroll: true });
    }, 350);
  } else {
    window.setTimeout(() => {
      els.searchInput?.focus({ preventScroll: true });
    }, 350);
  }
}

function renderRecoveryLane() {
  if (!els.recoveryList) return;
  if (!canUseRecoveryLane()) {
    if (els.recoveryPanel) els.recoveryPanel.hidden = true;
    return;
  }

  recoveryProblemIds = normalizeRecoveryProblemIds(recoveryProblemIds);
  const recoveryProblems = getRecoveryProblems();
  const dueRecovery = recoveryProblems.filter((problem) => problem.nextReview && isReviewDue(problem.nextReview));

  if (els.recoveryPanel) els.recoveryPanel.hidden = recoveryProblems.length === 0;

  els.recoveryCount.textContent = `${recoveryProblems.length}/${RECOVERY_LANE_LIMIT}`;
  els.recoverySummary.textContent =
    recoveryProblems.length === 0
      ? "Pick up to 3 cold problems. The rest can wait."
      : dueRecovery.length > 0
        ? `${dueRecovery.length} recovery ${dueRecovery.length === 1 ? "review is" : "reviews are"} due. All that matters is the next one.`
        : `Recovery lane is warm. Next up: ${nextRecoveryTiming(recoveryProblems)}.`;

  if (recoveryProblems.length === 0) {
    els.recoveryList.innerHTML = `
      <div class="recovery-empty">
        <strong>No active recovery problems.</strong>
        <span>When an old review feels important, add it here and bring it back online.</span>
      </div>
    `;
    return;
  }

  els.recoveryList.innerHTML = recoveryProblems
    .map((problem) => `
      <article class="recovery-item ${isReviewDue(problem.nextReview) ? "is-due" : ""}">
        <div>
          <strong>${escapeHtml(problem.title)}</strong>
          <span>${escapeHtml(stageName(problem.stage))} · ${escapeHtml(reviewTimingLabel(problem.nextReview))} · ${Number(problem.completionCount || 0)} ${Number(problem.completionCount || 0) === 1 ? "attempt" : "attempts"}</span>
        </div>
        <div class="recovery-actions">
          ${problem.url ? `<a class="ghost-btn small-btn" href="${escapeAttr(problem.url)}" target="_blank" rel="noreferrer">Open</a>` : ""}
          <button class="ghost-btn small-btn" type="button" data-recovery-remove="${escapeAttr(problem.id)}">Remove</button>
        </div>
      </article>
    `)
    .join("");
}

function getRecoveryProblems() {
  return recoveryProblemIds
    .map((id) => problems.find((problem) => problem.id === id))
    .filter(Boolean)
    .filter((problem) => clampStage(problem.stage) < RECOVERY_GRADUATION_STAGE);
}

function nextRecoveryTiming(recoveryProblems) {
  const next = recoveryProblems
    .filter((problem) => problem.nextReview)
    .sort((a, b) => dateValue(a.nextReview) - dateValue(b.nextReview))[0];
  return next ? `${next.title} ${reviewTimingLabel(next.nextReview)}` : "grade one to schedule it";
}

function addToRecoveryLane(id) {
  if (!canUseRecoveryLane()) return;
  const problem = problems.find((item) => item.id === id);
  if (!problem) return;

  if (clampStage(problem.stage) >= RECOVERY_GRADUATION_STAGE) {
    setRecoveryMessage(`${problem.title} is already at ${stageName(problem.stage)}, so it does not need Recovery Lane.`);
    return;
  }

  if (recoveryProblemIds.includes(id)) {
    setRecoveryMessage(`${problem.title} is already in Recovery Lane.`);
    return;
  }

  if (recoveryProblemIds.length >= RECOVERY_LANE_LIMIT) {
    setRecoveryMessage("Recovery Lane is full. Remove one before adding another.");
    return;
  }

  recoveryProblemIds = normalizeRecoveryProblemIds([...recoveryProblemIds, id]);
  persist();
  render();
  setRecoveryMessage(`${problem.title} added to Recovery Lane.`);
}

function removeFromRecoveryLane(id, options = {}) {
  if (!canUseRecoveryLane()) return;
  const problem = problems.find((item) => item.id === id);
  const nextIds = recoveryProblemIds.filter((problemId) => problemId !== id);
  if (nextIds.length === recoveryProblemIds.length) return;

  recoveryProblemIds = nextIds;
  if (!options.skipPersist) persist();
  render();
  if (!options.silent && problem) setRecoveryMessage(`${problem.title} removed from Recovery Lane.`);
}

function maybeGraduateRecoveryProblem(problem) {
  if (!canUseRecoveryLane()) return "";
  if (!problem || !recoveryProblemIds.includes(problem.id)) return "";
  if (clampStage(problem.stage) < RECOVERY_GRADUATION_STAGE) return "";

  recoveryProblemIds = recoveryProblemIds.filter((id) => id !== problem.id);
  return `${problem.title} graduated from Recovery Lane.`;
}

function normalizeRecoveryProblemIds(ids = []) {
  const existingIds = new Set(problems.map((problem) => problem.id));
  return [...new Set((Array.isArray(ids) ? ids : []).filter(Boolean))]
    .filter((id) => existingIds.has(id))
    .filter((id) => {
      const problem = problems.find((item) => item.id === id);
      return problem && clampStage(problem.stage) < RECOVERY_GRADUATION_STAGE;
    })
    .slice(0, RECOVERY_LANE_LIMIT);
}

function setRecoveryMessage(message) {
  if (els.gradeResult) els.gradeResult.textContent = message;
}

function renderMemoryHealth() {
  const evidence = buildMemoryEvidenceModel();
  const remaining = Math.max(0, evidence.skillCount - evidence.transferCount);

  els.evidenceGapCount.textContent = `${remaining} ${remaining === 1 ? "skill area" : "skill areas"}`;
  els.evidenceGapCopy.textContent = remaining === 0
    ? "Every tracked skill area has recent, independent, transfer-supported evidence."
    : "The adaptive plan uses these gaps to choose the next useful rep.";
  els.uncheckedSkillCount.textContent = evidence.uncheckedCount;
  els.independentGapCount.textContent = evidence.independentGapCount;
  els.transferGapCount.textContent = evidence.transferGapCount;

  renderAttentionTopics(evidence);
  renderEvidenceChart(evidence);
  renderRecentGradeChart();
}

function renderAttentionTopics(evidence = buildMemoryEvidenceModel()) {
  const allTopics = buildAttentionTopics(evidence);
  const topics = allTopics.slice(0, 4);
  els.viewAllTopicsBtn.disabled = allTopics.length === 0;

  if (topics.length === 0) {
    els.attentionTopics.innerHTML = `<p class="memory-empty">No skill gaps are asking for attention right now.</p>`;
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
            <span class="attention-level ${attentionLevelClass(topic)}">${attentionLevel(topic)} priority</span>
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
  const topics = buildAttentionTopics(buildMemoryEvidenceModel());
  if (topics.length === 0) {
    els.attentionTopicRows.innerHTML = `<p class="memory-empty">No attention topics yet.</p>`;
    return;
  }

  els.attentionTopicRows.innerHTML = topics
    .map((topic) => `
      <button class="attention-topic-row" type="button" data-topic-filter="${escapeAttr(topic.topic)}">
        <span>
          <strong>${escapeHtml(topic.topic)}</strong>
          <em>${attentionLevel(topic)} priority</em>
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
  navigateToRoute("library");
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
  if (isActive) els.filterBannerText.textContent = `Filtered to ${diagnosticsTopicFilter} from Memory.`;
}

function scrollProblemsIntoView() {
  requestAnimationFrame(() => {
    document.querySelector(".table-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function buildAttentionTopics(evidence = buildMemoryEvidenceModel()) {
  return evidence.skills
    .map((skill) => {
      const recent = evidence.recentAttempts.filter((attempt) => attempt.skillId === skill.id);
      const latest = recent[0] || null;
      const hasHistoricalEvidence = problems.some((problem) =>
        PRACTICE_V2_ENGINE?.skillIdFor(problem.topic) === skill.id && hasProperGradeHistory(problem),
      );
      const latestRed = latest?.grade === "red";
      const latestYellow = latest?.grade === "yellow";
      const score =
        (latestRed ? 8 : 0) +
        (latestYellow ? 6 : 0) +
        (!skill.checked ? 5 : 0) +
        (!skill.independent ? 4 : 0) +
        (skill.independent && !skill.transferSupported ? 2 : 0);

      return {
        topic: skill.label,
        score,
        checked: skill.checked,
        independent: skill.independent,
        transferSupported: skill.transferSupported,
        hasHistoricalEvidence,
        latestRed,
        latestYellow,
      };
    })
    .filter((topic) => topic.score > 0)
    .map((topic) => ({ ...topic, reasons: buildAttentionReasons(topic) }))
    .sort((a, b) => b.score - a.score || a.topic.localeCompare(b.topic));
}

function buildAttentionReasons(topic) {
  const reasons = [];
  if (topic.latestRed) reasons.push("latest result needs repair");
  if (topic.latestYellow) reasons.push("latest result needed help");
  if (!topic.checked) reasons.push(topic.hasHistoricalEvidence ? "evidence is older than 30 days" : "not assessed yet");
  if (!topic.independent) reasons.push("independent proof missing");
  if (topic.independent && !topic.transferSupported) reasons.push("transfer proof missing");
  return reasons.length ? reasons : ["evidence is current"];
}

function attentionLevel(topic) {
  if (topic.score >= 11) return "High";
  if (topic.score >= 6) return "Medium";
  return "Low";
}

function attentionLevelClass(topic) {
  return `attention-${attentionLevel(topic).toLowerCase()}`;
}

function renderEvidenceChart(evidence = buildMemoryEvidenceModel()) {
  const rows = [
    { label: "Checked recently", count: evidence.checkedCount },
    { label: "Independent", count: evidence.independentCount },
    { label: "Transfer supported", count: evidence.transferCount },
  ];
  const denominator = Math.max(evidence.skillCount, 1);

  els.evidenceChart.innerHTML = rows
    .map((row) => {
      const width = row.count === 0 ? 0 : Math.max(6, Math.round((row.count / denominator) * 100));
      return `
        <div class="stage-chart-row evidence-chart-row">
          <span>${escapeHtml(row.label)}</span>
          <div class="memory-bar" aria-hidden="true"><span style="width: ${width}%"></span></div>
          <strong>${row.count}/${evidence.skillCount}</strong>
        </div>
      `;
    })
    .join("");
}

function renderRecentGradeChart() {
  const weekStart = addDays(dateOnly(new Date()), -6);
  const recent = getActivitySessions().filter((session) => {
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
    { key: "green", label: "Independent", className: "grade-green" },
    { key: "yellow", label: "Assisted", className: "grade-yellow" },
    { key: "red", label: "Needs repair", className: "grade-red" },
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
  if (isFeatureEnabled("practiceV2")) {
    if (els.practiceV0Content) els.practiceV0Content.hidden = true;
    if (els.practiceV2Experience) els.practiceV2Experience.hidden = false;
    const pickOptions = els.todayPanel?.querySelector(".pick-options");
    const dailyIntent = els.todayPanel?.querySelector(".daily-intent");
    if (pickOptions) pickOptions.hidden = true;
    if (dailyIntent) dailyIntent.textContent = "One adaptive rep. The plan decides what matters now.";
    if (els.todaySummary) els.todaySummary.textContent = "Your evidence, available time, and recent work are already considered.";
    renderPracticeV2();
    runPracticeV2Shadow();
    return;
  }
  if (els.practiceV0Content) els.practiceV0Content.hidden = false;
  if (els.practiceV2Experience) els.practiceV2Experience.hidden = true;
  const pickOptions = els.todayPanel?.querySelector(".pick-options");
  const dailyIntent = els.todayPanel?.querySelector(".daily-intent");
  if (pickOptions) pickOptions.hidden = false;
  if (dailyIntent) dailyIntent.textContent = "One review. One optional new problem.";
  dailyPicks = getDailyPicks(options);
  renderRecommendationCard("review", dailyPicks.review);
  renderRecommendationCard("new", dailyPicks.newProblem);
  renderSkipControls();

  const reviewText = dailyPicks.review ? dailyPicks.review.title : "no due review";
  const newText = dailyPicks.newProblem ? dailyPicks.newProblem.title : `no new ${getSelectedStudyList().label} pick`;
  els.todaySummary.textContent = `${reviewText} + ${newText}.`;
  runPracticeV2Shadow();
}

function practiceV2StorageKey() {
  return `leetcode-tracker.practice-v2-runtime.v1.${coldWorkflowOwner()}`;
}

function restorePracticeV2Runtime() {
  if (!PRACTICE_V2_WORKFLOW || !isFeatureEnabled("practiceV2")) return;
  const saved = loadJson(practiceV2StorageKey(), null);
  practiceV2Runtime = PRACTICE_V2_WORKFLOW.normalizeRuntime(saved || {
    capacityMinutes: Number(trainingProfile.defaultSessionMinutes || 45),
    expectedRevision: currentRevision,
  });
  reconcilePracticeV2RuntimeRevision();
  if (practiceV2Runtime.undoReceipt && ["completed", "session-complete"].includes(practiceV2Runtime.phase)) {
    lastGradeUndo = cloneState(practiceV2Runtime.undoReceipt);
  }
}

function reconcilePracticeV2RuntimeRevision() {
  if (!practiceV2Runtime || !PRACTICE_V2_WORKFLOW?.reconcileRuntimeRevision) return;
  const previousRevision = Number(practiceV2Runtime.expectedRevision || 0);
  practiceV2Runtime = PRACTICE_V2_WORKFLOW.reconcileRuntimeRevision(practiceV2Runtime, currentRevision);
  if (Number(practiceV2Runtime.expectedRevision || 0) !== previousRevision) persistPracticeV2Runtime();
}

function persistPracticeV2Runtime() {
  if (!practiceV2Runtime || !isFeatureEnabled("practiceV2")) return;
  try {
    localStorage.setItem(practiceV2StorageKey(), JSON.stringify(practiceV2Runtime));
  } catch {
    // Runtime persistence is best effort in local/QA mode; evidence remains in tracker state.
  }
}

function clearPracticeV2Runtime() {
  practiceV2Runtime = PRACTICE_V2_WORKFLOW?.createRuntime({
    capacityMinutes: Number(trainingProfile.defaultSessionMinutes || 45),
    expectedRevision: currentRevision,
  }) || null;
  try {
    localStorage.removeItem(practiceV2StorageKey());
  } catch {
    // Ignore unavailable browser storage in QA reset paths.
  }
}

function practiceV2Catalog() {
  return [
    ...BLIND_75.map((problem) => ({ ...problem, listMemberships: ["blind75"] })),
    ...NEETCODE_150.map((problem) => ({ ...problem, listMemberships: ["neetcode150"] })),
  ];
}

function getPracticeV2Recommendation({ resetExclusions = false } = {}) {
  if (!PRACTICE_V2_ENGINE || !practiceV2Runtime) return null;
  if (resetExclusions) practiceV2Runtime.skippedProblemIds = [];
  const input = {
    state: buildTrackerStatePayload(),
    catalog: practiceV2Catalog(),
    today: toIsoDate(new Date()),
    capacityMinutes: Number(practiceV2Runtime.capacityMinutes || trainingProfile.defaultSessionMinutes || 45),
    activeProblemId: ["attempting", "grading", "reflecting", "saving"].includes(practiceV2Runtime.phase)
      ? practiceV2Runtime.recommendation?.public?.problemId || ""
      : "",
    skippedProblemIds: practiceV2Runtime.skippedProblemIds,
  };
  let recommendation = PRACTICE_V2_ENGINE.recommendNextRep(input);
  if (!recommendation.public && practiceV2Runtime.skippedProblemIds.length > 0) {
    practiceV2Runtime.skippedProblemIds = [];
    recommendation = PRACTICE_V2_ENGINE.recommendNextRep({ ...input, skippedProblemIds: [] });
  }
  return recommendation.public ? recommendation : null;
}

function ensurePracticeV2Recommendation() {
  if (!practiceV2Runtime || !["ready", "session-complete"].includes(practiceV2Runtime.phase)) return;
  if (practiceV2Runtime.phase === "ready" && practiceV2Runtime.recommendation?.public) return;
  practiceV2Runtime.recommendation = getPracticeV2Recommendation();
  practiceV2Runtime.expectedRevision = currentRevision;
  persistPracticeV2Runtime();
}

function renderPracticeV2() {
  if (!practiceV2Runtime || !els.practiceV2Experience) return;
  ensurePracticeV2Recommendation();
  const phase = practiceV2Runtime.phase === "saving" ? "reflecting" : practiceV2Runtime.phase;
  const recommendation = practiceV2Runtime.recommendation;
  const publicPick = recommendation?.public;

  els.practiceV2Experience.querySelectorAll("[data-v2-state]").forEach((state) => {
    state.hidden = state.dataset.v2State !== phase;
  });
  const activeStep = { ready: 0, attempting: 1, grading: 2, reflecting: 2, completed: 3, "session-complete": 3 }[phase] || 0;
  els.practiceV2Experience.querySelectorAll("[data-v2-step]").forEach((step, index) => {
    step.classList.toggle("active", index === activeStep);
    step.classList.toggle("complete", index < activeStep);
  });

  if (els.practiceV2Capacity) {
    els.practiceV2Capacity.value = String(practiceV2Runtime.capacityMinutes || 45);
    els.practiceV2Capacity.disabled = phase !== "ready";
  }
  if (publicPick) {
    els.practiceV2ReadyTitle.textContent = publicPick.title;
    els.practiceV2Difficulty.textContent = publicPick.difficulty;
    els.practiceV2TimeBox.textContent = `${publicPick.timeBoxMinutes} minutes`;
    els.practiceV2Evidence.textContent = publicPick.evidenceStatus;
    els.practiceV2Reason.textContent = publicPick.publicReason;
    els.practiceV2AttemptTitle.textContent = publicPick.title;
    els.practiceV2LockedTime.textContent = String(practiceV2Runtime.lockedTimeBoxMinutes || publicPick.timeBoxMinutes);
    els.practiceV2OpenLink.href = publicPick.url || "#";
    els.practiceV2OpenLink.hidden = !publicPick.url;
  } else if (phase === "ready") {
    els.practiceV2ReadyTitle.textContent = "No rep fits the time available.";
    els.practiceV2Difficulty.textContent = "-";
    els.practiceV2TimeBox.textContent = "-";
    els.practiceV2Evidence.textContent = "Try a longer session or return when you have more time.";
    els.practiceV2Reason.textContent = "Stopping without penalty is always valid.";
  }
  els.practiceV2BeginBtn.disabled = !publicPick;
  els.practiceV2ChangeBtn.disabled = !publicPick;

  renderPracticeV2Grade();
  renderPracticeV2Reflection();
  renderPracticeV2Completion();
  clearPracticeV2Spoilers(phase);
}

function clearPracticeV2Spoilers(phase) {
  if (["completed", "session-complete"].includes(phase)) return;
  if (els.practiceV2CompleteSkill) els.practiceV2CompleteSkill.textContent = "";
  if (els.practiceV2CompleteEvidence) els.practiceV2CompleteEvidence.textContent = "";
  if (els.practiceV2CompleteReview) els.practiceV2CompleteReview.textContent = "";
  if (els.practiceV2CompleteSummary) els.practiceV2CompleteSummary.textContent = "";
}

function movePracticeV2(event) {
  if (!practiceV2Runtime || !PRACTICE_V2_WORKFLOW) return;
  const result = PRACTICE_V2_WORKFLOW.transition(practiceV2Runtime, event);
  if (!result.ok) return;
  practiceV2Runtime = result.runtime;
  if (event === "cancel") {
    practiceV2Runtime.startedAt = "";
    practiceV2Runtime.attemptId = "";
    practiceV2Runtime.lockedTimeBoxMinutes = null;
  }
  persistPracticeV2Runtime();
  renderPracticeV2();
}

function beginPracticeV2Rep() {
  if (!practiceV2Runtime?.recommendation?.public) return;
  practiceV2Runtime.attemptId = crypto.randomUUID();
  practiceV2Runtime.startedAt = new Date().toISOString();
  practiceV2Runtime.lockedTimeBoxMinutes = practiceV2Runtime.recommendation.public.timeBoxMinutes;
  practiceV2Runtime.expectedRevision = currentRevision;
  movePracticeV2("begin");
}

function chooseAnotherPracticeV2Rep() {
  const currentId = practiceV2Runtime?.recommendation?.public?.problemId;
  if (!currentId) return;
  practiceV2Runtime.skippedProblemIds = [...new Set([...practiceV2Runtime.skippedProblemIds, currentId])];
  practiceV2Runtime.recommendation = getPracticeV2Recommendation();
  persistPracticeV2Runtime();
  renderPracticeV2();
}

function changePracticeV2Capacity() {
  if (!practiceV2Runtime || practiceV2Runtime.phase !== "ready") return;
  const previousTitle = practiceV2Runtime.recommendation?.public?.title || "";
  practiceV2Runtime.capacityMinutes = Number(els.practiceV2Capacity.value || 45);
  practiceV2Runtime.recommendation = null;
  practiceV2Runtime.skippedProblemIds = [];
  persistPracticeV2Runtime();
  renderPracticeV2();
  const nextTitle = practiceV2Runtime.recommendation?.public?.title || "";
  if (els.practiceV2CapacityHint) {
    els.practiceV2CapacityHint.textContent = nextTitle && nextTitle !== previousTitle
      ? `Rep updated to ${nextTitle} for a ${practiceV2Runtime.capacityMinutes}-minute session.`
      : nextTitle
        ? `${nextTitle} is still the strongest rep within ${practiceV2Runtime.capacityMinutes} minutes.`
        : `No rep currently fits within ${practiceV2Runtime.capacityMinutes} minutes.`;
  }
}

function selectPracticeV2Grade(grade) {
  if (!practiceV2Runtime || practiceV2Runtime.phase !== "grading" || !isProperGrade(grade)) return;
  practiceV2Runtime.provisionalGrade = grade;
  persistPracticeV2Runtime();
  renderPracticeV2Grade();
}

function renderPracticeV2Grade() {
  const grade = practiceV2Runtime?.provisionalGrade || "";
  document.querySelectorAll("[data-v2-grade]").forEach((button) => {
    const selected = button.dataset.v2Grade === grade;
    button.setAttribute("aria-checked", String(selected));
    button.classList.toggle("selected", selected);
  });
  if (els.practiceV2ContinueGradeBtn) els.practiceV2ContinueGradeBtn.disabled = !grade;
}

function continuePracticeV2Grade() {
  if (!practiceV2Runtime?.provisionalGrade) return;
  movePracticeV2("continue");
}

function capturePracticeV2Reflection() {
  if (!practiceV2Runtime || !["reflecting", "saving"].includes(practiceV2Runtime.phase)) return;
  const drafts = practiceV2Runtime.reflectionDrafts;
  drafts.shared.elapsedMinutes = els.practiceV2Elapsed.value;
  drafts.shared.timeTracked = !els.practiceV2TimeUntracked.checked;
  drafts.shared.note = els.practiceV2Note.value;
  drafts.shared.complexityKnown = els.practiceV2Complexity.checked;
  drafts.nonIndependent.assistance = els.practiceV2Assistance.value;
  drafts.nonIndependent.blocker = els.practiceV2Blocker.value;
  drafts.independent.friction = els.practiceV2Friction.value;
  persistPracticeV2Runtime();
  renderPracticeV2Reflection();
}

function renderPracticeV2Reflection() {
  if (!practiceV2Runtime) return;
  const grade = practiceV2Runtime.provisionalGrade;
  const drafts = practiceV2Runtime.reflectionDrafts;
  const labels = { red: "Could not solve", yellow: "Solved with help or heavy friction", green: "Solved independently" };
  if (els.practiceV2SelectedGrade) els.practiceV2SelectedGrade.textContent = labels[grade] || "";
  if (els.practiceV2Elapsed) {
    els.practiceV2Elapsed.value = drafts.shared.elapsedMinutes;
    els.practiceV2Elapsed.disabled = !drafts.shared.timeTracked;
  }
  if (els.practiceV2TimeUntracked) els.practiceV2TimeUntracked.checked = !drafts.shared.timeTracked;
  if (els.practiceV2Assistance) els.practiceV2Assistance.value = drafts.nonIndependent.assistance;
  if (els.practiceV2Blocker) els.practiceV2Blocker.value = drafts.nonIndependent.blocker;
  if (els.practiceV2Friction) els.practiceV2Friction.value = drafts.independent.friction;
  if (els.practiceV2Note) els.practiceV2Note.value = drafts.shared.note;
  if (els.practiceV2Complexity) els.practiceV2Complexity.checked = drafts.shared.complexityKnown;
  const independent = grade === "green";
  if (els.practiceV2AssistanceField) els.practiceV2AssistanceField.hidden = independent;
  if (els.practiceV2BlockerField) els.practiceV2BlockerField.hidden = independent;
  if (els.practiceV2FrictionField) els.practiceV2FrictionField.hidden = !independent;
}

function practiceV2ProblemForRecommendation() {
  const pick = practiceV2Runtime?.recommendation?.public;
  if (!pick) return null;
  return problems.find((problem) => problem.id === pick.problemId)
    || findProblemBySlug(slugFromUrl(pick.url))
    || findProblemByTitle(pick.title)
    || null;
}

function materializePracticeV2Problem() {
  const existing = practiceV2ProblemForRecommendation();
  if (existing) return { problem: existing, created: false };
  const pick = practiceV2Runtime?.recommendation?.public;
  const plan = findBuiltInPlan(slugFromUrl(pick?.url), pick?.title);
  if (!plan) return { problem: null, created: false };
  return { problem: addProblemFromPlan(plan), created: true };
}

function savePracticeV2Rep(event) {
  event.preventDefault();
  if (!practiceV2Runtime || practiceV2Runtime.phase !== "reflecting") return;
  capturePracticeV2Reflection();
  const validation = PRACTICE_V2_WORKFLOW.validateReflection({
    grade: practiceV2Runtime.provisionalGrade,
    draft: practiceV2Runtime.reflectionDrafts,
    lockedTimeBoxMinutes: practiceV2Runtime.lockedTimeBoxMinutes,
  });
  if (!validation.ok) {
    els.practiceV2Error.textContent = Object.values(validation.errors)[0];
    return;
  }
  els.practiceV2Error.textContent = "";
  const { problem, created } = materializePracticeV2Problem();
  if (!problem) {
    els.practiceV2Error.textContent = "This recommendation changed. Choose another rep and try again.";
    return;
  }

  const problemSnapshot = created ? null : cloneState(problem);
  const sessionsSnapshot = cloneState(sessions);
  const recoverySnapshot = cloneState(recoveryProblemIds);
  const recommendation = cloneState(practiceV2Runtime.recommendation);
  const metadata = {
    ...validation.metadata,
    attemptId: practiceV2Runtime.attemptId,
    recommendationId: recommendation.public.recommendationId,
    algorithmVersion: recommendation.algorithmVersion,
    taskType: recommendation.private.taskType,
    startedAt: practiceV2Runtime.startedAt,
    lockedTimeBoxMinutes: practiceV2Runtime.lockedTimeBoxMinutes,
  };
  const attemptType = isAttempted(problemSnapshot || problem) ? "review" : "new";
  practiceV2Runtime.phase = "saving";
  persistPracticeV2Runtime();
  renderPracticeV2();
  applyGrade(problem.id, practiceV2Runtime.provisionalGrade, {
    createdProblemId: created ? problem.id : "",
    problemSnapshot,
    sessionsSnapshot,
    recoverySnapshot,
    attemptType,
    attemptContext: "practice-v2",
    attemptMetadata: metadata,
    note: validation.metadata.note,
    complexityKnown: validation.metadata.complexityKnown,
    suppressPostGradePrompt: true,
  });

  const savedProblem = problems.find((item) => item.id === problem.id);
  const savedEntry = [...(savedProblem?.reviewHistory || [])].reverse().find((entry) => entry.attemptId === metadata.attemptId);
  practiceV2Runtime.phase = "completed";
  practiceV2Runtime.completion = {
    problemId: problem.id,
    title: savedProblem?.title || recommendation.public.title,
    topic: savedProblem?.topic || "General",
    grade: practiceV2Runtime.provisionalGrade,
    rationale: recommendation.private.rationale,
    nextReview: savedEntry?.nextReview || savedProblem?.nextReview || "",
    scheduleReason: savedEntry?.heldForEarly
      ? "early-clean-hold"
      : savedEntry?.heldForOverdue
        ? "overdue-hold"
        : practiceV2Runtime.provisionalGrade === "red"
          ? "reset"
          : "rescheduled",
    taskType: recommendation.private.taskType,
    elapsedMinutes: validation.metadata.elapsedMinutes,
  };
  practiceV2Runtime.undoReceipt = cloneState(lastGradeUndo);
  practiceV2Runtime.skippedProblemIds = [...new Set([...practiceV2Runtime.skippedProblemIds, recommendation.public.problemId])];
  persistPracticeV2Runtime();
  renderPracticeV2();
}

function renderPracticeV2Completion() {
  const completion = practiceV2Runtime?.completion;
  if (!completion) return;
  const copy = {
    red: ["Useful evidence captured.", "The plan can now prioritize the blocker before another independent check."],
    yellow: ["Partial independence recorded.", "The next rep can reinforce the weak point before testing transfer."],
    green: ["Independent evidence recorded.", "The plan can spend less time proving this exact answer and look for broader transfer."],
  }[completion.grade];
  els.practiceV2CompleteTitle.textContent = copy?.[0] || "That rep changed the plan.";
  els.practiceV2CompleteSummary.textContent = copy?.[1] || completion.rationale;
  els.practiceV2CompleteSkill.textContent = completion.topic;
  els.practiceV2CompleteEvidence.textContent = completion.rationale;
  els.practiceV2CompleteReview.textContent = completion.nextReview
    ? `${["early-clean-hold", "overdue-hold"].includes(completion.scheduleReason) ? "Still due" : "Next"} ${formatDate(completion.nextReview)}`
    : "No exact-title review scheduled";
}

function getNextPracticeV2Rep() {
  if (!practiceV2Runtime) return;
  practiceV2Runtime.phase = "ready";
  practiceV2Runtime.recommendation = null;
  practiceV2Runtime.attemptId = "";
  practiceV2Runtime.startedAt = "";
  practiceV2Runtime.lockedTimeBoxMinutes = null;
  practiceV2Runtime.provisionalGrade = "";
  practiceV2Runtime.reflectionDrafts = PRACTICE_V2_WORKFLOW.createRuntime().reflectionDrafts;
  practiceV2Runtime.completion = null;
  persistPracticeV2Runtime();
  renderPracticeV2();
}

function undoPracticeV2Rep() {
  if (!practiceV2Runtime?.undoReceipt) return;
  if (["attempting", "grading", "reflecting"].includes(practiceV2Runtime.phase)) {
    if (!window.confirm("Discard this unsaved attempt and undo the last saved rep?")) return;
  }
  lastGradeUndo = cloneState(practiceV2Runtime.undoReceipt);
  practiceV2Runtime.phase = "reflecting";
  practiceV2Runtime.completion = null;
  practiceV2Runtime.undoReceipt = null;
  persistPracticeV2Runtime();
  undoLastGrade();
  renderPracticeV2();
}

function runPracticeV2Shadow() {
  if (!appEnv.isQa || !isFeatureEnabled("practiceV2Shadow") || !PRACTICE_V2_ENGINE) return;

  const catalog = [
    ...BLIND_75.map((problem) => ({ ...problem, listMemberships: ["blind75"] })),
    ...NEETCODE_150.map((problem) => ({ ...problem, listMemberships: ["neetcode150"] })),
  ];
  const skippedProblemIds = [
    ...skippedDailyPicks.review,
    ...skippedDailyPicks.new,
  ];
  const result = PRACTICE_V2_ENGINE.recommendNextRep({
    state: buildTrackerStatePayload(),
    catalog,
    today: toIsoDate(new Date()),
    capacityMinutes: Number(trainingProfile.defaultSessionMinutes || 45),
    activeProblemId: activeAttempt?.problemId || "",
    skippedProblemIds,
  });
  const trace = {
    generatedAt: new Date().toISOString(),
    liveV0: {
      reviewProblemId: dailyPicks.review?.id || null,
      newProblemId: dailyPicks.newProblem?.id || null,
    },
    readinessV1: result,
  };

  window.__practiceV2Shadow = trace;
  console.info("[practice-v2 shadow]", trace);
}

function renderSkipControls() {
  els.skipReviewBtn.disabled = !dailyPicks.review;
  els.skipNewBtn.disabled = !dailyPicks.newProblem;
}

function skipDailyPick(type) {
  const item = type === "review" ? dailyPicks.review : dailyPicks.newProblem;
  const key = item ? dailyPickKey(type, item) : "";
  if (!key) return;

  if (type === "new" && isColdPracticePick(item)) {
    if (coldGradeDraft && !window.confirm("Discard the unfinished cold-check record and remove this pick?")) return;
    coldGradeDraft = null;
    coldPracticeProblemId = "";
    if (activeAttempt?.problemId === item.id) activeAttempt = null;
    clearPostGradeNote();
    persistColdWorkflowSession();
    renderDailyPicks({ preserveReview: true });
    return;
  }
  const attemptContext = attemptContextFor(type, item);
  if (activeAttempt?.type === attemptContext && activeAttempt.problemId === item.id) {
    if (!window.confirm(`You started ${item.title}. Skip it and leave that attempt?`)) return;
    activeAttempt = null;
    persistColdWorkflowSession();
  }
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
  const recoveryButton = type === "review" ? els.reviewRecoveryBtn : null;
  const isColdCheck = type === "new" && isColdPracticePick(item);
  const cardLabel = card.querySelector(".card-label");
  const timerNudge = card.querySelector(".leetcode-timer-nudge");
  const startButton = type === "review" ? els.reviewStartAttemptBtn : els.newStartAttemptBtn;
  const attemptState = type === "review" ? els.reviewAttemptState : els.newAttemptState;
  resetAttemptState(type);
  if (cardLabel) cardLabel.textContent = isColdCheck ? "Cold check" : type === "review" ? "Review" : "New";
  if (startButton) startButton.textContent = isColdCheck ? "Start cold check" : type === "review" ? "Start review" : "Start new";
  if (timerNudge) {
    timerNudge.textContent = type === "review"
      ? "Use LeetCode's stopwatch while solving. Review target: 10-20 min."
      : "Use LeetCode's stopwatch while solving. Easy 20 min, Medium 30 min, Hard 45 min.";
  }

  if (!item) {
    card.dataset.problemId = "";
    title.textContent = type === "review" ? "No due review" : `No unattempted ${getSelectedStudyList().label}`;
    meta.textContent =
      type === "review"
        ? "Nothing is due today. New graded work will schedule future reviews."
        : `Seed ${getSelectedStudyList().label} or add more problems when you want a larger queue.`;
    if (type === "review") {
      els.reviewReason.textContent = "";
      setReviewReasonVisibility(false);
    }
    openLink.hidden = true;
    openLink.removeAttribute("href");
    if (recoveryButton) {
      recoveryButton.hidden = true;
      recoveryButton.classList.remove("is-passive");
      recoveryButton.removeAttribute("aria-disabled");
    }
    setAttemptUnavailable(type);
    buttons.forEach((button) => (button.disabled = true));
    return;
  }

  card.dataset.problemId = item.id || "";
  card.dataset.slug = item.titleSlug || "";
  card.dataset.attemptContext = isColdCheck ? "cold" : type;
  const timebox = attemptTimebox(type, item);
  if (attemptState) {
    const heading = attemptState.querySelector("strong");
    const copy = attemptState.querySelector("span");
    if (heading) heading.textContent = isColdCheck ? "Cold check started" : type === "review" ? "Review started" : "New attempt started";
    if (copy) copy.textContent = `${timebox} target · record the final time after grading`;
  }
  if (timerNudge && isColdCheck) {
    timerNudge.textContent = `Start LeetCode's stopwatch. Target: ${timebox}. After grading, record the final time, result, assistance, and blocker here.`;
  } else if (timerNudge) {
    timerNudge.textContent = type === "review"
      ? "Use LeetCode's stopwatch while solving. Review target: 10-20 min."
      : "Use LeetCode's stopwatch while solving. Easy 20 min, Medium 30 min, Hard 45 min.";
  }
  title.textContent = item.title;
  meta.innerHTML = renderRecommendationMeta([
    { label: "Topic", value: item.topic || "General" },
    { label: "Difficulty", value: item.difficulty || "Medium" },
    {
      label: type === "review" ? "Timing" : "Source",
      value: type === "review"
        ? reviewTimingLabel(item.nextReview)
        : isColdCheck
          ? "Previously seen; current recall unverified"
          : `Next unattempted ${getSelectedStudyList().label}`,
    },
    { label: "Stage", value: isColdCheck ? "Cold baseline" : stageName(item.stage) },
    { label: "Target", value: timebox },
  ]);
  if (type === "review") {
    els.reviewReason.textContent = explainReviewPick(item);
    setReviewReasonVisibility(Boolean(els.reviewReason.textContent));
  }
  if (item.url) {
    openLink.href = item.url;
    openLink.hidden = false;
  } else {
    openLink.hidden = true;
    openLink.removeAttribute("href");
  }
  if (recoveryButton) {
    if (!canUseRecoveryLane()) {
      recoveryButton.hidden = true;
      recoveryButton.classList.remove("is-passive");
      recoveryButton.removeAttribute("aria-disabled");
    } else {
      const inRecoveryLane = recoveryProblemIds.includes(item.id);
      const canAddToRecovery = item.id && !inRecoveryLane && clampStage(item.stage) < RECOVERY_GRADUATION_STAGE;
      recoveryButton.textContent = inRecoveryLane ? "In Recovery Lane" : "Add to Recovery Lane";
      recoveryButton.classList.toggle("is-passive", inRecoveryLane);
      recoveryButton.disabled = !inRecoveryLane && !canAddToRecovery;
      recoveryButton.setAttribute("aria-disabled", inRecoveryLane ? "true" : "false");
      recoveryButton.hidden = false;
    }
  }
  buttons.forEach((button) => (button.disabled = false));
  syncAttemptState(type, item);
}

function attemptTimebox(type, item) {
  if (type === "review") return "10-20 min";
  const difficulty = normalizeDifficulty(item?.difficulty);
  return `${NEW_ATTEMPT_TIMEBOX_MINUTES[difficulty]} min`;
}

function resetAttemptState(type) {
  const card = type === "review" ? els.reviewCard : els.newCard;
  const startButton = type === "review" ? els.reviewStartAttemptBtn : els.newStartAttemptBtn;
  const attemptState = type === "review" ? els.reviewAttemptState : els.newAttemptState;
  card?.classList.remove("is-attempting");
  if (startButton) {
    startButton.hidden = false;
    startButton.disabled = false;
  }
  if (attemptState) attemptState.hidden = true;
}

function attemptContextFor(type, item) {
  return type === "new" && isColdPracticePick(item) ? "cold" : type;
}

function syncAttemptState(type, item) {
  if (!item || !activeAttempt) return;
  const context = attemptContextFor(type, item);
  if (activeAttempt.problemId !== item.id || activeAttempt.type !== context) return;

  const card = type === "review" ? els.reviewCard : els.newCard;
  const startButton = type === "review" ? els.reviewStartAttemptBtn : els.newStartAttemptBtn;
  const attemptState = type === "review" ? els.reviewAttemptState : els.newAttemptState;
  card?.classList.add("is-attempting");
  if (startButton) startButton.hidden = true;
  if (attemptState) attemptState.hidden = false;
}

function setAttemptUnavailable(type) {
  const startButton = type === "review" ? els.reviewStartAttemptBtn : els.newStartAttemptBtn;
  const attemptState = type === "review" ? els.reviewAttemptState : els.newAttemptState;
  if (startButton) {
    startButton.hidden = false;
    startButton.disabled = true;
  }
  if (attemptState) attemptState.hidden = true;
}

function startAttempt(type) {
  const item = type === "review" ? dailyPicks.review : dailyPicks.newProblem;
  if (!item) return;
  const context = attemptContextFor(type, item);
  if (!allowAttemptSwitch(context, item)) return;
  activeAttempt = { type: context, problemId: item.id, title: item.title };
  persistColdWorkflowSession();
  syncAttemptState(type, item);
  const card = type === "review" ? els.reviewCard : els.newCard;
  window.setTimeout(() => {
    card?.querySelector(".grade-btn:not(:disabled)")?.focus({ preventScroll: true });
  }, 80);
}

function allowAttemptSwitch(nextType, nextProblem) {
  if (!activeAttempt || (activeAttempt.type === nextType && activeAttempt.problemId === nextProblem.id)) return true;
  const activeProblem = problems.find((problem) => problem.id === activeAttempt.problemId);
  const activeTitle = activeProblem?.title || activeAttempt.title || "the current problem";
  if (coldGradeDraft) {
    const discard = window.confirm(
      `You have an unfinished cold-check record for ${activeTitle}. Discard that draft and switch to ${nextProblem.title}?`,
    );
    if (!discard) {
      resumeColdGradeDraft();
      return false;
    }
    cancelColdGradeDraft({ keepSelection: true, renderAfter: false });
  } else if (!window.confirm(`You started ${activeTitle}. Switch to ${nextProblem.title}?`)) {
    return false;
  }
  activeAttempt = null;
  persistColdWorkflowSession();
  return true;
}

function setReviewReasonVisibility(isVisible) {
  const reasonDetail = els.reviewReason?.closest(".pick-reason-detail");
  if (reasonDetail) reasonDetail.hidden = !isVisible;
}

function renderRecommendationMeta(items) {
  return items
    .map(
      (item) => `
        <span>
          <small>${escapeHtml(item.label)}</small>
          <strong>${escapeHtml(item.value)}</strong>
        </span>
      `,
    )
    .join("");
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
  renderSortHeaders();
  els.problemRows.innerHTML = "";
  els.resultCount.textContent = `${rows.length} ${rows.length === 1 ? "problem" : "problems"}`;
  els.emptyState.style.display = problems.length === 0 ? "block" : "none";

  rows.forEach((problem) => {
    const tr = document.createElement("tr");
    if (isFeatureEnabled("practiceV2")) {
      tr.className = "library-v2-row";
      tr.innerHTML = renderPracticeV2LibraryRow(problem);
      els.problemRows.appendChild(tr);
      return;
    }

    const seenUnverified = isSeenUnverified(problem);
    const displayStatus = problemDisplayStatus(problem);
    const displayStage = problemDisplayStage(problem);
    const displayReview = problemDisplayReview(problem);
    const reviewClass = !seenUnverified && isReviewDue(problem.nextReview) ? "review-due" : "";
    const titleNode = `<button type="button" data-edit="${problem.id}">${escapeHtml(problem.title)}</button>`;
    const openNode = problem.url
      ? `<a class="icon-btn row-open-link row-action-btn row-action-primary" href="${escapeAttr(problem.url)}" target="_blank" rel="noreferrer" aria-label="Open ${escapeAttr(problem.title)} on LeetCode">LeetCode</a>`
      : "";
    const recoveryNode =
      canUseRecoveryLane() && clampStage(problem.stage) < RECOVERY_GRADUATION_STAGE && !recoveryProblemIds.includes(problem.id)
        ? `<button class="icon-btn row-action-btn recovery-row-btn" type="button" data-recovery-add="${escapeAttr(problem.id)}" aria-label="Add ${escapeAttr(problem.title)} to Recovery Lane">Recover</button>`
        : "";
    const practiceNode = seenUnverified && !isFeatureEnabled("practiceV2")
      ? `<button class="icon-btn row-action-btn cold-practice-btn" type="button" data-cold-practice="${escapeAttr(problem.id)}" aria-label="Practice ${escapeAttr(problem.title)} now">Practice now</button>`
      : "";
    const memberships = renderMembershipBadges(problem);
    const attempts = Number(problem.completionCount || 0);
    const compactMeta = [
      problem.difficulty,
      problem.topic || "General",
      `${attempts} ${attempts === 1 ? "attempt" : "attempts"}`,
      displayReview,
    ]
      .filter(Boolean)
      .map((item) => `<span>${escapeHtml(item)}</span>`)
      .join("");
    const compactSignals = `
      <span class="stage-pill ${seenUnverified ? "stage-unverified" : ""}">${escapeHtml(displayStage)}</span>
      <span class="pill ${seenUnverified ? "status-unverified" : `status-${problem.status}`}">${escapeHtml(displayStatus)}</span>
      <span class="review-date ${reviewClass}">${escapeHtml(displayReview)}</span>
    `;

    tr.innerHTML = `
      <td>
        <div class="problem-title">
          ${titleNode}
          <span class="problem-meta-compact">${compactMeta}</span>
          <span class="notes-preview">${escapeHtml(problem.notes || "No notes yet")}</span>
          ${memberships}
          <span class="row-mobile-signals">${compactSignals}</span>
        </div>
      </td>
      <td><span class="pill ${seenUnverified ? "status-unverified" : `status-${problem.status}`}">${escapeHtml(displayStatus)}</span></td>
      <td><span class="stage-pill ${seenUnverified ? "stage-unverified" : ""}">${escapeHtml(displayStage)}</span></td>
      <td><span class="difficulty-${problem.difficulty}">${problem.difficulty}</span></td>
      <td>${escapeHtml(problem.topic || "General")}</td>
      <td>${Number(problem.completionCount || 0)}</td>
      <td><span class="review-date ${reviewClass}">${escapeHtml(displayReview)}</span></td>
      <td>
        <div class="row-actions">
          ${openNode}
          ${practiceNode}
          ${recoveryNode}
          <button class="icon-btn row-action-btn" type="button" data-edit="${problem.id}" aria-label="Edit ${escapeAttr(problem.title)}">Details</button>
        </div>
      </td>
    `;

    els.problemRows.appendChild(tr);
  });

  els.problemRows.querySelectorAll("[data-edit]").forEach((button) => {
    button.addEventListener("click", () => openDialog(button.dataset.edit));
  });
  els.problemRows.querySelectorAll("[data-recovery-add]").forEach((button) => {
    button.addEventListener("click", () => addToRecoveryLane(button.dataset.recoveryAdd));
  });
  els.problemRows.querySelectorAll("[data-cold-practice]").forEach((button) => {
    button.addEventListener("click", () => startColdPractice(button.dataset.coldPractice));
  });
}

function renderPracticeV2LibraryRow(problem) {
  const activeAttempt = isPracticeV2LibraryAttemptActive(problem);
  const evidence = activeAttempt
    ? {
        key: "active",
        label: "Attempt in progress",
        detail: "Finish or cancel the attempt to reveal evidence.",
        stale: false,
      }
    : getProblemEvidenceSummary(problem);
  const exactReview = activeAttempt
    ? { label: "Hidden during attempt", detail: "Your exact-title schedule is unchanged." }
    : getExactReviewSummary(problem);
  const titleNode = activeAttempt
    ? `<strong class="library-problem-title is-locked">${escapeHtml(problem.title)}</strong>`
    : `<button class="library-problem-title" type="button" data-edit="${escapeAttr(problem.id)}" aria-label="Open details for ${escapeAttr(problem.title)}">${escapeHtml(problem.title)}</button>`;
  const topic = activeAttempt ? "Topic hidden during attempt" : problem.topic || "General";
  const memberships = renderMembershipBadges(problem);
  const openNode = problem.url
    ? `<a class="library-external-link" href="${escapeAttr(problem.url)}" target="_blank" rel="noreferrer" aria-label="Open ${escapeAttr(problem.title)} on LeetCode">LeetCode <span aria-hidden="true">&#8599;</span></a>`
    : `<span class="library-action-unavailable">No link</span>`;

  return `
    <td class="library-problem-cell">
      <div class="library-problem-main">
        ${titleNode}
        <p class="library-problem-meta">
          <span class="difficulty-${escapeAttr(problem.difficulty)}">${escapeHtml(problem.difficulty)}</span>
          <span aria-hidden="true">&middot;</span>
          <span>${escapeHtml(topic)}</span>
        </p>
        ${memberships ? `<div class="library-memberships">${memberships}</div>` : ""}
      </div>
    </td>
    <td class="library-evidence-cell">
      <div class="library-evidence">
        <span class="evidence-badge evidence-${escapeAttr(evidence.key)}">${escapeHtml(evidence.label)}</span>
        ${evidence.stale ? `<span class="evidence-modifier">Stale</span>` : ""}
        <small>${escapeHtml(evidence.detail)}</small>
      </div>
    </td>
    <td class="library-review-cell">
      <div class="library-exact-review">
        <strong>${escapeHtml(exactReview.label)}</strong>
        <small>${escapeHtml(exactReview.detail)}</small>
      </div>
    </td>
    <td class="library-action-cell">
      ${openNode}
    </td>
  `;
}

function isPracticeV2LibraryAttemptActive(problem) {
  if (!isFeatureEnabled("practiceV2") || !practiceV2Runtime) return false;
  if (!["attempting", "grading", "reflecting", "saving"].includes(practiceV2Runtime.phase)) return false;
  return practiceV2ProblemForRecommendation()?.id === problem.id;
}

function getProblemEvidenceSummary(problem) {
  const latestGrade = latestProperGradeEntry(problem);
  if (!latestGrade) {
    const hasPriorContext = isSeenUnverified(problem) || isAttempted(problem);
    return hasPriorContext
      ? {
          key: "unverified",
          label: "Assessment pending",
          detail: "Historical exposure only; current recall is unverified.",
          stale: false,
        }
      : {
          key: "unseen",
          label: "Unseen",
          detail: "No trusted attempt yet.",
          stale: false,
        };
  }

  const date = normalizeDate(latestGrade.date);
  const ageDays = date ? Math.max(0, Math.floor((dateOnly(new Date()) - parseIsoDate(date)) / 86400000)) : 0;
  const byGrade = {
    red: { key: "repair", label: "Needs repair" },
    yellow: { key: "assisted", label: "Assisted" },
    green: isIndependentHistoryEntry(latestGrade)
      ? { key: "independent", label: "Independent" }
      : { key: "assisted", label: "Assisted" },
  };
  const state = byGrade[latestGrade.grade] || byGrade.yellow;
  return {
    ...state,
    detail: date ? `Last checked ${formatDate(date)}` : "Latest honest result recorded",
    stale: Boolean(date && ageDays > PRACTICE_V2_EVIDENCE_WINDOW_DAYS),
  };
}

function isIndependentHistoryEntry(entry) {
  if (entry?.grade !== "green") return false;
  const assistance = String(entry.assistance || "none").toLowerCase();
  return !["hint", "solution", "editorial", "person", "ai"].includes(assistance);
}

function latestProperGradeEntry(problem) {
  const latestHistoryEntry = (problem.reviewHistory || [])
    .filter((entry) => isProperGrade(entry.grade))
    .map((entry, index) => ({ entry, index, value: libraryHistoryDateValue(entry.date) }))
    .sort((a, b) => a.value - b.value || a.index - b.index)
    .at(-1)?.entry;

  if (latestHistoryEntry) return latestHistoryEntry;
  if (!isProperGrade(problem.lastGrade)) return null;

  return {
    grade: problem.lastGrade,
    date: normalizeDate(problem.lastReviewedAt || problem.firstAttemptAt),
    source: "legacy-summary",
  };
}

function libraryHistoryDateValue(value) {
  const normalized = normalizeDate(value);
  return normalized ? parseIsoDate(normalized).getTime() : 0;
}

function latestLibraryActivityValue(problem) {
  return Math.max(0, ...(problem.reviewHistory || []).map((entry) => libraryHistoryDateValue(entry.date)));
}

function getExactReviewSummary(problem) {
  if (!hasProperGradeHistory(problem)) {
    return {
      label: "Not scheduled",
      detail: isAttempted(problem) ? "Starts after an honest assessment." : "Starts after the first grade.",
    };
  }

  const nextReview = normalizeDate(problem.nextReview);
  if (!nextReview) return { label: "Not scheduled", detail: "No exact-title date set." };
  return {
    label: isReviewDue(nextReview) ? "Due now" : "Scheduled",
    detail: `${formatDate(nextReview)} · same-title recall`,
  };
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
  const normalizedSelected = canonicalTopic(selectedTopic);
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
        .map(canonicalTopic)
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
  const usesAdaptivePractice = isFeatureEnabled("practiceV2");

  return problems
    .filter((problem) => {
      const evidence = usesAdaptivePractice ? getProblemEvidenceSummary(problem) : null;
      const derivedStatus = usesAdaptivePractice
        ? evidence.key
        : isSeenUnverified(problem)
          ? "unverified"
          : problem.status;
      const haystack = [
        problem.title,
        problem.topic,
        usesAdaptivePractice ? "" : problem.notes,
        problem.difficulty,
        derivedStatus,
        usesAdaptivePractice ? evidence.label : problemDisplayStage(problem),
      ]
        .join(" ")
        .toLowerCase();
      return (
        (!query || haystack.includes(query)) &&
        (status === "all" || (usesAdaptivePractice ? evidenceFilterMatches(evidence, status) : derivedStatus === status)) &&
        (difficulty === "all" || problem.difficulty === difficulty) &&
        (topic === "all" || problem.topic === topic) &&
        (list === "all" ||
          (list === "blind75" && problem.listMemberships?.includes("blind75")) ||
          (list === "neetcode150" && problem.listMemberships?.includes("neetcode150")) ||
          (list === "due" && hasProperGradeHistory(problem) && isReviewDue(problem.nextReview)))
      );
    })
    .sort(sortProblems);
}

function evidenceFilterMatches(evidence, filter) {
  if (filter === "stale") return Boolean(evidence.stale);
  return evidence.key === filter;
}

function sortProblems(a, b) {
  const difficultyRank = { Easy: 1, Medium: 2, Hard: 3 };
  const statusRank = { todo: 1, solving: 2, review: 3, solved: 4 };
  const direction = tableSort.direction === "desc" ? -1 : 1;

  let result = 0;

  if (tableSort.column === "nextReview") {
    const aReviewDate = isSeenUnverified(a) ? "" : a.nextReview;
    const bReviewDate = isSeenUnverified(b) ? "" : b.nextReview;
    result = compareReviewDates(aReviewDate, bReviewDate, tableSort.direction);
  } else if (tableSort.column === "updated") {
    result = new Date(a.updatedAt || 0) - new Date(b.updatedAt || 0);
  } else if (tableSort.column === "lastActivity") {
    result = latestLibraryActivityValue(a) - latestLibraryActivityValue(b);
  } else if (tableSort.column === "difficulty") {
    result = difficultyRank[a.difficulty] - difficultyRank[b.difficulty];
  } else if (tableSort.column === "topic") {
    result = (a.topic || "").localeCompare(b.topic || "");
  } else if (tableSort.column === "title") {
    result = a.title.localeCompare(b.title);
  } else if (tableSort.column === "status") {
    result = (statusRank[a.status] || 0) - (statusRank[b.status] || 0);
  } else if (tableSort.column === "stage") {
    result = clampStage(a.stage) - clampStage(b.stage);
  } else if (tableSort.column === "attempts") {
    result = Number(a.completionCount || 0) - Number(b.completionCount || 0);
  }

  return (tableSort.column === "nextReview" ? result : result * direction) || a.title.localeCompare(b.title);
}

function compareReviewDates(aDate, bDate, direction) {
  const aMissing = !aDate;
  const bMissing = !bDate;
  if (aMissing && bMissing) return 0;
  if (aMissing) return 1;
  if (bMissing) return -1;

  const comparison = dateValue(aDate) - dateValue(bDate);
  return direction === "desc" ? -comparison : comparison;
}

function sortSelectValueToTableSort(value) {
  const mappings = {
    recentPractice: { column: "lastActivity", direction: "desc" },
    title: { column: "title", direction: "asc" },
    due: { column: "nextReview", direction: "asc" },
    dueDesc: { column: "nextReview", direction: "desc" },
    updated: { column: "updated", direction: "desc" },
    difficulty: { column: "difficulty", direction: "desc" },
    topic: { column: "topic", direction: "asc" },
  };
  return mappings[value] || (isFeatureEnabled("practiceV2") ? mappings.recentPractice : mappings.due);
}

function syncSortSelect() {
  const valueBySort = {
    "lastActivity:desc": "recentPractice",
    "title:asc": "title",
    "nextReview:asc": "due",
    "nextReview:desc": "dueDesc",
    "updated:desc": "updated",
    "difficulty:desc": "difficulty",
    "topic:asc": "topic",
  };
  const value = valueBySort[`${tableSort.column}:${tableSort.direction}`] || "";
  if (value) els.sortSelect.value = value;
}

function renderSortHeaders() {
  tableSortHeaders.forEach((header) => {
    const isActive = header.dataset.sortColumn === tableSort.column;
    header.setAttribute("aria-sort", isActive ? (tableSort.direction === "asc" ? "ascending" : "descending") : "none");
  });

  tableSortButtons.forEach((button) => {
    const isActive = button.dataset.tableSort === tableSort.column;
    button.classList.toggle("is-active", isActive);
    button.dataset.direction = isActive ? tableSort.direction : "";
  });
}

function getDailyPicks(options = {}) {
  const review =
    options.preserveReview && isCurrentReviewPickAvailable(dailyPicks.review)
      ? dailyPicks.review
      : getNextReviewPick();
  const coldProblem = getColdPracticeProblem();
  const newProblem = coldProblem || (
    options.preserveNew && isCurrentNewPickAvailable(dailyPicks.newProblem)
      ? dailyPicks.newProblem
      : getNextStudyListProblem(review?.topic, getSelectedStudyListId())
  );
  return { review, newProblem };
}

function getNextReviewPick() {
  const dueReviews = getDueReviews().filter((problem) => !skippedDailyPicks.review.has(problem.id));
  if (!canUseRecoveryLane()) return dueReviews[0] || null;
  return dueReviews.find((problem) => recoveryProblemIds.includes(problem.id)) || dueReviews[0] || null;
}

function getDueReviews() {
  const recentTopics = getRecentTopics(7);
  return problems
    .filter((problem) => hasProperGradeHistory(problem) && problem.nextReview && isReviewDue(problem.nextReview))
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
  return problems.some((problem) =>
    problem.id === item.id &&
    hasProperGradeHistory(problem) &&
    problem.nextReview &&
    isReviewDue(problem.nextReview)
  );
}

function isCurrentNewPickAvailable(item) {
  if (isColdPracticePick(item)) return isSeenUnverified(item);
  const key = item ? dailyPickKey("new", item) : "";
  if (!key || skippedDailyPicks.new.has(key)) return false;
  if (!item.listMemberships?.includes(getSelectedStudyList().membership)) return false;
  const existing = findProblemBySlug(item.titleSlug) || findProblemByTitle(item.title);
  return !existing || !isAttempted(existing);
}

function getColdPracticeProblem() {
  if (!coldPracticeProblemId) return null;
  const selectedProblemId = coldPracticeProblemId;
  const problem = problems.find((item) => item.id === selectedProblemId);
  if (!problem || !isSeenUnverified(problem)) {
    coldPracticeProblemId = "";
    if (coldGradeDraft?.problemId === selectedProblemId) coldGradeDraft = null;
    if (activeAttempt?.problemId === selectedProblemId) activeAttempt = null;
    persistColdWorkflowSession();
    return null;
  }
  return problem;
}

function isColdPracticePick(item) {
  return Boolean(item?.id && coldPracticeProblemId && item.id === coldPracticeProblemId);
}

function startColdPractice(id) {
  const problem = problems.find((item) => item.id === id);
  if (!problem || !isSeenUnverified(problem)) return;
  if (coldGradeDraft && coldGradeDraft.problemId !== id) {
    const existing = problems.find((item) => item.id === coldGradeDraft.problemId);
    if (!window.confirm(`Discard the unfinished cold-check record for ${existing?.title || "the current problem"}?`)) return;
  }
  coldPracticeProblemId = id;
  coldGradeDraft = null;
  activeAttempt = null;
  clearPostGradeNote();
  persistColdWorkflowSession();
  skippedDailyPicks.new = new Set();
  navigateToRoute("dashboard");
  renderDailyPicks({ preserveReview: true });
  els.newCard?.scrollIntoView({ behavior: "smooth", block: "center" });
}

function dailyPickKey(type, item) {
  return type === "review" ? item.id || "" : item.titleSlug || slugifyTitle(item.title);
}

function getRecentTopics(days) {
  const cutoff = addDays(dateOnly(new Date()), -days).getTime();
  return getActivitySessions()
    .filter((session) => dateValue(session.date) >= cutoff)
    .map((session) => session.topic)
    .filter(Boolean);
}

function getActivitySessions() {
  const sessionKeys = new Set(sessions.map(sessionActivityKey));
  const backfillSessions = [];

  problems.forEach((problem) => {
    (problem.reviewHistory || []).forEach((entry) => {
      if (!entry.backfilled || !isProperGrade(entry.grade)) return;

      const session = {
        date: normalizeDate(entry.date),
        problemId: problem.id,
        title: problem.title,
        topic: problem.topic,
        grade: entry.grade,
        attemptType: inferBackfillAttemptType(problem, entry),
        stage: entry.newStage ?? problem.stage,
        status: problem.status,
        backfilled: true,
        historyEntryId: entry.id || "",
      };
      const key = sessionActivityKey(session);
      if (!session.date || sessionKeys.has(key)) return;
      sessionKeys.add(key);
      backfillSessions.push(session);
    });
  });

  return [...sessions, ...backfillSessions];
}

function sessionActivityKey(session) {
  return (
    session.historyEntryId ||
    [session.problemId || "", normalizeDate(session.date), session.grade || "", session.backfilled ? "backfilled" : "session"].join("|")
  );
}

function topicPenalty(topic, recentTopics) {
  return recentTopics.filter((recentTopic) => recentTopic === topic).length;
}

function gradeDailyPick(cardType, grade) {
  const pick = cardType === "review" ? dailyPicks.review : dailyPicks.newProblem;
  if (!pick) return;

  const existing = pick.id ? problems.find((problem) => problem.id === pick.id) : findProblemBySlug(pick.titleSlug);
  const isColdCheck = cardType === "new" && (isColdPracticePick(pick) || isSeenUnverified(existing));
  const attemptContext = isColdCheck ? "cold" : cardType === "review" ? "review" : "new";
  if (!allowAttemptSwitch(attemptContext, existing || pick)) return;
  if (isColdCheck && existing) {
    beginColdGradeDraft(existing, grade);
    return;
  }

  const problemSnapshot = existing ? cloneState(existing) : null;
  const sessionsSnapshot = cloneState(sessions);
  const recoverySnapshot = cloneState(recoveryProblemIds);
  if (existing && cardType === "new" && !isColdCheck) {
    existing.listMemberships = mergeMemberships(existing.listMemberships, [getSelectedStudyList().membership]);
  }
  const problem = existing || addProblemFromPlan(pick);
  activeAttempt = null;
  persistColdWorkflowSession();
  applyGrade(problem.id, grade, {
    createdProblemId: existing ? "" : problem.id,
    problemSnapshot,
    sessionsSnapshot,
    recoverySnapshot,
    attemptType: attemptContext,
    attemptContext,
  });
}

function beginColdGradeDraft(problem, grade) {
  if (!problem || !isSeenUnverified(problem) || !isProperGrade(grade)) return;
  if (coldGradeDraft?.problemId === problem.id) {
    coldGradeDraft.grade = grade;
    persistColdWorkflowSession();
    showColdGradeDraftPrompt(problem);
    return;
  }
  coldPracticeProblemId = problem.id;
  activeAttempt = { type: "cold", problemId: problem.id, title: problem.title };
  coldGradeDraft = {
    problemId: problem.id,
    grade,
    durationMinutes: "",
    result: grade === "red" ? "incomplete" : "accepted",
    assistance: grade === "green" ? "none" : grade === "yellow" ? "hint" : "solution",
    blocker: "",
    coldScore: grade === "green" ? "4" : grade === "yellow" ? "2" : "0",
    note: "",
    tags: [],
    complexityKnown: Boolean(problem.complexityKnown),
  };
  persistColdWorkflowSession();
  showColdGradeDraftPrompt(problem);
}

function applyGrade(id, grade, undoContext = {}) {
  const today = toIsoDate(new Date());
  const now = new Date().toISOString();

  let gradeTransition = null;

  problems = problems.map((problem) => {
    if (problem.id !== id) return problem;

    const previousCount = Number(problem.completionCount || 0);
    const coldStart = isSeenUnverified(problem);
    const transition = getGradeTransition({
      grade,
      currentStage: problem.stage,
      currentGreenStreak: problem.greenStreak,
      scheduledReview: problem.nextReview,
      attemptDate: today,
      coldStart,
    });
    const reviewEntry = {
      date: today,
      createdAt: now,
      grade,
      id: crypto.randomUUID(),
      scheduledReview: problem.nextReview || "",
      previousStage: transition.previousStage,
      newStage: transition.newStage,
      wasOverdue: transition.daysOverdue > 0,
      daysOverdue: transition.daysOverdue,
      heldForEarly: transition.heldForEarly,
      heldForOverdue: transition.heldForOverdue,
      intervalDays: transition.intervalDays,
      nextReview: transition.nextReview,
      attemptContext: undoContext.attemptContext || (coldStart ? "cold" : undoContext.attemptType || ""),
      benchmarkPending:
        coldStart &&
        !undoContext.attemptMetadata &&
        undoContext.attemptContext !== "practice-v2",
      ...(undoContext.note != null ? { note: undoContext.note } : {}),
      ...(Array.isArray(undoContext.tags) ? { tags: undoContext.tags } : {}),
      ...(undoContext.attemptMetadata || {}),
    };
    gradeTransition = transition;
    const nextProblem = normalizeProblem({
      ...problem,
      status: "review",
      completionCount: previousCount + 1,
      stage: transition.newStage,
      currentIntervalDays: transition.intervalDays,
      greenStreak: transition.greenStreak,
      lastGrade: grade,
      lastReviewedAt: today,
      firstAttemptAt: problem.firstAttemptAt || today,
      nextReview: transition.nextReview,
      reviewHistory: [...(problem.reviewHistory || []), reviewEntry],
      solvedAt: grade === "green" ? problem.solvedAt || now : problem.solvedAt || "",
      notes: undoContext.note != null ? undoContext.note : problem.notes,
      complexityKnown: undoContext.complexityKnown == null ? problem.complexityKnown : undoContext.complexityKnown,
      updatedAt: now,
    });

    return applyMasteryStatus(nextProblem);
  });

  const gradedProblem = problems.find((problem) => problem.id === id);
  if (gradedProblem) {
    const latestHistoryEntry = gradedProblem.reviewHistory?.[gradedProblem.reviewHistory.length - 1];
    lastGradeUndo = {
      problemId: id,
      title: gradedProblem.title,
      createdProblemId: undoContext.createdProblemId || "",
      problemSnapshot: undoContext.problemSnapshot || null,
      sessionsSnapshot: undoContext.sessionsSnapshot || cloneState(sessions),
      recoverySnapshot: undoContext.recoverySnapshot || cloneState(recoveryProblemIds),
      restoreColdPractice: undoContext.attemptType === "cold",
    };
    maybeGraduateRecoveryProblem(gradedProblem);
    sessions = [
      {
        date: today,
        problemId: id,
        title: gradedProblem.title,
        topic: gradedProblem.topic,
        grade,
        attemptType: undoContext.attemptType || "",
        attemptContext: latestHistoryEntry?.attemptContext || undoContext.attemptContext || "",
        stage: gradedProblem.stage,
        status: gradedProblem.status,
        historyEntryId: latestHistoryEntry?.id || "",
        ...(undoContext.attemptMetadata || {}),
      },
      ...sessions,
    ];
  }

  if (coldPracticeProblemId === id) coldPracticeProblemId = "";
  if (activeAttempt?.problemId === id) activeAttempt = null;
  persistColdWorkflowSession();

  persist();
  render();
  if (els.gradeResult && gradeTransition) els.gradeResult.textContent = buildGradeResultSummary(gradeTransition);
  celebrateRep(undoContext.attemptType || "");
  if (!undoContext.suppressPostGradePrompt) showPostGradeNotePrompt(gradedProblem);
}

function celebrateRep(attemptType) {
  if (!els.todayPanel) return;
  els.todayPanel.classList.remove("is-rep-complete");
  window.requestAnimationFrame(() => {
    els.todayPanel.classList.add("is-rep-complete");
  });
  window.setTimeout(() => {
    els.todayPanel.classList.remove("is-rep-complete");
  }, 1600);
}

function undoLastGrade() {
  if (!lastGradeUndo) return;

  const { problemId, createdProblemId, problemSnapshot, sessionsSnapshot, recoverySnapshot, restoreColdPractice, title } = lastGradeUndo;
  problems = createdProblemId
    ? problems.filter((problem) => problem.id !== createdProblemId)
    : problems.map((problem) => (problem.id === problemId ? normalizeProblem(problemSnapshot) : problem));
  sessions = sessionsSnapshot;
  recoveryProblemIds = Array.isArray(recoverySnapshot) ? recoverySnapshot : recoveryProblemIds;
  if (restoreColdPractice && problemSnapshot) {
    coldPracticeProblemId = problemId;
    activeAttempt = { type: "cold", problemId, title: problemSnapshot.title };
  }
  lastGradeUndo = null;

  persist();
  clearPostGradeNote();
  persistColdWorkflowSession();
  render();
  if (els.gradeResult) els.gradeResult.textContent = `Undid last grade for ${title}.`;
}

function showPostGradeNotePrompt(problem, preferredEntry = null) {
  if (!problem) return;
  const shouldShowComplexity = problem.lastGrade === "green" || problem.lastGrade === "yellow";
  const latestEntry = preferredEntry || [...(problem.reviewHistory || [])].reverse().find((entry) => isProperGrade(entry.grade));
  pendingNoteProblemId = problem.id;
  pendingNoteHistoryEntryId = latestEntry?.id || "";
  pendingAttemptContext = latestEntry?.attemptContext || "";
  const feedback = postGradeFeedbackFor(problem.lastGrade);
  els.postGradeBadge.textContent = feedback.badge;
  els.postGradeFeedback.textContent = feedback.copy;
  const isCold = latestEntry?.attemptContext === "cold";
  setPostGradeOptionalFieldsVisibility(true);
  els.postGradeDraftGradeInput.disabled = true;
  els.undoGradeBtn.textContent = "Undo grade";
  els.savePostGradeNoteBtn.hidden = false;
  els.postGradeTitle.textContent = isCold ? `Complete the cold check for ${problem.title}` : `Leave one note for ${problem.title}?`;
  if (els.postGradeHelper) {
    els.postGradeHelper.textContent = isCold
      ? "Record the benchmark first. Notes and learning signals below are optional."
      : "Optional, but useful: pattern, mistake, edge case, or complexity reminder.";
  }
  els.postGradeNotesInput.value = latestEntry?.note || problem.notes || "";
  setSelectedPostGradeTags(latestEntry?.tags || []);
  els.postGradeComplexityInput.checked = Boolean(problem.complexityKnown);
  els.postGradeComplexityField.hidden = !shouldShowComplexity;
  configurePostGradeBenchmark(latestEntry, problem.lastGrade);
  els.postGradeNote.hidden = false;
  if (isCold) {
    window.requestAnimationFrame(() => {
      els.postGradeNote.scrollIntoView({ behavior: "smooth", block: "start" });
      els.postGradeDurationInput.focus({ preventScroll: true });
    });
  }
}

function showColdGradeDraftPrompt(problem) {
  if (!problem || !coldGradeDraft || coldGradeDraft.problemId !== problem.id) return;
  pendingNoteProblemId = problem.id;
  pendingNoteHistoryEntryId = "";
  pendingAttemptContext = "cold";
  setPostGradeOptionalFieldsVisibility(true);
  els.postGradeBadge.textContent = "Provisional grade";
  els.postGradeFeedback.textContent = "Finish the record to set this baseline.";
  els.postGradeTitle.textContent = `Finish the cold check for ${problem.title}`;
  els.postGradeHelper.textContent = "Confirm the grade and stopwatch evidence. Nothing has been scheduled yet.";
  els.postGradeDraftGradeInput.disabled = false;
  els.postGradeDraftGradeInput.value = coldGradeDraft.grade;
  els.postGradeDurationInput.value = coldGradeDraft.durationMinutes;
  els.postGradeResultInput.value = coldGradeDraft.result;
  els.postGradeAssistanceInput.value = coldGradeDraft.assistance;
  els.postGradeBlockerInput.value = coldGradeDraft.blocker;
  els.postGradeColdScoreInput.value = String(coldGradeDraft.coldScore);
  els.postGradeNotesInput.value = coldGradeDraft.note;
  setSelectedPostGradeTags(coldGradeDraft.tags);
  els.postGradeComplexityInput.checked = coldGradeDraft.complexityKnown;
  els.postGradeComplexityField.hidden = coldGradeDraft.grade === "red";
  els.postGradeBenchmarkFields.hidden = false;
  els.postGradeBenchmarkError.textContent = "";
  els.skipPostGradeNoteBtn.hidden = true;
  els.undoGradeBtn.textContent = "Back to attempt";
  els.savePostGradeNoteBtn.hidden = false;
  els.savePostGradeNoteBtn.textContent = "Finish cold check";
  els.postGradeNote.hidden = false;
  window.requestAnimationFrame(() => {
    els.postGradeNote.scrollIntoView({ behavior: "smooth", block: "start" });
    els.postGradeDurationInput.focus({ preventScroll: true });
  });
}

function resumeColdGradeDraft() {
  const problem = problems.find((item) => item.id === coldGradeDraft?.problemId && isSeenUnverified(item));
  if (!problem) {
    coldGradeDraft = null;
    persistColdWorkflowSession();
    return;
  }
  coldPracticeProblemId = problem.id;
  activeAttempt = { type: "cold", problemId: problem.id, title: problem.title };
  persistColdWorkflowSession();
  showColdGradeDraftPrompt(problem);
}

function resumePendingColdBenchmark() {
  if (pendingNoteProblemId || getCurrentRoute() !== "dashboard") return;

  const pending = problems
    .flatMap((problem) =>
      (problem.reviewHistory || [])
        .filter((entry) => entry.attemptContext === "cold" && entry.benchmarkPending)
        .map((entry) => ({ problem, entry })),
    )
    .sort((a, b) => dateValue(b.entry.createdAt || b.entry.date) - dateValue(a.entry.createdAt || a.entry.date))[0];

  if (pending) showPostGradeNotePrompt(pending.problem, pending.entry);
}

function configurePostGradeBenchmark(entry, grade) {
  const isCold = entry?.attemptContext === "cold";
  if (!els.postGradeBenchmarkFields) return;
  els.postGradeBenchmarkFields.hidden = !isCold;
  els.skipPostGradeNoteBtn.hidden = isCold;
  els.savePostGradeNoteBtn.textContent = isCold ? "Save benchmark" : "Save note";
  if (!isCold) return;

  els.postGradeDraftGradeInput.value = grade;
  els.postGradeDraftGradeInput.disabled = true;
  els.postGradeDurationInput.value = entry?.durationMinutes || "";
  els.postGradeResultInput.value = entry?.result || (grade === "red" ? "incomplete" : "accepted");
  els.postGradeAssistanceInput.value = entry?.assistance || (grade === "green" ? "none" : grade === "yellow" ? "hint" : "solution");
  els.postGradeBlockerInput.value = entry?.blocker || "";
  els.postGradeColdScoreInput.value = entry?.coldScore ?? (grade === "green" ? "4" : grade === "yellow" ? "2" : "0");
  els.postGradeBenchmarkError.textContent = "";
}

function postGradeFeedbackFor(grade) {
  const feedback = {
    red: {
      badge: "Minimum day complete",
      copy: "Good signal. We will bring it back sooner.",
    },
    yellow: {
      badge: "Minimum day complete",
      copy: "Useful rep. The path is getting clearer.",
    },
    green: {
      badge: "Minimum day complete",
      copy: "Clean recall logged. Momentum protected.",
    },
  };
  return feedback[grade] || { badge: "Minimum day complete", copy: "Momentum protected." };
}

function buildGradeResultSummary(transition) {
  if (transition.coldStart) return `Cold baseline set. Next review ${formatDate(transition.nextReview)}.`;
  const held = transition.heldForEarly || transition.heldForOverdue;
  const lead = held ? "Stage held." : "Next review";
  return held ? `${lead} Next review ${formatDate(transition.nextReview)}.` : `${lead} ${formatDate(transition.nextReview)}.`;
}

function clearPostGradeNote() {
  pendingNoteProblemId = "";
  pendingNoteHistoryEntryId = "";
  pendingAttemptContext = "";
  els.postGradeNotesInput.value = "";
  if (els.postGradeHelper) {
    els.postGradeHelper.textContent = "Optional, but useful: pattern, mistake, edge case, or complexity reminder.";
  }
  setSelectedPostGradeTags([]);
  els.postGradeComplexityInput.checked = false;
  els.postGradeComplexityField.hidden = true;
  if (els.postGradeBenchmarkFields) els.postGradeBenchmarkFields.hidden = true;
  if (els.postGradeBenchmarkError) els.postGradeBenchmarkError.textContent = "";
  els.skipPostGradeNoteBtn.hidden = false;
  els.undoGradeBtn.textContent = "Undo grade";
  els.savePostGradeNoteBtn.hidden = false;
  els.savePostGradeNoteBtn.textContent = "Save note";
  setPostGradeOptionalFieldsVisibility(true);
  els.postGradeNote.hidden = true;
}

function setPostGradeOptionalFieldsVisibility(isVisible) {
  if (els.postGradeTags) els.postGradeTags.hidden = !isVisible;
  if (els.postGradeNotesInput) els.postGradeNotesInput.hidden = !isVisible;
}

function handlePostGradeUndo() {
  if (coldGradeDraft) {
    cancelColdGradeDraft({ keepSelection: true });
    return;
  }
  undoLastGrade();
}

function cancelColdGradeDraft({ keepSelection = true, renderAfter = true } = {}) {
  const problemId = coldGradeDraft?.problemId || coldPracticeProblemId;
  coldGradeDraft = null;
  coldPracticeProblemId = keepSelection ? problemId : "";
  activeAttempt = keepSelection && problemId ? { type: "cold", problemId } : null;
  clearPostGradeNote();
  persistColdWorkflowSession();
  if (renderAfter) {
    renderDailyPicks({ preserveReview: true });
    if (els.gradeResult) els.gradeResult.textContent = keepSelection
      ? "Cold-check grade discarded. The attempt is still open."
      : "Cold check canceled.";
  }
}

function handleColdDraftInput(event) {
  if (!coldGradeDraft) return;
  if (event?.target === els.postGradeDraftGradeInput) {
    const grade = els.postGradeDraftGradeInput.value;
    els.postGradeResultInput.value = grade === "red" ? "incomplete" : "accepted";
    els.postGradeAssistanceInput.value = grade === "green" ? "none" : grade === "yellow" ? "hint" : "solution";
    els.postGradeColdScoreInput.value = grade === "green" ? "4" : grade === "yellow" ? "2" : "0";
    els.postGradeComplexityField.hidden = grade === "red";
  }
  captureColdDraftForm();
}

function captureColdDraftForm() {
  if (!coldGradeDraft) return;
  coldGradeDraft = {
    ...coldGradeDraft,
    grade: els.postGradeDraftGradeInput.value,
    durationMinutes: els.postGradeDurationInput.value,
    result: els.postGradeResultInput.value,
    assistance: els.postGradeAssistanceInput.value,
    blocker: els.postGradeBlockerInput.value,
    coldScore: els.postGradeColdScoreInput.value,
    note: els.postGradeNotesInput.value,
    tags: getSelectedPostGradeTags(),
    complexityKnown: els.postGradeComplexityInput.checked,
  };
  persistColdWorkflowSession();
}

function savePostGradeNote() {
  if (coldGradeDraft) {
    finishColdGradeDraft();
    return;
  }
  const note = els.postGradeNotesInput.value.trim();
  const tags = getSelectedPostGradeTags();
  if (!pendingNoteProblemId) return;

  const attemptMetadata = getPostGradeAttemptMetadata();
  if (pendingAttemptContext === "cold" && !attemptMetadata) return;

  const now = new Date().toISOString();
  const shouldUpdateComplexity = !els.postGradeComplexityField.hidden;
  problems = problems.map((problem) =>
    problem.id === pendingNoteProblemId
      ? normalizeProblem({
          ...problem,
          notes: note,
          reviewHistory: updateHistoryEntryWithLearningSignals(problem.reviewHistory || [], {
            historyEntryId: pendingNoteHistoryEntryId,
            note,
            tags,
            attemptMetadata,
          }),
          complexityKnown: shouldUpdateComplexity ? els.postGradeComplexityInput.checked : problem.complexityKnown,
          updatedAt: now,
        })
      : problem,
  );
  if (attemptMetadata) {
    sessions = sessions.map((session) =>
      session.historyEntryId === pendingNoteHistoryEntryId
        ? { ...session, ...attemptMetadata }
        : session,
    );
  }

  persist();
  clearPostGradeNote();
  render();
  const savedSignals = tags.length > 0 || Boolean(attemptMetadata);
  if (els.gradeResult) {
    els.gradeResult.textContent = note || savedSignals ? "Future-you signal saved." : "Future-you signal cleared.";
  }
}

function finishColdGradeDraft() {
  if (!coldGradeDraft) return;
  captureColdDraftForm();
  const problem = problems.find((item) => item.id === coldGradeDraft.problemId && isSeenUnverified(item));
  if (!problem) {
    els.postGradeBenchmarkError.textContent = "This problem changed in another workflow. Reload before finishing the cold check.";
    return;
  }

  const attemptMetadata = getPostGradeAttemptMetadata();
  if (!attemptMetadata) return;
  const draft = cloneState(coldGradeDraft);
  const problemSnapshot = cloneState(problem);
  const sessionsSnapshot = cloneState(sessions);
  const recoverySnapshot = cloneState(recoveryProblemIds);
  coldGradeDraft = null;
  activeAttempt = null;
  clearPostGradeNote();
  persistColdWorkflowSession();
  applyGrade(problem.id, draft.grade, {
    problemSnapshot,
    sessionsSnapshot,
    recoverySnapshot,
    attemptType: "cold",
    attemptContext: "cold",
    attemptMetadata,
    note: draft.note.trim(),
    tags: draft.tags,
    complexityKnown: draft.grade === "red" ? problem.complexityKnown : draft.complexityKnown,
    suppressPostGradePrompt: true,
  });
  showColdCheckCompletion(problem.id);
}

function showColdCheckCompletion(problemId) {
  const problem = problems.find((item) => item.id === problemId);
  if (!problem) return;
  setPostGradeOptionalFieldsVisibility(false);
  els.postGradeBenchmarkFields.hidden = true;
  els.postGradeComplexityField.hidden = true;
  els.postGradeBadge.textContent = "Cold check complete";
  els.postGradeFeedback.textContent = `${stageName(problem.stage)} · next ${formatDate(problem.nextReview)}`;
  els.postGradeTitle.textContent = `Baseline saved for ${problem.title}`;
  els.postGradeHelper.textContent = "This problem is now in the normal review loop.";
  els.undoGradeBtn.textContent = "Undo cold check";
  els.skipPostGradeNoteBtn.hidden = true;
  els.savePostGradeNoteBtn.hidden = true;
  els.postGradeNote.hidden = false;
}

function getPostGradeAttemptMetadata() {
  if (pendingAttemptContext !== "cold") return null;
  const durationMinutes = Number(els.postGradeDurationInput.value);
  const result = els.postGradeResultInput.value;
  const assistance = els.postGradeAssistanceInput.value;
  const blocker = els.postGradeBlockerInput.value;
  const coldScore = Number(els.postGradeColdScoreInput.value);

  if (!Number.isFinite(durationMinutes) || durationMinutes < 1 || durationMinutes > 180 || !result || !assistance || !blocker || !Number.isFinite(coldScore)) {
    els.postGradeBenchmarkError.textContent = "Complete the cold-check details so this benchmark is useful later.";
    return null;
  }

  els.postGradeBenchmarkError.textContent = "";
  return {
    attemptContext: "cold",
    durationMinutes: Math.round(durationMinutes),
    result,
    assistance,
    blocker,
    coldScore: Math.round(clamp(coldScore, 0, 4)),
  };
}

function getSelectedPostGradeTags() {
  if (!els.postGradeTags) return [];
  return Array.from(els.postGradeTags.querySelectorAll("input[type='checkbox']:checked"))
    .map((input) => input.value)
    .filter((value) => LEARNING_SIGNAL_KEYS.includes(value));
}

function setSelectedPostGradeTags(tags = []) {
  if (!els.postGradeTags) return;
  const selected = new Set(Array.isArray(tags) ? tags.filter((tag) => LEARNING_SIGNAL_KEYS.includes(tag)) : []);
  els.postGradeTags.querySelectorAll("input[type='checkbox']").forEach((input) => {
    input.checked = selected.has(input.value);
  });
}

function updateHistoryEntryWithLearningSignals(history, { historyEntryId, note, tags, attemptMetadata = null }) {
  const cleanTags = Array.isArray(tags) ? tags.filter((tag) => LEARNING_SIGNAL_KEYS.includes(tag)) : [];
  const fallbackIndex = historyEntryId
    ? -1
    : history.map((entry, index) => (isProperGrade(entry.grade) ? index : -1)).filter((index) => index >= 0).at(-1);
  const nextHistory = history.map((entry, index) => {
    const isTarget = historyEntryId
      ? entry.id === historyEntryId
      : index === fallbackIndex;
    if (!isTarget) return entry;
    return {
      ...entry,
      note,
      tags: cleanTags,
      ...(attemptMetadata || {}),
      benchmarkPending: attemptMetadata ? false : Boolean(entry.benchmarkPending),
    };
  });
  return nextHistory;
}

function getGradeTransition({ grade, currentStage, currentGreenStreak = 0, scheduledReview = "", attemptDate, coldStart = false }) {
  const previousStage = clampStage(currentStage);
  const attempt = normalizeDate(attemptDate);
  if (coldStart) return getColdStartTransition(grade, attempt);
  const reviewDate = normalizeDate(scheduledReview);
  const isEarlyClean =
    grade === "green" && reviewDate && attempt && parseIsoDate(attempt) < parseIsoDate(reviewDate);

  if (isEarlyClean) {
    return {
      previousStage,
      newStage: previousStage,
      intervalDays: STAGES[previousStage].intervalDays,
      nextReview: reviewDate,
      daysOverdue: 0,
      heldForEarly: true,
      heldForOverdue: false,
      greenStreak: Number(currentGreenStreak || 0),
    };
  }

  const daysOverdue = reviewDate ? getDaysOverdueOnDate(reviewDate, attempt) : 0;
  const newStage = nextStageForGrade(grade, previousStage, daysOverdue);
  const intervalDays = STAGES[newStage].intervalDays;
  const nextReview = toIsoDate(addDays(parseIsoDate(attempt), intervalDays));
  const heldForOverdue =
    grade === "green" && newStage === previousStage && isExtremelyOverdue(previousStage, daysOverdue);

  return {
    previousStage,
    newStage,
    intervalDays,
    nextReview,
    daysOverdue,
    heldForEarly: false,
    heldForOverdue,
    greenStreak: grade === "green" ? Number(currentGreenStreak || 0) + 1 : 0,
  };
}

function getColdStartTransition(grade, attemptDate) {
  const stageByGrade = { red: 0, yellow: 1, green: 2 };
  const newStage = stageByGrade[grade] ?? 0;
  const intervalDays = STAGES[newStage].intervalDays;
  return {
    previousStage: 1,
    newStage,
    intervalDays,
    nextReview: toIsoDate(addDays(parseIsoDate(attemptDate), intervalDays)),
    daysOverdue: 0,
    heldForEarly: false,
    heldForOverdue: false,
    coldStart: true,
    greenStreak: grade === "green" ? 1 : 0,
  };
}

function heldReasonLabel(entry) {
  if (entry.heldForEarly) {
    const scheduled = entry.scheduledReview ? ` before ${formatDate(entry.scheduledReview)}` : "";
    return ` · held early${scheduled}`;
  }
  if (entry.heldForOverdue) return " · held overdue";
  return "";
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
  if (isFeatureEnabled("practiceV2")) {
    const evidence = entry.grade === "red"
      ? "Needs repair"
      : entry.grade === "green" && isIndependentHistoryEntry(entry)
        ? "Independent evidence"
        : "Assisted evidence";
    const nextReview = entry.nextReview ? ` · exact-title recall ${formatDate(entry.nextReview)}` : "";
    return `${evidence}${nextReview}${heldReasonLabel(entry)}`;
  }
  const nextReview = entry.nextReview ? ` · next ${formatDate(entry.nextReview)}` : "";
  if (entry.attemptContext === "backfill-calibration") {
    return `Backfilled baseline -> ${stageName(entry.newStage)}${nextReview}`;
  }
  if (entry.coldStart || entry.attemptContext === "cold") {
    return `Cold baseline -> ${stageName(entry.newStage)}${nextReview}`;
  }
  return `${stageName(entry.previousStage)} -> ${stageName(entry.newStage)}${nextReview}${heldReasonLabel(entry)}`;
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
    "Add a real graded attempt you completed elsewhere. Imported rows stay visible above, but only real grades build current evidence and schedule same-title recall.";

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
          ${renderLearningSignalTags(entry.tags)}
          ${renderAttemptMetadata(entry)}
        </div>
        <div class="history-row-meta">
          <small>${escapeHtml(historyStageSummary(entry))}</small>
          ${
            isProperGrade(entry.grade)
              ? `<button class="ghost-btn history-delete-btn" type="button" data-delete-history-key="${escapeAttr(historyEntryKey(entry))}">Delete</button>`
              : ""
          }
        </div>
      </div>
    `)
    .join("");
}

function renderAttemptMetadata(entry) {
  if (isFeatureEnabled("practiceV2") && isProperGrade(entry.grade)) {
    const context = entry.backfilled
      ? "Manual backfill"
      : practiceTaskTypeLabel(entry.taskType) || (entry.attemptContext === "cold" ? "Assessment" : "Honest rep");
    const support = entry.grade === "green" ? frictionLabel(entry.friction) : assistanceLabel(entry.assistance);
    const details = [
      context,
      entry.durationMinutes || entry.elapsedMinutes ? `${entry.durationMinutes || entry.elapsedMinutes} min` : "",
      support,
      entry.grade === "green" ? "" : blockerLabel(entry.blocker),
    ].filter(Boolean);
    return details.length
      ? `<div class="history-attempt-meta">${details.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div>`
      : "";
  }
  if (entry.attemptContext !== "cold") return "";
  const details = [
    entry.durationMinutes ? `${entry.durationMinutes} min` : "",
    attemptResultLabel(entry.result),
    assistanceLabel(entry.assistance),
    blockerLabel(entry.blocker),
    Number.isFinite(Number(entry.coldScore)) ? `Cold score ${entry.coldScore}/4` : "",
  ].filter(Boolean);
  if (details.length === 0) return `<div class="history-attempt-meta"><span>Cold check</span></div>`;
  return `<div class="history-attempt-meta"><span>Cold check</span>${details.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div>`;
}

function attemptResultLabel(value) {
  return ({ accepted: "Accepted", working: "Working solution", incomplete: "Incomplete" })[value] || "";
}

function assistanceLabel(value) {
  return ({
    none: "No assistance",
    hint: "Used a hint",
    solution: "Viewed solution",
    editorial: "Read editorial",
    ai: "Asked AI",
    person: "Asked a person",
  })[value] || "";
}

function blockerLabel(value) {
  return ({
    "getting-started": "Getting-started blocker",
    recognition: "Pattern recognition blocker",
    strategy: "Strategy blocker",
    implementation: "Implementation blocker",
    "syntax-api": "Syntax/API blocker",
    "edge-cases": "Edge-case blocker",
    time: "Time blocker",
    "time-management": "Time-management blocker",
    explanation: "Explanation blocker",
    none: "No blocker",
  })[value] || "";
}

function frictionLabel(value) {
  return ({
    none: "No meaningful friction",
    implementation: "Implementation friction",
    "syntax-api": "Syntax / API friction",
    "edge-cases": "Edge-case friction",
    explanation: "Explanation friction",
    "time-management": "Time-management friction",
  })[value] || "";
}

function practiceTaskTypeLabel(value) {
  return ({
    assessment: "Assessment",
    learn: "Coverage rep",
    repair: "Repair rep",
    retention: "Exact-title recall",
    transfer: "Transfer rep",
    mixed: "Mixed rep",
    mock: "Mock rep",
  })[value] || "";
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
    id: crypto.randomUUID(),
    scheduledReview: shouldUseCurrentScheduleForBackfill(problem, date) ? problem.nextReview || "" : "",
    note,
  };

  const nextProblem = rebuildProblemFromHistory({
    ...problem,
    reviewHistory: [...(problem.reviewHistory || []), entry],
    updatedAt: now,
  });

  problems = problems.map((item) => (item.id === id ? nextProblem : item));
  const replayedEntry = (nextProblem.reviewHistory || []).find((item) => item.id === entry.id);
  const graduationMessage = maybeGraduateRecoveryProblem(nextProblem);
  sessions = upsertSession({
    date,
    problemId: id,
    title: nextProblem.title,
    topic: nextProblem.topic,
    grade,
    attemptType: replayedEntry?.attemptContext === "cold" ? "cold" : inferBackfillAttemptType(problem, date),
    attemptContext: replayedEntry?.attemptContext || "",
    stage: nextProblem.stage,
    status: nextProblem.status,
    backfilled: true,
    historyEntryId: entry.id,
  });
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
  els.gradeResult.textContent = [
    `Backfilled ${historyGradeLabel(grade).toLowerCase()} for ${nextProblem.title}.`,
    graduationMessage,
  ].filter(Boolean).join(" ");
}

function deleteHistoryEntry(entryKey) {
  const id = els.problemId.value;
  const problem = problems.find((item) => item.id === id);
  if (!problem || !entryKey) return;

  const entry = (problem.reviewHistory || []).find((item) => historyEntryKey(item) === entryKey);
  if (!entry || !isProperGrade(entry.grade)) return;

  if (!window.confirm(`Delete the ${historyGradeLabel(entry.grade).toLowerCase()} attempt from ${formatDate(entry.date)}?`)) {
    return;
  }

  const nextProblem = rebuildProblemFromHistory({
    ...problem,
    reviewHistory: (problem.reviewHistory || []).filter((item) => historyEntryKey(item) !== entryKey),
    updatedAt: new Date().toISOString(),
  });

  problems = problems.map((item) => (item.id === id ? nextProblem : item));
  recoveryProblemIds = normalizeRecoveryProblemIds(recoveryProblemIds);
  sessions = sessions.filter((session) => {
    if (entry.id && session.historyEntryId) return session.historyEntryId !== entry.id;
    return !(session.backfilled && session.problemId === id && session.date === entry.date && session.grade === entry.grade);
  });
  if ((entry.attemptContext === "cold" || entry.coldStart) && isSeenUnverified(nextProblem)) {
    coldPracticeProblemId = nextProblem.id;
    activeAttempt = { type: "cold", problemId: nextProblem.id, title: nextProblem.title };
    persistColdWorkflowSession();
  }
  lastGradeUndo = null;
  clearPostGradeNote();

  persist();
  render();
  renderReviewSummary(nextProblem);
  els.statusInput.value = nextProblem.status;
  els.reviewInput.value = nextProblem.nextReview;
  els.completionInput.value = nextProblem.completionCount;
  renderHistoryTab(nextProblem);
  els.gradeResult.textContent = `Deleted history entry for ${nextProblem.title}.`;
}

function historyEntryKey(entry) {
  if (entry.id) return entry.id;
  return [
    entry.date || "",
    entry.grade || "",
    entry.previousStage ?? "",
    entry.newStage ?? "",
    entry.nextReview || "",
    entry.note || "",
  ].join("|");
}

function renderLearningSignalTags(tags = []) {
  const cleanTags = Array.isArray(tags) ? tags.filter((tag) => LEARNING_SIGNAL_KEYS.includes(tag)) : [];
  if (cleanTags.length === 0) return "";
  return `
    <div class="history-tags" aria-label="Learning signals">
      ${cleanTags.map((tag) => `<span>${escapeHtml(learningSignalLabel(tag))}</span>`).join("")}
    </div>
  `;
}

function learningSignalLabel(tag) {
  return LEARNING_SIGNAL_LABELS[tag] || tag;
}

function rebuildProblemFromHistory(problem) {
  const sortedHistory = [...(problem.reviewHistory || [])].sort((a, b) => dateValue(a.date) - dateValue(b.date));
  const firstAttemptAt = sortedHistory[0]?.date || problem.firstAttemptAt || "";
  const latestContextEntry = [...sortedHistory].reverse().find((entry) => !isProperGrade(entry.grade)) || null;
  let stage = 0;
  let greenStreak = 0;
  let scheduledReview = "";
  let lastProperEntry = null;
  let hasSeenImportedContext = false;
  let hasReplayedProperGrade = false;

  const replayedHistory = sortedHistory.map((entry) => {
    if (!isProperGrade(entry.grade)) {
      if (entry.grade === "imported") hasSeenImportedContext = true;
      return entry;
    }

    const coldStart = !hasReplayedProperGrade && hasSeenImportedContext;
    const effectiveScheduledReview = coldStart ? "" : entry.scheduledReview || scheduledReview;
    const transition = getGradeTransition({
      grade: entry.grade,
      currentStage: stage,
      currentGreenStreak: greenStreak,
      scheduledReview: effectiveScheduledReview,
      attemptDate: entry.date,
      coldStart,
    });

    stage = transition.newStage;
    greenStreak = transition.greenStreak;
    scheduledReview = transition.nextReview;
    hasReplayedProperGrade = true;
    const attemptContext = coldStart
      ? entry.backfilled
        ? "backfill-calibration"
        : "cold"
      : entry.attemptContext || "";
    lastProperEntry = {
      ...entry,
      attemptContext,
      scheduledReview: effectiveScheduledReview,
      previousStage: transition.previousStage,
      newStage: transition.newStage,
      wasOverdue: transition.daysOverdue > 0,
      daysOverdue: transition.daysOverdue,
      heldForEarly: transition.heldForEarly,
      heldForOverdue: transition.heldForOverdue,
      coldStart: transition.coldStart,
      intervalDays: transition.intervalDays,
      nextReview: transition.nextReview,
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
    lastReviewedAt: lastProperEntry?.date || latestContextEntry?.date || "",
    lastGrade: lastProperEntry?.grade || latestContextEntry?.grade || "",
    nextReview: lastProperEntry?.nextReview || "",
    currentIntervalDays: STAGES[stage].intervalDays,
    solvedAt: problem.solvedAt || replayedHistory.find((entry) => entry.grade === "green")?.date || "",
    updatedAt: new Date().toISOString(),
  });

  const withoutUntrustedSchedule = isSeenUnverified(normalized)
    ? { ...normalized, nextReview: "" }
    : normalized;
  return applyMasteryStatus(withoutUntrustedSchedule);
}

function shouldUseCurrentScheduleForBackfill(problem, date) {
  if (!problem.nextReview) return false;

  const latestProperDate = (problem.reviewHistory || [])
    .filter((entry) => isProperGrade(entry.grade))
    .map((entry) => normalizeDate(entry.date))
    .filter(Boolean)
    .sort((a, b) => dateValue(b) - dateValue(a))[0];

  return !latestProperDate || dateValue(date) >= dateValue(latestProperDate);
}

function inferBackfillAttemptType(problem, entryOrDate) {
  const date = typeof entryOrDate === "string" ? entryOrDate : normalizeDate(entryOrDate?.date);
  if (typeof entryOrDate === "object" && entryOrDate?.scheduledReview) return "review";

  const history = Array.isArray(problem.reviewHistory) ? problem.reviewHistory : [];
  const hasEarlierHistory = history.some((entry) => {
    const entryDate = normalizeDate(entry.date);
    return entryDate && dateValue(entryDate) < dateValue(date);
  });
  if (hasEarlierHistory) return "review";

  const firstAttemptAt = normalizeDate(problem.firstAttemptAt);
  if (firstAttemptAt && dateValue(firstAttemptAt) < dateValue(date)) return "review";

  return "new";
}

function upsertSession(session) {
  const nextSessions = sessions.filter((item) => {
    if (session.historyEntryId && item.historyEntryId) return item.historyEntryId !== session.historyEntryId;
    return !(item.backfilled && item.problemId === session.problemId && item.date === session.date && item.grade === session.grade);
  });

  return [session, ...nextSessions]
    .sort((a, b) => dateValue(b.date) - dateValue(a.date));
}

function renderReviewSummary(problem) {
  renderProblemDialogTerminology();
  if (isFeatureEnabled("practiceV2")) {
    renderPracticeV2ProblemEvidence(problem);
    return;
  }

  if (problem && isSeenUnverified(problem)) {
    const unverifiedCopy = isFeatureEnabled("practiceV2")
      ? "The adaptive plan will schedule an assessment when it is the strongest next rep. Imported history does not schedule reviews."
      : "Use Practice now in the Library to set an honest cold baseline. Imported history does not schedule reviews.";
    els.reviewSummaryStats.innerHTML = `
      <div class="summary-empty summary-unverified">
        <strong>Seen before; current recall unverified</strong>
        <span>${unverifiedCopy}</span>
      </div>
    `;
    els.masteryBlockers.innerHTML = "";
    return;
  }
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

function renderProblemDialogTerminology() {
  const isV2 = isFeatureEnabled("practiceV2");
  if (els.reviewSummary) {
    els.reviewSummary.setAttribute("aria-label", isV2 ? "Current evidence" : "Review summary");
    els.reviewSummary.classList.toggle("evidence-summary", isV2);
  }
  if (els.reviewSummaryLabel) els.reviewSummaryLabel.textContent = isV2 ? "Current Evidence" : "Review Summary";
  if (els.reviewSummaryHint) els.reviewSummaryHint.textContent = "Read-only";
  if (els.statusField) els.statusField.hidden = isV2;
  if (els.completionField) els.completionField.hidden = isV2;
  if (els.reviewField) els.reviewField.hidden = isV2;
  if (els.reviewInputLabel) els.reviewInputLabel.textContent = isV2 ? "Exact-title review date" : "Next review";
  if (els.complexityHelper) {
    els.complexityHelper.textContent = isV2
      ? "Useful interview evidence; confirmed manually"
      : "Required for Mastered status";
  }
}

function renderPracticeV2ProblemEvidence(problem) {
  if (!problem) {
    els.reviewSummaryStats.innerHTML = `
      <div class="summary-empty">
        <strong>No evidence yet</strong>
        <span>Save the problem, then complete an honest rep when the adaptive plan selects it.</span>
      </div>
    `;
    renderEvidenceGuidance({ problem: null, evidence: null, latest: null, skill: null });
    return;
  }

  const evidence = getProblemEvidenceSummary(problem);
  const latest = latestProperGradeEntry(problem);
  const exactReview = getExactReviewSummary(problem);
  const skillId = PRACTICE_V2_ENGINE?.skillIdFor(problem.topic);
  const skill = buildMemoryEvidenceModel().skills.find((item) => item.id === skillId) || null;
  const elapsed = latest?.durationMinutes || latest?.elapsedMinutes;
  const support = latest
    ? latest.grade === "green"
      ? frictionLabel(latest.friction) || assistanceLabel(latest.assistance) || "No meaningful friction"
      : [assistanceLabel(latest.assistance), blockerLabel(latest.blocker)].filter(Boolean).join(" · ") || "Not recorded"
    : "Not recorded";
  const latestOutcome = latest
    ? latest.grade === "red"
      ? "Could not solve"
      : latest.grade === "green" && isIndependentHistoryEntry(latest)
        ? "Solved independently"
        : "Solved with help or friction"
    : isAttempted(problem)
      ? "Historical context only"
      : "No honest result";
  const stats = [
    ["Problem evidence", `${evidence.label}${evidence.stale ? " · stale" : ""}`],
    ["Last checked", latest?.date ? formatDate(latest.date) : "Not yet"],
    ["Latest result", latestOutcome],
    ["Help / friction", support],
    ["Stopwatch", elapsed ? `${elapsed} min` : "Not recorded"],
    ["Exact-title recall", `${exactReview.label} · ${exactReview.detail}`],
  ];

  els.reviewSummaryStats.innerHTML = stats
    .map(([label, value]) => `
      <div class="summary-stat">
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(value)}</strong>
      </div>
    `)
    .join("");
  renderEvidenceGuidance({ problem, evidence, latest, skill });
}

function renderEvidenceGuidance({ problem, evidence, latest, skill }) {
  const next = [];
  if (!problem || (!latest && !isAttempted(problem))) {
    next.push("First honest attempt");
  } else if (!latest) {
    next.push("Current assessment");
  } else {
    if (evidence?.stale) next.push("Fresh check");
    if (latest.grade === "red") next.push("Repair the main blocker");
    if (latest.grade !== "red" && !isIndependentHistoryEntry(latest)) next.push("Independent result");
    if (skill?.independent && !skill.transferSupported) next.push("Distinct-title transfer proof");
  }

  if (next.length === 0 && skill?.transferSupported) {
    els.masteryBlockers.innerHTML = `<p class="mastery-ready">Transfer-supported evidence is current for this skill.</p>`;
    return;
  }

  els.masteryBlockers.innerHTML = `
    <span>Next evidence to build</span>
    <div>${next.map((item) => `<span class="blocker-pill">${escapeHtml(item)}</span>`).join("")}</div>
  `;
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
  recoveryProblemIds = normalizeRecoveryProblemIds(recoveryProblemIds);

  persist();
  render();
  els.problemDialog.close();
}

function deleteCurrentProblem() {
  const id = els.problemId.value;
  problems = problems.filter((problem) => problem.id !== id);
  recoveryProblemIds = recoveryProblemIds.filter((problemId) => problemId !== id);
  sessions = sessions.filter((session) => session.problemId !== id);
  if (coldPracticeProblemId === id || coldGradeDraft?.problemId === id || activeAttempt?.problemId === id) {
    clearColdWorkflowSession();
    clearPostGradeNote();
  }
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
  let removed = 0;

  problems = problems.map((problem) => {
    if (!problem.listMemberships?.includes(studyList.membership) || problemMatchesStudyList(problem, studyList)) {
      return problem;
    }

    removed += 1;
    return normalizeProblem({
      ...problem,
      listMemberships: problem.listMemberships.filter((membership) => membership !== studyList.membership),
      updatedAt: now,
    });
  });

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
  alert(`${studyList.label} synced. Added ${added} new problems and removed ${removed} stale memberships.`);
}

function problemMatchesStudyList(problem, studyList) {
  const canonical = problemIdentitySlug(problem);
  const title = normalizeTitle(problem.title);
  return studyList.problems.some(
    (planProblem) => (canonical && canonicalSlug(planProblem.slug) === canonical) || normalizeTitle(planProblem.title) === title,
  );
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
  const titleSlug = planProblem.slug || planProblem.titleSlug || slugifyTitle(planProblem.title);
  return normalizeProblem({
    id: `planned-${membership}-${canonicalSlug(titleSlug)}`,
    title: planProblem.title,
    titleSlug,
    url: planProblem.url || leetcodeUrl(titleSlug),
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
  const payload = buildTrackerStatePayload({
    exportedAt: new Date().toISOString(),
    revision: currentRevision,
  });
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
      const parsed = JSON.parse(String(reader.result));
      const imported = Array.isArray(parsed)
        ? { version: 3, problems: parsed, sessions: [] }
        : parsed;
      const importedProblems = imported.problems;
      if (!Array.isArray(importedProblems)) throw new Error("Expected problems array");
      if (
        appEnv.authRequired &&
        !window.confirm("Importing replaces your hosted tracker state. We'll save a backup first. Continue?")
      ) {
        return;
      }
      const expectedRevision = currentRevision;
      const migrated = migrateTrackerState({ ...imported, exportedAt: undefined });
      applyRemoteState({
        ...migrated,
        savedAt: lastServerSavedAt,
        revision: expectedRevision,
      });
      persist();
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

function handleLeetcodeExtensionMessage(event) {
  if (event.origin !== window.location.origin) return;
  const payload = event.data || {};
  if (payload.source !== "leetcode-progress-extension" || payload.type !== "LEETCODE_PROGRESS_CAPTURED") return;
  if (!canUseLeetcodeImport()) return;

  const rows = Array.isArray(payload.rows) ? payload.rows : [];
  pendingLeetcodeImportRows = rows;
  pendingLeetcodeImportStages = {};
  pendingLeetcodeImportExcluded = new Set();
  pendingLeetcodeImportPlan = buildLeetcodeImportPlan(rows);
  updateLeetcodeImportStatus(payload.capturedAt || new Date().toISOString());

  if (window.location.pathname === "/settings" || window.location.pathname === "/data-management") {
    openLeetcodeImportReview();
  } else {
    els.gradeResult.textContent = `Captured ${rows.length} LeetCode history rows. Open Settings to review the import.`;
  }
}

function updateLeetcodeImportStatus(capturedAt) {
  if (!els.leetcodeImportStatus) return;
  const count = pendingLeetcodeImportRows.length;
  if (count === 0) {
    els.leetcodeImportStatus.textContent = "No captured LeetCode history yet.";
    return;
  }
  els.leetcodeImportStatus.textContent = `Captured ${count} rows from LeetCode${capturedAt ? ` at ${formatDateTime(capturedAt)}` : ""}. Review before importing.`;
}

function openLeetcodeImportReview() {
  if (!canUseLeetcodeImport()) return;
  if (!els.leetcodeImportDialog) return;
  pendingLeetcodeImportPlan = buildLeetcodeImportPlan(pendingLeetcodeImportRows);
  seedLeetcodeImportStageSelections(pendingLeetcodeImportPlan);
  renderLeetcodeImportReview(pendingLeetcodeImportPlan);
  els.leetcodeImportDialog.showModal();
}

function buildLeetcodeImportPlan(rows = []) {
  const seen = new Set();
  const candidates = [];
  let invalid = 0;
  let duplicateRows = 0;

  rows.forEach((row) => {
    const candidate = normalizeLeetcodeProgressRow(row);
    if (!candidate) {
      invalid += 1;
      return;
    }

    const rowKey = [candidate.slug, candidate.date, candidate.result].join("|");
    if (seen.has(rowKey)) {
      duplicateRows += 1;
      return;
    }
    seen.add(rowKey);
    candidates.push(candidate);
  });

  let matched = 0;
  let created = 0;
  let alreadyImported = 0;

  const plannedCandidates = candidates.map((candidate) => {
    const existing = findProblemBySlug(candidate.slug) || findProblemByTitle(candidate.title);
    const duplicate = existing ? hasLeetcodeImportedEntry(existing, candidate) : false;
    if (duplicate) alreadyImported += 1;
    else if (existing) matched += 1;
    else created += 1;
    return {
      ...candidate,
      importKey: leetcodeImportCandidateKey(candidate),
      importStage: defaultLeetcodeImportStage(candidate),
      action: duplicate ? "duplicate" : existing ? "merge" : "create",
      existingTitle: existing?.title || "",
    };
  });

  return {
    candidates: plannedCandidates,
    importable: plannedCandidates.filter((candidate) => candidate.action !== "duplicate"),
    matched,
    created,
    alreadyImported,
    duplicateRows,
    invalid,
    totalRows: rows.length,
  };
}

function leetcodeImportCandidateKey(candidate) {
  return [candidate.slug, candidate.date, candidate.result || "LeetCode history"].join("|");
}

function defaultLeetcodeImportStage() {
  return 1;
}

function selectedLeetcodeImportStage(candidate) {
  return clampLeetcodeImportStage(pendingLeetcodeImportStages[candidate.importKey] ?? candidate.importStage ?? defaultLeetcodeImportStage(candidate));
}

function isLeetcodeImportIncluded(candidate) {
  return candidate.action !== "duplicate" && !pendingLeetcodeImportExcluded.has(candidate.importKey);
}

function clampLeetcodeImportStage(stage) {
  return Math.round(clamp(Number(stage || 0), 0, 2));
}

function renderLeetcodeImportReview(plan) {
  const summary = plan || buildLeetcodeImportPlan([]);
  const includedRows = summary.importable.filter(isLeetcodeImportIncluded);
  const excludedCount = pendingLeetcodeImportExcluded.size;
  els.applyLeetcodeImportBtn.disabled = includedRows.length === 0;
  els.leetcodeImportSummary.innerHTML = `
    <div>
      <strong>${summary.totalRows}</strong>
      <span>Rows captured</span>
    </div>
    <div>
      <strong>${summary.matched}</strong>
      <span>Existing problems</span>
    </div>
    <div>
      <strong>${summary.created}</strong>
      <span>New problems</span>
    </div>
    <div>
      <strong>${summary.alreadyImported + summary.duplicateRows + summary.invalid + excludedCount}</strong>
      <span>Skipped</span>
    </div>
  `;

  if (summary.totalRows === 0) {
    els.leetcodeImportPreview.innerHTML = `
      <div class="history-empty">
        <strong>No captured rows yet</strong>
        <span>Load the unpacked Chrome extension, open LeetCode progress, and choose Capture Practice History.</span>
      </div>
    `;
    return;
  }

  const previewRows = summary.candidates;
  els.leetcodeImportPreview.innerHTML = `
    <div class="leetcode-import-note">
      <div>
        <strong>${includedRows.length} rows ready to import</strong>
        <span>${isFeatureEnabled("practiceV2")
          ? "Default confidence: Stage 1. This estimate does not schedule a review; a future adaptive assessment establishes trusted evidence."
          : "Default confidence: Stage 1. This estimate does not schedule a review; your first cold check sets the trusted stage."}</span>
      </div>
      <div class="leetcode-import-bulk" aria-label="Bulk import stage">
        <button class="ghost-btn" type="button" data-leetcode-import-stage-all="0">All Stage 0</button>
        <button class="ghost-btn" type="button" data-leetcode-import-stage-all="1">All Stage 1</button>
        <button class="ghost-btn" type="button" data-leetcode-import-stage-all="2">All Stage 2</button>
      </div>
    </div>
    ${previewRows
      .map((candidate) => `
        <div class="leetcode-import-row ${isLeetcodeImportIncluded(candidate) ? "" : "is-excluded"}">
          <div>
            <strong>${escapeHtml(candidate.title)}</strong>
            <span>${escapeHtml(formatDate(candidate.date))} · ${escapeHtml(candidate.result || "LeetCode history")} · ${escapeHtml(candidate.difficulty)}</span>
          </div>
          <div class="leetcode-import-row-actions">
            ${candidate.action === "duplicate" ? "" : renderLeetcodeImportStageSelect(candidate)}
            ${candidate.action === "duplicate" ? "" : renderLeetcodeImportIncludeButton(candidate)}
            <em>${escapeHtml(leetcodeImportActionLabel(candidate))}</em>
          </div>
        </div>
      `)
      .join("")}
  `;
}

function renderLeetcodeImportIncludeButton(candidate) {
  const included = isLeetcodeImportIncluded(candidate);
  return `
    <button
      class="ghost-btn leetcode-import-toggle"
      type="button"
      data-leetcode-import-toggle="${escapeAttr(candidate.importKey)}"
      aria-pressed="${included ? "false" : "true"}"
    >
      ${included ? "Remove" : "Restore"}
    </button>
  `;
}

function renderLeetcodeImportStageSelect(candidate) {
  const selectedStage = selectedLeetcodeImportStage(candidate);
  const disabled = isLeetcodeImportIncluded(candidate) ? "" : " disabled";
  return `
    <label class="leetcode-import-stage">
      <span>Confidence</span>
      <select data-leetcode-import-stage="${escapeAttr(candidate.importKey)}"${disabled}>
        ${[0, 1, 2]
          .map((stage) => `
            <option value="${stage}" ${stage === selectedStage ? "selected" : ""}>${escapeHtml(stageName(stage))}</option>
          `)
          .join("")}
      </select>
    </label>
  `;
}

function seedLeetcodeImportStageSelections(plan) {
  (plan?.importable || []).forEach((candidate) => {
    if (pendingLeetcodeImportStages[candidate.importKey] == null) {
      pendingLeetcodeImportStages[candidate.importKey] = candidate.importStage;
    }
  });
}

function handleLeetcodeImportPreviewClick(event) {
  if (!canUseLeetcodeImport()) return;
  const button = event.target.closest("[data-leetcode-import-stage-all]");
  if (button) {
    const stage = clampLeetcodeImportStage(button.dataset.leetcodeImportStageAll);
    (pendingLeetcodeImportPlan?.importable || []).filter(isLeetcodeImportIncluded).forEach((candidate) => {
      pendingLeetcodeImportStages[candidate.importKey] = stage;
    });
    renderLeetcodeImportReview(pendingLeetcodeImportPlan);
    return;
  }

  const toggle = event.target.closest("[data-leetcode-import-toggle]");
  if (!toggle) return;
  const key = toggle.dataset.leetcodeImportToggle;
  if (pendingLeetcodeImportExcluded.has(key)) pendingLeetcodeImportExcluded.delete(key);
  else pendingLeetcodeImportExcluded.add(key);
  renderLeetcodeImportReview(pendingLeetcodeImportPlan);
}

function handleLeetcodeImportPreviewChange(event) {
  if (!canUseLeetcodeImport()) return;
  const select = event.target.closest("[data-leetcode-import-stage]");
  if (!select) return;
  pendingLeetcodeImportStages[select.dataset.leetcodeImportStage] = clampLeetcodeImportStage(select.value);
}

function leetcodeImportActionLabel(candidate) {
  if (!isLeetcodeImportIncluded(candidate) && candidate.action !== "duplicate") return "Removed";
  const action = candidate.action;
  if (action === "merge") return "Merge";
  if (action === "create") return "Create";
  return "Skip";
}

function applyLeetcodeProgressImport() {
  if (!canUseLeetcodeImport()) return;
  const plan = pendingLeetcodeImportPlan || buildLeetcodeImportPlan(pendingLeetcodeImportRows);
  const includedRows = plan.importable.filter(isLeetcodeImportIncluded);
  if (includedRows.length === 0) return;

  const now = new Date().toISOString();
  let added = 0;
  includedRows.forEach((candidate) => {
    if (upsertLeetcodeImportedProblem({ ...candidate, importStage: selectedLeetcodeImportStage(candidate) }, now)) added += 1;
  });

  importMeta = {
    importedAt: toIsoDate(new Date()),
    sourceFileName: "LeetCode Progress extension",
    rowCount: added,
    schemaVersion: EXPORT_VERSION,
  };
  persist();
  persistImportMeta();
  render();
  els.leetcodeImportDialog.close();
  updateLeetcodeImportStatus(now);
  window.postMessage({ source: "dsa-tracker", type: "LEETCODE_PROGRESS_APPLIED" }, window.location.origin);
  alert(`Imported ${added} LeetCode history rows as historical context.`);
}

function upsertLeetcodeImportedProblem(candidate, now) {
  const existing = findProblemBySlug(candidate.slug) || findProblemByTitle(candidate.title);
  const builtInPlan = findBuiltInPlan(candidate.slug, candidate.title);
  const entry = buildLeetcodeImportedEntry(candidate);

  if (existing) {
    if (hasLeetcodeImportedEntry(existing, candidate)) return false;
    const nextHistory = [...(existing.reviewHistory || []), entry].sort((a, b) => dateValue(a.date) - dateValue(b.date));
    const hasProperHistory = nextHistory.some((item) => isProperGrade(item.grade));
    const baseProblem = {
      ...existing,
      titleSlug: existing.titleSlug || candidate.slug,
      url: existing.url || candidate.url,
      difficulty: existing.difficulty || candidate.difficulty,
      topic: existing.topic || builtInPlan?.topic || "General",
      listMemberships: mergeMemberships(existing.listMemberships, getBuiltInMemberships(candidate.slug, candidate.title)),
      firstAttemptAt: earliestHistoryDate(nextHistory) || existing.firstAttemptAt,
      reviewHistory: nextHistory,
      importStage: candidate.importStage,
      completionCount: Math.max(Number(existing.completionCount || 0), nextHistory.length),
      updatedAt: now,
    };
    const nextProblem = hasProperHistory ? normalizeProblem(baseProblem) : normalizeImportedOnlyProblem(baseProblem);
    problems = problems.map((problem) => (problem.id === existing.id ? nextProblem : problem));
    return true;
  }

  problems.push(normalizeImportedOnlyProblem({
    id: crypto.randomUUID(),
    title: builtInPlan?.title || candidate.title,
    titleSlug: builtInPlan?.slug || candidate.slug,
    url: builtInPlan?.url || candidate.url,
    difficulty: normalizeDifficulty(candidate.difficulty || builtInPlan?.difficulty),
    topic: builtInPlan?.topic || "General",
    notes: "",
    source: "leetcode-progress",
    listMemberships: getBuiltInMemberships(candidate.slug, candidate.title),
    reviewHistory: [entry],
    importStage: candidate.importStage,
    createdAt: now,
    updatedAt: now,
  }));
  return true;
}

function normalizeImportedOnlyProblem(problem) {
  const history = [...(problem.reviewHistory || [])].sort((a, b) => dateValue(a.date) - dateValue(b.date));
  const latest = history.at(-1);
  const count = history.length;
  const stage = problem.importStage == null ? inferStageFromCount(count) : clampLeetcodeImportStage(problem.importStage);
  const intervalDays = STAGES[stage].intervalDays;

  return normalizeProblem({
    ...problem,
    status: count > 0 ? "review" : "todo",
    firstAttemptAt: earliestHistoryDate(history) || problem.firstAttemptAt,
    completionCount: count,
    stage,
    greenStreak: 0,
    currentIntervalDays: intervalDays,
    lastReviewedAt: latest?.date || "",
    lastGrade: latest ? "imported" : "",
    nextReview: "",
    masteredAt: "",
    solvedAt: "",
  });
}

function buildLeetcodeImportedEntry(candidate) {
  return {
    id: crypto.randomUUID(),
    date: candidate.date,
    grade: "imported",
    source: "leetcode-progress",
    result: candidate.result,
    submissions: candidate.submissions,
    previousStage: null,
    newStage: candidate.importStage,
    wasOverdue: false,
    daysOverdue: 0,
    intervalDays: null,
    note: `LeetCode result: ${candidate.result || "history"}${candidate.submissions ? ` · ${candidate.submissions} submissions` : ""}`,
  };
}

function hasLeetcodeImportedEntry(problem, candidate) {
  return (problem.reviewHistory || []).some((entry) =>
    entry.source === "leetcode-progress" &&
    normalizeDate(entry.date) === candidate.date &&
    String(entry.result || "").toLowerCase() === candidate.result.toLowerCase()
  );
}

function normalizeLeetcodeProgressRow(row = {}) {
  const title = String(row.title || "").trim();
  const url = safeUrl(row.url || (row.slug ? `https://leetcode.com/problems/${row.slug}/` : ""));
  const slug = canonicalSlug(row.slug || slugFromUrl(url) || slugifyTitle(title));
  const date = normalizeLeetcodeProgressDate(row.date || row.submittedAt || "");
  if (!title || !slug || !date) return null;

  return {
    title,
    slug,
    url: url || `https://leetcode.com/problems/${slug}/`,
    date,
    result: String(row.result || "LeetCode history").trim(),
    difficulty: normalizeDifficulty(normalizeLeetcodeDifficulty(row.difficulty)),
    submissions: Number(row.submissions || 0) || 0,
  };
}

function normalizeLeetcodeDifficulty(value) {
  const difficulty = String(value || "").trim();
  if (/^med\.?$/i.test(difficulty)) return "Medium";
  return difficulty;
}

function normalizeLeetcodeProgressDate(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  const numeric = text.match(/(\d{4})[./-](\d{1,2})[./-](\d{1,2})/);
  if (numeric) {
    const [, year, month, day] = numeric;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  const monthDay = text.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\.?\s+(\d{1,2})(?:,\s*(\d{4}))?/i);
  if (!monthDay) return normalizeDate(text);

  const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  const month = monthNames.indexOf(monthDay[1].slice(0, 3).toLowerCase());
  const day = Number(monthDay[2]);
  let year = Number(monthDay[3] || new Date().getFullYear());
  const parsed = new Date(year, month, day);
  if (!monthDay[3] && parsed > addDays(dateOnly(new Date()), 7)) {
    year -= 1;
  }
  return toIsoDate(new Date(year, month, day));
}

function earliestHistoryDate(history = []) {
  return history
    .map((entry) => normalizeDate(entry.date))
    .filter(Boolean)
    .sort((a, b) => dateValue(a) - dateValue(b))[0] || "";
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
    ...problem,
    id: problem.id || crypto.randomUUID(),
    title,
    titleSlug,
    url,
    status: baseStatus,
    difficulty: normalizeDifficulty(problem.difficulty),
    topic: canonicalTopic(problem.topic),
    notes: String(problem.notes || ""),
    solution: normalizeSolution(problem.solution),
    firstAttemptAt: normalizeDate(problem.firstAttemptAt || problem.solvedAt || ""),
    reviewHistory: Array.isArray(problem.reviewHistory) ? problem.reviewHistory : [],
    completionCount,
    stage,
    greenStreak,
    complexityKnown: Boolean(problem.complexityKnown),
    currentIntervalDays: Number.isFinite(Number(problem.currentIntervalDays))
      ? Number(problem.currentIntervalDays)
      : STAGES[stage].intervalDays,
    lastReviewedAt: normalizeDate(problem.lastReviewedAt || ""),
    lastGrade: problem.lastGrade || "",
    nextReview,
    importStage: problem.importStage == null ? null : clampLeetcodeImportStage(problem.importStage),
    masteredAt: normalizeDate(problem.masteredAt || ""),
    source: problem.source || "manual",
    listMemberships,
    createdAt: problem.createdAt || new Date().toISOString(),
    updatedAt: problem.updatedAt || new Date().toISOString(),
    solvedAt: problem.solvedAt || "",
  };

  const withoutUntrustedSchedule = isSeenUnverified(normalized)
    ? { ...normalized, nextReview: "" }
    : normalized;
  return applyMasteryStatus(withoutUntrustedSchedule);
}

function canonicalTopic(value) {
  const topic = String(value || "General").trim() || "General";
  if (/^math\s*(?:&|and)\s*geometry$/i.test(topic)) return "Math & Geometry";
  return topic;
}

function normalizeSolution(solution = {}) {
  return {
    ...solution,
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

function hasProperGradeHistory(problem) {
  return isProperGrade(problem?.lastGrade) ||
    (problem?.reviewHistory || []).some((entry) => isProperGrade(entry.grade));
}

function isSeenUnverified(problem) {
  if (!problem || hasProperGradeHistory(problem)) return false;
  const hasImportedContext = (problem.reviewHistory || []).some((entry) => entry.grade === "imported") ||
    problem.lastGrade === "imported" ||
    problem.source === "csv" ||
    problem.source === "leetcode-progress";
  return hasImportedContext && isAttempted(problem);
}

function problemDisplayStatus(problem) {
  return isSeenUnverified(problem) ? "Seen, unverified" : statusLabel(problem.status);
}

function problemDisplayStage(problem) {
  if (!isSeenUnverified(problem)) return stageName(problem.stage);
  return isFeatureEnabled("practiceV2") ? "Assessment pending" : "Cold check needed";
}

function problemDisplayReview(problem) {
  return isSeenUnverified(problem) ? "Not scheduled" : formatDate(problem.nextReview);
}

function isMastered(problem) {
  if (isSeenUnverified(problem)) return false;
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
  if (isSeenUnverified(problem)) return false;
  const attempts = countMasteryEligibleAttempts(problem);
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

function countMasteryEligibleAttempts(problem) {
  const history = Array.isArray(problem.reviewHistory) ? problem.reviewHistory : [];
  if (history.length === 0) return Number(problem.completionCount || 0);

  return history.filter((entry) => {
    if (isProperGrade(entry.grade)) return true;
    return entry.grade === "imported" && entry.source !== "leetcode-progress";
  }).length;
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

function startOfWeekMonday(date) {
  const start = dateOnly(date);
  const day = start.getDay();
  const daysSinceMonday = (day + 6) % 7;
  start.setDate(start.getDate() - daysSinceMonday);
  return start;
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
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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
