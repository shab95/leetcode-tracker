const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");

const ENV = process.env.TRACKER_ENV === "qa" ? "qa" : "prod";
const IS_QA = ENV === "qa";
const PORT = Number(process.env.PORT || (IS_QA ? 5174 : 5173));
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const BACKUP_DIR = path.join(DATA_DIR, IS_QA ? "qa-backups" : "backups");
const STATE_FILE = path.join(DATA_DIR, IS_QA ? "qa-tracker-state.json" : "tracker-state.json");
const QA_FIXTURE_FILE = path.join(DATA_DIR, "fixtures", "qa-state.json");

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".csv": "text/csv; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
};

const server = http.createServer(async (request, response) => {
  try {
    if (request.url === "/api/env" && request.method === "GET") {
      sendJson(response, 200, { env: ENV, isQa: IS_QA });
      return;
    }

    if (request.url === "/api/reset-qa" && request.method === "POST") {
      await handleResetQa(response);
      return;
    }

    if (request.url === "/api/state" && request.method === "GET") {
      await handleGetState(response);
      return;
    }

    if (request.url === "/api/state" && request.method === "POST") {
      await handlePostState(request, response);
      return;
    }

    if (request.url?.startsWith("/api/")) {
      sendJson(response, 404, { error: "Not found" });
      return;
    }

    await serveStatic(request, response);
  } catch (error) {
    console.error(error);
    sendJson(response, 500, { error: "Internal server error" });
  }
});

server.listen(PORT, "::", () => {
  console.log(`DSA Tracker running at http://127.0.0.1:${PORT}/index.html`);
  console.log(`Environment: ${ENV}`);
  console.log(`State file: ${STATE_FILE}`);
});

async function handleGetState(response) {
  try {
    if (IS_QA) await ensureQaState();
    const raw = await fs.readFile(STATE_FILE, "utf8");
    send(response, 200, raw, "application/json; charset=utf-8");
  } catch (error) {
    if (error.code === "ENOENT") {
      sendJson(response, 200, {
        version: 3,
        savedAt: null,
        importMeta: null,
        problems: [],
        sessions: [],
      });
      return;
    }
    throw error;
  }
}

async function handleResetQa(response) {
  if (!IS_QA) {
    sendJson(response, 403, { error: "QA reset is only available in QA mode" });
    return;
  }

  const state = await loadQaFixture();
  const serialized = serializeState({
    ...state,
    savedAt: new Date().toISOString(),
  });

  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(STATE_FILE, serialized);
  send(response, 200, serialized, "application/json; charset=utf-8");
}

async function handlePostState(request, response) {
  const body = await readBody(request);
  const state = JSON.parse(body);

  if (!Array.isArray(state.problems) || !Array.isArray(state.sessions)) {
    sendJson(response, 400, { error: "Invalid tracker state" });
    return;
  }

  const nextState = {
    version: Number(state.version || 3),
    savedAt: new Date().toISOString(),
    importMeta: state.importMeta || null,
    problems: state.problems,
    sessions: state.sessions,
  };
  const serialized = serializeState(nextState);

  await fs.mkdir(BACKUP_DIR, { recursive: true });
  await fs.writeFile(STATE_FILE, serialized);
  await fs.writeFile(path.join(BACKUP_DIR, `tracker-state-${timestamp()}.json`), serialized);
  sendJson(response, 200, { ok: true, savedAt: nextState.savedAt });
}

async function ensureQaState() {
  try {
    await fs.access(STATE_FILE);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    const state = await loadQaFixture();
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(STATE_FILE, serializeState(state));
  }
}

async function loadQaFixture() {
  const raw = await fs.readFile(QA_FIXTURE_FILE, "utf8");
  const state = JSON.parse(raw);

  if (!Array.isArray(state.problems) || !Array.isArray(state.sessions)) {
    throw new Error("Invalid QA fixture state");
  }

  return {
    version: Number(state.version || 3),
    savedAt: state.savedAt || new Date().toISOString(),
    importMeta: state.importMeta || null,
    problems: state.problems,
    sessions: state.sessions,
  };
}

function serializeState(state) {
  return `${JSON.stringify(state, null, 2)}\n`;
}

async function serveStatic(request, response) {
  const url = new URL(request.url || "/", `http://${request.headers.host}`);
  const pathname = decodeURIComponent(url.pathname);
  const appRoutes = ["/", "/diagnostics", "/diagnostics/", "/data-management", "/data-management/"];
  const requestedPath = appRoutes.includes(pathname)
    ? "/index.html"
    : pathname;
  const filePath = path.normalize(path.join(ROOT, requestedPath));

  if (!filePath.startsWith(ROOT)) {
    send(response, 403, "Forbidden", "text/plain; charset=utf-8");
    return;
  }

  try {
    const contents = await fs.readFile(filePath);
    send(response, 200, contents, MIME_TYPES[path.extname(filePath)] || "application/octet-stream");
  } catch (error) {
    if (error.code === "ENOENT" || error.code === "EISDIR") {
      send(response, 404, "Not found", "text/plain; charset=utf-8");
      return;
    }
    throw error;
  }
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 10_000_000) {
        request.destroy();
        reject(new Error("Request body too large"));
      }
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

function sendJson(response, statusCode, payload) {
  send(response, statusCode, JSON.stringify(payload), "application/json; charset=utf-8");
}

function send(response, statusCode, body, contentType) {
  response.writeHead(statusCode, {
    "Content-Type": contentType,
    "Cache-Control": "no-store",
  });
  response.end(body);
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}
