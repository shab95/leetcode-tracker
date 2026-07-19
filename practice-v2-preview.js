"use strict";

const states = [...document.querySelectorAll(".rep-state")];
const progressSteps = [...document.querySelectorAll(".rep-progress li")];
const gradeButtons = [...document.querySelectorAll("[data-grade]")];
const themeButtons = [...document.querySelectorAll("[data-theme-choice]")];
const toast = document.querySelector("#prototypeToast");
const reflectionForm = document.querySelector("#reflectionForm");
const selectedGradeLabel = document.querySelector("#selectedGradeLabel");
const recapMinutes = document.querySelector("#recapMinutes");
const continueGradeButton = document.querySelector("#continueGrade");
const assistanceField = document.querySelector("#assistanceField");
const assistanceSelect = document.querySelector("#assistance");
const blockerField = document.querySelector("#blockerField");
const blockerSelect = document.querySelector("#blocker");
const greenFrictionField = document.querySelector("#greenFrictionField");
const greenFrictionSelect = document.querySelector("#greenFriction");
const reflectionPrompt = document.querySelector("#reflectionPrompt");
const elapsedMinutesInput = document.querySelector("#elapsedMinutes");
const timeUntrackedInput = document.querySelector("#timeUntracked");
const completionReviewDate = document.querySelector("#completionReviewDate");
const completionHeadline = document.querySelector("#completionHeadline");
const completionSummary = document.querySelector("#completionSummary");
const completionSkillCopy = document.querySelector("#completionSkillCopy");
const completionPlanTitle = document.querySelector("#completionPlanTitle");
const completionPlanCopy = document.querySelector("#completionPlanCopy");
const sessionCapacity = document.querySelector("#sessionCapacity");
const problemTitles = [...document.querySelectorAll(".rep-problem-title")];
const readyTimeBox = document.querySelector("#readyTimeBox");
const attemptTimeBox = document.querySelector("#attemptTimeBox");
const leetcodeLink = document.querySelector("#leetcodeLink");
const readyDifficulty = document.querySelector("#readyDifficulty");
const readinessVisual = document.querySelector("#readinessVisual");
const checkedCount = document.querySelector("#checkedCount");
const checkedGap = document.querySelector("#checkedGap");
const completionCapacityCopy = document.querySelector("#completionCapacityCopy");
const completionSkill = document.querySelector("#completionSkill");
const reflectionNote = document.querySelector("#reflectionNote");
const undoReceipt = document.querySelector("#undoReceipt");

let selectedGrade = null;
let lastElapsedMinutes = null;
let lastSavedDraft = null;
let toastTimer = null;

const stateSteps = {
  ready: 0,
  attempt: 1,
  grade: 2,
  reflect: 2,
  complete: 3,
  "session-complete": 3,
};

const gradeLabels = {
  red: "Could not solve",
  yellow: "Solved with help",
  green: "Solved independently",
};

const recommendationVariants = {
  short: {
    title: "Valid Anagram",
    difficulty: "Easy",
    timeBox: 10,
    url: "https://leetcode.com/problems/valid-anagram/",
  },
  standard: {
    title: "Longest Consecutive Sequence",
    difficulty: "Medium",
    timeBox: 30,
    url: "https://leetcode.com/problems/longest-consecutive-sequence/",
  },
};

