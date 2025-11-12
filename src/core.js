import fs from "fs";
import { promises as fsPromises } from "fs";
import { open } from "sqlite";
import sqlite3 from "sqlite3";

export default class ThreeStateCounter {
  constructor({
    dbPath = "counter.db",
    logPath = "counter.log",
    flushEvery = 10,
    mode = "async", // "sync" or "async"
  } = {}) {
    this.dbPath = dbPath;
    this.logPath = logPath;
    this.flushEvery = flushEvery;
    this.mode = mode;

    this.value = 0;
    this.pending = 0;
    this.db = null;

    // For async mode: batch writes
    this.writeBuffer = [];
    this.flushTimer = null;
    this.isWriting = false;

    if (mode !== "sync" && mode !== "async") {
      throw new Error('mode must be "sync" or "async"');
    }
  }

  // ---------- Setup & Recovery ----------

  async init() {
    await this._initDB();
    await this._loadState();
    await this._replayLog();
  }

  async _initDB() {
    this.db = await open({
      filename: this.dbPath,
      driver: sqlite3.Database,
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

  async _replayLog() {
    try {
      if (!fs.existsSync(this.logPath)) return;

      const content = await fsPromises.readFile(this.logPath, "utf8");
      const lines = content.trim().split("\n");

      for (const line of lines) {
        if (!line) continue;
        const delta = parseInt(line, 10);
        if (!isNaN(delta)) {
          this.value += delta;
        }
      }

      // Log replayed; clear it
      await fsPromises.writeFile(this.logPath, "");
    } catch (err) {
      console.error("Error replaying log:", err);
    }
  }

  // ---------- Core Operations ----------

  _logOperationSync(delta) {
    try {
      fs.appendFileSync(this.logPath, `${delta}\n`);
    } catch (err) {
      console.error("Error writing to log (sync):", err);
      throw err;
    }
  }

  async _logOperationAsync(delta) {
    // Add to buffer
    this.writeBuffer.push(delta);

    // Schedule a flush if not already scheduled
    if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => this._flushWriteBuffer(), 50);
    }
  }

  async _flushWriteBuffer() {
    if (this.isWriting || this.writeBuffer.length === 0) return;

    this.isWriting = true;
    this.flushTimer = null;

    const toWrite = [...this.writeBuffer];
    this.writeBuffer = [];

    try {
      const content = toWrite.join("\n") + "\n";
      await fsPromises.appendFile(this.logPath, content);
    } catch (err) {
      console.error("Error writing to log (async):", err);
      // Put failed writes back in buffer
      this.writeBuffer.unshift(...toWrite);
    } finally {
      this.isWriting = false;
      
      // If more writes came in while we were writing, schedule another flush
      if (this.writeBuffer.length > 0 && !this.flushTimer) {
        this.flushTimer = setTimeout(() => this._flushWriteBuffer(), 50);
      }
    }
  }

  increment(delta = 1) {
    if (this.mode === "sync") {
      this._logOperationSync(delta);
    } else {
      this._logOperationAsync(delta); // Fire and forget
    }

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
    if (!this.db || !this.db.open) return; // Skip if DB is closed

    try {
      // If async mode, ensure buffered writes are flushed first
      if (this.mode === "async") {
        await this._flushWriteBuffer();
      }

      await this.db.run(
        "UPDATE counter_state SET value = ? WHERE id = 1",
        this.value
      );

      await fsPromises.writeFile(this.logPath, "");
      this.pending = 0;
    } catch (err) {
      console.error("Error flushing to database:", err);
      throw err;
    }
  }

  async close() {
    // Clear any pending flush timer
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    // Ensure all writes are flushed
    if (this.mode === "async") {
      await this._flushWriteBuffer();
    }

    await this.flush();
    await this.db.close();
  }
}