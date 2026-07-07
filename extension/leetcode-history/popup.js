const MAX_PROGRESS_PAGES = 100;
const EMPTY_PAGE_STOP_AFTER = 2;
const API_SUBMISSION_PAGE_LIMIT = 20;
const MAX_API_SUBMISSION_PAGES = 150;
const LEETCODE_SUBMISSIONS_API_URL = "https://leetcode.com/api/submissions/";
const LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql/";
const LEETCODE_PROGRESS_BASE_URL = "https://leetcode.com/progress/";
const LEETCODE_CAPTURE_PAGE_URL = "https://leetcode.com/problemset/";
const MIN_RENDER_WAIT_MS = 1600;
const MAX_RENDER_WAIT_MS = 14000;
const TRACKER_URLS = {
  qa: "http://127.0.0.1:5174/settings",
  hosted: "https://leetcode-tracker-production-4cb5.up.railway.app/settings",
};

const captureBtn = document.querySelector("#captureBtn");
const statusText = document.querySelector("#statusText");
const openTrackerLink = document.querySelector("#openTrackerLink");

captureBtn.addEventListener("click", capturePracticeHistory);

chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  const url = tab?.url || "";
  if (url.startsWith(TRACKER_URLS.hosted.replace("/settings", ""))) {
    openTrackerLink.href = TRACKER_URLS.hosted;
    openTrackerLink.textContent = "Open hosted tracker";
  }
});

async function capturePracticeHistory() {
  captureBtn.disabled = true;
  setStatus("Reading LeetCode submissions from your signed-in browser...");

  try {
    let rows = [];
    try {
      rows = await captureFromLeetcodeApi();
    } catch (apiError) {
      console.warn("LeetCode submissions API capture failed; falling back to rendered progress page.", apiError);
      setStatus("LeetCode API was unavailable. Falling back to the rendered progress page...");
    }

    if (rows.length === 0) {
      setStatus("API returned no rows. Falling back to the rendered progress page...");
      rows = await captureFromRenderedProgressPages();
    }

    const uniqueRows = dedupeRows(rows);
    const capturedAt = new Date().toISOString();
    await chrome.storage.local.set({ leetcodeProgressCapture: { rows: uniqueRows, capturedAt } });
    setStatus(`Captured ${uniqueRows.length} rows. Open DSA Tracker Settings to review and import.`);
    openTrackerLink.focus();
  } catch (error) {
    console.error(error);
    setStatus("Could not capture history. Make sure you are signed in to LeetCode and can open /progress/?page=1.");
  } finally {
    captureBtn.disabled = false;
  }
}

async function captureFromLeetcodeApi() {
  const { tab: apiTab, shouldClose } = await getLeetcodeApiTab();

  try {
    if (apiTab.status !== "complete") await waitForTabComplete(apiTab.id);
    await delay(900);
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: apiTab.id },
      func: captureApiRowsFromLeetcodePage,
      args: [API_SUBMISSION_PAGE_LIMIT, MAX_API_SUBMISSION_PAGES],
    });
    const capture = result?.result || {};
    if (capture.error) throw new Error(capture.error);
    return Array.isArray(capture.rows) ? capture.rows : [];
  } finally {
    if (shouldClose) chrome.tabs.remove(apiTab.id).catch(() => {});
  }
}

async function getLeetcodeApiTab() {
  const tabs = await chrome.tabs.query({ url: "https://leetcode.com/*" });
  const reusableTab = tabs.find((tab) => {
    const url = tab.url || "";
    return !url.includes("/accounts/login") && !url.startsWith("chrome-extension://");
  });
  if (reusableTab) {
    setStatus("Using your open LeetCode tab to read submission history...");
    return { tab: reusableTab, shouldClose: false };
  }

  setStatus("Opening a quiet LeetCode capture tab to read submission history...");
  const tab = await chrome.tabs.create({
    url: LEETCODE_CAPTURE_PAGE_URL,
    active: false,
  });
  return { tab, shouldClose: true };
}