function showState(nextState) {
  states.forEach((state) => {
    const isActive = state.dataset.state === nextState;
    state.hidden = !isActive;
    state.classList.toggle("active", isActive);
  });

  const activeStep = stateSteps[nextState] ?? 0;
  progressSteps.forEach((step, index) => {
    step.classList.toggle("active", index === activeStep);
    step.classList.toggle("complete", index < activeStep);
  });

  document.querySelector(".practice-stage")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function showToast(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.hidden = false;
  toastTimer = setTimeout(() => {
    toast.hidden = true;
  }, 3200);
}

function chooseGrade(grade) {
  selectedGrade = grade;
  gradeButtons.forEach((button) => {
    button.setAttribute("aria-checked", String(button.dataset.grade === grade));
  });
  selectedGradeLabel.textContent = gradeLabels[grade];
  continueGradeButton.disabled = false;
}

function configureReflection() {
  const isIndependent = selectedGrade === "green";
  assistanceField.hidden = isIndependent;
  blockerField.hidden = isIndependent;
  greenFrictionField.hidden = !isIndependent;
  assistanceSelect.disabled = isIndependent;
  blockerSelect.disabled = isIndependent;
  greenFrictionSelect.disabled = !isIndependent;
  blockerSelect.setCustomValidity("");
  elapsedMinutesInput.setCustomValidity("");
  reflectionPrompt.textContent = isIndependent
    ? "Time is the only required signal. Add friction only when it will improve a future recommendation."
    : "Time, assistance, and the main blocker help the plan choose the right follow-up.";
}

function resetDraft() {
  reflectionForm?.reset();
  selectedGrade = null;
  lastElapsedMinutes = null;
  continueGradeButton.disabled = true;
  gradeButtons.forEach((button) => button.setAttribute("aria-checked", "false"));
  assistanceField.hidden = false;
  blockerField.hidden = false;
  greenFrictionField.hidden = true;
  assistanceSelect.disabled = false;
  blockerSelect.disabled = false;
  greenFrictionSelect.disabled = true;
  reflectionPrompt.textContent = "A few honest signals turn the result into a better next recommendation.";
  elapsedMinutesInput.disabled = false;
  elapsedMinutesInput.required = true;
  sessionCapacity.disabled = false;
  completionSkill.textContent = "";
}

function applyCapacity() {
  const availableMinutes = Number(sessionCapacity.value);
  const recommendation = availableMinutes < 40
    ? recommendationVariants.short
    : recommendationVariants.standard;

  problemTitles.forEach((title) => {
    title.textContent = recommendation.title;
  });
  readyTimeBox.textContent = `${recommendation.timeBox} minutes`;
  attemptTimeBox.textContent = String(recommendation.timeBox);
  readyDifficulty.textContent = recommendation.difficulty;
  leetcodeLink.href = recommendation.url;
}

function setEvidenceCaptured(isCaptured) {
  const checked = isCaptured ? 7 : 6;
  checkedCount.textContent = `${checked}/15`;
  checkedGap.textContent = `${15 - checked} core areas still need a recent check.`;
  readinessVisual.setAttribute(
    "aria-label",
    `Baseline coverage: ${checked} of 15 core skill areas checked recently`,
  );
  readinessVisual.classList.toggle("evidence-added", isCaptured);
  if (!isCaptured) completionSkill.textContent = "";
}

function setUndoReceipt(isAvailable) {
  undoReceipt.hidden = !isAvailable;
}

function captureSavedDraft() {
  return {
    grade: selectedGrade,
    elapsedMinutes: lastElapsedMinutes,
    timeUntracked: timeUntrackedInput.checked,
    assistance: assistanceSelect.value,
    blocker: blockerSelect.value,
    friction: greenFrictionSelect.value,
    note: reflectionNote.value,
  };
}

function restoreSavedDraft() {
  if (!lastSavedDraft) return;
  chooseGrade(lastSavedDraft.grade);
  configureReflection();
  timeUntrackedInput.checked = lastSavedDraft.timeUntracked;
  elapsedMinutesInput.value = lastSavedDraft.elapsedMinutes ?? "";
  elapsedMinutesInput.disabled = lastSavedDraft.timeUntracked;
  elapsedMinutesInput.required = !lastSavedDraft.timeUntracked;
  assistanceSelect.value = lastSavedDraft.assistance;
  blockerSelect.value = lastSavedDraft.blocker;
  greenFrictionSelect.value = lastSavedDraft.friction;
  reflectionNote.value = lastSavedDraft.note;
  lastElapsedMinutes = lastSavedDraft.elapsedMinutes;
}

function undoLastSavedRep() {
  if (!lastSavedDraft) return;
  restoreSavedDraft();
  setEvidenceCaptured(false);
  setUndoReceipt(false);
  showState("reflect");
  showToast("Rep undone. Only that saved attempt was removed, and the reflection draft was restored.");
}

function formatFutureReview(days) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
}

