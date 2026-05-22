const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");

const express = require("express");
const session = require("express-session");
const helmet = require("helmet");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const EXPORT_VERSION = 3;
const EMPTY_STATE = {
  version: EXPORT_VERSION,
  savedAt: null,
  revision: 0,
  importMeta: null,
  problems: [],
  sessions: [],
};

const ENV = process.env.TRACKER_ENV === "qa" ? "qa" : "prod";
const IS_QA = ENV === "qa";
const AUTH_REQUIRED = process.env.AUTH_REQUIRED === "true";
const IS_HOSTED = AUTH_REQUIRED;
const PORT = Number(process.env.PORT || (IS_QA ? 5174 : 5173));
const HOST = process.env.HOST || (IS_HOSTED ? "0.0.0.0" : "127.0.0.1");
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const BACKUP_DIR = path.join(DATA_DIR, IS_QA ? "qa-backups" : "backups");
const STATE_FILE = path.join(DATA_DIR, IS_QA ? "qa-tracker-state.json" : "tracker-state.json");
const QA_FIXTURE_FILE = path.join(DATA_DIR, "fixtures", "qa-state.json");
const MAX_STATE_BYTES = Number(process.env.MAX_STATE_BYTES || 5_000_000);
const BACKUP_RETENTION = Number(process.env.BACKUP_RETENTION || 20);
const SQLITE_PATH = process.env.SQLITE_PATH || path.join(DATA_DIR, "tracker.sqlite");
const PUBLIC_FILES = new Set([
  "/index.html",
  "/app.js",
  "/styles.css",
  "/data/blind-75.js",
  "/data/neetcode-150.js",
]);
const APP_ROUTES = new Set(["/", "/index.html", "/diagnostics", "/diagnostics/", "/data-management", "/data-management/"]);
const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
};

class SqliteSessionStore extends session.Store {
  constructor(database) {
    super();
    this.db = database;
  }

  get(sid, callback) {
    try {
      const row = this.db.prepare("SELECT sess, expires FROM sessions WHERE sid = ?").get(sid);
      if (!row) {
        callback(null, null);
        return;
      }

      if (Number(row.expires) <= Date.now()) {
        this.destroy(sid, () => callback(null, null));
        return;
      }

      callback(null, JSON.parse(row.sess));
    } catch (error) {
      callback(error);
    }
  }

  set(sid, sess, callback) {
    try {
      const expires = sess.cookie?.expires
        ? new Date(sess.cookie.expires).getTime()
        : Date.now() + 1000 * 60 * 60 * 24 * 30;
      this.db.prepare(`
        INSERT INTO sessions (sid, sess, expires)
        VALUES (?, ?, ?)
        ON CONFLICT(sid) DO UPDATE SET sess = excluded.sess, expires = excluded.expires
      `).run(sid, JSON.stringify(sess), expires);
      callback(null);
    } catch (error) {
      callback(error);
    }
  }

  destroy(sid, callback) {
    try {
      this.db.prepare("DELETE FROM sessions WHERE sid = ?").run(sid);
      callback(null);
    } catch (error) {
      callback(error);
    }
  }

  touch(sid, sess, callback) {
    this.set(sid, sess, callback);
  }
}

validateConfig();

const allowedEmails = parseAllowedEmails(process.env.ALLOWED_EMAILS);
const db = IS_HOSTED ? initDatabase(SQLITE_PATH) : null;
const app = express();

app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: MAX_STATE_BYTES }));

if (IS_HOSTED) {
  app.use(
    session({
      name: "dsa_tracker.sid",
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      store: new SqliteSessionStore(db),
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 24 * 30,
      },
    }),
  );
  app.use(passport.initialize());
  app.use(passport.session());
  configurePassport();
}

app.get("/api/health", (request, response) => {
  response.json({ ok: true });
});

app.get("/api/env", (request, response) => {
  response.json({
    env: ENV,
    isQa: IS_QA,
    authRequired: AUTH_REQUIRED,
    storageMode: IS_HOSTED ? "cloud" : "local",
  });
});

