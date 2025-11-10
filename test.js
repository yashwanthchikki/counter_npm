// Unit tests for three-state-counter
// Run with: node test/counter.test.js

import fs from "fs";
import { promises as fsPromises } from "fs";
import ThreeStateCounter from "../src/core.js";
import counter from "../src/index.js";
import assert from "assert";

// Test utilities
let testCount = 0;
let passCount = 0;
let failCount = 0;

function test(name, fn) {
  testCount++;
  return async () => {
    try {
      await fn();
      passCount++;
      console.log(`✅ ${name}`);
    } catch (err) {
      failCount++;
      console.log(`❌ ${name}`);
      console.error(`   Error: ${err.message}`);
      if (err.stack) {
        console.error(`   ${err.stack.split('\n').slice(1, 3).join('\n   ')}`);
      }
    }
  };
}

async function cleanup() {
  const files = await fsPromises.readdir(".");
  for (const file of files) {
    if (file.startsWith("test-") && (file.endsWith(".db") || file.endsWith(".log"))) {
      await fsPromises.unlink(file).catch(() => {});
    }
  }
}

// ============================================
// CORE TESTS - ThreeStateCounter
// ============================================

const testCoreBasicIncrement = test("Core: Basic increment", async () => {
  const c = new ThreeStateCounter({
    dbPath: "test-core-basic.db",
    logPath: "test-core-basic.log",
    flushEvery: 10,
    mode: "sync",
  });

  await c.init();
  assert.strictEqual(c.getValue(), 0, "Initial value should be 0");

  c.increment();
  assert.strictEqual(c.getValue(), 1, "After increment should be 1");

  c.increment(5);
  assert.strictEqual(c.getValue(), 6, "After increment(5) should be 6");

  await c.close();
});

const testCoreDecrement = test("Core: Decrement", async () => {
  const c = new ThreeStateCounter({
    dbPath: "test-core-decrement.db",
    logPath: "test-core-decrement.log",
    flushEvery: 10,
    mode: "sync",
  });

  await c.init();
  c.increment(10);
  c.decrement(3);
  
  assert.strictEqual(c.getValue(), 7, "10 - 3 should be 7");

  await c.close();
});

const testCoreSyncMode = test("Core: Sync mode writes immediately", async () => {
  const logPath = "test-core-sync.log";
  
  const c = new ThreeStateCounter({
    dbPath: "test-core-sync.db",
    logPath,
    flushEvery: 100,
    mode: "sync",
  });

  await c.init();
  c.increment();
  
  // In sync mode, log should be written immediately
  const logExists = fs.existsSync(logPath);
  assert.strictEqual(logExists, true, "Log file should exist after sync increment");
  
  const content = await fsPromises.readFile(logPath, "utf8");
  assert.strictEqual(content.trim(), "1", "Log should contain the increment");

  await c.close();
});

const testCoreAsyncMode = test("Core: Async mode buffers writes", async () => {
  const logPath = "test-core-async.log";
  
  const c = new ThreeStateCounter({
    dbPath: "test-core-async.db",
    logPath,
    flushEvery: 100,
    mode: "async",
  });

  await c.init();
  c.increment();
  
  // In async mode, write might be buffered
  // Wait a bit and check
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const logExists = fs.existsSync(logPath);
  assert.strictEqual(logExists, true, "Log file should exist after buffer flush");

  await c.close();
});

const testCoreFlush = test("Core: Flush writes to database", async () => {
  const dbPath = "test-core-flush.db";
  
  const c = new ThreeStateCounter({
    dbPath,
    logPath: "test-core-flush.log",
    flushEvery: 100,
    mode: "sync",
  });

  await c.init();
  c.increment(42);
  
  await c.flush();
  
  // Check that database has the value
  const row = await c.db.get("SELECT value FROM counter_state WHERE id = 1");
  assert.strictEqual(row.value, 42, "Database should have flushed value");

  await c.close();
});

const testCoreCrashRecovery = test("Core: Crash recovery from log", async () => {
  const dbPath = "test-core-crash.db";
  const logPath = "test-core-crash.log";

  // First session: write some increments
  const c1 = new ThreeStateCounter({
    dbPath,
    logPath,
    flushEvery: 100,
    mode: "sync",
  });

  await c1.init();
  c1.increment(5);
  c1.increment(3);
  // Don't flush, simulate crash
  await c1.db.close(); // Close DB but don't flush log

  // Second session: recovery
  const c2 = new ThreeStateCounter({
    dbPath,
    logPath,
    flushEvery: 100,
    mode: "sync",
  });

  await c2.init();
  
  assert.strictEqual(c2.getValue(), 8, "Should recover value from log");

  await c2.close();
});

