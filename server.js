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
APP_ROUTES.add("/leaderboard");
APP_ROUTES.add("/leaderboard/");
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
let qaLeaderboardProfile = { displayName: "QA You", optedIn: true };
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

app.get("/api/leaderboard/profile", requireLeaderboardAccess, (request, response) => {
  if (isQaLeaderboardRequest()) {
    response.json(qaLeaderboardProfile);
    return;
  }

  ensureLeaderboardBaseline(request.user.id);
  response.json(getLeaderboardProfile(request.user.id));
});

app.post("/api/leaderboard/profile", requireLeaderboardAccess, (request, response) => {
  const profile = request.body || {};
  const optedIn = Boolean(profile.optedIn);
  const displayName = String(profile.displayName || "").trim().slice(0, 40);

  if (optedIn && displayName.length < 2) {
    response.status(400).json({ error: "Display name is required to opt in" });
    return;
  }

  if (isQaLeaderboardRequest()) {
    qaLeaderboardProfile = { displayName: displayName || "QA You", optedIn };
    response.json(qaLeaderboardProfile);
    return;
  }

  saveLeaderboardProfile(request.user.id, displayName, optedIn);
  ensureLeaderboardBaseline(request.user.id);
  response.json(getLeaderboardProfile(request.user.id));
});

