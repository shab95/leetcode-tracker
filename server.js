const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");

const express = require("express");
const session = require("express-session");
const helmet = require("helmet");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const webPush = require("web-push");
const {
  STATE_VERSION,
  createEmptyState,
  migrateStateToV4,
} = require("./state-v4.js");
const PracticeV2Engine = require("./recommendation-engine.js");

const EXPORT_VERSION = STATE_VERSION;
const EMPTY_STATE = createEmptyState();

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
const SQLITE_STARTUP_SNAPSHOT = String(process.env.SQLITE_STARTUP_SNAPSHOT || "").trim();
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "";
const NOTIFICATION_CHECK_INTERVAL_MS = Number(process.env.NOTIFICATION_CHECK_INTERVAL_MS || 60_000);
const NOTIFICATIONS_CONFIGURED = Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);
const FEATURES = Object.freeze({
  friendPulse: readFeatureFlag("FEATURE_FRIEND_PULSE"),
  leetcodeImport: readFeatureFlag("FEATURE_LEETCODE_IMPORT"),
  phoneReminders: readFeatureFlag("FEATURE_PHONE_REMINDERS"),
  practiceV2: IS_QA || readFeatureFlag("FEATURE_PRACTICE_V2"),
  practiceV2Shadow: IS_QA || readFeatureFlag("FEATURE_PRACTICE_V2_SHADOW"),
  recoveryLane: readFeatureFlag("FEATURE_RECOVERY_LANE"),
});
const PUBLIC_FILES = new Set([
  "/index.html",
  "/app.js",
  "/state-v4.js",
  "/recommendation-engine.js",
  "/practice-v2-workflow.js",
  "/manifest.webmanifest",
  "/pwa-icon.svg",
  "/service-worker.js",
  "/styles.css",
  "/data/blind-75.js",
  "/data/neetcode-150.js",
]);
const APP_ROUTES = new Set([
  "/",
  "/index.html",
  "/library",
  "/library/",
  "/memory",
  "/memory/",
  "/diagnostics",
  "/diagnostics/",
  "/settings",
  "/settings/",
  "/data-management",
  "/data-management/",
]);
APP_ROUTES.add("/leaderboard");
APP_ROUTES.add("/leaderboard/");
if (FEATURES.friendPulse) {
  APP_ROUTES.add("/pacts");
  APP_ROUTES.add("/pacts/");
}
const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json; charset=utf-8",
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

if (FEATURES.phoneReminders && NOTIFICATIONS_CONFIGURED) {
  webPush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

const allowedEmails = parseAllowedEmails(process.env.ALLOWED_EMAILS);
const db = IS_HOSTED ? initDatabase(SQLITE_PATH) : null;
let qaLeaderboardProfile = {
  displayName: "QA You",
  handle: "qayou",
  optedIn: true,
  leaderboardOptedIn: true,
  pactsOptedIn: true,
  timezone: "America/New_York",
};
const qaFriendPulse = {
  nextRequestId: 4,
  nextPactId: 4,
  incoming: [
    { id: "qa-request-1", displayName: "Maya QA", handle: "maya", status: "pending" },
  ],
  outgoing: [
    { id: "qa-request-2", displayName: "Alex QA", handle: "alex", status: "pending" },
  ],
  pacts: [
    { id: "qa-pact-1", displayName: "Sam QA", handle: "sam", completedToday: true, paused: false },
    { id: "qa-pact-2", displayName: "Riya QA", handle: "riya", completedToday: false, paused: true },
  ],
};
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
    features: FEATURES,
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
  response.json(getSocialProfile(request.user.id));
});

app.post("/api/leaderboard/profile", requireLeaderboardAccess, (request, response) => {
  handleSaveSocialProfile(request, response);
});

app.get("/api/social/profile", requireLeaderboardAccess, (request, response) => {
  if (isQaLeaderboardRequest()) {
    response.json(qaLeaderboardProfile);
    return;
  }

  ensureLeaderboardBaseline(request.user.id);
  response.json(getSocialProfile(request.user.id));
});

app.post("/api/social/profile", requireLeaderboardAccess, (request, response) => {
  handleSaveSocialProfile(request, response);
});

function handleSaveSocialProfile(request, response) {
  const profile = request.body || {};
  const existingProfile = isQaLeaderboardRequest()
    ? qaLeaderboardProfile
    : request.user?.id
      ? getSocialProfile(request.user.id)
      : {};
  const leaderboardOptedIn = profile.leaderboardOptedIn === undefined
    ? profile.optedIn === undefined
      ? Boolean(existingProfile.leaderboardOptedIn || existingProfile.optedIn)
      : Boolean(profile.optedIn)
    : Boolean(profile.leaderboardOptedIn);
  const pactsOptedIn = FEATURES.friendPulse
    ? profile.pactsOptedIn === undefined
      ? Boolean(existingProfile.pactsOptedIn)
      : Boolean(profile.pactsOptedIn)
    : Boolean(existingProfile.pactsOptedIn);
  const displayName = String(profile.displayName ?? existingProfile.displayName ?? "").trim().slice(0, 40);
  const timezone = normalizeNotificationTimezone(profile.timezone);
  const submittedHandle = profile.handle === undefined ? existingProfile.handle || "" : profile.handle || "";
  const handleValidation = FEATURES.friendPulse
    ? normalizeSocialHandle(submittedHandle)
    : { ok: true, handle: existingProfile.handle || "" };
  const handle = handleValidation.handle;
  const shouldValidatePactProfile = FEATURES.friendPulse && pactsOptedIn;

  if ((leaderboardOptedIn || shouldValidatePactProfile) && displayName.length < 2) {
    response.status(400).json({ error: "Display name is required to opt in" });
    return;
  }

  if (!handleValidation.ok) {
    response.status(400).json({ error: handleValidation.error });
    return;
  }

  if (shouldValidatePactProfile && !handle) {
    response.status(400).json({ error: "Handle is required to enable daily pacts" });
    return;
  }

  if (isQaLeaderboardRequest()) {
    qaLeaderboardProfile = {
      displayName: displayName || "QA You",
      handle: handle || qaLeaderboardProfile.handle || "qayou",
      optedIn: leaderboardOptedIn,
      leaderboardOptedIn,
      pactsOptedIn,
      timezone,
    };
    response.json(qaLeaderboardProfile);
    return;
  }

  const existingHandleOwner = handle ? getUserIdBySocialHandle(handle) : null;
  if (existingHandleOwner && existingHandleOwner !== request.user.id) {
    response.status(409).json({ error: "That handle is already taken" });
    return;
  }

  saveSocialProfile(request.user.id, { displayName, handle, leaderboardOptedIn, pactsOptedIn, timezone });
  ensureLeaderboardBaseline(request.user.id);
  response.json(getSocialProfile(request.user.id));
}

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

app.get("/api/friend-pulse", requireFeature("friendPulse"), requireLeaderboardAccess, async (request, response, next) => {
  try {
    if (isQaLeaderboardRequest()) {
      response.json(await getQaFriendPulse());
      return;
    }

    response.json(getFriendPulse(request.user.id));
  } catch (error) {
    next(error);
  }
});