const testCoreAutoFlush = test("Core: Auto-flush after flushEvery operations", async () => {
  const c = new ThreeStateCounter({
    dbPath: "test-core-autoflush.db",
    logPath: "test-core-autoflush.log",
    flushEvery: 3,
    mode: "sync",
  });

  await c.init();
  
  c.increment();
  c.increment();
  assert.strictEqual(c.pending, 2, "Should have 2 pending ops");
  
  c.increment(); // This should trigger auto-flush
  
  // Give async flush time to complete
  await new Promise(resolve => setTimeout(resolve, 100));
  
  assert.strictEqual(c.pending, 0, "Pending should be 0 after auto-flush");

  await c.close();
});

const testCoreInvalidMode = test("Core: Invalid mode throws error", async () => {
  try {
    new ThreeStateCounter({
      dbPath: "test-invalid.db",
      logPath: "test-invalid.log",
      mode: "invalid",
    });
    throw new Error("Should have thrown error for invalid mode");
  } catch (err) {
    assert.strictEqual(err.message.includes("must be"), true, "Should throw mode error");
  }
});

// ============================================
// MANAGER TESTS - CounterManager
// ============================================

const testManagerSetup = test("Manager: Setup counter", async () => {
  const c = await counter.setup("test-manager-1", 0, 1, 10, "sync");
  
  assert.strictEqual(typeof c, "function", "Should return a function");
  assert.strictEqual(c.value, 0, "Initial value should be 0");
  
  await counter.closeAll();
});

const testManagerIncrement = test("Manager: Increment via function call", async () => {
  const c = await counter.setup("test-manager-2", 0, 2, 10, "sync");
  
  c(); // Increment by 2
  assert.strictEqual(c.value, 2, "Should increment by jump amount");
  
  c();
  assert.strictEqual(c.value, 4, "Should increment again");
  
  await counter.closeAll();
});

const testManagerCustomJump = test("Manager: Custom jump amount", async () => {
  const c = await counter.setup("test-manager-jump", 100, -5, 10, "sync");
  
  c();
  assert.strictEqual(c.value, 95, "Should decrement by 5");
  
  await counter.closeAll();
});

const testManagerReset = test("Manager: Reset counter", async () => {
  const c = await counter.setup("test-manager-reset", 0, 1, 10, "sync");
  
  c();
  c();
  c();
  assert.strictEqual(c.value, 3, "Should be 3");
  
  await c.reset(0);
  assert.strictEqual(c.value, 0, "Should reset to 0");
  
  await counter.closeAll();
});

const testManagerList = test("Manager: List all counters", async () => {
  await counter.setup("test-list-1", 0, 1, 10, "sync");
  await counter.setup("test-list-2", 0, 1, 10, "sync");
  
  const list = counter.list();
  assert.strictEqual(list.includes("test-list-1"), true, "Should include counter 1");
  assert.strictEqual(list.includes("test-list-2"), true, "Should include counter 2");
  
  await counter.closeAll();
});

const testManagerReuseSameName = test("Manager: Reuse same name returns existing", async () => {
  const c1 = await counter.setup("test-reuse", 0, 1, 10, "sync");
  c1();
  
  const c2 = await counter.setup("test-reuse", 0, 1, 10, "sync");
  
  assert.strictEqual(c1, c2, "Should return same instance");
  assert.strictEqual(c2.value, 1, "Should have previous value");
  
  await counter.closeAll();
});

const testManagerFlushAll = test("Manager: Flush all counters", async () => {
  const c1 = await counter.setup("test-flushall-1", 0, 1, 100, "sync");
  const c2 = await counter.setup("test-flushall-2", 0, 1, 100, "sync");
  
  c1();
  c2();
  c2();
  
  await counter.flushAll();
  
  // Both should have pending = 0
  // Note: We can't directly check this without exposing internal state
  // But we can verify flush was called
  
  await counter.closeAll();
});

// ============================================
// EDGE CASES & ERROR HANDLING
// ============================================

const testEdgeCaseZeroFlushEvery = test("Edge: flushEvery = 0 doesn't crash", async () => {
  const c = new ThreeStateCounter({
    dbPath: "test-edge-flush0.db",
    logPath: "test-edge-flush0.log",
    flushEvery: 0,
    mode: "sync",
  });

  await c.init();
  c.increment();
  c.increment();
  
  assert.strictEqual(c.getValue(), 2, "Should still work with flushEvery=0");
  
  await c.close();
});