function captureApiRowsFromLeetcodePage(pageLimit, maxPages) {
  const submissionsApiUrl = "https://leetcode.com/api/submissions/";
  const graphqlUrl = "https://leetcode.com/graphql/";

  return run();

  async function run() {
    try {
      if (location.hostname !== "leetcode.com") {
        return { rows: [], error: "Could not open LeetCode in the capture tab." };
      }

      if (location.pathname.startsWith("/accounts/login")) {
        return { rows: [], error: "LeetCode is asking this Chrome profile to sign in." };
      }

      const difficultyBySlug = await fetchDifficultyBySlugInPage();
      const rows = [];
      const pageSignatures = new Set();
      let lastKey = "";

      for (let page = 0; page < maxPages; page += 1) {
        const payload = await fetchSubmissionsApiPageInPage(page * pageLimit, lastKey);
        const submissions = getSubmissionsFromApiPayload(payload);
        const pageRows = submissions
          .map((submission) => normalizeApiSubmissionRowInPage(submission, difficultyBySlug))
          .filter(Boolean);
        const signature = pageRows.map((row) => `${row.slug}|${row.date}|${row.result}`).join(";");

        if (pageRows.length === 0) break;
        if (pageSignatures.has(signature)) break;
        pageSignatures.add(signature);
        rows.push(...pageRows);

        if (!payload.has_next && !payload.hasNext) break;
        lastKey = payload.last_key || payload.lastKey || "";
      }

      return { rows: aggregateSubmissionRowsInPage(rows) };
    } catch (error) {
      return { rows: [], error: error?.message || "Could not read LeetCode submissions API." };
    }
  }

  async function fetchSubmissionsApiPageInPage(offset, lastKey = "") {
    const url = new URL(submissionsApiUrl);
    url.searchParams.set("offset", String(offset));
    url.searchParams.set("limit", String(pageLimit));
    if (lastKey) url.searchParams.set("lastkey", lastKey);

    const response = await fetch(url.toString(), {
      credentials: "include",
      headers: {
        accept: "application/json",
      },
    });

    if (!response.ok) throw new Error(`LeetCode submissions API returned ${response.status}.`);

    const text = await response.text();
    if (/^\s*</.test(text)) throw new Error("LeetCode submissions API returned HTML instead of JSON.");
    return JSON.parse(text);
  }

  async function fetchDifficultyBySlugInPage() {
    const response = await fetch(graphqlUrl, {
      method: "POST",
      credentials: "include",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        query: `
          query allQuestionsRaw {
            allQuestions: allQuestionsRaw {
              titleSlug
              difficulty
            }
          }
        `,
      }),
    });
    if (!response.ok) return new Map();
    const payload = await response.json();
    const questions = payload?.data?.allQuestions;
    if (!Array.isArray(questions)) return new Map();
    return new Map(
      questions
        .filter((question) => question?.titleSlug && question?.difficulty)
        .map((question) => [canonicalSlug(question.titleSlug), normalizeDifficulty(question.difficulty)])
    );
  }

  function getSubmissionsFromApiPayload(payload = {}) {
    if (Array.isArray(payload.submissions_dump)) return payload.submissions_dump;
    if (Array.isArray(payload.submissionsDump)) return payload.submissionsDump;
    if (Array.isArray(payload.submissions)) return payload.submissions;
    return [];
  }

  function normalizeApiSubmissionRowInPage(submission = {}, difficultyBySlug) {
    const title = cleanText(submission.title || submission.question?.title || "");
    const slug = canonicalSlug(
      submission.title_slug ||
        submission.titleSlug ||
        submission.question?.titleSlug ||
        slugFromUrl(submission.url || submission.link || "")
    );
    if (!title || !slug) return null;

    const timestamp = Number(submission.timestamp || submission.createdAt || submission.date || 0);
    const timestampMs = timestamp > 9999999999 ? timestamp : timestamp * 1000;
    const date = timestamp > 0 ? toIsoDate(new Date(timestampMs)) : normalizeCapturedDate(submission.time || "");
    if (!date) return null;

    return {
      title,
      slug,
      url: `https://leetcode.com/problems/${slug}/`,
      date,
      result: cleanText(submission.status_display || submission.statusDisplay || submission.status || "LeetCode history"),
      difficulty: normalizeDifficulty(difficultyBySlug.get(slug) || submission.difficulty || "Medium"),
      submissions: 1,
    };
  }

  function aggregateSubmissionRowsInPage(rows) {
    const grouped = new Map();
    rows.forEach((row) => {
      const key = [row.slug, row.date, row.result].join("|");
      const existing = grouped.get(key);
      if (existing) {
        existing.submissions += row.submissions || 1;
        return;
      }
      grouped.set(key, { ...row, submissions: row.submissions || 1 });
    });
    return [...grouped.values()];
  }

  function normalizeCapturedDate(value) {
    const text = String(value || "").trim();
    if (!text) return "";

    const today = localDateOnly(new Date());
    if (/today/i.test(text) || /\b\d+\s+(minute|hour)s?\s+ago\b/i.test(text)) return toIsoDate(today);
    if (/yesterday/i.test(text)) return toIsoDate(addDays(today, -1));

    const daysAgo = text.match(/\b(\d+)\s+days?\s+ago\b/i);
    if (daysAgo) return toIsoDate(addDays(today, -Number(daysAgo[1])));

    const weeksAgo = text.match(/\b(\d+)\s+weeks?\s+ago\b/i);
    if (weeksAgo) return toIsoDate(addDays(today, -Number(weeksAgo[1]) * 7));

    const monthsAgo = text.match(/\b(\d+)\s+months?\s+ago\b/i);
    if (monthsAgo) {
      const date = new Date(today);
      date.setMonth(date.getMonth() - Number(monthsAgo[1]));
      return toIsoDate(date);
    }

    const numeric = text.match(/(\d{4})[./-](\d{1,2})[./-](\d{1,2})/);
    if (numeric) {
      const [, year, month, day] = numeric;
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }

    const monthDay = text.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\.?\s+(\d{1,2})(?:,\s*(\d{4}))?/i);
    if (!monthDay) return "";

    const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
    const month = monthNames.indexOf(monthDay[1].slice(0, 3).toLowerCase());
    const day = Number(monthDay[2]);
    let year = Number(monthDay[3] || today.getFullYear());
    const parsed = new Date(year, month, day);
    if (!monthDay[3] && parsed > addDays(today, 7)) year -= 1;
    return toIsoDate(new Date(year, month, day));
  }

  function addDays(date, days) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
  }

  function localDateOnly(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function toIsoDate(date) {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");
  }

  function canonicalSlug(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/^\/?problems\//, "")
      .replace(/\/$/, "")
      .replace(/[^a-z0-9-]/g, "");
  }

  function slugFromUrl(url) {
    const match = String(url || "").match(/\/problems\/([^/?#]+)/);
    return match?.[1] || "";
  }

  function normalizeDifficulty(value) {
    const difficulty = cleanText(value || "Medium");
    if (/^easy$/i.test(difficulty)) return "Easy";
    if (/^(med\.?|medium)$/i.test(difficulty)) return "Medium";
    if (/^hard$/i.test(difficulty)) return "Hard";
    return "Medium";
  }

  function cleanText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }
}

async function captureFromRenderedProgressPages() {
  const rows = [];
  const pageSignatures = new Set();
  let emptyPages = 0;
  const progressTab = await createProgressTab();

  try {
    for (let page = 1; page <= MAX_PROGRESS_PAGES; page += 1) {
      setStatus(`Reading LeetCode progress page ${page}...`);
      await loadProgressPage(progressTab.id, page);
      const pageRows = (await waitForRenderedProgressRows(progressTab.id)).map(normalizeCapturedRow).filter(Boolean);
      const signature = pageRows.map((row) => `${row.slug}|${row.date}|${row.result}`).join(";");

      if (pageRows.length === 0) {
        emptyPages += 1;
        if (emptyPages >= EMPTY_PAGE_STOP_AFTER) break;
        continue;
      }

      if (pageSignatures.has(signature)) break;
      pageSignatures.add(signature);
      emptyPages = 0;
      rows.push(...pageRows);
    }
  } finally {
    chrome.tabs.remove(progressTab.id).catch(() => {});
  }

  return rows;
}

async function createProgressTab() {
  return chrome.tabs.create({
    url: `${LEETCODE_PROGRESS_BASE_URL}?page=1`,
    active: false,
  });
}

async function loadProgressPage(tabId, page) {
  const url = `${LEETCODE_PROGRESS_BASE_URL}?page=${page}`;
  await chrome.tabs.update(tabId, { url });
  await waitForTabComplete(tabId);
  await delay(MIN_RENDER_WAIT_MS);
}

function waitForTabComplete(tabId) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      reject(new Error("Timed out while loading LeetCode progress."));
    }, 15000);

    function listener(updatedTabId, info) {
      if (updatedTabId !== tabId || info.status !== "complete") return;
      clearTimeout(timeout);
      chrome.tabs.onUpdated.removeListener(listener);
      resolve();
    }

    chrome.tabs.onUpdated.addListener(listener);
  });
}

