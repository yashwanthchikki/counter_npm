// Fixed test file for three-state-counter
// Save this as: test/counter.test.js

import ThreeStateCounter from "../src/core.js";
import counter from "../src/index.js";
import assert from "assert";
import fs from "fs";
import { promises as fsPromises } from "fs";

console.log("🧪 Running Three-State Counter Tests\n");

let passCount = 0;
let failCount = 0;

async function test(name, fn) {
  try {
    await fn();
    passCount++;
    console.log(`✅ ${name}`);
  } catch (err) {
    failCount++;
    console.log(`❌ ${name}`);
    console.error(`   Error: ${err.message}`);
  }
}

// Helper to clean up files
async function cleanup() {
  const files = await fsPromises.readdir(".");
  for (const file of files) {
    if (file.startsWith("test-") && (file.endsWith(".db") || file.endsWith(".log"))) {
      try {
        await fsPromises.unlink(file);
      } catch (e) {}
    }
  }
}

console.log("📦 CORE TESTS");

// Test 1: Basic increment
await test("Core: Basic increment", async () => {
  const c = new ThreeStateCounter({
    dbPath: "test-basic-1.db",
    logPath: "test-basic-1.log",
    flushEvery: 10,
    mode: "sync",
  });

  await c.init();
  c.increment();
  assert.strictEqual(c.getValue(), 1);
  c.increment(5);
  assert.strictEqual(c.getValue(), 6);
  await c.close();
});

// Test 2: Decrement
await test("Core: Decrement", async () => {
  const c = new ThreeStateCounter({
    dbPath: "test-dec-2.db",
    logPath: "test-dec-2.log",
    flushEvery: 10,
    mode: "sync",
  });

  await c.init();
  c.increment(10);
  c.decrement(3);
  assert.strictEqual(c.getValue(), 7);
  await c.close();
});

// Test 3: Sync mode writes immediately
await test("Core: Sync mode writes immediately", async () => {
  const logPath = "test-sync-3.log";
  
  const c = new ThreeStateCounter({
    dbPath: "test-sync-3.db",
    logPath,
    flushEvery: 100,
    mode: "sync",
  });

  await c.init();
  c.increment();
  
  const logExists = fs.existsSync(logPath);
  assert.strictEqual(logExists, true);
  
  const content = await fsPromises.readFile(logPath, "utf8");
  assert.strictEqual(content.trim(), "1");

  await c.close();
});

// Test 4: Flush to database
await test("Core: Flush to database", async () => {
  const c = new ThreeStateCounter({
    dbPath: "test-flush-4.db",
    logPath: "test-flush-4.log",
    flushEvery: 100,
    mode: "sync",
  });

  await c.init();
  c.increment(42);
  await c.flush();
  
  const row = await c.db.get("SELECT value FROM counter_state WHERE id = 1");
  assert.strictEqual(row.value, 42);
  await c.close();
});

// Test 5: Crash recovery
await test("Core: Crash recovery from log", async () => {
  const dbPath = "test-crash-5.db";
  const logPath = "test-crash-5.log";

  // Session 1
  const c1 = new ThreeStateCounter({ dbPath, logPath, flushEvery: 100, mode: "sync" });
  await c1.init();
  c1.increment(5);
  c1.increment(3);
  await c1.db.close();

  // Session 2
  const c2 = new ThreeStateCounter({ dbPath, logPath, flushEvery: 100, mode: "sync" });
  await c2.init();
  assert.strictEqual(c2.getValue(), 8);
  await c2.close();
});

// Test 6: Auto-flush
await test("Core: Auto-flush after flushEvery", async () => {
  const c = new ThreeStateCounter({
    dbPath: "test-autoflush-6.db",
    logPath: "test-autoflush-6.log",
    flushEvery: 3,
    mode: "sync",
  });

  await c.init();
  
  c.increment();
  c.increment();
  assert.strictEqual(c.pending, 2);
  
  c.increment();
  
  await new Promise(resolve => setTimeout(resolve, 100));
  assert.strictEqual(c.pending, 0);

  await c.close();
});

console.log("\n🎛️  MANAGER TESTS");

// Test 7: Manager setup
await test("Manager: Setup counter", async () => {
  const c = await counter.setup("test-mgr-7", 0, 1, 10, "sync");
  assert.strictEqual(typeof c, "function");
  assert.strictEqual(c.value, 0);
  await counter.closeAll();
});

// Test 8: Manager increment
await test("Manager: Increment via function", async () => {
  const c = await counter.setup("test-mgr-8", 0, 2, 10, "sync");
  c();
  assert.strictEqual(c.value, 2);
  c();
  assert.strictEqual(c.value, 4);
  await counter.closeAll();
});

// Test 9: Custom jump
await test("Manager: Custom jump amount", async () => {
  const c = await counter.setup("test-mgr-9", 100, -5, 10, "sync");
  c();
  assert.strictEqual(c.value, 95);
  await counter.closeAll();
});

