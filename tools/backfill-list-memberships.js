#!/usr/bin/env node
/* Usage: node tools/backfill-list-memberships.js --db /path/tracker.sqlite [--apply] [--report path] */
const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");
const { loadStudyCatalog } = require("../study-catalog.js");

const args = process.argv.slice(2);
const option = (name, fallback = "") => args.includes(name) ? args[args.indexOf(name) + 1] || fallback : fallback;
const dbPath = option("--db");
const apply = args.includes("--apply");
const reportPath = option("--report", "");
if (!dbPath) throw new Error("Pass --db <SQLite path>.");
const resolvedDbPath = path.resolve(dbPath);
const resolvedReportPath = reportPath ? path.resolve(reportPath) : "";
if (resolvedReportPath && resolvedReportPath === resolvedDbPath) throw new Error("--report must not be the same file as --db.");

const catalog = loadStudyCatalog();
const db = new DatabaseSync(resolvedDbPath);
const rows = db.prepare("SELECT user_id, version, revision, state_json FROM tracker_state ORDER BY user_id").all();
const report = { generatedAt: new Date().toISOString(), mode: apply ? "apply" : "dry-run", catalogSize: catalog.catalog.length, users: [], totals: { users: rows.length, changedUsers: 0, changedProblems: 0, otherProblems: 0 } };
const changes = [];
for (const row of rows) {
  const state = JSON.parse(row.state_json);
  const user = { userId: row.user_id, changed: [], other: [] };
  for (const problem of Array.isArray(state.problems) ? state.problems : []) {
    const before = Array.isArray(problem.listMemberships) ? [...problem.listMemberships].sort() : [];
    const after = catalog.membershipsFor(problem).sort();
    if (after.length === 0 && (problem.reviewHistory || []).some((entry) => ["red", "yellow", "green"].includes(entry.grade))) user.other.push(problem.title);
    if (JSON.stringify(before) !== JSON.stringify(after)) {
      user.changed.push({ id: problem.id, title: problem.title, before, after });
      problem.listMemberships = after;
    }
  }
  report.totals.changedProblems += user.changed.length;
  report.totals.otherProblems += user.other.length;
  if (user.changed.length) {
    report.totals.changedUsers += 1;
    changes.push({ row, state });
  }
  report.users.push(user);
}

const serializedReport = `${JSON.stringify(report, null, 2)}\n`;
// Validate report persistence before mutation. An explicit report path is part
// of the migration contract, so a bad path must fail while the DB is untouched.
if (resolvedReportPath) fs.mkdirSync(path.dirname(resolvedReportPath), { recursive: true });
if (resolvedReportPath) fs.writeFileSync(resolvedReportPath, serializedReport);

if (apply && changes.length) {
  db.exec("BEGIN IMMEDIATE");
  try {
    const backup = db.prepare("INSERT INTO state_backups (user_id, revision, state_json, created_at, reason) VALUES (?, ?, ?, ?, ?)");
    const update = db.prepare("UPDATE tracker_state SET revision = ?, state_json = ?, saved_at = ? WHERE user_id = ? AND revision = ?");
    const now = new Date().toISOString();
    for (const { row, state } of changes) {
      backup.run(row.user_id, row.revision, row.state_json, now, "canonical-list-membership-backfill");
      const result = update.run(Number(row.revision || 0) + 1, JSON.stringify(state), now, row.user_id, row.revision);
      if (result.changes !== 1) throw new Error(`Revision changed for user ${row.user_id}; no partial migration was committed.`);
    }
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
console.log(serializedReport);
