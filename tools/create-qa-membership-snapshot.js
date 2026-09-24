#!/usr/bin/env node
/* Copy only membership-relevant QA fields; excludes sessions, credentials, notes, and reflections. */
const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");
const args = process.argv.slice(2);
const value = (name) => args[args.indexOf(name) + 1] || "";
const sourcePath = value("--source");
const targetPath = value("--target");
if (!sourcePath || !targetPath) throw new Error("Usage: --source production.sqlite --target qa.sqlite");
if (fs.existsSync(targetPath)) throw new Error(`Refusing to overwrite ${targetPath}`);
const source = new DatabaseSync(path.resolve(sourcePath));
const target = new DatabaseSync(path.resolve(targetPath));
target.exec(`
  CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT, is_allowed INTEGER NOT NULL DEFAULT 1);
  CREATE TABLE tracker_state (user_id INTEGER PRIMARY KEY, version INTEGER NOT NULL, revision INTEGER NOT NULL, state_json TEXT NOT NULL, saved_at TEXT NOT NULL);
  CREATE TABLE leaderboard_profiles (user_id INTEGER PRIMARY KEY, display_name TEXT NOT NULL DEFAULT '', opted_in INTEGER NOT NULL DEFAULT 0, handle TEXT NOT NULL DEFAULT '', leaderboard_opted_in INTEGER NOT NULL DEFAULT 0, pacts_opted_in INTEGER NOT NULL DEFAULT 0, timezone TEXT NOT NULL DEFAULT 'America/New_York', created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
  CREATE TABLE state_backups (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, revision INTEGER NOT NULL, state_json TEXT NOT NULL, created_at TEXT NOT NULL, reason TEXT NOT NULL);
`);
const redactState = (serialized) => {
  const state = JSON.parse(serialized);
  // This fixture is only for catalog membership rehearsal. Keep the identity,
  // membership and grade signal required by the backfill; drop all workflow,
  // profile, telemetry, schedule, reflection, and session data.
  return JSON.stringify({
    version: state.version,
    problems: (state.problems || []).map((problem) => ({
      id: problem.id,
      title: problem.title,
      titleSlug: problem.titleSlug,
      slug: problem.slug,
      url: problem.url,
      listMemberships: problem.listMemberships,
      reviewHistory: (problem.reviewHistory || []).map((entry) => ({ grade: entry.grade })),
    })),
  });
};
const copy = (table, columns, transform = (row) => row) => {
  const rows = source.prepare(`SELECT ${columns.join(", ")} FROM ${table}`).all();
  const insert = target.prepare(`INSERT INTO ${table} (${columns.join(", ")}) VALUES (${columns.map(() => "?").join(", ")})`);
  for (const raw of rows) { const row = transform(raw); insert.run(...columns.map((column) => row[column])); }
  return rows.length;
};
target.exec("BEGIN");
try {
  const summary = {
    users: copy("users", ["id", "email", "is_allowed"], (row) => ({ ...row, email: `qa-user-${row.id}@example.invalid` })),
    states: copy("tracker_state", ["user_id", "version", "revision", "state_json", "saved_at"], (row) => ({ ...row, state_json: redactState(row.state_json) })),
    profiles: copy("leaderboard_profiles", ["user_id", "display_name", "opted_in", "handle", "leaderboard_opted_in", "pacts_opted_in", "timezone", "created_at", "updated_at"], (row) => ({ ...row, display_name: `QA User ${row.user_id}`, handle: "" })),
  };
  target.exec("COMMIT");
  console.log(JSON.stringify(summary));
} catch (error) { target.exec("ROLLBACK"); throw error; }
