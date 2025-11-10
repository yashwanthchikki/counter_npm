cat > README.md << 'EOF'
# 🧮 three-state-counter  
**by Yashwanth Chikki H.D.**

A lightweight, crash-safe, and persistent counter for Node.js — built with three layers of reliability:

- ⚡ **In-Memory Counter** → Ultra-fast reads & writes  
- 🧾 **Append-Only Log File** → Crash recovery without overhead  
- 💾 **SQLite Snapshot** → Permanent, durable state  

No Redis. No setup. Just install, import, and go.

---

## 🚀 Why Use *three-state-counter*?

When you only need a simple persistent counter, not an entire database or Redis instance.

Perfect for:

- Page views / download counts  
- API rate tracking  
- IoT / analytics counters  
- Lightweight caching of incrementing data  
- Any small app needing speed + safety  

---

## ⚙️ Installation
```bash
npm install three-state-counter
```

## 🧩 Quick Start Example
```javascript
import counter from "three-state-counter";

// Create persistent counters
await counter.setup("views", 0, 1);       // (name, initialValue, jumpValue)
await counter.setup("likes", 10, 2, 5);   // flushes to disk every 5 ops

// Use them like functions
counter.views();  // increments by +1
counter.likes();  // increments by +2

console.log(counter.views.value);   // => 1
console.log(counter.likes.value);   // => 12

// Persist to disk manually (optional)
await counter.flushAll();
```

🧠 On restart, all counter values automatically recover — even after a crash.

---

## 🧱 How It Works

Your counter operates on three layers:

| Layer | Purpose | Behavior |
|-------|---------|----------|
| 🧠 In-memory | Fast access and updates | Reads/writes happen instantly |
| 🧾 Log file (.log) | Write-ahead logging | Stores unflushed operations |
| 💾 SQLite DB | Long-term storage | Stores last committed state |

**Data Flow:**

1. Each increment updates memory + appends to log file
2. Every `flushEvery` ops → writes to SQLite + clears log
3. On startup → SQLite loads → log replays → state recovered

That's how it stays fast, safe, and durable.

---

## 📘 API Reference

### counter.setup(name, initial = 0, jump = 1, flushEvery = 10)

Creates or loads a persistent counter.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| name | string | — | Unique counter name |
| initial | number | 0 | Starting value if new |
| jump | number | 1 | Increment amount per call |
| flushEvery | number | 10 | Number of updates before flushing to SQLite |

**Example:**
```javascript
const downloads = await counter.setup("downloads", 0, 5, 3);

downloads(); // +5 → 5
downloads(); // +5 → 10
console.log(downloads.value); // => 10
```

### Counter Functions

Every counter created with `setup()` is callable like a function.
```javascript
await counter.setup("visits", 0, 1);
counter.visits();   // increments
counter.visits();   // increments again
console.log(counter.visits.value); // => 2
```

Each counter instance provides:

| Method / Property | Type | Description |
|-------------------|------|-------------|
| counter.name() | function | Increments by jump and returns new value |
| counter.name.value | number | Current in-memory value |
| counter.name.flush() | function | Forces immediate persistence to SQLite |
| counter.name.reset(value) | function | Resets to specific value and persists it |

### Global Manager Methods

| Method | Description |
|--------|-------------|
| counter.list() | Returns all counter names currently active |
| counter.flushAll() | Flushes every counter to SQLite |
| counter.closeAll() | Gracefully closes all open counters |

**Example:**
```javascript
await counter.flushAll();
console.log(counter.list()); // ['views', 'likes', 'downloads']
```

---

## 🧾 Example Use Cases

### 1️⃣ Page View Tracker
```javascript
await counter.setup("pageViews", 0, 1);
counter.pageViews(); // call this every visit
console.log("Total views:", counter.pageViews.value);
```

### 2️⃣ Lightweight Rate Counter
```javascript
await counter.setup("apiHits", 0, 1, 20);
counter.apiHits(); // increment per request
```

### 3️⃣ IoT Sensor Count
```javascript
await counter.setup("sensorCount", 100, 10);
counter.sensorCount(); // adds 10
```

---

## ⚡ Performance Notes

- Log writes are append-only → extremely fast
- No fsync on every write → uses OS caching
- SQLite flushes are infrequent (batched via `flushEvery`)
- Ideal for small to moderate workloads

---

## 🧩 File Structure (Runtime)
```
three-state-counter/
├── counter.db      ← SQLite database (persistent)
├── views.log       ← Append-only log for "views" counter
├── likes.log       ← Append-only log for "likes" counter
└── ...
```

Add these to `.gitignore`:
```
*.db
*.log
```

---

## 💾 Crash Recovery Example

If your app crashes during updates:

1. Logs remain on disk
2. On restart → SQLite loads previous snapshot
3. Log entries replay automatically

✅ **Result:** no data loss

---

## 🧠 Design Inspiration

Inspired by architectures like:

- Redis AOF + RDB Hybrid (log + snapshot)
- RocksDB Write-Ahead Logs
- PostgreSQL WAL

Simplified for single-process Node.js apps.

---

## 🧰 Tech Stack

- Node.js (ES Modules)
- SQLite (`sqlite` + `sqlite3`) — no native compilation required
- Native `fs` module for logging

---

## 🧱 Project Structure
```
three-state-counter/
├── package.json
├── README.md
├── LICENSE
├── .gitignore
└── src/
    ├── core.js      ← Core counter logic
    └── index.js     ← Public API (CounterManager)
```

---

## 📦 Installation for Contributors
```bash
git clone https://github.com/yashwanthchikki/three-state-counter.git
cd three-state-counter
npm install
node test.js
```

---

## 🧾 License

MIT License

Copyright © 2025
Yashwanth Chikki H.D.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED.

---

## 💬 Author

👤 **Yashwanth Chikki H.D.**  
📧 yashwanthchikkihd@gmail.com  
💻 [GitHub – yashwanthchikki](https://github.com/yashwanthchikki)

🧠 Developer · AI/ML Enthusiast · Systems Engineer
EOF