app.get("/api/friend-pulse/search", requireFeature("friendPulse"), requireLeaderboardAccess, (request, response) => {
  const handleValidation = normalizeSocialHandle(request.query.handle || request.query.q || "");
  if (!handleValidation.ok) {
    response.json({ results: [] });
    return;
  }

  if (isQaLeaderboardRequest()) {
    response.json({ results: getQaFriendSearchResults(handleValidation.handle) });
    return;
  }

  response.json({ results: searchFriendByHandle(request.user.id, handleValidation.handle) });
});

app.post("/api/friend-pulse/requests", requireFeature("friendPulse"), requireLeaderboardAccess, (request, response) => {
  const body = request.body || {};
  if (isQaLeaderboardRequest()) {
    sendQaPactResult(response, createQaPactRequest(body.handle || ""), 201);
    return;
  }

  const result = createFriendPactRequest(request.user.id, body.handle || "");
  response.status(result.status).json(result.body);
});

app.post("/api/friend-pulse/requests/:id/accept", requireFeature("friendPulse"), requireLeaderboardAccess, (request, response) => {
  if (isQaLeaderboardRequest()) {
    sendQaPactResult(response, updateQaPactRequest(request.params.id, "active"));
    return;
  }

  const result = updateFriendPactRequest(request.user.id, request.params.id, "active");
  response.status(result.status).json(result.body);
});

app.post("/api/friend-pulse/requests/:id/decline", requireFeature("friendPulse"), requireLeaderboardAccess, (request, response) => {
  if (isQaLeaderboardRequest()) {
    sendQaPactResult(response, updateQaPactRequest(request.params.id, "declined"));
    return;
  }

  const result = updateFriendPactRequest(request.user.id, request.params.id, "declined");
  response.status(result.status).json(result.body);
});

app.post("/api/friend-pulse/requests/:id/retract", requireFeature("friendPulse"), requireLeaderboardAccess, (request, response) => {
  if (isQaLeaderboardRequest()) {
    sendQaPactResult(response, retractQaPactRequest(request.params.id));
    return;
  }

  const result = retractFriendPactRequest(request.user.id, request.params.id);
  response.status(result.status).json(result.body);
});

app.post("/api/friend-pulse/pacts/:id/remove", requireFeature("friendPulse"), requireLeaderboardAccess, (request, response) => {
  if (isQaLeaderboardRequest()) {
    sendQaPactResult(response, removeQaPact(request.params.id));
    return;
  }

  const result = removeFriendPact(request.user.id, request.params.id);
  response.status(result.status).json(result.body);
});

app.get("/api/notifications/config", requireAllowedUser, (request, response) => {
  if (!FEATURES.phoneReminders || !IS_HOSTED) {
    response.json({
      available: false,
      configured: false,
      vapidPublicKey: "",
      settings: null,
      reason: FEATURES.phoneReminders
        ? "Phone reminders are available in the hosted app."
        : "Phone reminders are turned off.",
    });
    return;
  }

  response.json({
    available: true,
    configured: NOTIFICATIONS_CONFIGURED,
    vapidPublicKey: NOTIFICATIONS_CONFIGURED ? VAPID_PUBLIC_KEY : "",
    settings: getNotificationSettings(request.user.id),
    reason: NOTIFICATIONS_CONFIGURED ? "" : "Server push keys are not configured yet.",
  });
});

app.post("/api/notifications/subscribe", requireAllowedUser, (request, response) => {
  if (!FEATURES.phoneReminders || !IS_HOSTED || !NOTIFICATIONS_CONFIGURED) {
    response.status(503).json({ error: "Notifications are not configured" });
    return;
  }

  const validation = validateNotificationSubscription(request.body || {});
  if (!validation.ok) {
    response.status(400).json({ error: validation.error });
    return;
  }

  savePushSubscription(request.user.id, validation.subscription, validation.settings);
  response.json({ ok: true, settings: getNotificationSettings(request.user.id) });
});

app.post("/api/notifications/settings", requireAllowedUser, (request, response) => {
  if (!FEATURES.phoneReminders || !IS_HOSTED || !NOTIFICATIONS_CONFIGURED) {
    response.status(503).json({ error: "Notifications are not configured" });
    return;
  }

  const settings = normalizeNotificationSettings(request.body || {});
  updatePushSubscriptionSettings(request.user.id, request.body?.endpoint || "", settings);
  response.json({ ok: true, settings: getNotificationSettings(request.user.id) });
});

app.post("/api/notifications/unsubscribe", requireAllowedUser, (request, response) => {
  if (!IS_HOSTED) {
    response.json({ ok: true, settings: null });
    return;
  }

  deletePushSubscription(request.user.id, request.body?.endpoint || "");
  response.json({ ok: true, settings: getNotificationSettings(request.user.id) });
});

app.post("/api/notifications/test", requireAllowedUser, async (request, response, next) => {
  try {
    if (!FEATURES.phoneReminders || !IS_HOSTED || !NOTIFICATIONS_CONFIGURED) {
      response.status(503).json({ error: "Notifications are not configured" });
      return;
    }

    const result = await sendPracticeNotificationToUser(request.user.id, { test: true });
    response.json({ ok: true, sent: result.sent, failed: result.failed, stale: result.stale });
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
  console.log(`Feature flags: ${JSON.stringify(FEATURES)}`);
  if (IS_HOSTED) console.log(`SQLite path: ${SQLITE_PATH}`);
  else console.log(`State file: ${STATE_FILE}`);
  if (IS_HOSTED) {
    console.log(`Push notifications: ${NOTIFICATIONS_CONFIGURED ? "configured" : "not configured"}`);
    if (NOTIFICATIONS_CONFIGURED) console.log(`VAPID subject: ${describeVapidSubject(VAPID_SUBJECT)}`);
  }
});
httpServer.ref();

if (IS_HOSTED && FEATURES.phoneReminders && NOTIFICATIONS_CONFIGURED) {
  setInterval(() => {
    sendDuePracticeReminders().catch((error) => console.warn(`Reminder check failed: ${error.message}`));
  }, NOTIFICATION_CHECK_INTERVAL_MS).unref();
}

function readFeatureFlag(name) {
  return ["1", "true", "yes", "on"].includes(String(process.env[name] || "").trim().toLowerCase());
}

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

  if (FEATURES.phoneReminders && NOTIFICATIONS_CONFIGURED && !isValidVapidSubject(VAPID_SUBJECT)) {
    throw new Error("Hosted push notifications require VAPID_SUBJECT to be a real mailto: or https:// contact value.");
  }
}

function requireFeature(feature) {
  return (request, response, next) => {
    if (FEATURES[feature]) {
      next();
      return;
    }
    response.status(404).json({ error: "Feature disabled" });
  };
}

function isValidVapidSubject(value) {
  const subject = String(value || "").trim();
  if (subject.endsWith(".local")) return false;
  return /^mailto:[^@\s]+@[^@\s]+\.[^@\s]+$/i.test(subject) || /^https:\/\/[^/\s]+/i.test(subject);
}

