import fs from "fs";
import sqlite3 from "sqlite";
import sqlite3Driver from "sqlite3";

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
    this.db = null;       // will be initialized asynchronously
  }

  // ---------- Setup & Recovery ----------

  async init() {
    await this._initDB();
    await this._loadState();
    this._replayLog();
  }

  async _initDB() {
    this.db = await sqlite3.open({
      filename: this.dbPath,
      driver: sqlite3Driver.Database,
    });

    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS counter_state (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        value INTEGER NOT NULL
      )
    `);

    await this.db.run(
      "INSERT OR IGNORE INTO counter_state (id, value) VALUES (1, 0)"
    );
  }

  async _loadState() {
    const row = await this.db.get(
      "SELECT value FROM counter_state WHERE id = 1"
    );
    this.value = row?.value ?? 0;
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

  async flush() {
    if (!this.db) return;
    await this.db.run(
      "UPDATE counter_state SET value = ? WHERE id = 1",
      this.value
    );
    fs.writeFileSync(this.logPath, "");
    this.pending = 0;
  }

  async close() {
    await this.flush();
    await this.db.close();
  }
}
