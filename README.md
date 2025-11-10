🧮 three-state-counter
by Yashwanth Chikki H.D.

A lightweight, crash-safe, and persistent counter for Node.js — built with three layers of reliability:

⚡ In-Memory Counter → Ultra-fast reads & writes

🧾 Append-Only Log File → Crash recovery without overhead

💾 SQLite Snapshot → Permanent, durable state

No Redis. No setup. Just install, import, and go.

🚀 Why Use three-state-counter?

When you only need a simple persistent counter, not an entire database or Redis instance.

Perfect for:

Page views / download counts

API rate tracking

IoT / analytics counters

Lightweight caching of incrementing data

Any small app needing speed + safety

⚙️ Installation
npm install three-state-counter

🧩 Quick Start Example
import counter from "three-state-counter";

// Create persistent counters
counter.setup("views", 0, 1);       // (name, initialValue, jumpValue)
counter.setup("likes", 10, 2, 5);   // flushes to disk every 5 ops

// Use them like functions
counter.views();  // increments by +1
counter.likes();  // increments by +2

console.log(counter.views.value);   // => 1
console.log(counter.likes.value);   // => 12

// Persist to disk manually (optional)
counter.flushAll();


🧠 Next time your app restarts, the counter values automatically recover — even if you crashed mid-update.

🧱 How It Works

Your counter operates on three layers:

Layer	Purpose	Behavior
🧠 In-memory	Fast access and updates	Reads/writes happen instantly
🧾 Log file (.log)	Write-ahead logging	Stores unflushed operations
💾 SQLite DB	Long-term storage	Stores last committed state
Data Flow

Each increment → updates memory + appends to log file

Every flushEvery ops → writes to SQLite and clears log

On startup → SQLite loads, log is replayed, state recovered

That’s how it stays fast, safe, and durable.

📘 API Reference
counter.setup(name, initial = 0, jump = 1, flushEvery = 10)

Creates (or loads) a persistent counter.

Parameter	Type	Default	Description
name	string	—	Unique counter name
initial	number	0	Starting value if new
jump	number	1	Increment amount per call
flushEvery	number	10	Number of updates before flushing to SQLite
Example
const downloads = counter.setup("downloads", 0, 5, 3);

downloads(); // +5 → 5
downloads(); // +5 → 10
console.log(downloads.value); // => 10

Counter Function

Every counter created with setup() is callable like a function.

Example
counter.setup("visits", 0, 1);
counter.visits();   // increments
counter.visits();   // increments again
console.log(counter.visits.value); // => 2


Each counter instance has the following methods and properties:

Method / Property	Type	Description
counter.name()	function	Increments by jump and returns new value
counter.name.value	number	Current in-memory value
counter.name.flush()	function	Forces immediate persistence to SQLite
counter.name.reset(value)	function	Resets to a specific value and persists it
Global Manager Methods
Method	Description
counter.list()	Returns all counter names currently active
counter.flushAll()	Flushes every counter to SQLite
counter.closeAll()	Gracefully closes all open counter connections
Example:
counter.flushAll();
console.log(counter.list()); // ['views', 'likes', 'downloads']

🧾 Example Use Cases
1. Page View Tracker
counter.setup("pageViews", 0, 1);
counter.pageViews(); // call this every visit
console.log("Total views:", counter.pageViews.value);

2. Lightweight Rate Counter
counter.setup("apiHits", 0, 1, 20);
counter.apiHits(); // increment per request

3. IoT Sensor Count
counter.setup("sensorCount", 100, 10);
counter.sensorCount(); // adds 10

⚡ Performance Notes

Log writes are append-only, so they’re extremely fast

No fsync on every write (uses OS caching for speed)

SQLite flush is infrequent and batched (flushEvery)

Ideal for small to moderate workloads

🧩 File Structure

At runtime, these files are created automatically:

three-state-counter/
├── counter.db      ← SQLite database (persistent)
├── views.log       ← Append-only log for “views” counter
├── likes.log       ← Append-only log for “likes” counter
└── ...


You can safely .gitignore these:

*.db
*.log

💾 Persistence Example

If your app crashes during updates:

Logs remain on disk

On restart, counters load from DB

Log entries replay → full recovery

Result: No data loss.

🧠 Design Inspiration

This library takes cues from proven architectures:

Redis AOF + RDB hybrid (log + snapshot)

RocksDB write-ahead logs

PostgreSQL WAL durability model

But simplified for single-process Node.js apps.

🧰 Tech Stack

Node.js (ES Modules)

better-sqlite3
 – for embedded persistence

Native fs module for lightweight append logging

🧱 Project Structure
three-state-counter/
├── package.json
├── README.md
├── LICENSE
├── .gitignore
└── src/
    ├── core.js      ← Core counter logic
    └── index.js     ← Public API (CounterManager)

📦 Installation for Contributors
git clone https://github.com/yashwanthchikki/three-state-counter.git
cd three-state-counter
npm install


Run a test:

node test.js

🧾 License

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

💬 Author

👤 Yashwanth Chikki H.D.
📧 [Your Email or GitHub Profile]
💻 Developer, AI/ML Enthusiast, Systems Engineer
📧 [yashwanthchikkihd@gmail.com](mailto:yashwanthchikkihd@gmail.com)
💻 [GitHub – yashwanthchikki](https://github.com/yashwanthchikki)