app.get("/api/me", (request, response) => {
  if (!IS_HOSTED) {
    response.json({ authRequired: false, authenticated: true, allowed: true, user: null });
    return;
  }

  if (!request.user) {
    response.json({ authRequired: true, authenticated: false, allowed: false, user: null });
    return;
  }

  response.json({
    authRequired: true,
    authenticated: true,
    allowed: Boolean(request.user.is_allowed),
    user: publicUser(request.user),
  });
});

app.get("/auth/google", hostedOnly, passport.authenticate("google", { scope: ["profile", "email"] }));

app.get(
  "/auth/google/callback",
  hostedOnly,
  passport.authenticate("google", { failureRedirect: "/index.html?auth=failed" }),
  (request, response) => {
    response.redirect("/index.html");
  },
);

app.post("/auth/logout", hostedOnly, (request, response, next) => {
  request.logout((error) => {
    if (error) {
      next(error);
      return;
    }
    request.session.destroy(() => {
      response.clearCookie("dsa_tracker.sid");
      response.json({ ok: true });
    });
  });
});

app.get("/api/state", requireAllowedUser, async (request, response, next) => {
  try {
    if (IS_HOSTED) {
      response.json(getHostedState(request.user.id));
      return;
    }

    const state = await getLocalState();
    response.json(state);
  } catch (error) {
    next(error);
  }
});

app.post("/api/state", requireAllowedUser, async (request, response, next) => {
  try {
    const validation = validateTrackerState(request.body);
    if (!validation.ok) {
      response.status(400).json({ error: validation.error });
      return;
    }

    if (IS_HOSTED) {
      const result = saveHostedState(request.user.id, request.body);
      response.status(result.status).json(result.body);
      return;
    }

    const result = await saveLocalState(request.body);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

if (!IS_HOSTED) {
  app.post("/api/reset-qa", async (request, response, next) => {
    try {
      await handleResetQa(response);
    } catch (error) {
      next(error);
    }
  });
}

app.use("/api", (request, response) => {
  response.status(404).json({ error: "Not found" });
});

app.use(requirePageAccess, async (request, response, next) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.status(404).send("Not found");
    return;
  }

  try {
    await serveStatic(request, response);
  } catch (error) {
    next(error);
  }
});

app.use((error, request, response, next) => {
  if (error?.type === "entity.too.large") {
    response.status(413).json({ error: "Tracker state is too large" });
    return;
  }

  console.error(error);
  response.status(500).json({ error: "Internal server error" });
});

const httpServer = app.listen(PORT, HOST, () => {
  console.log(`DSA Tracker running at http://127.0.0.1:${PORT}/index.html`);
  console.log(`Environment: ${ENV}`);
  console.log(`Storage mode: ${IS_HOSTED ? "cloud" : "local"}`);
  console.log(`Auth required: ${AUTH_REQUIRED}`);
  console.log(`Host: ${HOST}`);
  if (IS_HOSTED) console.log(`SQLite path: ${SQLITE_PATH}`);
  else console.log(`State file: ${STATE_FILE}`);
});
httpServer.ref();

function validateConfig() {
  if (!IS_HOSTED) return;

  const required = [
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "GOOGLE_CALLBACK_URL",
    "SESSION_SECRET",
    "ALLOWED_EMAILS",
    "SQLITE_PATH",
  ];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Hosted mode is missing required env vars: ${missing.join(", ")}`);
  }
}

function configurePassport() {
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser((id, done) => {
    try {
      done(null, getUserById(id));
    } catch (error) {
      done(error);
    }
  });

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
      },
      (accessToken, refreshToken, profile, done) => {
        try {
          const email = String(profile.emails?.[0]?.value || "").toLowerCase();
          if (!email) {
            done(new Error("Google profile did not include an email address"));
            return;
          }

          const isAllowed = allowedEmails.has(email);
          const user = upsertUser({
            googleSub: profile.id,
            email,
            name: profile.displayName || "",
            pictureUrl: profile.photos?.[0]?.value || "",
            isAllowed,
          });
          console.log(`Google login ${isAllowed ? "allowed" : "denied"} for ${email}`);
          done(null, user);
        } catch (error) {
          done(error);
        }
      },
    ),
  );
}

function requireAllowedUser(request, response, next) {
  if (!IS_HOSTED) {
    next();
    return;
  }

  if (!request.isAuthenticated?.() || !request.user) {
    response.status(401).json({ error: "Authentication required" });
    return;
  }

  if (!request.user.is_allowed) {
    response.status(403).json({ error: "This account is not invited to the private beta" });
    return;
  }

  next();
}

function requirePageAccess(request, response, next) {
  if (!IS_HOSTED) {
    next();
    return;
  }

  if (isAppRoute(request.path) || isPublicAsset(request.path)) {
    next();
    return;
  }

  response.status(404).send("Not found");
}

function hostedOnly(request, response, next) {
  if (!IS_HOSTED) {
    response.status(404).send("Not found");
    return;
  }
  next();
}

function initDatabase(filePath) {
  const dbPath = path.resolve(filePath);
  const dir = path.dirname(dbPath);
  require("node:fs").mkdirSync(dir, { recursive: true });
  const database = new DatabaseSync(dbPath);
  database.exec("PRAGMA journal_mode = WAL");
  database.exec("PRAGMA foreign_keys = ON");
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      google_sub TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      name TEXT,
      picture_url TEXT,
      is_allowed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      last_login_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tracker_state (
      user_id INTEGER PRIMARY KEY,
      version INTEGER NOT NULL,
      revision INTEGER NOT NULL DEFAULT 0,
      state_json TEXT NOT NULL,
      saved_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS state_backups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      revision INTEGER NOT NULL,
      state_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      reason TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS sessions (
      sid TEXT PRIMARY KEY,
      sess TEXT NOT NULL,
      expires INTEGER NOT NULL
    );
  `);
  return database;
}

