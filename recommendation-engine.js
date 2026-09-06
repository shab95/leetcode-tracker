(function initPracticeV2Engine(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.PracticeV2Engine = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createPracticeV2Engine() {
  "use strict";

  const ALGORITHM_VERSION = "readiness-v1.9";
  const V2_ALGORITHM_VERSION = "readiness-v2.1";
  const EVIDENCE_WINDOW_DAYS = 30;
  const WEAKNESS_WINDOW_DAYS = 21;
  const EXACT_TITLE_COOLDOWN_HOURS = 24;
  const TRANSFER_DEBT_WINDOW = 12;
  const TASK_PRECEDENCE = Object.freeze({ repair: 0, assessment: 1, transfer: 2, retention: 3, learn: 4, mixed: 5, mock: 6 });
  const NEW_TIME_BOX = Object.freeze({ Easy: 20, Medium: 30, Hard: 45 });
  const REVIEW_TIME_BOX = Object.freeze({ Easy: 10, Medium: 15, Hard: 20 });
  const INDEPENDENT_CHECKPOINT = Object.freeze({ Easy: 10, Medium: 15, Hard: 20 });
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

  const V2_REPAIR_WINDOW_DAYS = 3;
  const V2_MEANINGFUL_GAP_DAYS = 14;
  const V2_DELAYED_RETENTION_DAYS = 45;
  const V2_HARD_MEDIUM_GATE = 2;
  const STUDY_LIST_SCOPES = Object.freeze(["blind75", "neetcode150", "all"]);

  // The built-in catalogs predate V2 pattern metadata. Keep this mapping
  // local to the policy layer so existing state and list files stay portable.
  const CANONICAL_PATTERNS = Object.freeze({
    "two-sum": "two-pointers",
    "valid-palindrome": "two-pointers",
    "two-sum-ii-input-array-is-sorted": "two-pointers",
    "3sum": "two-pointers",
    "container-with-most-water": "two-pointers",
    "trapping-rain-water": "two-pointers",
    "remove-duplicates-from-sorted-array": "two-pointers",
    "move-zeroes": "two-pointers",
    "sort-colors": "two-pointers",
    "longest-substring-without-repeating-characters": "sliding-window",
    "longest-repeating-character-replacement": "sliding-window",
    "permutation-in-string": "sliding-window",
    "minimum-window-substring": "sliding-window",
    "sliding-window-maximum": "sliding-window",
    "daily-temperatures": "monotonic-stack",
    "car-fleet": "monotonic-stack",
    "largest-rectangle-in-histogram": "monotonic-stack",
    "next-greater-element-i": "monotonic-stack",
    "next-greater-element-ii": "monotonic-stack",
    "online-stock-span": "monotonic-stack",
    "maximal-rectangle": "monotonic-stack",
    "merge-intervals": "interval-sweep",
    "insert-interval": "interval-sweep",
    "non-overlapping-intervals": "interval-sweep",
    "meeting-rooms": "interval-sweep",
    "meeting-rooms-ii": "interval-sweep",
    "course-schedule": "topological-sort",
    "course-schedule-ii": "topological-sort",
    "alien-dictionary": "topological-sort",
    "number-of-islands": "graph-search",
    "clone-graph": "graph-search",
    "pacific-atlantic-water-flow": "graph-search",
    "rotting-oranges": "graph-search",
    "graph-valid-tree": "graph-search",
    "number-of-connected-components-in-an-undirected-graph": "graph-search",
    "word-ladder": "graph-search",
    "surrounded-regions": "graph-search",
    "subsets": "backtracking",
    "combination-sum": "backtracking",
    "permutations": "backtracking",
    "word-search": "backtracking",
    "word-search-ii": "backtracking",
    "letter-combinations-of-a-phone-number": "backtracking",
    "palindrome-partitioning": "backtracking",
    "n-queens": "backtracking",
    "generate-parentheses": "backtracking",
    "binary-search": "binary-search",
    "search-in-rotated-sorted-array": "binary-search",
    "find-minimum-in-rotated-sorted-array": "binary-search",
    "koko-eating-bananas": "binary-search",
    "median-of-two-sorted-arrays": "binary-search",
    "time-based-key-value-store": "binary-search",
    "capacity-to-ship-packages-within-d-days": "binary-search",
    "maximum-depth-of-binary-tree": "tree-traversal",
    "same-tree": "tree-traversal",
    "invert-binary-tree": "tree-traversal",
    "binary-tree-level-order-traversal": "tree-traversal",
    "serialize-and-deserialize-binary-tree": "tree-traversal",
    "subtree-of-another-tree": "tree-traversal",
    "lowest-common-ancestor-of-a-binary-search-tree": "tree-traversal",
    "binary-tree-right-side-view": "tree-traversal",
    "validate-binary-search-tree": "tree-traversal",
    "kth-smallest-element-in-a-bst": "tree-traversal",
    "climbing-stairs": "dynamic-programming",
    "house-robber": "dynamic-programming",
    "house-robber-ii": "dynamic-programming",
    "coin-change": "dynamic-programming",
    "longest-increasing-subsequence": "dynamic-programming",
    "word-break": "dynamic-programming",
    "decode-ways": "dynamic-programming",
    "unique-paths": "dynamic-programming",
    "longest-common-subsequence": "dynamic-programming",
    "maximum-subarray": "dynamic-programming",
    "maximum-product-subarray": "dynamic-programming",
    "partition-equal-subset-sum": "dynamic-programming",
    "target-sum": "dynamic-programming",
    "regular-expression-matching": "dynamic-programming",
    "kth-largest-element-in-an-array": "heap",
    "top-k-frequent-elements": "heap",
    "merge-k-sorted-lists": "heap",
    "find-median-from-data-stream": "heap",
    "task-scheduler": "heap",
    "last-stone-weight": "heap",
    "reverse-linked-list": "linked-list",
    "merge-two-sorted-lists": "linked-list",
    "reorder-list": "linked-list",
    "remove-nth-node-from-end-of-list": "linked-list",
    "copy-list-with-random-pointer": "linked-list",
    "linked-list-cycle": "linked-list",
    "lru-cache": "linked-list",
    "implement-trie-prefix-tree": "trie",
    "design-add-and-search-words-data-structure": "trie",
    "single-number": "bit-manipulation",
    "number-of-1-bits": "bit-manipulation",
    "counting-bits": "bit-manipulation",
    "reverse-bits": "bit-manipulation",
    "missing-number": "bit-manipulation",
    "sum-of-two-integers": "bit-manipulation",
    "redundant-connection": "union-find",
    "accounts-merge": "union-find",
    "best-time-to-buy-and-sell-stock": "greedy",
    "jump-game": "greedy",
    "jump-game-ii": "greedy",
    "gas-station": "greedy",
    "partition-labels": "greedy",
    "hand-of-straights": "greedy",
    "subarray-sum-equals-k": "prefix-sum",
    "range-sum-query-2d-immutable": "prefix-sum",
  });

  function resolveClock(input = {}) {
    const suppliedToday = normalizeDate(input.today);
    const today = suppliedToday || normalizeDate(new Date());
    const now = normalizeTimestamp(input.now) || (
      suppliedToday ? `${today}T23:59:59.999Z` : new Date().toISOString()
    );
    return { today, now };
  }

  function recommendNextRep(input = {}) {
    const state = normalizeState(input.state);
    const profile = { ...(state.trainingProfile || {}), ...(input.trainingProfile || {}) };
    const { today, now } = resolveClock(input);
    const capacityMinutes = positiveNumber(input.capacityMinutes, positiveNumber(profile.defaultSessionMinutes, 45));
    const studyListScope = input.studyListScope || state.practicePlan?.studyListScope;
    const catalog = filterCatalogByStudyScope(
      input.catalog,
      studyListScope,
    );
    const scopedProblems = filterProblemsByStudyScope(state.problems, studyListScope);
    const evidence = deriveEvidence({ ...state, problems: scopedProblems }, { today, now, catalog });
    const excluded = buildExcludedSet(input);
    const candidates = buildCandidates(scopedProblems, catalog)
      .filter((candidate) => !excluded.has(candidate.id) && !excluded.has(candidate.slug))
      .map((candidate) => scoreCandidate(candidate, { evidence, profile, today, now, capacityMinutes }))
      .filter((candidate) => candidate.eligible)
      .sort(compareCandidates);

    const winner = (
      evidence.transferDebt
        ? candidates.find((candidate) => candidate.taskType === "transfer")
        : null
    ) || candidates[0] || null;
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
        independentCheckpointMinutes: winner.independentCheckpointMinutes,
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

  // V2 is a policy layer over the same normalized state. It deliberately does
  // not mutate scheduler fields, so the rollout can be compared and reversed.
  function recommendNextRepV2(input = {}) {
    const state = normalizeState(input.state);
    const profile = { ...(state.trainingProfile || {}), ...(input.trainingProfile || {}) };
    const { today, now } = resolveClock(input);
    const capacityMinutes = positiveNumber(input.capacityMinutes, positiveNumber(profile.defaultSessionMinutes, 45));
    const studyListScope = input.studyListScope || state.practicePlan?.studyListScope;
    const catalog = filterCatalogByStudyScope(
      input.catalog,
      studyListScope,
    );
    const scopedProblems = filterProblemsByStudyScope(state.problems, studyListScope);
    const evidence = deriveV2Evidence({ ...state, problems: scopedProblems }, { today, now, catalog });
    const excluded = buildExcludedSet(input);
    const includeFamiliarDeferred = Boolean(input.includeFamiliarDeferred);
    const considered = buildCandidates(scopedProblems, catalog)
      .filter((candidate) => !excluded.has(String(candidate.id)) && !excluded.has(String(candidate.slug)))
      .map((candidate) => classifyV2Candidate(candidate, {
        evidence,
        today,
        now,
        capacityMinutes,
        includeFamiliarDeferred,
      }));
    const candidates = considered
      .filter((candidate) => candidate.eligible)
      .sort(compareV2Candidates);

    const laneOrder = ["repair", "transfer", "learn", "retention"];
    const pinnedProblemId = String(input.pinnedProblemId || input.pinnedRecommendationId || "");
    const pinnedWinner = pinnedProblemId
      ? candidates.find((candidate) => (
        String(candidate.id) === pinnedProblemId ||
        String(candidate.slug) === pinnedProblemId ||
        buildRecommendationIdFor(V2_ALGORITHM_VERSION, today, candidate) === pinnedProblemId
      ))
      : null;
    const winner = pinnedWinner || laneOrder
      .map((lane) => candidates.find((candidate) => candidate.lane === lane))
      .find(Boolean) || null;

    if (!winner) {
      const reasonCodes = ["no-eligible-candidate"];
      if (considered.length === 0) reasonCodes.push("no-candidates-after-exclusions");
      if (considered.length > 0 && considered.every((candidate) => candidate.capacityBlocked)) {
        reasonCodes.push("capacity-too-small-for-candidate");
      }
      if (considered.some((candidate) => candidate.futureBlocked)) {
        reasonCodes.push("future-history-only");
      }
      if (considered.some((candidate) => candidate.cooldownBlocked)) {
        reasonCodes.push("exact-title-cooldown");
      }
      if (considered.some((candidate) => candidate.hardLockedForAcquisition)) {
        reasonCodes.push("hard-acquisition-gated");
      }
      const familiarDeferred = considered.filter((candidate) => candidate.familiarityBlocked);
      if (familiarDeferred.length > 0 && familiarDeferred.length === considered.length) {
        reasonCodes.push("all-candidates-familiar-deferred");
      } else if (familiarDeferred.length > 0) {
        reasonCodes.push("familiarity-deferred");
      }
      if (capacityMinutes < NEW_TIME_BOX.Easy) {
        reasonCodes.push("capacity-too-small-for-new-coverage");
      }
      return {
        algorithmVersion: V2_ALGORITHM_VERSION,
        public: null,
        private: {
          taskType: null,
          lane: null,
          reasonCodes,
          rationale: "No candidate fits the current capacity, cooldown, or exclusion set.",
          consideredCount: considered.length,
          earliestFamiliarEligibleAt: familiarDeferred
            .map((candidate) => candidate.familiarEligibleAgainAt)
            .filter(Boolean)
            .sort()[0] || "",
          evidence: summarizeV2Evidence(evidence),
        },
      };
    }

    const recommendationId = buildRecommendationIdFor(V2_ALGORITHM_VERSION, today, winner);
    return {
      algorithmVersion: V2_ALGORITHM_VERSION,
      public: {
        recommendationId,
        problemId: winner.id,
        title: winner.title,
        url: winner.url,
        difficulty: winner.difficulty,
        independentCheckpointMinutes: winner.independentCheckpointMinutes,
        timeBoxMinutes: winner.timeBoxMinutes,
        publicReason: publicReasonFor(winner.taskType),
        evidenceStatus: publicEvidenceStatusFor(winner.taskType),
      },
      private: {
        recommendationId,
        taskType: winner.taskType,
        lane: winner.lane,
        primarySkillIds: [winner.skillId],
        patternId: winner.patternId,
        reasonCodes: winner.reasonCodes,
        score: winner.score,
        scoreComponents: winner.scoreComponents,
        rationale: privateRationaleFor(winner),
        consideredCount: candidates.length,
        hardUnlocked: winner.hardUnlocked,
        hardLockedForAcquisition: winner.hardLockedForAcquisition,
        requiredMinutes: winner.requiredMinutes,
        rankedCandidates: candidates.slice(0, 12).map(toV2PrivateTrace),
        evidence: summarizeV2Evidence(evidence),
      },
    };
  }

  function deriveV2Evidence(stateInput = {}, options = {}) {
    const state = normalizeState(stateInput);
    const { today, now } = resolveClock(options);
    const catalog = filterCatalogByStudyScope(
      options.catalog,
      options.studyListScope || state.practicePlan?.studyListScope,
    );
    const scopedProblems = filterProblemsByStudyScope(
      state.problems,
      options.studyListScope || state.practicePlan?.studyListScope,
    );
    const skills = new Map();
    const patterns = new Map();
    const recentAttempts = [];

    for (const problem of scopedProblems) {
      const plan = findCatalogMatch(problem, catalog);
      const evidenceProblem = plan && !hasPatternMetadata(problem)
        ? { ...plan, ...problem, patternId: patternIdFor(plan), patternKnown: true }
        : problem;
      const skillId = skillIdFor(evidenceProblem.topic);
      const patternId = patternIdFor(evidenceProblem);
      const skill = skills.get(skillId) || createV2SkillEvidence(skillId, evidenceProblem.topic);
      const pattern = patterns.get(patternId) || createV2PatternEvidence(patternId, skillId);
      if (hasPatternMetadata(evidenceProblem)) pattern.patternKnown = true;
      const attempts = properAttempts(problem, { throughDate: today, throughTimestamp: now });

      for (const attempt of attempts) {
        const ageDays = dateDiffDays(attempt.date, today);
        if (ageDays < 0 || ageDays > EVIDENCE_WINDOW_DAYS) continue;
        const titleKey = candidateSlug(problem);
        const enriched = { ...attempt, problemId: problem.id, titleKey, skillId, patternId, difficulty: normalizeDifficulty(evidenceProblem.difficulty) };
        recentAttempts.push(enriched);
        skill.checkedTitles.add(titleKey);
        pattern.checkedTitles.add(titleKey);
        skill.lastCheckedAt = maxDate(skill.lastCheckedAt, attempt.date);
        pattern.lastCheckedAt = maxDate(pattern.lastCheckedAt, attempt.date);

        if (qualifiesAsIndependent(attempt)) {
          skill.independentTitles.add(titleKey);
          pattern.independentTitles.add(titleKey);
          skill.lastIndependentAt = maxDate(skill.lastIndependentAt, attempt.date);
          pattern.lastIndependentAt = maxDate(pattern.lastIndependentAt, attempt.date);
          if (normalizeDifficulty(evidenceProblem.difficulty) === "Medium") {
            pattern.independentMediumTitles.add(titleKey);
          }
        }
      }
      skills.set(skillId, skill);
      patterns.set(patternId, pattern);
    }

    for (const planProblem of catalog) {
      const skillId = skillIdFor(planProblem.topic);
      const patternId = patternIdFor(planProblem);
      if (!skills.has(skillId)) skills.set(skillId, createV2SkillEvidence(skillId, planProblem.topic));
      if (!patterns.has(patternId)) {
        const pattern = createV2PatternEvidence(patternId, skillId);
        pattern.patternKnown = hasPatternMetadata(planProblem);
        patterns.set(patternId, pattern);
      } else if (hasPatternMetadata(planProblem)) {
        patterns.get(patternId).patternKnown = true;
      }
    }

    for (const skill of skills.values()) {
      skill.checked = skill.checkedTitles.size > 0;
      skill.independent = skill.independentTitles.size > 0;
    }
    for (const pattern of patterns.values()) {
      pattern.checked = pattern.checkedTitles.size > 0;
      pattern.independent = pattern.independentTitles.size > 0;
      pattern.hardUnlocked = pattern.patternKnown && pattern.independentMediumTitles.size >= V2_HARD_MEDIUM_GATE;
    }

    recentAttempts.sort(compareAttemptsNewestFirst);
    return { today, skills, patterns, recentAttempts };
  }

  function classifyV2Candidate(candidate, context) {
    const { evidence, today, now, capacityMinutes, includeFamiliarDeferred = false } = context;
    const attempts = properAttempts(candidate.problem, { throughDate: today, throughTimestamp: now });
    const allAttempts = properAttempts(candidate.problem);
    const importedEntries = importedAttempts(candidate.problem, { throughDate: today });
    const importedOnly = attempts.length === 0 && importedEntries.length > 0;
    const lastAttempt = attempts.at(-1) || null;
    const lastAgeDays = lastAttempt ? dateDiffDays(lastAttempt.date, today) : null;
    const skill = evidence.skills.get(candidate.skillId) || createV2SkillEvidence(candidate.skillId, candidate.topic);
    const pattern = evidence.patterns.get(candidate.patternId) || createV2PatternEvidence(candidate.patternId, candidate.skillId);
    if (candidate.patternKnown) pattern.patternKnown = true;
    const hasFutureAttempts = attempts.length < allAttempts.length;
    const futureOnly = attempts.length === 0 && allAttempts.length > 0;
    const scheduledNextReview = eligibleNextReview(candidate, lastAttempt, hasFutureAttempts);
    const activeFamiliarity = latestActiveFamiliarity(candidate.problem, { today, now });
    const familiarEligibleAgainAt = normalizeDate(activeFamiliarity?.eligibleAgainAt);
    const nextReview = includeFamiliarDeferred
      ? scheduledNextReview
      : maxDate(scheduledNextReview, familiarEligibleAgainAt);
    const due = Boolean(nextReview && nextReview <= today && attempts.length > 0);
    const daysOverdue = due ? Math.max(0, dateDiffDays(nextReview, today)) : 0;
    const recentWeakness = Boolean(
      lastAttempt &&
      lastAgeDays >= 0 &&
      lastAgeDays <= V2_REPAIR_WINDOW_DAYS &&
      (["red", "yellow"].includes(lastAttempt.grade) || lastAttempt.solutionQuality === "suboptimal")
    );
    const recentOptimizationGap = Boolean(lastAttempt?.solutionQuality === "suboptimal" && recentWeakness);
    const unseen = attempts.length === 0;
    // A topic fallback is useful for transfer grouping, but it is not strong
    // enough evidence to unlock a compound Hard problem. Only explicit pattern
    // metadata can satisfy the Hard gate.
    const scheduledTaskType = chooseV2TaskType({
      candidate,
      skill,
      pattern,
      attempts,
      importedOnly,
      due,
      lastAttempt,
      lastAgeDays,
      recentWeakness,
      unseen,
    });
    const taskType = scheduledTaskType || (includeFamiliarDeferred && activeFamiliarity ? "retention" : "");
    const lane = laneForV2Candidate({ taskType, due, unseen, lastAgeDays, recentWeakness });
    // Hard gating applies to new coverage and transfer acquisition only. A
    // recent failure or a genuinely due Hard still needs a repair path.
    const hardUnlocked = candidate.difficulty !== "Hard" ||
      !["learn", "transfer"].includes(lane) ||
      (candidate.patternKnown && pattern.hardUnlocked);
    const hardLockedForAcquisition = candidate.difficulty === "Hard" &&
      ["learn", "transfer"].includes(lane) &&
      !(candidate.patternKnown && pattern.hardUnlocked);
    const effectiveTaskType = taskType || "retention";
    const timeBoxMinutes = timeBoxFor(candidate.difficulty, effectiveTaskType);
    const independentCheckpointMinutes = Math.min(timeBoxMinutes, independentCheckpointFor(candidate.difficulty));
    // Capacity is the user's solving budget. Reflection is shown in the UI but
    // should not make a 45-minute Hard ineligible when its solving box is 45.
    const requiredMinutes = timeBoxMinutes;
    const capacityBlocked = requiredMinutes > capacityMinutes;
    const futureBlocked = futureOnly;
    const cooldown = exactTitleCooldown({
      ...candidate,
      nextReview: includeFamiliarDeferred && familiarEligibleAgainAt ? "" : nextReview,
    }, lastAttempt, { today, now });
    const cooldownBlocked = cooldown.blocked;
    const familiarityBlocked = Boolean(
      !includeFamiliarDeferred && familiarEligibleAgainAt && familiarEligibleAgainAt > today
    );
    const eligible = Boolean(
      candidate.title && candidate.id && Boolean(taskType) && !capacityBlocked && !hardLockedForAcquisition &&
      !cooldownBlocked && !futureBlocked && !familiarityBlocked
    );
    const scoreComponents = {
      lane: (4 - ({ repair: 0, transfer: 1, learn: 2, retention: 3 }[lane] ?? 4)) * 100,
      due: due ? 12 + Math.min(10, Math.floor(daysOverdue / 7)) : 0,
      underTested: Math.max(0, 10 - pattern.checkedTitles.size),
      catalogPriority: targetPriority(candidate.catalogOrder),
      capacityFit: Math.round(Math.min(5, 5 * (requiredMinutes / Math.max(capacityMinutes, 1)))),
      recentTitle: lane === "repair" ? 0 : recentTitlePenalty(candidate, evidence.recentAttempts, today),
    };
    const reasonCodes = v2ReasonCodes({ lane, taskType, importedOnly, due, daysOverdue, recentWeakness, recentOptimizationGap, hardUnlocked, hardLockedForAcquisition, pattern });

    return {
      ...candidate,
      patternId: candidate.patternId,
      lane,
      taskType,
      timeBoxMinutes,
      independentCheckpointMinutes,
      requiredMinutes,
      eligible,
      due,
      daysOverdue,
      lastAttempt,
      lastAgeDays,
      importedOnly,
      futureOnly,
      unseen,
      hardUnlocked,
      hardLockedForAcquisition,
      capacityBlocked,
      futureBlocked,
      cooldownBlocked,
      cooldownReason: cooldown.reason,
      familiarityBlocked,
      familiarEligibleAgainAt,
      scoreComponents,
      score: Object.values(scoreComponents).reduce((sum, value) => sum + value, 0),
      reasonCodes,
      allAttemptsCount: allAttempts.length,
    };
  }

  function chooseV2TaskType({ candidate, skill, pattern, attempts, importedOnly, due, lastAttempt, lastAgeDays, recentWeakness, unseen }) {
    if (recentWeakness) return "repair";
    // Transfer tests skill generalization. The candidate may use a different
    // sub-pattern; explicit pattern metadata is required for Hard gating, not
    // for the broader transfer lane itself.
    if (unseen && skill.independent) return "transfer";
    if (unseen) return "learn";
    if (due && lastAgeDays >= V2_MEANINGFUL_GAP_DAYS) return "retention";
    if (lastAgeDays != null && lastAgeDays >= V2_DELAYED_RETENTION_DAYS && lastAttempt?.grade === "green") return "retention";
    return "";
  }

  function laneForV2Candidate({ taskType, due, unseen, lastAgeDays, recentWeakness }) {
    if (recentWeakness || taskType === "repair") return "repair";
    if (taskType === "transfer") return "transfer";
    if (unseen) return "learn";
    if (taskType === "retention") return "retention";
    if (due || (lastAgeDays != null && lastAgeDays >= V2_DELAYED_RETENTION_DAYS)) return "retention";
    return null;
  }

  function compareV2Candidates(a, b) {
    return b.score - a.score ||
      difficultyRank(a.difficulty) - difficultyRank(b.difficulty) ||
      a.catalogOrder - b.catalogOrder ||
      a.slug.localeCompare(b.slug) ||
      a.id.localeCompare(b.id);
  }

  function v2ReasonCodes({ lane, taskType, importedOnly, due, daysOverdue, recentWeakness, recentOptimizationGap, hardUnlocked, hardLockedForAcquisition, pattern }) {
    const codes = [`v2-lane-${lane}`, `task-${taskType}`];
    if (importedOnly) codes.push("historical-exposure-unverified");
    if (due) codes.push("exact-review-due");
    if (daysOverdue > 0) codes.push("review-overdue");
    if (recentWeakness) codes.push("recent-friction");
    if (recentOptimizationGap) codes.push("recent-optimization-gap");
    if (pattern.hardUnlocked && pattern.patternKnown !== false) codes.push("hard-gate-open");
    if (hardLockedForAcquisition) codes.push("hard-gate-closed");
    if (pattern.patternKnown === false) codes.push("pattern-metadata-missing");
    return codes;
  }

  function toV2PrivateTrace(candidate) {
    return {
      problemId: candidate.id,
      title: candidate.title,
      lane: candidate.lane,
      taskType: candidate.taskType,
      skillId: candidate.skillId,
      patternId: candidate.patternId,
      difficulty: candidate.difficulty,
      hardLockedForAcquisition: candidate.hardLockedForAcquisition,
      score: candidate.score,
      reasonCodes: candidate.reasonCodes,
      timeBoxMinutes: candidate.timeBoxMinutes,
    };
  }

  function summarizeV2Evidence(evidence) {
    return {
      skills: [...evidence.skills.values()].map((skill) => ({
        id: skill.id,
        checkedTitles: skill.checkedTitles.size,
        independentTitles: skill.independentTitles.size,
      })),
      patterns: [...evidence.patterns.values()].map((pattern) => ({
        id: pattern.id,
        independentMediumTitles: pattern.independentMediumTitles.size,
        hardUnlocked: pattern.hardUnlocked,
      })),
    };
  }

  function createV2SkillEvidence(id, label) {
    return { id, label: String(label || id), checkedTitles: new Set(), independentTitles: new Set(), checked: false, independent: false, lastCheckedAt: "", lastIndependentAt: "" };
  }

  function createV2PatternEvidence(id, skillId) {
    return { id, skillId, checkedTitles: new Set(), independentTitles: new Set(), independentMediumTitles: new Set(), checked: false, independent: false, hardUnlocked: false, patternKnown: false, lastCheckedAt: "", lastIndependentAt: "" };
  }

  function deriveEvidence(stateInput = {}, options = {}) {
    const state = normalizeState(stateInput);
    const today = normalizeDate(options.today) || normalizeDate(new Date());
    const now = normalizeTimestamp(options.now);
    const catalog = Array.isArray(options.catalog) ? options.catalog : [];
    const skills = new Map();
    const recentAttempts = [];

    for (const problem of state.problems) {
      const skillId = skillIdFor(problem.topic);
      const skill = skills.get(skillId) || createSkillEvidence(skillId, problem.topic);
      const attempts = properAttempts(problem, { throughDate: today, throughTimestamp: now });

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

    recentAttempts.sort(compareAttemptsNewestFirst);
    const recentVersionedAttempts = recentAttempts
      .filter((attempt) => attempt.taskType)
      .slice(0, TRANSFER_DEBT_WINDOW);
    const transferDebt = (
      recentVersionedAttempts.length >= TRANSFER_DEBT_WINDOW &&
      !recentVersionedAttempts.some((attempt) => ["transfer", "mixed", "mock"].includes(attempt.taskType))
    );
    return {
      today,
      skills,
      checkedSkillIds: [...skills.values()].filter((skill) => skill.checked).map((skill) => skill.id).sort(),
      independentSkillIds: [...skills.values()].filter((skill) => skill.independent).map((skill) => skill.id).sort(),
      transferSupportedSkillIds: [...skills.values()].filter((skill) => skill.transferSupported).map((skill) => skill.id).sort(),
      recentAttempts,
      recentVersionedRepCount: recentVersionedAttempts.length,
      transferDebt,
    };
  }

  function summarizeStudyListEvidence(input = {}) {
    const today = normalizeDate(input.today) || normalizeDate(new Date());
    const now = normalizeTimestamp(input.now);
    const windowDays = positiveNumber(input.windowDays, EVIDENCE_WINDOW_DAYS);
    const problems = Array.isArray(input.problems) ? input.problems : [];
    const catalog = Array.isArray(input.catalog) ? input.catalog : [];
    const bySlug = new Map();
    const byTitle = new Map();

    for (const problem of problems) {
      const slug = candidateSlug(problem);
      const title = normalizeTitle(problem.title);
      if (slug) bySlug.set(slug, problem);
      if (title) byTitle.set(title, problem);
    }

    const summary = {
      total: 0,
      measured: 0,
      independent: 0,
      developing: 0,
      unmeasured: 0,
      windowDays,
    };
    const seen = new Set();

    for (const planProblem of catalog) {
      const slug = candidateSlug(planProblem);
      const title = normalizeTitle(planProblem.title);
      const catalogKey = slug || title;
      if (!catalogKey || seen.has(catalogKey)) continue;
      seen.add(catalogKey);
      summary.total += 1;

      const problem = bySlug.get(slug) || byTitle.get(title);
      const recentAttempts = properAttempts(problem, { throughDate: today, throughTimestamp: now })
        .filter((attempt) => {
          const ageDays = dateDiffDays(attempt.date, today);
          return ageDays >= 0 && ageDays <= windowDays;
        });

      if (recentAttempts.some(qualifiesAsIndependent)) {
        summary.independent += 1;
        summary.measured += 1;
      } else if (recentAttempts.length > 0) {
        summary.developing += 1;
        summary.measured += 1;
      } else {
        summary.unmeasured += 1;
      }
    }

    return summary;
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
        if (!existing.patternKnown && hasPatternMetadata(plan)) {
          existing.patternId = patternIdFor(plan);
          existing.patternKnown = true;
        }
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
    const { evidence, profile, today, now, capacityMinutes } = context;
    const allAttempts = properAttempts(candidate.problem);
    const attempts = properAttempts(candidate.problem, { throughDate: today, throughTimestamp: now });
    const importedEntries = importedAttempts(candidate.problem, { throughDate: today });
    const hasFutureAttempts = attempts.length < allAttempts.length;
    const lastAttempt = attempts[attempts.length - 1] || null;
    const lastAgeDays = lastAttempt ? dateDiffDays(lastAttempt.date, today) : null;
    const skill = evidence.skills.get(candidate.skillId) || createSkillEvidence(candidate.skillId, candidate.topic);
    const effectiveNextReview = eligibleNextReview(candidate, lastAttempt, hasFutureAttempts);
    const due = Boolean(effectiveNextReview && effectiveNextReview <= today && attempts.length > 0);
    const daysOverdue = due ? Math.max(0, dateDiffDays(effectiveNextReview, today)) : 0;
    const importedOnly = attempts.length === 0 && importedEntries.length > 0;
    const recentOptimizationGap = Boolean(
      lastAttempt &&
      lastAgeDays >= 0 &&
      lastAgeDays <= WEAKNESS_WINDOW_DAYS &&
      lastAttempt.solutionQuality === "suboptimal"
    );
    const recentWeakness = lastAttempt && lastAgeDays >= 0 && lastAgeDays <= WEAKNESS_WINDOW_DAYS && (
      ["red", "yellow"].includes(lastAttempt.grade) || recentOptimizationGap
    );
    const taskType = chooseTaskType({ candidate, skill, attempts, importedOnly, due, lastAttempt, lastAgeDays, recentWeakness });
    const timeBoxMinutes = timeBoxFor(candidate.difficulty, taskType);
    const independentCheckpointMinutes = Math.min(
      timeBoxMinutes,
      independentCheckpointFor(candidate.difficulty),
    );
    const requiredMinutes = timeBoxMinutes + 3;
    const cooldown = exactTitleCooldown({ ...candidate, nextReview: effectiveNextReview }, lastAttempt, { today, now });
    const eligible = Boolean(candidate.title && candidate.id && requiredMinutes <= capacityMinutes && !cooldown.blocked);
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

    const reasonCodes = reasonCodesFor({
      taskType,
      skill,
      due,
      importedOnly,
      recentWeakness,
      recentOptimizationGap,
      lastAgeDays,
    });
    if (evidence.transferDebt && taskType === "transfer") reasonCodes.push("transfer-cadence-due");

    return {
      ...candidate,
      taskType,
      timeBoxMinutes,
      independentCheckpointMinutes,
      requiredMinutes,
      eligible,
      due,
      daysOverdue,
      lastAttempt,
      lastAgeDays,
      importedOnly,
      recentOptimizationGap,
      cooldownReason: cooldown.reason,
      score,
      scoreComponents: components,
      reasonCodes,
    };
  }

  function chooseTaskType({ candidate, skill, attempts, importedOnly, due, lastAttempt, lastAgeDays, recentWeakness }) {
    if (recentWeakness) return "repair";
    if (importedOnly || (attempts.length > 0 && lastAgeDays > 60 && !due)) return "assessment";
    if (!skill.transferSupported && skill.independent && attempts.length === 0) return "transfer";
    if (due) return "retention";
    if (attempts.length === 0) return "learn";
    if (!skill.independent || lastAttempt?.grade !== "green") return "assessment";
    if (!skill.transferSupported && !skill.independentTitles.has(candidate.slug)) return "transfer";
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
      patternId: patternIdFor(problem),
      patternKnown: hasPatternMetadata(problem),
      nextReview: normalizeDate(problem.nextReview),
      stage: clamp(Number(problem.stage || 0), 0, 5),
      catalogOrder: positiveNumber(problem.order, 9999),
      listMemberships: Array.isArray(problem.listMemberships) ? [...problem.listMemberships] : [],
      problem,
    };
  }

  function findCatalogMatch(problem, catalog = []) {
    const slug = candidateSlug(problem);
    const title = normalizeTitle(problem.title);
    return catalog.find((plan) => (
      (slug && candidateSlug(plan) === slug) ||
      (title && normalizeTitle(plan.title) === title)
    )) || null;
  }

  function properAttempts(problem = {}, options = {}) {
    const throughDate = normalizeDate(options.throughDate);
    const throughTimestamp = timestampValue(options.throughTimestamp);
    return (Array.isArray(problem.reviewHistory) ? problem.reviewHistory : [])
      .filter((entry) => ["red", "yellow", "green"].includes(entry?.grade))
      .map((entry) => ({
        ...entry,
        date: normalizeDate(entry.date || entry.occurredAt || entry.completedAt || entry.createdAt),
        taskType: String(entry.taskType || ""),
      }))
      .filter((entry) => entry.date)
      .filter((entry) => attemptIsWithinCutoff(entry, { throughDate, throughTimestamp }))
      .sort(compareAttemptsChronologically);
  }

  function importedAttempts(problem = {}, options = {}) {
    const throughDate = normalizeDate(options.throughDate);
    return (Array.isArray(problem.reviewHistory) ? problem.reviewHistory : [])
      .filter((entry) => entry?.grade === "imported")
      .map((entry) => ({
        ...entry,
        date: normalizeDate(entry.date || entry.occurredAt || entry.completedAt || entry.createdAt),
      }))
      .filter((entry) => !throughDate || !entry.date || entry.date <= throughDate);
  }

  function familiarityEvents(problem = {}, options = {}) {
    const throughDate = normalizeDate(options.throughDate);
    const throughTimestamp = timestampValue(options.throughTimestamp);
    const attempts = properAttempts(problem, options);
    const lastAttempt = attempts.at(-1) || null;
    const lastAttemptDate = normalizeDate(lastAttempt?.date);
    const lastAttemptTimestamp = attemptOccurrenceTimestamp(lastAttempt || {});
    const history = Array.isArray(problem.reviewHistory) ? problem.reviewHistory : [];
    const lastAttemptIndex = lastAttempt?.id
      ? history.findLastIndex((entry) => entry?.id === lastAttempt.id)
      : -1;

    return history
      .filter((entry) => entry?.kind === "familiarity" && !entry.revokedAt)
      .map((entry) => ({
        ...entry,
        date: normalizeDate(entry.date || entry.occurredAt || entry.createdAt),
        _historyIndex: history.indexOf(entry),
      }))
      .filter((entry) => entry.date)
      .filter((entry) => !throughDate || entry.date <= throughDate)
      .filter((entry) => {
        if (!Number.isFinite(throughTimestamp)) return true;
        const occurredAt = timestampValue(entry.occurredAt || entry.createdAt);
        return !Number.isFinite(occurredAt) || occurredAt <= throughTimestamp;
      })
      .filter((entry) => {
        if (!lastAttemptDate) return true;
        if (entry.date !== lastAttemptDate) return entry.date > lastAttemptDate;
        const occurredAt = timestampValue(entry.occurredAt || entry.createdAt);
        if (!Number.isFinite(lastAttemptTimestamp)) return entry._historyIndex > lastAttemptIndex;
        return Number.isFinite(occurredAt) && occurredAt > lastAttemptTimestamp;
      })
      .sort(compareFamiliarityChronologically)
      .map(({ _historyIndex, ...entry }) => entry);
  }

  function latestActiveFamiliarity(problem = {}, options = {}) {
    return familiarityEvents(problem, {
      throughDate: options.today,
      throughTimestamp: options.now,
    }).at(-1) || null;
  }

  function calculateFamiliarityTransition(problem = {}, options = {}) {
    const today = normalizeDate(options.today) || normalizeDate(new Date());
    const now = normalizeTimestamp(options.now) || new Date().toISOString();
    const attempts = properAttempts(problem, { throughDate: today, throughTimestamp: now });
    const lastAttempt = attempts.at(-1) || null;
    const events = familiarityEvents(problem, { throughDate: today, throughTimestamp: now });
    const previousEvent = events.at(-1) || null;
    const hasVerifiedGreen = attempts.some((attempt) => attempt.grade === "green");
    let intervalDays;

    if (["red", "yellow"].includes(lastAttempt?.grade)) {
      intervalDays = 7;
    } else if (!hasVerifiedGreen) {
      intervalDays = events.length === 0 ? 14 : 30;
    } else {
      const stage = clamp(Number(problem.stage || 0), 0, 5);
      const greenIntervals = [1, 3, 7, 14, 30, 60];
      const nextGreenInterval = greenIntervals[Math.min(stage + 1, greenIntervals.length - 1)];
      const previousInterval = positiveNumber(previousEvent?.intervalDays, 0);
      const nextFamiliarInterval = previousInterval >= 30 ? 60 : previousInterval >= 14 ? 30 : 14;
      intervalDays = Math.min(60, Math.max(14, nextGreenInterval, nextFamiliarInterval));
    }

    const calculatedDate = addDaysDate(today, intervalDays);
    const priorNextReview = normalizeDate(problem.nextReview);
    return {
      intervalDays,
      eligibleAgainAt: maxDate(calculatedDate, priorNextReview),
      familiaritySequence: events.length + 1,
      priorGrade: lastAttempt?.grade || "",
      priorNextReview,
    };
  }

  function compareFamiliarityChronologically(a, b) {
    const dateDifference = dateValue(a.date) - dateValue(b.date);
    if (dateDifference) return dateDifference;
    const aTimestamp = timestampValue(a.occurredAt || a.createdAt);
    const bTimestamp = timestampValue(b.occurredAt || b.createdAt);
    if (Number.isFinite(aTimestamp) && Number.isFinite(bTimestamp) && aTimestamp !== bTimestamp) {
      return aTimestamp - bTimestamp;
    }
    if (a._historyIndex !== b._historyIndex) return a._historyIndex - b._historyIndex;
    return String(a.id || "").localeCompare(String(b.id || ""));
  }

  function attemptIsWithinCutoff(attempt, { throughDate, throughTimestamp }) {
    if (throughDate && attempt.date > throughDate) return false;
    if (!Number.isFinite(throughTimestamp)) return true;

    const occurredAt = attemptOccurrenceTimestamp(attempt);
    return !Number.isFinite(occurredAt) || occurredAt <= throughTimestamp;
  }

  function eligibleNextReview(candidate, lastAttempt, hasFutureAttempts) {
    if (!hasFutureAttempts) return normalizeDate(candidate.nextReview) || normalizeDate(lastAttempt?.nextReview);

    const historyNextReview = normalizeDate(lastAttempt?.nextReview);
    if (historyNextReview) return historyNextReview;
    return "";
  }

  function qualifiesAsIndependent(attempt) {
    if (attempt.grade !== "green") return false;
    const assistance = String(attempt.assistance || "none").toLowerCase();
    return !["hint", "solution", "editorial", "person", "ai"].includes(assistance);
  }

  function reasonCodesFor({ taskType, skill, due, importedOnly, recentWeakness, recentOptimizationGap, lastAgeDays }) {
    const codes = [`task-${taskType}`];
    if (!skill.checked) codes.push("missing-recent-check");
    if (!skill.independent) codes.push("missing-independent-evidence");
    if (!skill.transferSupported && skill.independent) codes.push("missing-transfer-evidence");
    if (due) codes.push("exact-review-due");
    if (importedOnly) codes.push("historical-exposure-unverified");
    if (recentWeakness) codes.push("recent-friction");
    if (recentOptimizationGap) codes.push("recent-optimization-gap");
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
    if (candidate.taskType === "repair" && candidate.lastAttempt?.solutionQuality === "suboptimal") {
      return `A recent correct-but-suboptimal result makes an optimization-focused ${skill} follow-up valuable.`;
    }
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
      independentCheckpointMinutes: candidate.independentCheckpointMinutes,
      timeBoxMinutes: candidate.timeBoxMinutes,
    };
  }

  function independentCheckpointFor(difficulty) {
    return INDEPENDENT_CHECKPOINT[normalizeDifficulty(difficulty)];
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

  function exactTitleCooldown(candidate, lastAttempt, { today, now }) {
    if (!lastAttempt) return { blocked: false, reason: "" };

    const attemptAt = attemptOccurrenceTimestamp(lastAttempt);
    const currentTime = timestampValue(now);
    const elapsed = currentTime - attemptAt;
    if (
      Number.isFinite(attemptAt) &&
      Number.isFinite(currentTime) &&
      elapsed >= 0 &&
      elapsed < EXACT_TITLE_COOLDOWN_HOURS * 3600000
    ) {
      return { blocked: true, reason: "same-title-cooldown" };
    }

    const nextReview = normalizeDate(candidate.nextReview);
    if (["yellow", "green"].includes(lastAttempt.grade) && nextReview && nextReview > today) {
      return { blocked: true, reason: "scheduled-review-not-due" };
    }

    if (lastAttempt.grade !== "red") return { blocked: false, reason: "" };

    if (attemptAt && currentTime) return { blocked: false, reason: "" };

    if (nextReview && nextReview > today) return { blocked: true, reason: "scheduled-review-not-due" };

    return { blocked: false, reason: "" };
  }

  function attemptTimestamp(attempt) {
    return timestampValue(attempt.occurredAt || attempt.completedAt || attempt.createdAt);
  }

  function attemptOccurrenceTimestamp(attempt) {
    const explicitTimestamp = timestampValue(attempt.occurredAt || attempt.completedAt);
    if (Number.isFinite(explicitTimestamp)) return explicitTimestamp;
    if (attempt.backfilled || String(attempt.attemptContext || "").includes("backfill")) return NaN;
    return timestampValue(attempt.createdAt);
  }

  function compareAttemptsChronologically(a, b) {
    const dateDifference = dateValue(a.date) - dateValue(b.date);
    if (dateDifference) return dateDifference;

    const timestampDifference = attemptOrderTimestamp(a) - attemptOrderTimestamp(b);
    if (timestampDifference) return timestampDifference;

    return attemptStableKey(a).localeCompare(attemptStableKey(b));
  }

  function compareAttemptsNewestFirst(a, b) {
    return compareAttemptsChronologically(b, a);
  }

  function attemptOrderTimestamp(attempt) {
    const timestamp = attemptOccurrenceTimestamp(attempt);
    return Number.isFinite(timestamp) ? timestamp : dateValue(attempt.date);
  }

  function attemptStableKey(attempt) {
    return [
      attempt.problemId || "",
      attempt.titleKey || "",
      attempt.id || "",
      attempt.grade || "",
      attempt.taskType || "",
      attempt.assistance || "",
      attempt.note || "",
    ].map(String).join("|");
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
    return buildRecommendationIdFor(ALGORITHM_VERSION, today, candidate);
  }

  function buildRecommendationIdFor(version, today, candidate) {
    return `rec-${version}-${stableHash([today, candidate.id, candidate.taskType, candidate.timeBoxMinutes].join("|"))}`;
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

  function filterCatalogByStudyScope(catalog, scope) {
    const values = Array.isArray(catalog) ? catalog : [];
    if (!STUDY_LIST_SCOPES.includes(scope) || scope === "all") return values;
    return values.filter((plan) => (
      Array.isArray(plan?.listMemberships) && plan.listMemberships.includes(scope)
    ));
  }

  function filterProblemsByStudyScope(problems, scope) {
    const values = Array.isArray(problems) ? problems : [];
    if (!STUDY_LIST_SCOPES.includes(scope) || scope === "all") return values;
    return values.filter((problem) => (
      Array.isArray(problem?.listMemberships) && problem.listMemberships.includes(scope)
    ));
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

  function patternIdFor(problem = {}) {
    const rawPattern = problem.patternId || problem.primaryPattern || problem.pattern ||
      (Array.isArray(problem.patternIds) ? problem.patternIds[0] : "");
    // Unknown patterns must not collapse into one topic-wide bucket. They are
    // intentionally ineligible for Hard acquisition until explicit metadata
    // exists, but their per-problem evidence can still guide ranking.
    return slugify(rawPattern) || CANONICAL_PATTERNS[candidateSlug(problem)] || `unknown:${candidateSlug(problem)}`;
  }

  function hasPatternMetadata(problem = {}) {
    return Boolean(
      String(problem.patternId || problem.primaryPattern || problem.pattern || "").trim() ||
      (Array.isArray(problem.patternIds) && problem.patternIds.some((pattern) => String(pattern || "").trim())) ||
      Boolean(CANONICAL_PATTERNS[candidateSlug(problem)])
    );
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
    return Number.isNaN(date.getTime()) ? "" : localDateKey(date);
  }

  function localDateKey(value = new Date()) {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function normalizeTimestamp(value) {
    const timestamp = timestampValue(value);
    return timestamp ? new Date(timestamp).toISOString() : "";
  }

  function timestampValue(value) {
    if (!value) return NaN;
    const date = value instanceof Date ? value : new Date(value);
    const timestamp = date.getTime();
    return Number.isFinite(timestamp) ? timestamp : NaN;
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

  function addDaysDate(value, days) {
    const normalized = normalizeDate(value);
    if (!normalized) return "";
    const date = new Date(`${normalized}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() + Number(days || 0));
    return date.toISOString().slice(0, 10);
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
    V2_ALGORITHM_VERSION,
    EVIDENCE_WINDOW_DAYS,
    EXACT_TITLE_COOLDOWN_HOURS,
    TRANSFER_DEBT_WINDOW,
    INDEPENDENT_CHECKPOINT,
    WEIGHTS,
    recommendNextRep,
    recommendNextRepV2,
    deriveEvidence,
    deriveV2Evidence,
    summarizeStudyListEvidence,
    buildCandidates,
    calculateFamiliarityTransition,
    familiarityEvents,
    localDateKey,
    properAttempts,
    skillIdFor,
    patternIdFor,
    filterCatalogByStudyScope,
  });
});