async function scrapeProgressTab(tabId) {
  const [result] = await chrome.scripting.executeScript({
    target: { tabId },
    func: scrapeRenderedProgressRows,
  });
  return Array.isArray(result?.result) ? result.result : [];
}

async function waitForRenderedProgressRows(tabId) {
  const startedAt = Date.now();
  let bestRows = [];
  let lastSignature = "";
  let stableReads = 0;

  while (Date.now() - startedAt < MAX_RENDER_WAIT_MS) {
    await prepareProgressPageForScrape(tabId);
    const rows = await scrapeProgressTab(tabId);
    const signature = rows.map((row) => `${row.slug}|${row.date}|${row.result}`).join(";");

    if (rows.length > bestRows.length) bestRows = rows;
    if (signature && signature === lastSignature) stableReads += 1;
    else stableReads = 0;

    if (rows.length >= 10 && stableReads >= 2) return rows;
    if (rows.length > 0 && stableReads >= 4) return rows;

    lastSignature = signature;
    await delay(700);
  }

  return bestRows;
}

async function prepareProgressPageForScrape(tabId) {
  await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      window.scrollTo(0, 0);
      document.querySelectorAll("[data-radix-scroll-area-viewport]").forEach((node) => {
        node.scrollTop = 0;
      });
    },
  });
  await delay(120);
}

