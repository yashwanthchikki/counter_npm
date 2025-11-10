import ThreeStateCounter from "./core.js";

class CounterManager {
  constructor() {
    this.registry = {};
  }

  /**
   * Setup a new counter.
   * @param {string} name - Unique name for the counter.
   * @param {number} [initial=0] - Starting value.
   * @param {number} [jump=1] - Increment amount.
   * @param {number} [flushEvery=10] - Number of ops before flush to SQLite.
   * @param {string} [mode="async"] - "sync" (blocking, safer) or "async" (parallel, faster).
   */
  async setup(name, initial = 0, jump = 1, flushEvery = 10, mode = "async") {
    if (this.registry[name]) return this.registry[name];

    const counterInstance = new ThreeStateCounter({
      dbPath: "counter.db",
      logPath: `${name}.log`,
      flushEvery,
      mode,
    });

    // CRITICAL: Initialize async
    await counterInstance.init();
    
    // Set initial value after loading state
    if (initial !== 0) {
      counterInstance.value = initial;
      await counterInstance.flush();
    }

    // Define callable function
    const fn = () => {
      counterInstance.increment(jump);
      return counterInstance.value;
    };

    Object.defineProperty(fn, "value", {
      get() {
        return counterInstance.value;
      },
    });

    fn.flush = async () => await counterInstance.flush();
    fn.reset = async (val = 0) => {
      counterInstance.value = val;
      await counterInstance.flush();
    };
    fn.close = async () => await counterInstance.close();

    this.registry[name] = fn;
    this[name] = fn;

    return fn;
  }

  list() {
    return Object.keys(this.registry);
  }

  async flushAll() {
    await Promise.all(
      Object.values(this.registry).map((fn) => fn.flush())
    );
  }

  async closeAll() {
    await Promise.all(
      Object.values(this.registry).map((fn) => fn.close())
    );
  }
}

export default new CounterManager();