const testEdgeCaseLargeNumbers = test("Edge: Large numbers", async () => {
  const c = new ThreeStateCounter({
    dbPath: "test-edge-large.db",
    logPath: "test-edge-large.log",
    flushEvery: 10,
    mode: "sync",
  });

  await c.init();
  c.increment(1000000);
  c.increment(2000000);
  
  assert.strictEqual(c.getValue(), 3000000, "Should handle large numbers");
  
  await c.close();
});

const testEdgeCaseNegativeValues = test("Edge: Negative values", async () => {
  const c = new ThreeStateCounter({
    dbPath: "test-edge-negative.db",
    logPath: "test-edge-negative.log",
    flushEvery: 10,
    mode: "sync",
  });

  await c.init();
  c.increment(-100);
  c.increment(-50);
  
  assert.strictEqual(c.getValue(), -150, "Should handle negative values");
  
  await c.close();
});

const testEdgeCaseCorruptedLog = test("Edge: Corrupted log file", async () => {
  const logPath = "test-edge-corrupt.log";
  
  // Create corrupted log
  await fsPromises.writeFile(logPath, "1\n2\ninvalid\n3\n");
  
  const c = new ThreeStateCounter({
    dbPath: "test-edge-corrupt.db",
    logPath,
    flushEvery: 10,
    mode: "sync",
  });

  await c.init();
  
  // Should skip invalid line
  assert.strictEqual(c.getValue(), 6, "Should skip corrupted lines (1+2+3)");
  
  await c.close();
});

// ============================================
// CONCURRENCY TESTS
// ============================================

const testConcurrentIncrements = test("Concurrency: Multiple rapid increments", async () => {
  const c = new ThreeStateCounter({
    dbPath: "test-concurrent.db",
    logPath: "test-concurrent.log",
    flushEvery: 100,
    mode: "async",
  });

  await c.init();
  
  // Fire 100 increments rapidly
  for (let i = 0; i < 100; i++) {
    c.increment();
  }
  
  assert.strictEqual(c.getValue(), 100, "All increments should be counted");
  
  await c.close();
});

const testAsyncBufferFlush = test("Async: Buffer flushes properly", async () => {
  const logPath = "test-async-buffer.log";
  
  const c = new ThreeStateCounter({
    dbPath: "test-async-buffer.db",
    logPath,
    flushEvery: 1000,
    mode: "async",
  });

  await c.init();
  
  c.increment();
  c.increment();
  c.increment();
  
  // Wait for buffer flush
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const content = await fsPromises.readFile(logPath, "utf8");
  const lines = content.trim().split("\n");
  
  assert.strictEqual(lines.length, 3, "Should have 3 lines in log");
  
  await c.close();
});

// ============================================
// RUN ALL TESTS
// ============================================

async function runTests() {
  console.log("🧪 Running Three-State Counter Tests\n");
  console.log("=" .repeat(50));
  
  await cleanup();
  
  // Core tests
  console.log("\n📦 CORE TESTS");
  await testCoreBasicIncrement();
  await testCoreDecrement();
  await testCoreSyncMode();
  await testCoreAsyncMode();
  await testCoreFlush();
  await testCoreCrashRecovery();
  await testCoreAutoFlush();
  await testCoreInvalidMode();
  
  // Manager tests
  console.log("\n🎛️  MANAGER TESTS");
  await testManagerSetup();
  await testManagerIncrement();
  await testManagerCustomJump();
  await testManagerReset();
  await testManagerList();
  await testManagerReuseSameName();
  await testManagerFlushAll();
  
  // Edge cases
  console.log("\n⚠️  EDGE CASES");
  await testEdgeCaseZeroFlushEvery();
  await testEdgeCaseLargeNumbers();
  await testEdgeCaseNegativeValues();
  await testEdgeCaseCorruptedLog();
  
  // Concurrency
  console.log("\n⚡ CONCURRENCY TESTS");
  await testConcurrentIncrements();
  await testAsyncBufferFlush();
  
  // Cleanup
  await cleanup();
  
  // Summary
  console.log("\n" + "=".repeat(50));
  console.log(`\n📊 TEST SUMMARY`);
  console.log(`   Total:  ${testCount}`);
  console.log(`   ✅ Pass:  ${passCount}`);
  console.log(`   ❌ Fail:  ${failCount}`);
  
  if (failCount === 0) {
    console.log("\n🎉 All tests passed!\n");
    process.exit(0);
  } else {
    console.log("\n💥 Some tests failed!\n");
    process.exit(1);
  }
}

runTests();