function updateCompletion() {
  // This prototype candidate carries a hidden Stage 1 exact-title schedule.
  // Red resets to Stage 0 (1 day); yellow/green retain Stage 1 here (3 days).
  const intervalDays = selectedGrade === "red" ? 1 : 3;
  const timeBox = Number(attemptTimeBox.textContent);
  completionReviewDate.textContent = `Next exact review ${formatFutureReview(intervalDays)}`;
  completionSkill.textContent = "Revealed skill family";

  const completionCopy = {
    red: {
      headline: "The plan found the repair target.",
      summary: "The attempt is useful evidence. A focused repair should come before another independent check.",
      skill: `The attempt exposed where independent reasoning broke down against a ${timeBox}-minute target.`,
      planTitle: "Repair, then reassess",
      planCopy: "The next suitable rep will address the blocker without treating this attempt as failure debt.",
    },
    yellow: {
      headline: "That rep changed the plan.",
      summary: "You showed partial independent recall. The plan will reinforce the weak point before testing transfer.",
      skill: `Partial independent reasoning against a ${timeBox}-minute target.`,
      planTitle: "Transfer evidence still needed",
      planCopy: "This result is retained, but another problem will test whether the reasoning generalizes.",
    },
    green: {
      headline: "Independent evidence added.",
      summary: "You completed the full attempt independently. The plan can now spend less time proving this exact result.",
      skill: `Independent reasoning, implementation, testing, and complexity under the ${timeBox}-minute time box.`,
      planTitle: "Look for transfer next",
      planCopy: "A different title can verify that the skill generalizes instead of repeating this answer from memory.",
    },
  }[selectedGrade];

  completionHeadline.textContent = completionCopy.headline;
  completionSummary.textContent = completionCopy.summary;
  if (lastElapsedMinutes === null) {
    completionSkillCopy.textContent = selectedGrade === "green"
      ? "Independent completion recorded; speed remains unverified."
      : "Result and blocker recorded; speed remains unverified.";
  } else if (selectedGrade === "yellow" && assistanceSelect.value !== "none") {
    completionSkillCopy.textContent = "Assisted attempt recorded; the blocker will shape the next repair or reassessment.";
  } else {
    completionSkillCopy.textContent = completionCopy.skill;
  }
  completionPlanTitle.textContent = completionCopy.planTitle;
  completionPlanCopy.textContent = completionCopy.planCopy;

  if (lastElapsedMinutes === null) {
    completionCapacityCopy.textContent = "Time was not tracked. Confirm what remains before asking for another rep.";
  } else {
    const remaining = Math.max(0, Number(sessionCapacity.value) - lastElapsedMinutes);
    completionCapacityCopy.textContent = remaining >= 15
      ? `About ${remaining} minutes remain today. The next recommendation will fit that capacity.`
      : "Today's planned capacity is complete. Stopping here is fully on plan.";
  }
}

document.querySelector("#beginRep")?.addEventListener("click", () => {
  sessionCapacity.disabled = true;
  showState("attempt");
});
document.querySelector("#finishAttempt")?.addEventListener("click", () => showState("grade"));
document.querySelector("#cancelAttempt")?.addEventListener("click", () => {
  sessionCapacity.disabled = false;
  showState("ready");
});
document.querySelector("#backToAttempt")?.addEventListener("click", () => showState("attempt"));
document.querySelector("#continueGrade")?.addEventListener("click", () => {
  if (!selectedGrade) return;
  configureReflection();
  showState("reflect");
});
document.querySelector("#backToGrade")?.addEventListener("click", () => showState("grade"));
document.querySelector("#continuePractice")?.addEventListener("click", () => {
  showToast("A real implementation would recalculate the next rep from the saved evidence.");
  resetDraft();
  showState("ready");
});
document.querySelector("#endSession")?.addEventListener("click", () => showState("session-complete"));
document.querySelector("#restartSession")?.addEventListener("click", () => {
  resetDraft();
  showState("ready");
});
document.querySelector("#undoCompleted")?.addEventListener("click", () => {
  undoLastSavedRep();
});
document.querySelector("#undoFromSession")?.addEventListener("click", () => {
  undoLastSavedRep();
});
undoReceipt?.addEventListener("click", undoLastSavedRep);
document.querySelector("#resetPreview")?.addEventListener("click", () => {
  resetDraft();
  lastSavedDraft = null;
  setUndoReceipt(false);
  setEvidenceCaptured(false);
  showState("ready");
  showToast("Prototype reset. No tracker data was changed.");
});
document.querySelector("#changeRep")?.addEventListener("click", () => {
  showToast("The production flow will log a skip reason and choose the next eligible candidate.");
});