function scrapeRenderedProgressRows() {
  const problemLinks = [...document.querySelectorAll('a[href*="/problems/"]')];
  const rows = [];
  const seen = new Set();

  problemLinks.forEach((link) => {
    const title = cleanText(link.textContent).replace(/^\d+\.\s*/, "");
    const href = link.getAttribute("href") || "";
    const slug = slugFromUrl(href);
    if (!title || !slug || seen.has(slug)) return;

    const rowElement = findProgressRowElement(link);
    const rowText = cleanText(rowElement?.textContent || "");
    const cells = getProgressRowCells(rowElement);
    const problemCell = cells.find((cell) => cell.includes(title)) || rowText;
    const date = extractDate(cells[0] || rowText);
    const result = extractResult(cells[2] || rowText);
    const difficulty = extractDifficulty(problemCell || rowText);
    const submissions = extractSubmissionCount(cells[3] || rowText, result);
    if (!date && !result && !difficulty) return;

    seen.add(slug);
    rows.push({
      title,
      slug,
      url: `https://leetcode.com/problems/${slug}/`,
      date,
      result,
      difficulty,
      submissions,
    });
  });

  return rows;

  function findProgressRowElement(link) {
    const rowLike = findBestRowLikeContainer(link);
    if (rowLike) return rowLike;

    let node = link;
    for (let depth = 0; depth < 9 && node; depth += 1) {
      if (node.matches?.("tr, li")) return node;
      const text = cleanText(node.textContent || "");
      if (
        text.includes("Accepted") ||
        text.includes("Wrong Answer") ||
        text.includes("Runtime Error") ||
        text.includes("Compile Error")
      ) {
        const problemLinkCount = node.querySelectorAll?.('a[href*="/problems/"]').length || 0;
        if (problemLinkCount <= 1) return node;
      }
      node = node.parentElement;
    }
    return link.parentElement;
  }

  function findBestRowLikeContainer(link) {
    const candidates = [];
    let node = link;
    for (let depth = 0; depth < 12 && node; depth += 1) {
      const text = cleanText(node.textContent || "");
      const hasResult = /(Accepted|Wrong Answer|Time Limit Exceeded|Memory Limit Exceeded|Runtime Error|Compile Error|Output Limit Exceeded)/i.test(text);
      const hasDifficulty = /\b(Easy|Med\.?|Medium|Hard)\b/i.test(text);
      const hasDate = /\b(?:\d+\s+(?:minute|hour|day|week|month)s?\s+ago|Today|Yesterday|\d{4}[./-]\d{1,2}[./-]\d{1,2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2})\b/i.test(text);
      const linkCount = node.querySelectorAll?.('a[href*="/problems/"]').length || 0;
      if (hasResult && hasDifficulty && hasDate && linkCount <= 1) {
        candidates.push({ node, length: text.length });
      }
      node = node.parentElement;
    }

    return candidates
      .filter((candidate) => candidate.length > 20 && candidate.length < 500)
      .sort((a, b) => a.length - b.length)[0]?.node || null;
  }

  function getProgressRowCells(rowElement) {
    if (!rowElement) return [];
    const directCells = [...rowElement.children].map((child) => cleanText(child.textContent)).filter(Boolean);
    if (directCells.length >= 3) return directCells;

    return [...rowElement.querySelectorAll(":scope > div, :scope > td")]
      .map((child) => cleanText(child.textContent))
      .filter(Boolean);
  }

  function extractDate(text) {
    const relative = text.match(/\b(?:\d+\s+(?:minute|hour|day|week|month)s?\s+ago|Today|Yesterday)/i);
    if (relative) return relative[0];
    const numeric = text.match(/\b\d{4}[./-]\d{1,2}[./-]\d{1,2}\b/);
    if (numeric) return numeric[0];
    const monthDay = text.match(/\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2}(?:,\s*\d{4})?(?=$|\s|[^\d])/i);
    return monthDay?.[0] || "";
  }

  function extractResult(text) {
    const result = text.match(/\b(Accepted|Wrong Answer|Time Limit Exceeded|Memory Limit Exceeded|Runtime Error|Compile Error|Output Limit Exceeded)(?=$|\s|\d)/i);
    return result ? result[1] : "LeetCode history";
  }

  function extractDifficulty(text) {
    const difficulty =
      text.match(/(Easy|Med\.?|Medium|Hard)\.?$/i) ||
      text.match(/\b(Easy|Med\.?|Medium|Hard)(?=$|\s|\.|Accepted|Wrong Answer|Time Limit Exceeded|Memory Limit Exceeded|Runtime Error|Compile Error|Output Limit Exceeded)/i);
    if (!difficulty) return "Medium";
    return /^med\.?$/i.test(difficulty[1]) ? "Medium" : difficulty[1];
  }

  function extractSubmissionCount(text, result) {
    const afterResult = result ? text.slice(text.toLowerCase().lastIndexOf(result.toLowerCase()) + result.length) : text;
    const numbers = afterResult.match(/\b\d+\b/g) || [];
    return Number(numbers[0] || 0) || 0;
  }

  function slugFromUrl(url) {
    const match = String(url || "").match(/\/problems\/([^/?#]+)/);
    return match?.[1] || "";
  }

  function cleanText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }
}

function dedupeRows(rows) {
  const seen = new Set();
  return rows.filter((row) => {
    const key = [row.slug, row.date, row.result].join("|");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeCapturedRow(row) {
  const date = normalizeCapturedDate(row.date);
  if (!date) return null;
  return {
    ...row,
    date,
  };
}

function normalizeCapturedDate(value) {
  const text = String(value || "").trim();
  if (!text) return "";

  const today = localDateOnly(new Date());
  if (/today/i.test(text) || /\b\d+\s+(minute|hour)s?\s+ago\b/i.test(text)) return toIsoDate(today);
  if (/yesterday/i.test(text)) return toIsoDate(addDays(today, -1));

  const daysAgo = text.match(/\b(\d+)\s+days?\s+ago\b/i);
  if (daysAgo) return toIsoDate(addDays(today, -Number(daysAgo[1])));

  const weeksAgo = text.match(/\b(\d+)\s+weeks?\s+ago\b/i);
  if (weeksAgo) return toIsoDate(addDays(today, -Number(weeksAgo[1]) * 7));

  const monthsAgo = text.match(/\b(\d+)\s+months?\s+ago\b/i);
  if (monthsAgo) {
    const date = new Date(today);
    date.setMonth(date.getMonth() - Number(monthsAgo[1]));
    return toIsoDate(date);
  }

  const numeric = text.match(/(\d{4})[./-](\d{1,2})[./-](\d{1,2})/);
  if (numeric) {
    const [, year, month, day] = numeric;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  const monthDay = text.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\.?\s+(\d{1,2})(?:,\s*(\d{4}))?/i);
  if (!monthDay) return "";

  const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  const month = monthNames.indexOf(monthDay[1].slice(0, 3).toLowerCase());
  const day = Number(monthDay[2]);
  let year = Number(monthDay[3] || today.getFullYear());
  const parsed = new Date(year, month, day);
  if (!monthDay[3] && parsed > addDays(today, 7)) year -= 1;
  return toIsoDate(new Date(year, month, day));
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function localDateOnly(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function toIsoDate(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function canonicalSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^\/?problems\//, "")
    .replace(/\/$/, "")
    .replace(/[^a-z0-9-]/g, "");
}

function slugFromUrl(url) {
  const match = String(url || "").match(/\/problems\/([^/?#]+)/);
  return match?.[1] || "";
}

function normalizeDifficulty(value) {
  const difficulty = cleanText(value || "Medium");
  if (/^easy$/i.test(difficulty)) return "Easy";
  if (/^(med\.?|medium)$/i.test(difficulty)) return "Medium";
  if (/^hard$/i.test(difficulty)) return "Hard";
  return "Medium";
}

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function setStatus(message) {
  statusText.textContent = message;
}
