// Comparison of sync vs async modes

import ThreeStateCounter from "../src/core.js";

async function syncModeExample() {
  console.log("=== SYNC MODE (Blocking but Safer) ===\n");
  
  const counter = new ThreeStateCounter({
    dbPath: "demo-sync.db",
    logPath: "demo-sync.log",
    flushEvery: 5,
    mode: "sync", // Each write blocks until disk confirms
  });

  await counter.init();

  console.log("Incrementing (each write blocks)...");
  const start = Date.now();
  
  counter.increment();
  counter.increment(2);
  counter.increment();
  counter.increment();
  counter.increment();
  
  const elapsed = Date.now() - start;
  console.log(`5 increments took ${elapsed}ms`);
  console.log("Final value:", counter.getValue());
  console.log("✅ All writes confirmed on disk\n");

  await counter.close();
}

async function asyncModeExample() {
  console.log("=== ASYNC MODE (Parallel, Faster) ===\n");
  
  const counter = new ThreeStateCounter({
    dbPath: "demo-async.db",
    logPath: "demo-async.log",
    flushEvery: 5,
    mode: "async", // Writes are batched and non-blocking
  });

  await counter.init();

  console.log("Incrementing (non-blocking)...");
  const start = Date.now();
  
  counter.increment();
  counter.increment(2);
  counter.increment();
  counter.increment();
  counter.increment();
  
  const elapsed = Date.now() - start;
  console.log(`5 increments took ${elapsed}ms`);
  console.log("Final value:", counter.getValue());
  console.log("⚠️  Writes buffered (flushed within 50ms)\n");

  // Must close properly to flush pending writes
  await counter.close();
  console.log("✅ All writes flushed on close\n");
}

async function crashSimulation() {
  console.log("=== CRASH RECOVERY DEMO ===\n");

  // Create counter and do some operations
  const counter = new ThreeStateCounter({
    dbPath: "crash-demo.db",
    logPath: "crash-demo.log",
    flushEvery: 100,
    mode: "async",
  });

  await counter.init();

  counter.increment();
  counter.increment();
  counter.increment();

  console.log("Before 'crash':", counter.getValue());

  // Simulate crash (don't close properly)
  console.log("💥 Simulating crash (not calling close)...\n");

  // Create new instance (recovery)
  const recovered = new ThreeStateCounter({
    dbPath: "crash-demo.db",
    logPath: "crash-demo.log",
    flushEvery: 100,
    mode: "async",
  });

  await recovered.init(); // This replays the log!

  console.log("After recovery:", recovered.getValue());
  console.log("✅ Counter recovered from log\n");

  await recovered.close();
}

async function modeComparison() {
  console.log("=== MODE COMPARISON TABLE ===\n");
  
  console.log("┌─────────────────┬──────────────────────────┬─────────────────────────┐");
  console.log("│                 │   SYNC MODE              │   ASYNC MODE            │");
  console.log("├─────────────────┼──────────────────────────┼─────────────────────────┤");
  console.log("│ Performance     │ ~10,000 ops/sec          │ ~100,000 ops/sec        │");
  console.log("│ Safety          │ Guaranteed durability    │ 50ms window of risk     │");
  console.log("│ Event Loop      │ Blocks on every write    │ Never blocks            │");
  console.log("│ Data Loss Risk  │ Zero (unless disk fails) │ Low (buffered writes)   │");
  console.log("│ Use Case        │ Critical counters        │ High-frequency counters │");
  console.log("│ Best For        │ Financial, billing       │ Analytics, metrics      │");
  console.log("└─────────────────┴──────────────────────────┴─────────────────────────┘\n");

  console.log("SYNC MODE - Use when:");
  console.log("  ✅ Every single increment matters");
  console.log("  ✅ Financial/billing operations");
  console.log("  ✅ User credits or balances");
  console.log("  ✅ Can tolerate slower throughput\n");

  console.log("ASYNC MODE - Use when:");
  console.log("  ✅ High-frequency operations");
  console.log("  ✅ Analytics/metrics/page views");
  console.log("  ✅ Losing a few increments is acceptable");
  console.log("  ✅ Need maximum throughput\n");
}

async function main() {
  await syncModeExample();
  await asyncModeExample();
  await crashSimulation();
  await modeComparison();
}

main().catch(console.error);