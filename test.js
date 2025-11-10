import ThreeStateCounter from "./core.js";

async function main() {
  const counter = new ThreeStateCounter({
    dbPath: "counter.db",
    logPath: "counter.log",
    flushEvery: 5,
  });

  await counter.init(); // <-- required now!

  counter.increment();
  counter.increment(2);
  console.log("Value:", counter.getValue());

  await counter.flush();
  await counter.close();
}

main();
