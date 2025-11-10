# Three-State Counter

**Lightning-fast, crash-safe persistent counters for Node.js** — No Redis required. No native dependencies. Just pure JavaScript magic.

[![npm version](https://img.shields.io/npm/v/three-state-counter.svg)](https://www.npmjs.com/package/three-state-counter)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

```javascript
import counter from 'three-state-counter';

const pageViews = await counter.setup('views', 0, 1, 10, 'async');
pageViews(); // Instant increment
pageViews(); // ~100,000 ops/sec
console.log(pageViews.value); // 2
```

## 🚀 Why This Exists

You need counters that are **fast** and **don't lose data on crashes**. Your options suck:

| Solution | Speed | Crash Safe | Easy | Problems |
|----------|-------|------------|------|----------|
| **Variables** | ⚡️ Instant | ❌ No | ✅ Yes | Lost on restart |
| **SQLite Direct** | 🐌 ~500 ops/s | ✅ Yes | ✅ Yes | Too slow |
| **Redis** | ⚡️ Fast | ✅ Yes | ❌ No | External service |
| **better-sqlite3** | ⚡️ Fast | ✅ Yes | ❌ No | Native compilation breaks |
| **This Package** | ⚡️ 100k ops/s | ✅ Yes | ✅ Yes | **Perfect** ✨ |

This package gives you **in-memory speed with database durability** using a three-layer architecture:

1. 🧠 **Memory** — Instant reads/writes (nanoseconds)
2. 📝 **Write-Ahead Log** — Crash recovery (microseconds)  
3. 💾 **SQLite** — Long-term persistence (milliseconds)

## 📦 Installation

```bash
npm install three-state-counter
```

**Zero native dependencies.** Works everywhere Node.js runs.

## 🎯 Quick Start

### Simple Counter

```javascript
import counter from 'three-state-counter';

// Create an async counter (fastest)
const requests = await counter.setup('api_requests');

requests(); // +1
requests(); // +1
requests(); // +1

console.log(requests.value); // 3

// Always cleanup on shutdown
process.on('SIGINT', async () => {
  await counter.closeAll();
  process.exit(0);
});
```

### Custom Increment & Initial Value

```javascript
// Start at 1000, increment by 10 each time
const score = await counter.setup('game_score', 1000, 10);

score(); // 1010
score(); // 1020
score(); // 1030
```

### Decrement Counter

```javascript
// Negative jump = decrement
const credits = await counter.setup('user_credits', 100, -5);

credits(); // 95
credits(); // 90
credits(); // 85
```

## ⚡️ Sync vs Async Mode

Choose your trade-off: **safety** or **speed**.

### 🛡️ Sync Mode (Safe & Reliable)

Every write **blocks** until confirmed on disk. Zero data loss.

```javascript
const balance = await counter.setup('balance', 0, 1, 10, 'sync');
```

**Performance:** ~10,000 ops/sec  
**Data Loss Risk:** Zero (unless disk explodes)  
**Use For:**
- 💰 Payment processing
- 💳 User credits/balances  
- 📊 Financial metrics
- 🎫 License activations

### 🚀 Async Mode (Fast & Efficient)

Writes happen in background. Insanely fast. Tiny risk window.

```javascript
const views = await counter.setup('page_views', 0, 1, 10, 'async');
```

**Performance:** ~100,000 ops/sec  
**Data Loss Risk:** ~50ms window on crash  
**Use For:**
- 📈 Analytics & metrics
- 👁️ Page view counters
- 📡 API request tracking
- ⚡ Real-time events

### 📊 Performance Comparison

```
╔═══════════════════╦══════════════╦═══════════════════╗
║ Mode              ║ Operations   ║ Data Loss Risk    ║
╠═══════════════════╬══════════════╬═══════════════════╣
║ Sync Mode         ║ 10,000/sec   ║ None              ║
║ Async Mode        ║ 100,000/sec  ║ Last ~50ms        ║
║ Pure SQLite       ║ 500/sec      ║ None              ║
║ In-Memory Only    ║ 10,000,000/s ║ Everything        ║
╚═══════════════════╩══════════════╩═══════════════════╝
```

## 🎮 Complete API

### CounterManager

```javascript
import counter from 'three-state-counter';
```

#### `setup(name, initial, jump, flushEvery, mode)`

Create or retrieve a counter.

```javascript
const myCounter = await counter.setup(
  'counter_name',  // Unique identifier
  0,               // Initial value (default: 0)
  1,               // Increment amount (default: 1)
  10,              // Flush to SQLite every N ops (default: 10)
  'async'          // Mode: 'sync' or 'async' (default: 'async')
);
```

#### Counter Operations

```javascript
// Increment
myCounter();                    // Increment by jump amount
console.log(myCounter.value);   // Read current value

// Manual operations
await myCounter.flush();        // Force write to SQLite
await myCounter.reset(100);     // Reset to specific value
await myCounter.close();        // Flush and cleanup

// Manager operations
counter.list();                 // ['counter1', 'counter2', ...]
await counter.flushAll();       // Flush all counters
await counter.closeAll();       // Close all counters (important!)
```

### ThreeStateCounter (Direct Usage)

For advanced control, use the core class directly:

```javascript
import ThreeStateCounter from 'three-state-counter/core';

const counter = new ThreeStateCounter({
  dbPath: 'my-counter.db',
  logPath: 'my-counter.log',
  flushEvery: 10,
  mode: 'async'
});

await counter.init();           // Required!

counter.increment();            // +1
counter.increment(5);           // +5
counter.decrement(2);           // -2
console.log(counter.getValue()); // 4

await counter.flush();          // Persist to SQLite
await counter.close();          // Cleanup
```

## 🔥 Real-World Examples

### Express.js API Rate Limiting

```javascript
import express from 'express';
import counter from 'three-state-counter';

const app = express();
const requests = await counter.setup('api_requests', 0, 1, 100, 'async');

app.use((req, res, next) => {
  requests();
  console.log(`Total requests: ${requests.value}`);
  next();
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await counter.closeAll();
  server.close();
});
```

### Game Score System

```javascript
// Player with starting score
const playerScore = await counter.setup('player_123', 1000, 10, 50, 'sync');

// Win a match
playerScore(); // +10

// Lose points
const penalty = await counter.setup('player_123_penalty', 0, -5, 10, 'sync');
penalty(); // -5

console.log(`Score: ${playerScore.value + penalty.value}`);
```

### Analytics Dashboard

```javascript
const metrics = {
  views: await counter.setup('page_views', 0, 1, 1000, 'async'),
  clicks: await counter.setup('button_clicks', 0, 1, 1000, 'async'),
  errors: await counter.setup('errors', 0, 1, 10, 'sync') // Critical!
};

// Track events
metrics.views();
metrics.clicks();

// Dashboard endpoint
app.get('/stats', (req, res) => {
  res.json({
    views: metrics.views.value,
    clicks: metrics.clicks.value,
    errors: metrics.errors.value
  });
});
```

## 🛡️ Crash Recovery

Both modes survive crashes. Here's how:

### What Happens on Crash

```javascript
const counter = await counter.setup('test', 0, 1, 1000, 'async');

counter(); // Written to memory + log
counter(); // Written to memory + log
counter(); // Written to memory + log
// 💥 CRASH! Process dies

// --- Restart ---
const recovered = await counter.setup('test', 0, 1, 1000, 'async');
console.log(recovered.value); // 3 ✅ Recovered from log!
```

### Data Loss Scenarios

| Event | Sync Mode | Async Mode |
|-------|-----------|------------|
| Clean shutdown (`closeAll()`) | ✅ No loss | ✅ No loss |
| Process crash (`kill -9`) | ✅ No loss | ⚠️ Last ~50ms lost |
| Power failure | ✅ No loss | ⚠️ Last ~50ms + buffer lost |
| Disk corruption | ❌ Everything lost | ❌ Everything lost |

## 🎛️ Tuning Performance

### Adjust Flush Frequency

```javascript
// More frequent = safer, slower
const critical = await counter.setup('payments', 0, 1, 5, 'sync');

// Less frequent = faster, more to replay on crash  
const analytics = await counter.setup('views', 0, 1, 10000, 'async');
```

### When to Flush Manually

```javascript
const orders = await counter.setup('orders', 0, 1, 100, 'async');

// After important operations
async function processOrder() {
  orders();
  await orders.flush(); // Ensure it's saved
}
```

## ⚠️ Important Limitations

### ❌ Single Process Only

Multiple Node processes will **corrupt each other**:

```javascript
// ❌ BAD - Two processes, same counter
// process1.js
const counter = await counter.setup('shared');

// process2.js  
const counter = await counter.setup('shared'); // CORRUPT!
```

**Solution:** Use Redis/Postgres for multi-process counters.

### ❌ Not for Distributed Systems

This package is for **single-machine** applications. For multi-server:
- Use Redis
- Use Postgres with proper locking
- Use a distributed counter service

### ❌ Requires Filesystem

Cloud functions (Lambda, Cloud Run) with ephemeral storage will lose data.

**Solution:** Use managed databases or Redis in serverless environments.

## 🎯 When to Use This

### ✅ Perfect For

- Single-server Node.js applications
- Desktop/Electron apps  
- CLI tools that need persistence
- Local development/testing
- Replacing in-memory counters with persistence
- Avoiding Redis for simple use cases

### ❌ Not Suitable For

- Multi-server deployments
- Serverless/cloud functions
- Distributed systems
- When you need atomic multi-counter operations
- Already using Redis/Postgres

## 🤔 FAQ

**Q: Why not just use SQLite for everything?**  
A: Direct SQLite is ~200x slower. This gives you memory speed with SQLite safety.

**Q: Why not use Redis?**  
A: Redis requires an external service. This is pure Node.js with zero setup.

**Q: Is async mode safe enough?**  
A: For analytics/metrics, yes. For financial data, use sync mode.

**Q: What happens if I don't call `closeAll()`?**  
A: Async mode might lose the last ~50ms of operations. Always use graceful shutdown.

**Q: Can I use this in production?**  
A: Yes, but know the limitations (single-process only).

## 📚 Examples

Check out the `examples/` directory:

```bash
npm run example:basic        # Simple usage
npm run example:modes        # Sync vs Async comparison
npm run example:performance  # Benchmark tests
```

## 🧪 Testing

```bash
npm test
```

Runs 20+ unit tests covering:
- Core functionality
- Crash recovery
- Edge cases
- Concurrency
- Both sync and async modes

## 🤝 Contributing

Issues and PRs welcome! Please include tests.

## 📄 License

MIT © Yashwanth Chikki H.D.

## 🔗 Links

- **NPM:** https://www.npmjs.com/package/three-state-counter
- **GitHub:** https://github.com/yourusername/three-state-counter
- **Issues:** https://github.com/yourusername/three-state-counter/issues

---

**Made with ☕ by developers who are tired of installing Redis for simple counters.**

If this saved you time, give it a ⭐ on GitHub!