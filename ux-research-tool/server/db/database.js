const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = path.resolve(__dirname, '../../db.sqlite');

const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS studies (
    id           TEXT PRIMARY KEY,
    title        TEXT NOT NULL,
    type         TEXT NOT NULL,
    config       TEXT NOT NULL,
    status       TEXT NOT NULL DEFAULT 'draft',
    public_token TEXT UNIQUE,
    created_by   TEXT,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS responses (
    id                TEXT PRIMARY KEY,
    study_id          TEXT NOT NULL REFERENCES studies(id),
    participant_name  TEXT NOT NULL,
    participant_email TEXT NOT NULL,
    data              TEXT NOT NULL,
    completed_at      DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Add created_by to existing databases that predate the column
try { db.exec('ALTER TABLE studies ADD COLUMN created_by TEXT'); } catch {}

module.exports = db;