gradeButtons.forEach((button) => {
  button.addEventListener("click", () => chooseGrade(button.dataset.grade));
});

reflectionForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!selectedGrade) {
    showState("grade");
    return;
  }
  const elapsed = timeUntrackedInput.checked ? null : Number(elapsedMinutesInput.value || 0);
  if (!timeUntrackedInput.checked && (!elapsed || elapsed < 1 || elapsed > 180)) {
    elapsedMinutesInput.reportValidity();
    return;
  }
  const lockedTimeBox = Number(attemptTimeBox.textContent);
  if (selectedGrade === "green" && elapsed !== null && elapsed > lockedTimeBox) {
    elapsedMinutesInput.setCustomValidity(
      `This exceeded the ${lockedTimeBox}-minute time box. Choose the friction grade or correct the elapsed time.`,
    );
    elapsedMinutesInput.reportValidity();
    return;
  }
  elapsedMinutesInput.setCustomValidity("");
  if (selectedGrade !== "green" && !assistanceSelect.value) {
    assistanceSelect.reportValidity();
    return;
  }
  if (selectedGrade !== "green" && !blockerSelect.value) {
    blockerSelect.setCustomValidity("Choose the main blocker for this result.");
    blockerSelect.reportValidity();
    return;
  }
  blockerSelect.setCustomValidity("");
  recapMinutes.textContent = elapsed ? `${elapsed} min` : "Not tracked";
  lastElapsedMinutes = elapsed;
  lastSavedDraft = captureSavedDraft();
  updateCompletion();
  setEvidenceCaptured(true);
  setUndoReceipt(true);
  showState("complete");
});

timeUntrackedInput?.addEventListener("change", () => {
  elapsedMinutesInput.disabled = timeUntrackedInput.checked;
  elapsedMinutesInput.required = !timeUntrackedInput.checked;
  elapsedMinutesInput.setCustomValidity("");
});

blockerSelect?.addEventListener("change", () => blockerSelect.setCustomValidity(""));
elapsedMinutesInput?.addEventListener("input", () => elapsedMinutesInput.setCustomValidity(""));

sessionCapacity?.addEventListener("change", () => {
  applyCapacity();
  showToast("Today's recommendation now fits the available time.");
});

themeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const theme = button.dataset.themeChoice;
    document.documentElement.dataset.theme = theme;
    themeButtons.forEach((choice) => {
      choice.setAttribute("aria-pressed", String(choice === button));
    });
  });
});

const previewParams = new URLSearchParams(window.location.search);
const requestedTheme = previewParams.get("theme");
const requestedState = previewParams.get("state");

if (["light", "dark"].includes(requestedTheme)) {
  document.documentElement.dataset.theme = requestedTheme;
  themeButtons.forEach((choice) => {
    choice.setAttribute("aria-pressed", String(choice.dataset.themeChoice === requestedTheme));
  });
}

if (Object.hasOwn(stateSteps, requestedState)) {
  if (["reflect", "complete", "session-complete"].includes(requestedState)) {
    chooseGrade("yellow");
    configureReflection();
    lastElapsedMinutes = 24;
    updateCompletion();
    if (["complete", "session-complete"].includes(requestedState)) setEvidenceCaptured(true);
  }
  showState(requestedState);
}

applyCapacity();