function upsertUser({ googleSub, email, name, pictureUrl, isAllowed }) {
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO users (google_sub, email, name, picture_url, is_allowed, created_at, last_login_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(google_sub) DO UPDATE SET
      email = excluded.email,
      name = excluded.name,
      picture_url = excluded.picture_url,
      is_allowed = excluded.is_allowed,
      last_login_at = excluded.last_login_at
  `).run(googleSub, email, name, pictureUrl, isAllowed ? 1 : 0, now, now);
  return getUserByGoogleSub(googleSub);
}

function getUserByGoogleSub(googleSub) {
  return rowToUser(db.prepare("SELECT * FROM users WHERE google_sub = ?").get(googleSub));
}

function getUserById(id) {
  return rowToUser(db.prepare("SELECT * FROM users WHERE id = ?").get(id));
}

function rowToUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    google_sub: row.google_sub,
    email: row.email,
    name: row.name || "",
    picture_url: row.picture_url || "",
    is_allowed: Boolean(row.is_allowed),
  };
}

function publicUser(user) {
  return {
    email: user.email,
    name: user.name,
    pictureUrl: user.picture_url,
  };
}

function getHostedState(userId) {
  const row = db.prepare("SELECT version, revision, state_json, saved_at FROM tracker_state WHERE user_id = ?").get(userId);
  if (!row) return { ...EMPTY_STATE };

  const state = JSON.parse(row.state_json);
  return {
    ...state,
    version: Number(row.version || state.version || EXPORT_VERSION),
    savedAt: row.saved_at,
    revision: Number(row.revision || 0),
  };
}

function saveHostedState(userId, state) {
  const existing = db.prepare("SELECT revision, state_json FROM tracker_state WHERE user_id = ?").get(userId);
  const expectedRevision = Number(state.revision || 0);
  const currentRevision = existing ? Number(existing.revision || 0) : 0;

  if (expectedRevision !== currentRevision) {
    return {
      status: 409,
      body: {
        error: "Tracker state changed in another tab or device",
        currentRevision,
      },
    };
  }

  const savedAt = new Date().toISOString();
  const nextRevision = currentRevision + 1;
  const nextState = sanitizeState({
    ...state,
    savedAt,
    revision: nextRevision,
  });
  const serialized = serializeState(nextState);

  db.exec("BEGIN");
  try {
    if (existing) createHostedBackup(userId, currentRevision, existing.state_json, "save");
    db.prepare(`
      INSERT INTO tracker_state (user_id, version, revision, state_json, saved_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        version = excluded.version,
        revision = excluded.revision,
        state_json = excluded.state_json,
        saved_at = excluded.saved_at
    `).run(userId, nextState.version, nextRevision, serialized, savedAt);
    trimHostedBackups(userId);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }

  return { status: 200, body: { ok: true, savedAt, revision: nextRevision } };
}

function createHostedBackup(userId, revision, stateJson, reason) {
  db.prepare("INSERT INTO state_backups (user_id, revision, state_json, created_at, reason) VALUES (?, ?, ?, ?, ?)")
    .run(userId, revision, stateJson, new Date().toISOString(), reason);
}

function trimHostedBackups(userId) {
  db.prepare(`
    DELETE FROM state_backups
    WHERE user_id = ?
      AND id NOT IN (
        SELECT id FROM state_backups
        WHERE user_id = ?
        ORDER BY created_at DESC, id DESC
        LIMIT ?
      )
  `).run(userId, userId, BACKUP_RETENTION);
}

async function getLocalState() {
  try {
    if (IS_QA) await ensureQaState();
    const raw = await fs.readFile(STATE_FILE, "utf8");
    return normalizeStateResponse(JSON.parse(raw));
  } catch (error) {
    if (error.code === "ENOENT") return { ...EMPTY_STATE };
    throw error;
  }
}

async function saveLocalState(state) {
  const nextState = sanitizeState({
    ...state,
    savedAt: new Date().toISOString(),
    revision: Number(state.revision || 0) + 1,
  });
  const serialized = serializeState(nextState);

  await fs.mkdir(BACKUP_DIR, { recursive: true });
  await fs.writeFile(STATE_FILE, serialized);
  await fs.writeFile(path.join(BACKUP_DIR, `tracker-state-${timestamp()}.json`), serialized);
  return { ok: true, savedAt: nextState.savedAt, revision: nextState.revision };
}

async function handleResetQa(response) {
  if (!IS_QA) {
    response.status(403).json({ error: "QA reset is only available in QA mode" });
    return;
  }

  const state = await loadQaFixture();
  const serialized = serializeState({
    ...state,
    savedAt: new Date().toISOString(),
    revision: 0,
  });

  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(STATE_FILE, serialized);
  response.type("application/json; charset=utf-8").send(serialized);
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

  return sanitizeState({
    version: Number(state.version || EXPORT_VERSION),
    savedAt: state.savedAt || new Date().toISOString(),
    revision: Number(state.revision || 0),
    importMeta: state.importMeta || null,
    problems: state.problems,
    sessions: state.sessions,
  });
}

function validateTrackerState(state) {
  if (!state || typeof state !== "object") return { ok: false, error: "Invalid tracker state" };
  if (!Array.isArray(state.problems) || !Array.isArray(state.sessions)) {
    return { ok: false, error: "Invalid tracker state" };
  }
  return { ok: true };
}

function sanitizeState(state) {
  return {
    version: Number(state.version || EXPORT_VERSION),
    savedAt: state.savedAt || null,
    revision: Number(state.revision || 0),
    importMeta: state.importMeta || null,
    problems: state.problems,
    sessions: state.sessions,
  };
}

function normalizeStateResponse(state) {
  return sanitizeState({
    ...state,
    revision: Number(state.revision || 0),
  });
}

function serializeState(state) {
  return `${JSON.stringify(sanitizeState(state), null, 2)}\n`;
}

async function serveStatic(request, response) {
  const pathname = decodeURIComponent(new URL(request.url, `http://${request.headers.host}`).pathname);
  const requestedPath = isAppRoute(pathname) ? "/index.html" : pathname;

  if (IS_HOSTED && !isPublicAsset(requestedPath) && requestedPath !== "/index.html") {
    response.status(404).send("Not found");
    return;
  }

  const filePath = path.normalize(path.join(ROOT, requestedPath));
  if (!filePath.startsWith(ROOT)) {
    response.status(403).send("Forbidden");
    return;
  }

  try {
    const contents = await fs.readFile(filePath);
    response.type(MIME_TYPES[path.extname(filePath)] || "application/octet-stream").send(contents);
  } catch (error) {
    if (error.code === "ENOENT" || error.code === "EISDIR") {
      response.status(404).send("Not found");
      return;
    }
    throw error;
  }
}

function isAppRoute(pathname) {
  return APP_ROUTES.has(pathname);
}

function isPublicAsset(pathname) {
  return PUBLIC_FILES.has(pathname);
}

function parseAllowedEmails(value = "") {
  return new Set(
    value
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}
