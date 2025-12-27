const Database = require("better-sqlite3");
const db = new Database("scheduler.db");

// jobs table
db.prepare(`
  CREATE TABLE IF NOT EXISTS jobs (
    jobId TEXT PRIMARY KEY,
    schedule TEXT,
    api TEXT,
    type TEXT,
    nextExecutionTime TEXT,
    alertWebhook TEXT
  )
`).run();

// executions table
db.prepare(`
  CREATE TABLE IF NOT EXISTS executions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    jobId TEXT,
    executionTime TEXT,
    statusCode INTEGER,
    durationMs INTEGER,
    success INTEGER
  )
`).run();

module.exports = db;