function describeVapidSubject(value) {
  const subject = String(value || "").trim();
  if (subject.startsWith("mailto:")) {
    const domain = subject.split("@").pop() || "unknown";
    return `mailto domain ${domain}`;
  }
  try {
    return new URL(subject).origin;
  } catch {
    return "invalid";
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
  createStartupSnapshot(database, dbPath, SQLITE_STARTUP_SNAPSHOT);
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
      handle TEXT NOT NULL DEFAULT '',
      leaderboard_opted_in INTEGER NOT NULL DEFAULT 0,
      pacts_opted_in INTEGER NOT NULL DEFAULT 0,
      timezone TEXT NOT NULL DEFAULT 'America/New_York',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS friend_pacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      requester_id INTEGER NOT NULL,
      receiver_id INTEGER NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (requester_id) REFERENCES users(id),
      FOREIGN KEY (receiver_id) REFERENCES users(id)
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

    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      endpoint TEXT NOT NULL UNIQUE,
      subscription_json TEXT NOT NULL,
      reminder_time TEXT NOT NULL DEFAULT '20:30',
      timezone TEXT NOT NULL DEFAULT 'America/New_York',
      enabled INTEGER NOT NULL DEFAULT 1,
      last_sent_date TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);
  ensureColumn(database, "leaderboard_profiles", "handle", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(database, "leaderboard_profiles", "leaderboard_opted_in", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(database, "leaderboard_profiles", "pacts_opted_in", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(database, "leaderboard_profiles", "timezone", "TEXT NOT NULL DEFAULT 'America/New_York'");
  database.exec("CREATE UNIQUE INDEX IF NOT EXISTS leaderboard_profiles_handle_unique ON leaderboard_profiles(handle) WHERE handle <> ''");
  database.exec("CREATE INDEX IF NOT EXISTS friend_pacts_participants_idx ON friend_pacts(requester_id, receiver_id, status)");
  database.prepare(`
    UPDATE leaderboard_profiles
    SET leaderboard_opted_in = opted_in
    WHERE opted_in = 1 AND leaderboard_opted_in = 0
  `).run();
  return database;
}

function createStartupSnapshot(database, dbPath, snapshotName) {
  if (!snapshotName) return;
  if (!/^[a-z0-9][a-z0-9._-]{2,79}$/i.test(snapshotName)) {
    throw new Error("SQLITE_STARTUP_SNAPSHOT must be a safe 3-80 character filename");
  }

  const snapshotPath = path.join(path.dirname(dbPath), `${snapshotName}.sqlite`);
  if (require("node:fs").existsSync(snapshotPath)) {
    console.log(`SQLite startup snapshot already exists: ${snapshotPath}`);
    return;
  }

  database.prepare("VACUUM INTO ?").run(snapshotPath);
  const snapshot = new DatabaseSync(snapshotPath, { readOnly: true });
  const integrity = snapshot.prepare("PRAGMA integrity_check").get()?.integrity_check;
  snapshot.close();
  if (integrity !== "ok") {
    require("node:fs").rmSync(snapshotPath, { force: true });
    throw new Error(`SQLite startup snapshot failed integrity check: ${integrity || "unknown"}`);
  }
  console.log(`Created SQLite startup snapshot: ${snapshotPath}`);
}

function ensureColumn(database, tableName, columnName, definition) {
  const columns = database.prepare(`PRAGMA table_info(${tableName})`).all();
  if (columns.some((column) => column.name === columnName)) return;
  database.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
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

function getSocialProfile(userId) {
  const row = db.prepare(`
    SELECT display_name, opted_in, handle, leaderboard_opted_in, pacts_opted_in, timezone
    FROM leaderboard_profiles
    WHERE user_id = ?
  `).get(userId);
  const leaderboardOptedIn = Boolean(row?.leaderboard_opted_in ?? row?.opted_in);
  return {
    displayName: row?.display_name || "",
    handle: row?.handle || "",
    optedIn: leaderboardOptedIn,
    leaderboardOptedIn,
    pactsOptedIn: Boolean(row?.pacts_opted_in),
    timezone: row?.timezone || "America/New_York",
  };
}

function saveSocialProfile(userId, profile) {
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO leaderboard_profiles (
      user_id,
      display_name,
      opted_in,
      handle,
      leaderboard_opted_in,
      pacts_opted_in,
      timezone,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      display_name = excluded.display_name,
      opted_in = excluded.opted_in,
      handle = excluded.handle,
      leaderboard_opted_in = excluded.leaderboard_opted_in,
      pacts_opted_in = excluded.pacts_opted_in,
      timezone = excluded.timezone,
      updated_at = excluded.updated_at
  `).run(
    userId,
    profile.displayName,
    profile.leaderboardOptedIn ? 1 : 0,
    profile.handle || "",
    profile.leaderboardOptedIn ? 1 : 0,
    profile.pactsOptedIn ? 1 : 0,
    profile.timezone || "America/New_York",
    now,
    now,
  );
}

function getUserIdBySocialHandle(handle) {
  const row = db.prepare("SELECT user_id FROM leaderboard_profiles WHERE handle = ?").get(handle);
  return row ? Number(row.user_id) : null;
}

function normalizeSocialHandle(value) {
  const handle = String(value || "").trim().replace(/^@/, "").toLowerCase();
  if (!handle) return { ok: true, handle: "" };
  if (!/^[a-z]{3,24}$/.test(handle)) {
    return { ok: false, handle, error: "Handle must be 3-24 letters only" };
  }
  return { ok: true, handle };
}

function getLeaderboard(currentUserId) {
  const weekStart = currentWeekStart();
  const weekEnd = addDaysIso(weekStart, 6);
  const today = todayInTimeZone();
  const rows = db.prepare(`
    SELECT
      users.id AS user_id,
      leaderboard_profiles.display_name,
      leaderboard_profiles.handle,
      leaderboard_profiles.pacts_opted_in,
      tracker_state.state_json
    FROM leaderboard_profiles
    JOIN users ON users.id = leaderboard_profiles.user_id
    JOIN tracker_state ON tracker_state.user_id = users.id
    WHERE leaderboard_profiles.leaderboard_opted_in = 1
      AND users.is_allowed = 1
  `).all();

  const leaderboardRows = rows.map((row) => {
    const state = safeParseState(row.state_json);
    ensureLeaderboardBaseline(row.user_id, state, weekStart, today);
    const baseline = getLeaderboardBaseline(row.user_id, weekStart);
    const stats = buildLeaderboardStats(state, baseline?.due_count_start || 0, weekStart, weekEnd, today);
    return {
      userId: row.user_id === currentUserId ? "me" : crypto.createHash("sha256").update(String(row.user_id)).digest("hex").slice(0, 12),
      displayName: row.display_name,
      handle: FEATURES.friendPulse && row.pacts_opted_in ? row.handle || "" : "",
      isCurrentUser: row.user_id === currentUserId,
      weekly: stats.weekly,
      readiness: stats.readiness,
      lifetime: stats.lifetime,
    };
  });

  return {
    weekStart,
    weekEnd,
    today,
    rows: leaderboardRows,
  };
}

async function getQaLeaderboard() {
  const weekStart = currentWeekStart();
  const weekEnd = addDaysIso(weekStart, 6);
  const today = todayInTimeZone();
  const state = await getLocalState();
  const currentDueCount = countDueReviews(state.problems || [], today);
  const currentStats = buildLeaderboardStats(state, currentDueCount + 4, weekStart, weekEnd, today);
  const rows = [
    {
      userId: "qa-alex",
      displayName: "Alex QA",
      handle: FEATURES.friendPulse ? "alex" : "",
      isCurrentUser: false,
      weekly: {
        practiceDays: 5,
        repsCompleted: 24,
        skillBreadth: 6,
        independentReps: 15,
        reviewsCompleted: 18,
        newAttempts: 6,
        backlogReduced: 12,
        cleanRecallRate: 78,
        currentStreak: 4,
      },
      readiness: {
        checkedSkills: 11,
        independentSkills: 8,
        transferSkills: 4,
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
      handle: FEATURES.friendPulse ? "maya" : "",
      isCurrentUser: false,
      weekly: {
        practiceDays: 3,
        repsCompleted: 20,
        skillBreadth: 9,
        independentReps: 9,
        reviewsCompleted: 11,
        newAttempts: 9,
        backlogReduced: 3,
        cleanRecallRate: 65,
        currentStreak: 2,
      },
      readiness: {
        checkedSkills: 13,
        independentSkills: 7,
        transferSkills: 3,
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
      handle: FEATURES.friendPulse ? "sam" : "",
      isCurrentUser: false,
      weekly: {
        practiceDays: 6,
        repsCompleted: 9,
        skillBreadth: 5,
        independentReps: 7,
        reviewsCompleted: 7,
        newAttempts: 2,
        backlogReduced: 1,
        cleanRecallRate: 92,
        currentStreak: 6,
      },
      readiness: {
        checkedSkills: 7,
        independentSkills: 6,
        transferSkills: 2,
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
      handle: FEATURES.friendPulse ? qaLeaderboardProfile.handle || "qayou" : "",
      isCurrentUser: true,
      weekly: currentStats.weekly,
      readiness: currentStats.readiness,
      lifetime: currentStats.lifetime,
    });
  }

  return { weekStart, weekEnd, today, rows };
}

async function getQaFriendPulse() {
  const state = await getLocalState();
  const today = todayInTimeZone();
  return {
    profile: qaLeaderboardProfile,
    currentUser: {
      displayName: qaLeaderboardProfile.displayName || "QA You",
      handle: qaLeaderboardProfile.handle || "qayou",
      completedToday: getActivitySessions(state).some((session) => isProperGrade(session.grade) && normalizeDate(session.date) === today),
      pactsOptedIn: Boolean(qaLeaderboardProfile.pactsOptedIn),
    },
    incoming: qaLeaderboardProfile.pactsOptedIn ? qaFriendPulse.incoming.filter((request) => request.status === "pending") : [],
    outgoing: qaLeaderboardProfile.pactsOptedIn ? qaFriendPulse.outgoing.filter((request) => request.status === "pending") : [],
    pacts: qaLeaderboardProfile.pactsOptedIn ? qaFriendPulse.pacts.filter((pact) => pact.status !== "removed") : [],
    incomingCount: qaLeaderboardProfile.pactsOptedIn
      ? qaFriendPulse.incoming.filter((request) => request.status === "pending").length
      : 0,
  };
}

function getQaFriendSearchResults(handle) {
  const users = [
    { userId: "qa-alex", displayName: "Alex QA", handle: "alex" },
    { userId: "qa-maya", displayName: "Maya QA", handle: "maya" },
    { userId: "qa-riya", displayName: "Riya QA", handle: "riya" },
    { userId: "qa-sam", displayName: "Sam QA", handle: "sam" },
  ];
  return users
    .filter((user) => user.handle === handle)
    .map((user) => {
      const pact = qaFriendPulse.pacts.find((item) =>
        item.handle === user.handle && !["removed", "declined"].includes(item.status),
      );
      const outgoing = qaFriendPulse.outgoing.find((request) =>
        request.handle === user.handle && request.status === "pending",
      );
      const incoming = qaFriendPulse.incoming.find((request) =>
        request.handle === user.handle && request.status === "pending",
      );
      const status = pact
        ? pact.paused ? "paused" : "active"
        : incoming
          ? "incoming"
          : outgoing
            ? "pending"
            : "available";
      return { ...user, status };
    });
}

function createQaPactRequest(target) {
  const rawTarget = String(target || "").trim();
  const handleValidation = normalizeSocialHandle(rawTarget);
  if (!handleValidation.ok) return { error: "Enter an exact handle with 3-24 letters." };
  const handle = handleValidation.handle;
  const result = getQaFriendSearchResults(handle)[0];
  if (!result) return { error: "User is unavailable" };
  if (result.status && result.status !== "available") return { ok: true, status: result.status };
  const request = {
    id: `qa-request-${qaFriendPulse.nextRequestId++}`,
    displayName: result.displayName,
    handle: result.handle,
    status: "pending",
  };
  qaFriendPulse.outgoing.push(request);
  return request;
}

function updateQaPactRequest(id, status) {
  const request = qaFriendPulse.incoming.find((item) => item.id === id && item.status === "pending");
  if (!request) return { error: "Request not found" };
  request.status = status;
  if (status === "active") {
    qaFriendPulse.pacts.push({
      id: `qa-pact-${qaFriendPulse.nextPactId++}`,
      displayName: request.displayName,
      handle: request.handle,
      completedToday: false,
      paused: false,
      status: "active",
    });
  }
  return { ok: true };
}

function retractQaPactRequest(id) {
  const request = qaFriendPulse.outgoing.find((item) => item.id === id && item.status === "pending");
  if (!request) return { error: "Request not found" };
  request.status = "removed";
  return { ok: true, status: "removed" };
}

function removeQaPact(id) {
  const pact = qaFriendPulse.pacts.find((item) => item.id === id);
  if (!pact) return { error: "Pact not found" };
  pact.status = "removed";
  return { ok: true };
}

function sendQaPactResult(response, result, successStatus = 200) {
  if (result?.error) {
    response.status(404).json(result);
    return;
  }
  response.status(successStatus).json(result);
}

function getFriendPulse(currentUserId) {
  const profile = getSocialProfile(currentUserId);
  const currentUserCompleted = userCompletedToday(currentUserId, profile.timezone);

  if (!profile.pactsOptedIn) {
    return {
      profile,
      currentUser: {
        displayName: profile.displayName,
        handle: profile.handle,
        completedToday: currentUserCompleted,
        pactsOptedIn: false,
      },
      incoming: [],
      outgoing: [],
      pacts: [],
      incomingCount: 0,
    };
  }

  const incoming = db.prepare(`
    SELECT friend_pacts.id, leaderboard_profiles.display_name, leaderboard_profiles.handle
    FROM friend_pacts
    JOIN users ON users.id = friend_pacts.requester_id
    JOIN leaderboard_profiles ON leaderboard_profiles.user_id = users.id
    WHERE friend_pacts.receiver_id = ?
      AND friend_pacts.status = 'pending'
      AND users.is_allowed = 1
      AND leaderboard_profiles.pacts_opted_in = 1
  `).all(currentUserId).map((row) => ({
    id: String(row.id),
    displayName: row.display_name,
    handle: row.handle,
    status: "pending",
  }));

  const outgoing = db.prepare(`
    SELECT friend_pacts.id, leaderboard_profiles.display_name, leaderboard_profiles.handle
    FROM friend_pacts
    JOIN users ON users.id = friend_pacts.receiver_id
    JOIN leaderboard_profiles ON leaderboard_profiles.user_id = users.id
    WHERE friend_pacts.requester_id = ?
      AND friend_pacts.status = 'pending'
      AND users.is_allowed = 1
      AND leaderboard_profiles.pacts_opted_in = 1
  `).all(currentUserId).map((row) => ({
    id: String(row.id),
    displayName: row.display_name,
    handle: row.handle,
    status: "pending",
  }));

  const pactRows = db.prepare(`
    SELECT
      friend_pacts.id,
      other_users.id AS friend_id,
      other_profiles.display_name,
      other_profiles.handle,
      other_profiles.pacts_opted_in,
      other_profiles.timezone
    FROM friend_pacts
    JOIN users AS other_users ON other_users.id = CASE
      WHEN friend_pacts.requester_id = ? THEN friend_pacts.receiver_id
      ELSE friend_pacts.requester_id
    END
    JOIN leaderboard_profiles AS other_profiles ON other_profiles.user_id = other_users.id
    WHERE (friend_pacts.requester_id = ? OR friend_pacts.receiver_id = ?)
      AND friend_pacts.status = 'active'
      AND other_users.is_allowed = 1
  `).all(currentUserId, currentUserId, currentUserId);

  const pacts = pactRows.map((row) => {
    const paused = !Boolean(row.pacts_opted_in);
    return {
      id: String(row.id),
      userId: publicSocialUserId(row.friend_id),
      displayName: row.display_name,
      handle: row.handle,
      completedToday: paused ? false : userCompletedToday(row.friend_id, row.timezone),
      paused,
      status: paused ? "paused" : "active",
    };
  });

  return {
    profile,
    currentUser: {
      displayName: profile.displayName,
      handle: profile.handle,
      completedToday: currentUserCompleted,
      pactsOptedIn: true,
    },
    incoming,
    outgoing,
    pacts,
    incomingCount: incoming.length,
  };
}

function searchFriendByHandle(currentUserId, handle) {
  const row = db.prepare(`
    SELECT users.id, leaderboard_profiles.display_name, leaderboard_profiles.handle
    FROM leaderboard_profiles
    JOIN users ON users.id = leaderboard_profiles.user_id
    WHERE leaderboard_profiles.handle = ?
      AND leaderboard_profiles.pacts_opted_in = 1
      AND users.is_allowed = 1
      AND users.id <> ?
    LIMIT 1
  `).get(handle, currentUserId);

  if (!row) return [];
  return [{
    userId: publicSocialUserId(row.id),
    displayName: row.display_name,
    handle: row.handle,
    status: friendRelationStatus(currentUserId, row.id),
  }];
}

function createFriendPactRequest(currentUserId, rawHandle) {
  const profile = getSocialProfile(currentUserId);
  if (!profile.pactsOptedIn || !profile.handle) {
    return { status: 400, body: { error: "Enable daily pacts and choose a handle first" } };
  }

  const handleValidation = normalizeSocialHandle(rawHandle || "");
  if (!handleValidation.ok) {
    return { status: 400, body: { error: "Enter an exact handle with 3-24 letters." } };
  }

  const targetUserId = getUserIdBySocialHandle(handleValidation.handle);
  if (!targetUserId || targetUserId === currentUserId) {
    return { status: 404, body: { error: "User is unavailable" } };
  }

  const target = getSocialProfile(targetUserId);
  const targetUser = getUserById(targetUserId);
  if (!targetUser?.is_allowed || !target.pactsOptedIn) {
    return { status: 404, body: { error: "User is unavailable" } };
  }

  const existing = getPactBetweenUsers(currentUserId, targetUserId);
  if (existing && ["pending", "active"].includes(existing.status)) {
    return { status: 409, body: { error: "A pact already exists", status: existing.status } };
  }

  const now = new Date().toISOString();
  if (existing) {
    db.prepare(`
      UPDATE friend_pacts
      SET requester_id = ?, receiver_id = ?, status = 'pending', updated_at = ?
      WHERE id = ?
    `).run(currentUserId, targetUserId, now, existing.id);
    return { status: 201, body: { ok: true, id: String(existing.id), status: "pending" } };
  }

  const result = db.prepare(`
    INSERT INTO friend_pacts (requester_id, receiver_id, status, created_at, updated_at)
    VALUES (?, ?, 'pending', ?, ?)
  `).run(currentUserId, targetUserId, now, now);
  return { status: 201, body: { ok: true, id: String(result.lastInsertRowid), status: "pending" } };
}

function updateFriendPactRequest(currentUserId, id, status) {
  const row = db.prepare("SELECT * FROM friend_pacts WHERE id = ? AND receiver_id = ? AND status = 'pending'").get(id, currentUserId);
  if (!row) return { status: 404, body: { error: "Request not found" } };
  if (status === "active" && !getSocialProfile(currentUserId).pactsOptedIn) {
    return { status: 400, body: { error: "Enable daily pacts before accepting" } };
  }
  if (status === "active") {
    const requester = getUserById(row.requester_id);
    const requesterProfile = getSocialProfile(row.requester_id);
    if (!requester?.is_allowed || !requesterProfile.pactsOptedIn || !requesterProfile.handle) {
      db.prepare("UPDATE friend_pacts SET status = 'removed', updated_at = ? WHERE id = ?").run(new Date().toISOString(), id);
      return { status: 410, body: { error: "This request is no longer available" } };
    }
  }
  db.prepare("UPDATE friend_pacts SET status = ?, updated_at = ? WHERE id = ?").run(status, new Date().toISOString(), id);
  return { status: 200, body: { ok: true, status } };
}

function retractFriendPactRequest(currentUserId, id) {
  const row = db.prepare("SELECT * FROM friend_pacts WHERE id = ? AND requester_id = ? AND status = 'pending'").get(id, currentUserId);
  if (!row) return { status: 404, body: { error: "Request not found" } };
  db.prepare("UPDATE friend_pacts SET status = 'removed', updated_at = ? WHERE id = ?").run(new Date().toISOString(), id);
  return { status: 200, body: { ok: true, status: "removed" } };
}

function removeFriendPact(currentUserId, id) {
  const row = db.prepare(`
    SELECT * FROM friend_pacts
    WHERE id = ?
      AND status = 'active'
      AND (requester_id = ? OR receiver_id = ?)
  `).get(id, currentUserId, currentUserId);
  if (!row) return { status: 404, body: { error: "Pact not found" } };
  db.prepare("UPDATE friend_pacts SET status = 'removed', updated_at = ? WHERE id = ?").run(new Date().toISOString(), id);
  return { status: 200, body: { ok: true } };
}

function getPactBetweenUsers(userA, userB) {
  return db.prepare(`
    SELECT *
    FROM friend_pacts
    WHERE (requester_id = ? AND receiver_id = ?)
       OR (requester_id = ? AND receiver_id = ?)
    ORDER BY updated_at DESC, id DESC
    LIMIT 1
  `).get(userA, userB, userB, userA);
}

function friendRelationStatus(currentUserId, targetUserId) {
  const row = getPactBetweenUsers(currentUserId, targetUserId);
  if (!row || ["declined", "removed"].includes(row.status)) return "available";
  if (row.status === "active") return "active";
  if (row.status === "pending" && row.requester_id === currentUserId) return "pending";
  if (row.status === "pending" && row.receiver_id === currentUserId) return "incoming";
  return row.status;
}

function publicSocialUserId(userId) {
  return crypto.createHash("sha256").update(String(userId)).digest("hex").slice(0, 12);
}

function userCompletedToday(userId, timezone) {
  const localDate = todayInTimeZone(normalizeNotificationTimezone(timezone));
  return minimumPracticeComplete(userId, localDate);
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

function buildLeaderboardStats(state, baselineDueCount, weekStart, weekEnd, today) {
  const problems = Array.isArray(state.problems) ? state.problems : [];
  const sessions = getActivitySessions(state);
  const sessionsWithAttemptTypes = sessions.map((session) => ({
    ...session,
    effectiveAttemptType: session.attemptType || inferSessionAttemptType(session, problems),
    effectiveTopic:
      session.topic ||
      problems.find((problem) => problem.id === session.problemId)?.topic ||
      "General",
  }));
  const weekSessions = sessionsWithAttemptTypes.filter((session) => isSessionInWeek(session, weekStart, weekEnd));
  const gradedWeekSessions = weekSessions.filter((session) => isProperGrade(session.grade));
  const practiceDays = new Set(gradedWeekSessions.map((session) => normalizeDate(session.date)).filter(Boolean)).size;
  const cleanCount = gradedWeekSessions.filter((session) => session.grade === "green").length;
  const totalGraded = gradedWeekSessions.length;
  const currentDueCount = countDueReviews(problems, today);
  const lifetimeAttempts = getLifetimeGradedAttempts(problems, sessionsWithAttemptTypes);
  const streakAnchor = latestActivityDate(gradedWeekSessions, today);
  const evidence = PracticeV2Engine.deriveEvidence(state, { today });
  const skillBreadth = new Set(
    gradedWeekSessions.map((session) => PracticeV2Engine.skillIdFor(session.effectiveTopic)),
  ).size;
  const independentReps = gradedWeekSessions.filter(isIndependentLeaderboardRep).length;

  return {
    weekly: {
      practiceDays,
      repsCompleted: totalGraded,
      skillBreadth,
      independentReps,
      reviewsCompleted: gradedWeekSessions.filter((session) => session.effectiveAttemptType === "review").length,
      newAttempts: gradedWeekSessions.filter((session) => session.effectiveAttemptType === "new").length,
      backlogReduced: Math.max(0, Number(baselineDueCount || 0) - currentDueCount),
      cleanRecallRate: totalGraded ? Math.round((cleanCount / totalGraded) * 100) : 0,
      currentStreak: currentPracticeStreak(sessionsWithAttemptTypes, streakAnchor),
    },
    readiness: {
      checkedSkills: evidence.checkedSkillIds.length,
      independentSkills: evidence.independentSkillIds.length,
      transferSkills: evidence.transferSupportedSkillIds.length,
    },
    lifetime: {
      durablePlus: problems.filter((problem) => isAttempted(problem) && clampStage(problem.stage) >= 4).length,
      mastered: problems.filter((problem) => isMastered(problem, today)).length,
      totalGradedAttempts: lifetimeAttempts.length,
      totalReviewCompletions: lifetimeAttempts.filter((attempt) => attempt.attemptType === "review").length,
    },
  };
}

function isIndependentLeaderboardRep(session) {
  if (session.grade !== "green") return false;
  const assistance = String(session.assistance || "none").toLowerCase();
  return !["hint", "solution", "editorial", "person", "ai"].includes(assistance);
}

function latestActivityDate(sessions, fallbackDate) {
  return (sessions || [])
    .map((session) => normalizeDate(session.date))
    .filter(Boolean)
    .sort((a, b) => b.localeCompare(a))[0] || fallbackDate;
}

function getLifetimeGradedAttempts(problems, sessions) {
  const attempts = [];
  const historyKeys = new Set();

  for (const problem of problems || []) {
    for (const entry of problem.reviewHistory || []) {
      if (!isProperGrade(entry.grade)) continue;

      const key = historyActivityKey(problem, entry);
      historyKeys.add(key);
      attempts.push({
        key,
        grade: entry.grade,
        attemptType: inferHistoryAttemptType(problem, entry),
      });
    }
  }

  for (const session of sessions || []) {
    if (!isProperGrade(session.grade)) continue;
    const key = session.historyEntryId || sessionActivityKey(session);
    if (historyKeys.has(key)) continue;
    attempts.push({
      key,
      grade: session.grade,
      attemptType: session.effectiveAttemptType || session.attemptType || "",
    });
  }

  return attempts;
}

function historyActivityKey(problem, entry) {
  return entry.id || [problem.id || "", normalizeDate(entry.date), entry.grade || "", entry.previousStage ?? "", entry.newStage ?? ""].join("|");
}

function inferHistoryAttemptType(problem, entry) {
  if (entry.scheduledReview) return "review";
  return inferBackfillAttemptType(problem, entry);
}

function getActivitySessions(state) {
  const problems = Array.isArray(state.problems) ? state.problems : [];
  const existingSessions = Array.isArray(state.sessions) ? state.sessions : [];
  const sessionKeys = new Set(existingSessions.map(sessionActivityKey));
  const backfillSessions = [];

  for (const problem of problems) {
    for (const entry of problem.reviewHistory || []) {
      if (!entry.backfilled || !isProperGrade(entry.grade)) continue;

      const session = {
        date: normalizeDate(entry.date),
        problemId: problem.id,
        title: problem.title,
        topic: problem.topic,
        grade: entry.grade,
        attemptType: inferBackfillAttemptType(problem, entry),
        taskType: entry.taskType || "",
        assistance: entry.assistance || "",
        stage: entry.newStage ?? problem.stage,
        status: problem.status,
        backfilled: true,
        historyEntryId: entry.id || "",
      };
      const key = sessionActivityKey(session);
      if (!session.date || sessionKeys.has(key)) continue;
      sessionKeys.add(key);
      backfillSessions.push(session);
    }
  }

  return [...existingSessions, ...backfillSessions];
}

function sessionActivityKey(session) {
  return session.historyEntryId || [session.problemId || "", normalizeDate(session.date), session.grade || "", session.backfilled ? "backfilled" : "session"].join("|");
}

function inferBackfillAttemptType(problem, entry) {
  if (entry.scheduledReview) return "review";

  const entryDate = normalizeDate(entry.date);
  const history = Array.isArray(problem.reviewHistory) ? problem.reviewHistory : [];
  const hasEarlierHistory = history.some((item) => {
    const itemDate = normalizeDate(item.date);
    return itemDate && itemDate < entryDate;
  });
  if (hasEarlierHistory) return "review";

  const firstAttemptDate = normalizeDate(problem.firstAttemptAt);
  if (firstAttemptDate && firstAttemptDate < entryDate) return "review";

  return "new";
}

function inferSessionAttemptType(session, problems) {
  const problem = (problems || []).find((item) => item.id === session.problemId);
  if (!problem) return "";

  const sessionDate = normalizeDate(session.date);
  if (!sessionDate) return "";

  const history = Array.isArray(problem.reviewHistory) ? problem.reviewHistory : [];
  const hasEarlierHistory = history.some((entry) => {
    const entryDate = normalizeDate(entry.date);
    return entryDate && entryDate < sessionDate;
  });
  if (hasEarlierHistory) return "review";

  const firstAttemptDate = normalizeDate(problem.firstAttemptAt);
  if (firstAttemptDate && firstAttemptDate < sessionDate) return "review";

  const sameDayProperEntries = history.filter((entry) => normalizeDate(entry.date) === sessionDate && isProperGrade(entry.grade));
  const matchingEntry = sameDayProperEntries.find((entry) => entry.grade === session.grade);
  if (matchingEntry?.scheduledReview) return "review";

  return "new";
}

function isSessionInWeek(session, weekStart, weekEnd) {
  const date = normalizeDate(session.date);
  return date && date >= weekStart && date <= weekEnd;
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

function getNotificationSettings(userId) {
  const row = db.prepare(`
    SELECT reminder_time, timezone, enabled
    FROM push_subscriptions
    WHERE user_id = ?
    ORDER BY updated_at DESC, id DESC
    LIMIT 1
  `).get(userId);

  if (!row) return { enabled: false, reminderTime: "20:30", timezone: "America/New_York", subscriptionCount: 0 };

  const count = db.prepare("SELECT COUNT(*) AS count FROM push_subscriptions WHERE user_id = ?").get(userId)?.count || 0;
  return {
    enabled: Boolean(row.enabled),
    reminderTime: row.reminder_time,
    timezone: row.timezone,
    subscriptionCount: Number(count || 0),
  };
}

function validateNotificationSubscription(body) {
  const subscription = body.subscription || {};
  const endpoint = String(subscription.endpoint || "").trim();
  const keys = subscription.keys || {};

  if (!endpoint || !keys.p256dh || !keys.auth) {
    return { ok: false, error: "Invalid push subscription" };
  }

  return {
    ok: true,
    subscription,
    settings: normalizeNotificationSettings(body),
  };
}

function normalizeNotificationSettings(body = {}) {
  const reminderTime = /^([01]\d|2[0-3]):[0-5]\d$/.test(String(body.reminderTime || ""))
    ? String(body.reminderTime)
    : "20:30";
  const timezone = normalizeNotificationTimezone(body.timezone);
  return {
    reminderTime,
    timezone,
    enabled: body.enabled !== false,
  };
}

function normalizeNotificationTimezone(value) {
  const timezone = String(value || "America/New_York").trim().slice(0, 80) || "America/New_York";
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format(new Date());
    return timezone;
  } catch {
    return "America/New_York";
  }
}

function savePushSubscription(userId, subscription, settings) {
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO push_subscriptions (user_id, endpoint, subscription_json, reminder_time, timezone, enabled, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(endpoint) DO UPDATE SET
      user_id = excluded.user_id,
      subscription_json = excluded.subscription_json,
      reminder_time = excluded.reminder_time,
      timezone = excluded.timezone,
      enabled = excluded.enabled,
      updated_at = excluded.updated_at
  `).run(
    userId,
    subscription.endpoint,
    JSON.stringify(subscription),
    settings.reminderTime,
    settings.timezone,
    settings.enabled ? 1 : 0,
    now,
    now,
  );
}

function updatePushSubscriptionSettings(userId, endpoint, settings) {
  const now = new Date().toISOString();
  if (endpoint) {
    db.prepare(`
      UPDATE push_subscriptions
      SET reminder_time = ?, timezone = ?, enabled = ?, updated_at = ?
      WHERE user_id = ? AND endpoint = ?
    `).run(settings.reminderTime, settings.timezone, settings.enabled ? 1 : 0, now, userId, endpoint);
    return;
  }

  db.prepare(`
    UPDATE push_subscriptions
    SET reminder_time = ?, timezone = ?, enabled = ?, updated_at = ?
    WHERE user_id = ?
  `).run(settings.reminderTime, settings.timezone, settings.enabled ? 1 : 0, now, userId);
}

function deletePushSubscription(userId, endpoint) {
  if (endpoint) {
    db.prepare("DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?").run(userId, endpoint);
    return;
  }

  db.prepare("DELETE FROM push_subscriptions WHERE user_id = ?").run(userId);
}

async function sendDuePracticeReminders() {
  if (!FEATURES.phoneReminders || !IS_HOSTED || !NOTIFICATIONS_CONFIGURED) return;

  const rows = db.prepare(`
    SELECT push_subscriptions.*, users.email
    FROM push_subscriptions
    JOIN users ON users.id = push_subscriptions.user_id
    WHERE push_subscriptions.enabled = 1
      AND users.is_allowed = 1
  `).all();

  for (const row of rows) {
    try {
      const local = localDateTimeParts(new Date(), row.timezone);
      if (row.last_sent_date === local.date) continue;
      if (local.time < row.reminder_time) continue;
      if (minimumPracticeComplete(row.user_id, local.date)) continue;

      const result = await sendPushSubscription(row, buildReminderPayload(row.user_id, local.date, false));

      if (result.sent) {
        db.prepare("UPDATE push_subscriptions SET last_sent_date = ?, updated_at = ? WHERE id = ?")
          .run(local.date, new Date().toISOString(), row.id);
      }
    } catch (error) {
      console.warn(`Practice reminder failed for subscription ${row.id}: ${error.message}`);
    }
  }
}

function minimumPracticeComplete(userId, localDate) {
  const state = getHostedState(userId);
  return getActivitySessions(state).some((session) => isProperGrade(session.grade) && normalizeDate(session.date) === localDate);
}

async function sendPracticeNotificationToUser(userId, payload) {
  const rows = db.prepare("SELECT * FROM push_subscriptions WHERE user_id = ? AND enabled = 1").all(userId);
  const body = buildReminderPayload(userId, todayInTimeZone(), Boolean(payload?.test));
  let sent = 0;
  let failed = 0;
  let stale = 0;
  for (const row of rows) {
    try {
      const result = await sendPushSubscription(row, body);
      if (result.sent) sent += 1;
      if (result.stale) stale += 1;
    } catch (error) {
      failed += 1;
      console.warn(`Push notification failed for subscription ${row.id}: ${error.message}`);
    }
  }
  return { sent, failed, stale };
}

async function sendPushSubscription(row, payload) {
  try {
    await webPush.sendNotification(JSON.parse(row.subscription_json), JSON.stringify(payload));
    return { sent: true, stale: false };
  } catch (error) {
    if (isStalePushError(error)) {
      db.prepare("DELETE FROM push_subscriptions WHERE id = ?").run(row.id);
      return { sent: false, stale: true };
    }
    throw error;
  }
}

function isStalePushError(error) {
  const body = typeof error?.body === "string" ? error.body : "";
  return error?.statusCode === 404 || error?.statusCode === 410 || body.includes("BadJwtToken");
}

function buildReminderPayload(userId, localDate, isTest = false) {
  const state = getHostedState(userId);
  const problems = Array.isArray(state.problems) ? state.problems : [];
  const sessions = getActivitySessions(state).filter((session) => isProperGrade(session.grade));
  const lastPracticeDate = latestActivityDate(sessions, localDate);
  const daysSincePractice = dateDiffDays(lastPracticeDate, localDate);
  const dueCount = countDueReviews(problems, localDate);
  const overdueCount = problems.filter((problem) => problem.nextReview && normalizeDate(problem.nextReview) < localDate).length;
  const pick = pickReminderCopy({ userId, localDate, daysSincePractice, dueCount, overdueCount, isTest });

  return {
    title: pick.title,
    body: pick.body,
    tag: isTest ? "minimum-practice-test" : "minimum-practice-reminder",
    url: "/index.html",
  };
}

function pickReminderCopy({ userId, localDate, daysSincePractice, dueCount, overdueCount, isTest }) {
  if (isTest) {
    return pickFromList([
      { title: "DSA Tracker", body: "Quick ping: your next rep is ready whenever you are." },
      { title: "DSA Tracker", body: "Small nudge, big payoff. One honest attempt keeps the loop alive." },
      { title: "DSA Tracker", body: "Your tracker is ready for one more clean win." },
    ], userId, localDate, dueCount + overdueCount);
  }

  if (daysSincePractice >= 14) {
    return pickFromList([
      { title: "DSA Tracker", body: "Welcome back. One problem is enough to restart momentum." },
      { title: "DSA Tracker", body: "No guilt, no catch-up marathon. Just one problem to get moving again." },
      { title: "DSA Tracker", body: "Your queue is still here. Take one calm rep and rebuild the rhythm." },
    ], userId, localDate, daysSincePractice + overdueCount);
  }

  if (daysSincePractice >= 3) {
    return pickFromList([
      { title: "DSA Tracker", body: "You’re close. One attempt today keeps the loop warm." },
      { title: "DSA Tracker", body: "One problem now, and future-you gets the payoff." },
      { title: "DSA Tracker", body: "The next rep is waiting. Let’s keep the chain moving." },
    ], userId, localDate, daysSincePractice + dueCount);
  }

  return pickFromList([
    { title: "DSA Tracker", body: "Your next rep is ready." },
    { title: "DSA Tracker", body: "One problem keeps the streak moving." },
    { title: "DSA Tracker", body: "Small dose, big payoff. Let’s keep going." },
    { title: "DSA Tracker", body: "Time for one clean win." },
    { title: "DSA Tracker", body: "All that matters is the next one." },
  ], userId, localDate, dueCount);
}

function pickFromList(items, userId, localDate, salt = 0) {
  if (!Array.isArray(items) || items.length === 0) {
    return { title: "DSA Tracker", body: "All that matters is the next one." };
  }

  const seed = crypto.createHash("sha256").update([userId, localDate, salt, items.length].join("|")).digest();
  const index = seed.readUInt32BE(0) % items.length;
  return items[index];
}

function localDateTimeParts(date, timezone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: normalizeNotificationTimezone(timezone),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = (type) => parts.find((part) => part.type === type)?.value || "";
  return {
    date: `${value("year")}-${value("month")}-${value("day")}`,
    time: `${value("hour")}:${value("minute")}`,
  };
}

function countDueReviews(problems, today) {
  return (problems || []).filter((problem) => problem.nextReview && normalizeDate(problem.nextReview) <= today).length;
}

function isAttempted(problem) {
  return Number(problem.completionCount || 0) > 0 || Boolean(problem.firstAttemptAt || problem.lastReviewedAt);
}

function isMastered(problem, today) {
  const attempts = countMasteryEligibleAttempts(problem);
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

function countMasteryEligibleAttempts(problem) {
  const history = Array.isArray(problem.reviewHistory) ? problem.reviewHistory : [];
  if (history.length === 0) return Number(problem.completionCount || 0);

  return history.filter((entry) => {
    if (["red", "yellow", "green"].includes(entry.grade)) return true;
    return entry.grade === "imported" && entry.source !== "leetcode-progress";
  }).length;
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

function todayInTimeZone(timezone = "America/New_York") {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: normalizeNotificationTimezone(timezone),
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
  if (!row) return createEmptyState();

  const state = JSON.parse(row.state_json);
  return migrateStateToV4({
    ...state,
    version: Number(row.version || state.version || EXPORT_VERSION),
    savedAt: row.saved_at,
    revision: Number(row.revision || 0),
  });
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
    if (existing) {
      const existingVersion = serializedStateVersion(existing.state_json);
      createHostedBackup(
        userId,
        currentRevision,
        existing.state_json,
        existingVersion < STATE_VERSION ? "pre-v4-migration" : "save",
      );
    }
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
    if (error.code === "ENOENT") return createEmptyState();
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

  let previousSerialized = "";
  try {
    previousSerialized = await fs.readFile(STATE_FILE, "utf8");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  await fs.mkdir(BACKUP_DIR, { recursive: true });
  if (previousSerialized) {
    const previousVersion = serializedStateVersion(previousSerialized);
    const reason = previousVersion < STATE_VERSION ? "pre-v4-migration" : "pre-save";
    await fs.writeFile(path.join(BACKUP_DIR, `tracker-state-${reason}-${timestamp()}.json`), previousSerialized);
  }
  await fs.writeFile(STATE_FILE, serialized);
  return { ok: true, savedAt: nextState.savedAt, revision: nextState.revision };
}

function serializedStateVersion(serialized) {
  try {
    return Number(JSON.parse(serialized)?.version || 0);
  } catch {
    return 0;
  }
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
    ...state,
    savedAt: state.savedAt || new Date().toISOString(),
    revision: Number(state.revision || 0),
  });
}

function validateTrackerState(state) {
  if (!state || typeof state !== "object") return { ok: false, error: "Invalid tracker state" };
  if (!Array.isArray(state.problems) || !Array.isArray(state.sessions)) {
    return { ok: false, error: "Invalid tracker state" };
  }
  const version = Number(state.version || 3);
  if (!Number.isFinite(version) || version < 1 || version > STATE_VERSION) {
    return { ok: false, error: `Unsupported tracker state version: ${state.version}` };
  }
  return { ok: true };
}

function sanitizeState(state) {
  return migrateStateToV4(state);
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