app.get("/api/leaderboard", requireLeaderboardAccess, async (request, response, next) => {
  try {
    if (isQaLeaderboardRequest()) {
      response.json(await getQaLeaderboard());
      return;
    }

    response.json(getLeaderboard(request.user.id));
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

function requireLeaderboardAccess(request, response, next) {
  if (isQaLeaderboardRequest()) {
    next();
    return;
  }

  if (!IS_HOSTED) {
    response.status(404).send("Not found");
    return;
  }

  requireAllowedUser(request, response, next);
}

function isQaLeaderboardRequest() {
  return IS_QA && !IS_HOSTED;
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

    CREATE TABLE IF NOT EXISTS leaderboard_profiles (
      user_id INTEGER PRIMARY KEY,
      display_name TEXT NOT NULL DEFAULT '',
      opted_in INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS leaderboard_weekly_baselines (
      user_id INTEGER NOT NULL,
      week_start TEXT NOT NULL,
      due_count_start INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (user_id, week_start),
      FOREIGN KEY (user_id) REFERENCES users(id)
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

function getLeaderboardProfile(userId) {
  const row = db.prepare("SELECT display_name, opted_in FROM leaderboard_profiles WHERE user_id = ?").get(userId);
  return {
    displayName: row?.display_name || "",
    optedIn: Boolean(row?.opted_in),
  };
}

function saveLeaderboardProfile(userId, displayName, optedIn) {
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO leaderboard_profiles (user_id, display_name, opted_in, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      display_name = excluded.display_name,
      opted_in = excluded.opted_in,
      updated_at = excluded.updated_at
  `).run(userId, displayName, optedIn ? 1 : 0, now, now);
}

function getLeaderboard(currentUserId) {
  const weekStart = currentWeekStart();
  const today = todayInTimeZone();
  const rows = db.prepare(`
    SELECT
      users.id AS user_id,
      leaderboard_profiles.display_name,
      tracker_state.state_json
    FROM leaderboard_profiles
    JOIN users ON users.id = leaderboard_profiles.user_id
    JOIN tracker_state ON tracker_state.user_id = users.id
    WHERE leaderboard_profiles.opted_in = 1
      AND users.is_allowed = 1
  `).all();

  const leaderboardRows = rows.map((row) => {
    const state = safeParseState(row.state_json);
    ensureLeaderboardBaseline(row.user_id, state, weekStart, today);
    const baseline = getLeaderboardBaseline(row.user_id, weekStart);
    const stats = buildLeaderboardStats(state, baseline?.due_count_start || 0, weekStart, today);
    return {
      userId: row.user_id === currentUserId ? "me" : crypto.createHash("sha256").update(String(row.user_id)).digest("hex").slice(0, 12),
      displayName: row.display_name,
      isCurrentUser: row.user_id === currentUserId,
      weekly: stats.weekly,
      lifetime: stats.lifetime,
    };
  });

  return {
    weekStart,
    today,
    rows: leaderboardRows,
  };
}

async function getQaLeaderboard() {
  const weekStart = currentWeekStart();
  const today = todayInTimeZone();
  const state = await getLocalState();
  const currentDueCount = countDueReviews(state.problems || [], today);
  const currentStats = buildLeaderboardStats(state, currentDueCount + 4, weekStart, today);
  const rows = [
    {
      userId: "qa-alex",
      displayName: "Alex QA",
      isCurrentUser: false,
      weekly: {
        practiceDays: 5,
        reviewsCompleted: 18,
        newAttempts: 6,
        backlogReduced: 12,
        cleanRecallRate: 78,
        currentStreak: 4,
      },
      lifetime: {
        durablePlus: 44,
        mastered: 19,
        totalGradedAttempts: 128,
        totalReviewCompletions: 91,
      },
    },
    {
      userId: "qa-maya",
      displayName: "Maya QA",
      isCurrentUser: false,
      weekly: {
        practiceDays: 3,
        reviewsCompleted: 11,
        newAttempts: 9,
        backlogReduced: 3,
        cleanRecallRate: 65,
        currentStreak: 2,
      },
      lifetime: {
        durablePlus: 31,
        mastered: 11,
        totalGradedAttempts: 96,
        totalReviewCompletions: 58,
      },
    },
    {
      userId: "qa-sam",
      displayName: "Sam QA",
      isCurrentUser: false,
      weekly: {
        practiceDays: 6,
        reviewsCompleted: 7,
        newAttempts: 2,
        backlogReduced: 1,
        cleanRecallRate: 92,
        currentStreak: 6,
      },
      lifetime: {
        durablePlus: 17,
        mastered: 6,
        totalGradedAttempts: 53,
        totalReviewCompletions: 35,
      },
    },
  ];

  if (qaLeaderboardProfile.optedIn) {
    rows.unshift({
      userId: "qa-current",
      displayName: qaLeaderboardProfile.displayName || "QA You",
      isCurrentUser: true,
      weekly: currentStats.weekly,
      lifetime: currentStats.lifetime,
    });
  }

  return { weekStart, today, rows };
}

function ensureLeaderboardBaseline(userId, state = null, weekStart = currentWeekStart(), today = todayInTimeZone()) {
  if (!IS_HOSTED) return;
  const existing = getLeaderboardBaseline(userId, weekStart);
  if (existing) return;

  const effectiveState = state || getHostedState(userId);
  const dueCount = countDueReviews(effectiveState.problems || [], today);
  const now = new Date().toISOString();
  db.prepare(`
    INSERT OR IGNORE INTO leaderboard_weekly_baselines (user_id, week_start, due_count_start, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(userId, weekStart, dueCount, now, now);
}

function getLeaderboardBaseline(userId, weekStart) {
  return db.prepare("SELECT due_count_start FROM leaderboard_weekly_baselines WHERE user_id = ? AND week_start = ?").get(userId, weekStart);
}

function safeParseState(stateJson) {
  try {
    return sanitizeState(JSON.parse(stateJson));
  } catch {
    return { ...EMPTY_STATE };
  }
}

function buildLeaderboardStats(state, baselineDueCount, weekStart, today) {
  const sessions = Array.isArray(state.sessions) ? state.sessions : [];
  const problems = Array.isArray(state.problems) ? state.problems : [];
  const weekSessions = sessions.filter((session) => isSessionInWeek(session, weekStart, today));
  const gradedWeekSessions = weekSessions.filter((session) => isProperGrade(session.grade));
  const practiceDays = new Set(gradedWeekSessions.map((session) => normalizeDate(session.date)).filter(Boolean)).size;
  const cleanCount = gradedWeekSessions.filter((session) => session.grade === "green").length;
  const totalGraded = gradedWeekSessions.length;
  const currentDueCount = countDueReviews(problems, today);

  return {
    weekly: {
      practiceDays,
      reviewsCompleted: gradedWeekSessions.filter((session) => session.attemptType === "review").length,
      newAttempts: gradedWeekSessions.filter((session) => session.attemptType === "new").length,
      backlogReduced: Math.max(0, Number(baselineDueCount || 0) - currentDueCount),
      cleanRecallRate: totalGraded ? Math.round((cleanCount / totalGraded) * 100) : 0,
      currentStreak: currentPracticeStreak(sessions, today),
    },
    lifetime: {
      durablePlus: problems.filter((problem) => isAttempted(problem) && clampStage(problem.stage) >= 4).length,
      mastered: problems.filter((problem) => isMastered(problem, today)).length,
      totalGradedAttempts: sessions.filter((session) => isProperGrade(session.grade)).length,
      totalReviewCompletions: sessions.filter((session) => isProperGrade(session.grade) && session.attemptType === "review").length,
    },
  };
}

function isSessionInWeek(session, weekStart, today) {
  const date = normalizeDate(session.date);
  return date && date >= weekStart && date <= today;
}

function currentPracticeStreak(sessions, today) {
  const dates = new Set(
    (sessions || [])
      .filter((session) => isProperGrade(session.grade))
      .map((session) => normalizeDate(session.date))
      .filter(Boolean),
  );
  let cursor = today;
  let streak = 0;

  if (!dates.has(cursor)) cursor = addDaysIso(cursor, -1);

  while (dates.has(cursor)) {
    streak += 1;
    cursor = addDaysIso(cursor, -1);
  }

  return streak;
}

function countDueReviews(problems, today) {
  return (problems || []).filter((problem) => problem.nextReview && normalizeDate(problem.nextReview) <= today).length;
}

function isAttempted(problem) {
  return Number(problem.completionCount || 0) > 0 || Boolean(problem.firstAttemptAt || problem.lastReviewedAt);
}

function isMastered(problem, today) {
  const attempts = Number(problem.completionCount || 0);
  const threshold = masteryAttemptThreshold(problem.difficulty);
  const recent = (problem.reviewHistory || []).slice(-3);
  const hasRecentRed = recent.some((entry) => entry.grade === "red");
  const firstAttemptAt = problem.firstAttemptAt || problem.reviewHistory?.[0]?.date || "";
  const daysSinceFirstAttempt = firstAttemptAt ? dateDiffDays(normalizeDate(firstAttemptAt), today) : 0;

  return (
    attempts >= threshold &&
    Number(problem.greenStreak || 0) >= 2 &&
    clampStage(problem.stage) >= 4 &&
    !hasRecentRed &&
    daysSinceFirstAttempt >= 14 &&
    Boolean(problem.complexityKnown)
  );
}

function masteryAttemptThreshold(difficulty) {
  if (difficulty === "Easy") return 3;
  if (difficulty === "Hard") return 5;
  return 4;
}

function isProperGrade(grade) {
  return ["red", "yellow", "green"].includes(grade);
}

function clampStage(stage) {
  return Math.max(0, Math.min(5, Math.round(Number(stage || 0))));
}

function currentWeekStart() {
  const today = todayInTimeZone();
  const day = dayOfWeek(today);
  const daysSinceMonday = (day + 6) % 7;
  return addDaysIso(today, -daysSinceMonday);
}

function todayInTimeZone() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function dayOfWeek(isoDate) {
  return new Date(`${isoDate}T12:00:00Z`).getUTCDay();
}

function addDaysIso(isoDate, days) {
  const date = new Date(`${isoDate}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function dateDiffDays(fromIsoDate, toIsoDate) {
  if (!fromIsoDate || !toIsoDate) return 0;
  return Math.floor((new Date(`${toIsoDate}T12:00:00Z`) - new Date(`${fromIsoDate}T12:00:00Z`)) / 86400000);
}

function normalizeDate(value) {
  if (!value) return "";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
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
