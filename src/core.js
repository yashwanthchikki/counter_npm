import fs from "fs";
import Database from "better-sqlite3";

export default class ThreeStateCounter {
  constructor({
    dbPath = "counter.db",
    logPath = "counter.log",
    flushEvery = 10,
  } = {}) {
    this.dbPath = dbPath;
    this.logPath = logPath;
    this.flushEvery = flushEvery;

    this.value = 0;       // in-memory counter
    this.pending = 0;     // unflushed operations

    this._initDB();       // ensure DB schema
    this._loadState();    // load last flushed value
    this._replayLog();    // recover from crash
  }

  // ---------- Setup & Recovery ----------

  _initDB() {
    this.db = new Database(this.dbPath);
    this.db.prepare(`
      CREATE TABLE IF NOT EXISTS counter_state (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        value INTEGER NOT NULL
      )
    `).run();
    this.db.prepare(
      "INSERT OR IGNORE INTO counter_state (id, value) VALUES (1, 0)"
    ).run();
  }

  _loadState() {
    const row = this.db.prepare(
      "SELECT value FROM counter_state WHERE id = 1"
    ).get();
    this.value = row.value;
  }

  _replayLog() {
    if (!fs.existsSync(this.logPath)) return;

    const lines = fs.readFileSync(this.logPath, "utf8").trim().split("\n");
    for (const line of lines) {
      if (!line) continue;
      this.value += parseInt(line, 10);
    }

    // Log has been replayed; we can safely clear it.
    fs.writeFileSync(this.logPath, "");
  }

  // ---------- Core Operations ----------

  _logOperation(delta) {
    // Append to file — cheap, buffered write
    fs.appendFileSync(this.logPath, `${delta}\n`);
  }

  increment(delta = 1) {
    this._logOperation(delta);
    this.value += delta;
    this.pending++;

    if (this.pending >= this.flushEvery) {
      this.flush();
    }
  }

  decrement(delta = 1) {
    this.increment(-delta);
  }

  getValue() {
    return this.value;
  }

  // ---------- Flush to Persistent DB ----------

  flush() {
    this.db.prepare(
      "UPDATE counter_state SET value = ? WHERE id = 1"
    ).run(this.value);

    // Clear log (all ops persisted)
    fs.writeFileSync(this.logPath, "");
    this.pending = 0;
  }

  close() {
    this.flush();
    this.db.close();
  }
}
