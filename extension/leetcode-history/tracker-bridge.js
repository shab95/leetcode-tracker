const CAPTURE_STORAGE_KEY = "leetcodeProgressCapture";

postStoredCapture();

window.addEventListener("message", (event) => {
  if (event.source !== window) return;
  if (event.data?.source !== "dsa-tracker" || event.data?.type !== "LEETCODE_PROGRESS_APPLIED") return;
  chrome.storage.local.remove(CAPTURE_STORAGE_KEY);
});

async function postStoredCapture() {
  const stored = await chrome.storage.local.get(CAPTURE_STORAGE_KEY);
  const capture = stored[CAPTURE_STORAGE_KEY];
  if (!capture || !Array.isArray(capture.rows)) return;

  window.postMessage(
    {
      source: "leetcode-progress-extension",
      type: "LEETCODE_PROGRESS_CAPTURED",
      rows: capture.rows,
      capturedAt: capture.capturedAt || new Date().toISOString(),
    },
    window.location.origin,
  );
}