// Test 10: Reset
await test("Manager: Reset counter", async () => {
  const c = await counter.setup("test-mgr-10", 0, 1, 10, "sync");
  c();
  c();
  c();
  assert.strictEqual(c.value, 3);
  
  await c.reset(0);
  assert.strictEqual(c.value, 0);
  await counter.closeAll();
});

// Test 11: List counters
await test("Manager: List all counters", async () => {
  await counter.setup("test-list-a", 0, 1, 10, "sync");
  await counter.setup("test-list-b", 0, 1, 10, "sync");
  
  const list = counter.list();
  assert.strictEqual(list.includes("test-list-a"), true);
  assert.strictEqual(list.includes("test-list-b"), true);
  
  await counter.closeAll();
});

// Test 12: Reuse same name
await test("Manager: Reuse name returns existing", async () => {
  const c1 = await counter.setup("test-reuse-12", 0, 1, 10, "sync");
  c1();
  
  const c2 = await counter.setup("test-reuse-12", 0, 1, 10, "sync");
  
  assert.strictEqual(c1, c2);
  assert.strictEqual(c2.value, 1);
  await counter.closeAll();
});

// Test 13: Flush all
await test("Manager: Flush all counters", async () => {
  const c1 = await counter.setup("test-flush-a", 0, 1, 100, "sync");
  const c2 = await counter.setup("test-flush-b", 0, 1, 100, "sync");
  
  c1();
  c2();
  c2();
  
  await counter.flushAll();
  await counter.closeAll();
});

console.log("\n⚠️  EDGE CASES");

// Test 14: Zero flushEvery
await test("Edge: flushEvery = 0 works", async () => {
  const c = new ThreeStateCounter({
    dbPath: "test-edge-14.db",
    logPath: "test-edge-14.log",
    flushEvery: 0,
    mode: "sync",
  });

  await c.init();
  c.increment();
  c.increment();
  assert.strictEqual(c.getValue(), 2);
  await c.close();
});

// Test 15: Large numbers
await test("Edge: Large numbers", async () => {
  const c = new ThreeStateCounter({
    dbPath: "test-edge-15.db",
    logPath: "test-edge-15.log",
    flushEvery: 10,
    mode: "sync",
  });

  await c.init();
  c.increment(1000000);
  c.increment(2000000);
  assert.strictEqual(c.getValue(), 3000000);
  await c.close();
});

// Test 16: Negative values
await test("Edge: Negative values", async () => {
  const c = new ThreeStateCounter({
    dbPath: "test-edge-16.db",
    logPath: "test-edge-16.log",
    flushEvery: 10,
    mode: "sync",
  });

  await c.init();
  c.increment(-100);
  c.increment(-50);
  assert.strictEqual(c.getValue(), -150);
  await c.close();
});

// Test 17: Corrupted log
await test("Edge: Corrupted log file", async () => {
  const logPath = "test-edge-17.log";
  await fsPromises.writeFile(logPath, "1\n2\ninvalid\n3\n");
  
  const c = new ThreeStateCounter({
    dbPath: "test-edge-17.db",
    logPath,
    flushEvery: 10,
    mode: "sync",
  });

  await c.init();
  assert.strictEqual(c.getValue(), 6);
  await c.close();
});

console.log("\n⚡ CONCURRENCY TESTS");

// Test 18: Rapid increments
await test("Concurrency: Multiple rapid increments", async () => {
  const c = new ThreeStateCounter({
    dbPath: "test-concurrent-18.db",
    logPath: "test-concurrent-18.log",
    flushEvery: 100,
    mode: "async",
  });

  await c.init();
  
  for (let i = 0; i < 100; i++) {
    c.increment();
  }
  
  assert.strictEqual(c.getValue(), 100);
  await c.close();
});

// Test 19: Async buffer flush
await test("Async: Buffer flushes properly", async () => {
  const logPath = "test-async-19.log";
  
  const c = new ThreeStateCounter({
    dbPath: "test-async-19.db",
    logPath,
    flushEvery: 1000,
    mode: "async",
  });

  await c.init();
  
  c.increment();
  c.increment();
  c.increment();
  
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const content = await fsPromises.readFile(logPath, "utf8");
  const lines = content.trim().split("\n");
  
  assert.strictEqual(lines.length, 3);
  await c.close();
});

// Cleanup
console.log("\nCleaning up test files...");
await cleanup();

// Summary
console.log("\n" + "=".repeat(50));
console.log(`\n📊 TEST SUMMARY`);
console.log(`   Total:  ${passCount + failCount}`);
console.log(`   ✅ Pass:  ${passCount}`);
console.log(`   ❌ Fail:  ${failCount}`);

if (failCount === 0) {
  console.log("\n🎉 All tests passed!\n");
  process.exit(0);
} else {
  console.log("\n💥 Some tests failed!\n");
  process.exit(1);
}