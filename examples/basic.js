// Basic usage examples for three-state-counter

import counter from "../src/index.js";

async function basicExample() {
  console.log("=== Basic Counter Usage ===\n");

  // Create a simple page view counter
  const pageViews = await counter.setup("pageviews", 0, 1, 10, "async");

  // Increment it
  pageViews();
  pageViews();
  pageViews();

  console.log("Page views:", pageViews.value); // 3

  // Manual flush to SQLite
  await pageViews.flush();

  // Reset counter
  await pageViews.reset(100);
  console.log("After reset:", pageViews.value); // 100

  await counter.closeAll();
}

async function multipleCounters() {
  console.log("\n=== Multiple Counters ===\n");

  // Create different counters
  const requests = await counter.setup("api_requests", 0, 1, 100, "async");
  const errors = await counter.setup("api_errors", 0, 1, 10, "sync");

  // Use them
  requests();
  requests();
  requests();

  errors();

  console.log("API Requests:", requests.value); // 3
  console.log("API Errors:", errors.value);     // 1

  // List all counters
  console.log("All counters:", counter.list());

  await counter.closeAll();
}

async function customJump() {
  console.log("\n=== Custom Increment Amount ===\n");

  // Decrement by 5 each time (negative jump)
  const credits = await counter.setup("user_credits", 100, -5, 10, "sync");

  credits(); // -5
  credits(); // -5
  credits(); // -5

  console.log("Credits remaining:", credits.value); // 85

  await counter.closeAll();
}

async function main() {
  await basicExample();
  await multipleCounters();
  await customJump();
}

main().catch(console.error);