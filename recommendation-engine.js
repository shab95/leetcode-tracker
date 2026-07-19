(function initPracticeV2Engine(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.PracticeV2Engine = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createPracticeV2Engine() {
  "use strict";

  const ALGORITHM_VERSION = "readiness-v1";
  const EVIDENCE_WINDOW_DAYS = 30;
  const WEAKNESS_WINDOW_DAYS = 21;
  const TASK_PRECEDENCE = Object.freeze({ repair: 0, assessment: 1, transfer: 2, retention: 3, learn: 4, mixed: 5, mock: 6 });
  const NEW_TIME_BOX = Object.freeze({ Easy: 20, Medium: 30, Hard: 45 });
  const REVIEW_TIME_BOX = Object.freeze({ Easy: 10, Medium: 15, Hard: 20 });
  const WEIGHTS = Object.freeze({
    missingChecked: 24,
    missingIndependent: 18,
    missingTransfer: 12,
    importedUnverified: 18,
    staleEvidence: 14,
    dueBase: 22,
    overdueMax: 14,
    recentRed: 38,
    recentYellow: 24,
    targetPriority: 10,
    goalUrgency: 8,
    recentTitleTwoDays: -50,
    recentTitleWeek: -24,
    recentSkillEach: -6,
    capacityFit: 5,
  });

  function recommendNextRep(input = {}) {
    const state = normalizeState(input.state);
    const profile = { ...(state.trainingProfile || {}), ...(input.trainingProfile || {}) };
    const today = normalizeDate(input.today) || normalizeDate(new Date());
    const capacityMinutes = positiveNumber(input.capacityMinutes, positiveNumber(profile.defaultSessionMinutes, 45));
    const catalog = Array.isArray(input.catalog) ? input.catalog : [];
    const evidence = deriveEvidence(state, { today, catalog });
    const excluded = buildExcludedSet(input);
    const candidates = buildCandidates(state.problems, catalog)
      .filter((candidate) => !excluded.has(candidate.id) && !excluded.has(candidate.slug))
      .map((candidate) => scoreCandidate(candidate, { evidence, profile, today, capacityMinutes }))
      .filter((candidate) => candidate.eligible)
      .sort(compareCandidates);

    const winner = candidates[0] || null;
    if (!winner) {
      return {
        algorithmVersion: ALGORITHM_VERSION,
        public: null,
        private: {
          taskType: null,
          reasonCodes: ["no-eligible-candidate"],
          rationale: "No candidate fits the current capacity and exclusion set.",
          consideredCount: candidates.length,
        },
      };
    }

    const recommendationId = buildRecommendationId(today, winner);
    return {
      algorithmVersion: ALGORITHM_VERSION,
      public: {
        recommendationId,
        problemId: winner.id,
        title: winner.title,
        url: winner.url,
        difficulty: winner.difficulty,
        timeBoxMinutes: winner.timeBoxMinutes,
        publicReason: publicReasonFor(winner.taskType),
        evidenceStatus: publicEvidenceStatusFor(winner.taskType),
      },
      private: {
        recommendationId,
        taskType: winner.taskType,
        primarySkillIds: [winner.skillId],
        reasonCodes: winner.reasonCodes,
        score: winner.score,
        scoreComponents: winner.scoreComponents,
        rationale: privateRationaleFor(winner),
        consideredCount: candidates.length,
        rankedCandidates: candidates.slice(0, 10).map(toPrivateTrace),
      },
    };
  }

  function deriveEvidence(stateInput = {}, options = {}) {
    const state = normalizeState(stateInput);
    const today = normalizeDate(options.today) || normalizeDate(new Date());
    const catalog = Array.isArray(options.catalog) ? options.catalog : [];
    const skills = new Map();
    const recentAttempts = [];

    for (const problem of state.problems) {
      const skillId = skillIdFor(problem.topic);
      const skill = skills.get(skillId) || createSkillEvidence(skillId, problem.topic);
      const attempts = properAttempts(problem);

      for (const attempt of attempts) {
        const ageDays = dateDiffDays(attempt.date, today);
        if (ageDays < 0 || ageDays > EVIDENCE_WINDOW_DAYS) continue;
        const titleKey = candidateSlug(problem);
        skill.checkedTitles.add(titleKey);
        skill.lastCheckedAt = maxDate(skill.lastCheckedAt, attempt.date);
        recentAttempts.push({ ...attempt, problemId: problem.id, titleKey, skillId });

        if (qualifiesAsIndependent(attempt)) {
          skill.independentTitles.add(titleKey);
          skill.lastIndependentAt = maxDate(skill.lastIndependentAt, attempt.date);
        }
        if (["transfer", "mixed", "mock"].includes(attempt.taskType) && qualifiesAsIndependent(attempt)) {
          skill.designatedTransferTitles.add(titleKey);
        }
      }

      skills.set(skillId, skill);
    }

    for (const planProblem of catalog) {
      const skillId = skillIdFor(planProblem.topic);
      if (!skills.has(skillId)) skills.set(skillId, createSkillEvidence(skillId, planProblem.topic));
    }

    for (const skill of skills.values()) {
      skill.checked = skill.checkedTitles.size > 0;
      skill.independent = skill.independentTitles.size > 0;
      skill.transferSupported = skill.independentTitles.size >= 2 && skill.designatedTransferTitles.size > 0;
    }

    recentAttempts.sort((a, b) => dateValue(b.date) - dateValue(a.date));
    return {
      today,
      skills,
      checkedSkillIds: [...skills.values()].filter((skill) => skill.checked).map((skill) => skill.id).sort(),
      independentSkillIds: [...skills.values()].filter((skill) => skill.independent).map((skill) => skill.id).sort(),
      transferSupportedSkillIds: [...skills.values()].filter((skill) => skill.transferSupported).map((skill) => skill.id).sort(),
      recentAttempts,
    };
  }

  function buildCandidates(problems = [], catalog = []) {
    const bySlug = new Map();
    const byTitle = new Map();
    for (const problem of problems) {
      const candidate = candidateFromProblem(problem);
      bySlug.set(candidate.slug, candidate);
      byTitle.set(normalizeTitle(candidate.title), candidate);
    }

    const catalogCandidates = [];
    for (const plan of catalog) {
      const slug = candidateSlug(plan);
      const existing = bySlug.get(slug) || byTitle.get(normalizeTitle(plan.title));
      if (existing) {
        existing.catalogOrder = Math.min(existing.catalogOrder, positiveNumber(plan.order, 9999));
        existing.listMemberships = unique([...(existing.listMemberships || []), ...(plan.listMemberships || [])]);
        if (!existing.topic && plan.topic) existing.topic = plan.topic;
        if (!existing.url && plan.url) existing.url = plan.url;
        catalogCandidates.push(existing);
        continue;
      }

      const candidate = candidateFromProblem({
        ...plan,
        id: `planned-${slug}`,
        titleSlug: slug,
        url: plan.url || (slug ? `https://leetcode.com/problems/${slug}/` : ""),
        reviewHistory: [],
        completionCount: 0,
        stage: 0,
        nextReview: "",
        listMemberships: plan.listMemberships || [],
      });
      candidate.catalogOrder = positiveNumber(plan.order, 9999);
      bySlug.set(slug, candidate);
      byTitle.set(normalizeTitle(candidate.title), candidate);
      catalogCandidates.push(candidate);
    }

    return uniqueBy([...bySlug.values(), ...catalogCandidates], (candidate) => candidate.id || candidate.slug);
  }

  function scoreCandidate(candidate, context) {
    const { evidence, profile, today, capacityMinutes } = context;
    const attempts = properAttempts(candidate.problem);
    const importedEntries = importedAttempts(candidate.problem);
    const lastAttempt = attempts[attempts.length - 1] || null;
    const lastAgeDays = lastAttempt ? dateDiffDays(lastAttempt.date, today) : null;
    const skill = evidence.skills.get(candidate.skillId) || createSkillEvidence(candidate.skillId, candidate.topic);
    const due = Boolean(candidate.nextReview && candidate.nextReview <= today && attempts.length > 0);
    const daysOverdue = due ? Math.max(0, dateDiffDays(candidate.nextReview, today)) : 0;
    const importedOnly = attempts.length === 0 && importedEntries.length > 0;
    const recentWeakness = lastAttempt && lastAgeDays >= 0 && lastAgeDays <= WEAKNESS_WINDOW_DAYS && ["red", "yellow"].includes(lastAttempt.grade);
    const taskType = chooseTaskType({ candidate, skill, attempts, importedOnly, due, lastAttempt, lastAgeDays, recentWeakness });
    const timeBoxMinutes = timeBoxFor(candidate.difficulty, taskType);
    const requiredMinutes = timeBoxMinutes + 3;
    const eligible = Boolean(candidate.title && candidate.id && requiredMinutes <= capacityMinutes);
    const components = {};

    components.readinessGap = (!skill.checked ? WEIGHTS.missingChecked : 0) +
      (!skill.independent ? WEIGHTS.missingIndependent : 0) +
      (!skill.transferSupported && skill.independent ? WEIGHTS.missingTransfer : 0);
    components.staleness = importedOnly
      ? WEIGHTS.importedUnverified
      : lastAgeDays == null
        ? 8
        : lastAgeDays > EVIDENCE_WINDOW_DAYS
          ? Math.min(WEIGHTS.staleEvidence, Math.round((lastAgeDays - EVIDENCE_WINDOW_DAYS) / 7) + 4)
          : 0;
    components.reviewUrgency = due
      ? WEIGHTS.dueBase + Math.min(WEIGHTS.overdueMax, Math.floor(daysOverdue / 7))
      : 0;
    components.recentBlocker = recentWeakness
      ? lastAttempt.grade === "red" ? WEIGHTS.recentRed : WEIGHTS.recentYellow
      : 0;
    components.targetPriority = targetPriority(candidate.catalogOrder);
    components.transferNeed = taskType === "transfer" ? WEIGHTS.missingTransfer : 0;
    components.goalUrgency = goalUrgency(profile, today, taskType);
    components.recentTitlePenalty = taskType === "repair"
      ? 0
      : recentTitlePenalty(candidate, evidence.recentAttempts, today);
    components.recentSkillPenalty = recentSkillPenalty(candidate.skillId, evidence.recentAttempts);
    components.capacityFit = Math.round(WEIGHTS.capacityFit * Math.min(1, requiredMinutes / Math.max(capacityMinutes, 1)));
    const score = Object.values(components).reduce((sum, value) => sum + value, 0);

    return {
      ...candidate,
      taskType,
      timeBoxMinutes,
      requiredMinutes,
      eligible,
      due,
      daysOverdue,
      lastAttempt,
      lastAgeDays,
      importedOnly,
      score,
      scoreComponents: components,
      reasonCodes: reasonCodesFor({ taskType, skill, due, importedOnly, recentWeakness, lastAgeDays }),
    };
  }

  function chooseTaskType({ skill, attempts, importedOnly, due, lastAttempt, lastAgeDays, recentWeakness }) {
    if (recentWeakness) return "repair";
    if (importedOnly || (attempts.length > 0 && lastAgeDays > 60 && !due)) return "assessment";
    if (!skill.transferSupported && skill.independent && attempts.length === 0) return "transfer";
    if (due) return "retention";
    if (attempts.length === 0) return "learn";
    if (!skill.independent || lastAttempt?.grade !== "green") return "assessment";
    if (!skill.transferSupported) return "transfer";
    return "assessment";
  }

  function compareCandidates(a, b) {
    return b.score - a.score ||
      (TASK_PRECEDENCE[a.taskType] ?? 99) - (TASK_PRECEDENCE[b.taskType] ?? 99) ||
      a.catalogOrder - b.catalogOrder ||
      difficultyRank(a.difficulty) - difficultyRank(b.difficulty) ||
      a.slug.localeCompare(b.slug) ||
      a.id.localeCompare(b.id);
  }

  function candidateFromProblem(problem = {}) {
    const title = String(problem.title || "").trim();
    const slug = candidateSlug(problem);
    const topic = String(problem.topic || "General").trim() || "General";
    return {
      id: String(problem.id || `planned-${slug}`),
      title,
      slug,
      url: String(problem.url || ""),
      difficulty: normalizeDifficulty(problem.difficulty),
      topic,
      skillId: skillIdFor(topic),
      nextReview: normalizeDate(problem.nextReview),
      stage: clamp(Number(problem.stage || 0), 0, 5),
      catalogOrder: positiveNumber(problem.order, 9999),
      listMemberships: Array.isArray(problem.listMemberships) ? [...problem.listMemberships] : [],
      problem,
    };
  }

  function properAttempts(problem = {}) {
    return (Array.isArray(problem.reviewHistory) ? problem.reviewHistory : [])
      .filter((entry) => ["red", "yellow", "green"].includes(entry?.grade))
      .map((entry) => ({
        ...entry,
        date: normalizeDate(entry.occurredAt || entry.date || entry.createdAt),
        taskType: String(entry.taskType || ""),
      }))
      .filter((entry) => entry.date)
      .sort((a, b) => dateValue(a.date) - dateValue(b.date));
  }

  function importedAttempts(problem = {}) {
    return (Array.isArray(problem.reviewHistory) ? problem.reviewHistory : []).filter((entry) => entry?.grade === "imported");
  }

  function qualifiesAsIndependent(attempt) {
    if (attempt.grade !== "green") return false;
    const assistance = String(attempt.assistance || "none").toLowerCase();
    return !["hint", "solution", "editorial", "person", "ai"].includes(assistance);
  }

  function reasonCodesFor({ taskType, skill, due, importedOnly, recentWeakness, lastAgeDays }) {
    const codes = [`task-${taskType}`];
    if (!skill.checked) codes.push("missing-recent-check");
    if (!skill.independent) codes.push("missing-independent-evidence");
    if (!skill.transferSupported && skill.independent) codes.push("missing-transfer-evidence");
    if (due) codes.push("exact-review-due");
    if (importedOnly) codes.push("historical-exposure-unverified");
    if (recentWeakness) codes.push("recent-friction");
    if (lastAgeDays != null && lastAgeDays > EVIDENCE_WINDOW_DAYS) codes.push("evidence-stale");
    return codes;
  }

  function publicReasonFor(taskType) {
    if (taskType === "retention") return "Selected because a spaced recall check is useful now.";
    if (taskType === "repair") return "Selected because another honest attempt will clarify what to practice next.";
    if (taskType === "learn") return "Selected to build useful interview coverage within today's time.";
    return "Selected to measure current independent problem-solving evidence.";
  }

  function publicEvidenceStatusFor(taskType) {
    if (taskType === "retention") return "Exact-title recall is ready to check.";
    if (taskType === "repair") return "A fresh result will update the plan.";
    if (taskType === "learn") return "This area needs a first current attempt.";
    return "Independent evidence is missing or stale.";
  }

  function privateRationaleFor(candidate) {
    const skill = candidate.topic || "this skill area";
    if (candidate.taskType === "repair") return `Recent ${candidate.lastAttempt?.grade || "non-clean"} evidence makes a focused ${skill} follow-up valuable.`;
    if (candidate.taskType === "retention") return `${candidate.title} is ${candidate.daysOverdue} days overdue for exact-title retention.`;
    if (candidate.taskType === "transfer") return `${skill} has independent evidence but still needs a distinct-title transfer result.`;
    if (candidate.taskType === "learn") return `${skill} needs current coverage and this target-list problem fits the available time.`;
    return `${skill} needs fresh independent evidence for the current plan.`;
  }

  function toPrivateTrace(candidate) {
    return {
      problemId: candidate.id,
      title: candidate.title,
      taskType: candidate.taskType,
      primarySkillIds: [candidate.skillId],
      score: candidate.score,
      scoreComponents: candidate.scoreComponents,
      reasonCodes: candidate.reasonCodes,
      timeBoxMinutes: candidate.timeBoxMinutes,
    };
  }

  function timeBoxFor(difficulty, taskType) {
    const normalized = normalizeDifficulty(difficulty);
    return ["repair", "retention"].includes(taskType) ? REVIEW_TIME_BOX[normalized] : NEW_TIME_BOX[normalized];
  }

  function targetPriority(order) {
    if (!Number.isFinite(order) || order >= 9999) return 0;
    return Math.max(1, WEIGHTS.targetPriority - Math.floor((Math.max(1, order) - 1) / 15));
  }

  function goalUrgency(profile, today, taskType) {
    const targetDate = normalizeDate(profile.targetDate);
    const weeks = targetDate
      ? Math.ceil(dateDiffDays(today, targetDate) / 7)
      : positiveNumber(profile.horizonWeeks, 8);
    if (weeks > 6 || !["assessment", "transfer", "mixed", "mock"].includes(taskType)) return 0;
    return Math.max(2, WEIGHTS.goalUrgency - Math.max(0, weeks - 1));
  }

  function recentTitlePenalty(candidate, attempts, today) {
    const matching = attempts.find((attempt) => attempt.titleKey === candidate.slug);
    if (!matching) return 0;
    const age = dateDiffDays(matching.date, today);
    if (age <= 2) return WEIGHTS.recentTitleTwoDays;
    if (age <= 7) return WEIGHTS.recentTitleWeek;
    return 0;
  }

  function recentSkillPenalty(skillId, attempts) {
    const count = attempts.slice(0, 7).filter((attempt) => attempt.skillId === skillId).length;
    return count * WEIGHTS.recentSkillEach;
  }

  function buildExcludedSet(input) {
    const values = [
      ...(input.skippedProblemIds || []),
      ...(input.recentlyCompletedProblemIds || []),
      input.activeProblemId,
    ];
    return new Set(values.filter(Boolean).map(String));
  }

  function buildRecommendationId(today, candidate) {
    return `rec-${ALGORITHM_VERSION}-${stableHash([today, candidate.id, candidate.taskType, candidate.timeBoxMinutes].join("|"))}`;
  }

  function stableHash(value) {
    let hash = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
  }

  function createSkillEvidence(id, label) {
    return {
      id,
      label: String(label || id),
      checkedTitles: new Set(),
      independentTitles: new Set(),
      designatedTransferTitles: new Set(),
      checked: false,
      independent: false,
      transferSupported: false,
      lastCheckedAt: "",
      lastIndependentAt: "",
    };
  }

  function normalizeState(state) {
    return {
      ...(state && typeof state === "object" ? state : {}),
      problems: Array.isArray(state?.problems) ? state.problems : [],
      sessions: Array.isArray(state?.sessions) ? state.sessions : [],
    };
  }

  function candidateSlug(problem) {
    return String(problem.titleSlug || problem.slug || slugFromUrl(problem.url) || slugify(problem.title)).toLowerCase();
  }

  function slugFromUrl(value) {
    const match = String(value || "").match(/leetcode\.com\/problems\/([^/?#]+)/i);
    return match?.[1] || "";
  }

  function skillIdFor(topic) {
    const id = slugify(topic || "general") || "general";
    return ({
      "math-and-geometry": "math-geometry",
    })[id] || id;
  }

  function slugify(value) {
    return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  function normalizeTitle(value) {
    return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  }

  function normalizeDifficulty(value) {
    const text = String(value || "Medium").toLowerCase();
    if (text.startsWith("easy")) return "Easy";
    if (text.startsWith("hard")) return "Hard";
    return "Medium";
  }

  function difficultyRank(value) {
    return { Easy: 0, Medium: 1, Hard: 2 }[normalizeDifficulty(value)];
  }

  function normalizeDate(value) {
    if (!value) return "";
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
  }

  function dateDiffDays(from, to) {
    const fromValue = dateValue(from);
    const toValue = dateValue(to);
    if (!Number.isFinite(fromValue) || !Number.isFinite(toValue)) return 0;
    return Math.floor((toValue - fromValue) / 86400000);
  }

  function dateValue(value) {
    const normalized = normalizeDate(value);
    return normalized ? new Date(`${normalized}T12:00:00Z`).getTime() : NaN;
  }

  function maxDate(a, b) {
    if (!a) return b;
    if (!b) return a;
    return a > b ? a : b;
  }

  function positiveNumber(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? number : fallback;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function unique(values) {
    return [...new Set(values)];
  }

  function uniqueBy(values, keyFn) {
    const seen = new Set();
    return values.filter((value) => {
      const key = keyFn(value);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  return Object.freeze({
    ALGORITHM_VERSION,
    EVIDENCE_WINDOW_DAYS,
    WEIGHTS,
    recommendNextRep,
    deriveEvidence,
    buildCandidates,
    properAttempts,
    skillIdFor,
  });
});
