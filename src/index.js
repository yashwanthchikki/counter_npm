import ThreeStateCounter from "./core.js";

class CounterManager {
  constructor() {
    this.registry = {};
    this.instances = {}; // Store the actual counter instances
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
      dbPath: `${name}.db`, // Unique DB per counter!
      logPath: `${name}.log`,
      flushEvery,
      mode,
    });

    // CRITICAL: Initialize async
    await counterInstance.init();
    
    // Set initial value after loading state
    // Only override if the loaded state is 0 and we want a different initial value
    if (counterInstance.value === 0 && initial !== 0) {
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

    fn.flush = async () => {
      if (counterInstance.db && counterInstance.db.open) {
        await counterInstance.flush();
      }
    };
    
    fn.reset = async (val = 0) => {
      counterInstance.value = val;
      if (counterInstance.db && counterInstance.db.open) {
        await counterInstance.flush();
      }
    };
    
    fn.close = async () => {
      if (counterInstance.db && counterInstance.db.open) {
        await counterInstance.close();
      }
    };

    this.registry[name] = fn;
    this.instances[name] = counterInstance; // Store instance reference
    this[name] = fn;

    return fn;
  }

  list() {
    return Object.keys(this.registry);
  }

  async flushAll() {
    const flushPromises = [];
    for (const [name, instance] of Object.entries(this.instances)) {
      if (instance && instance.db && instance.db.open) {
        flushPromises.push(instance.flush().catch(err => {
          console.error(`Error flushing ${name}:`, err.message);
        }));
      }
    }
    await Promise.all(flushPromises);
  }

  async closeAll() {
    const closePromises = [];
    for (const [name, instance] of Object.entries(this.instances)) {
      if (instance && instance.db && instance.db.open) {
        closePromises.push(instance.close().catch(err => {
          console.error(`Error closing ${name}:`, err.message);
        }));
      }
    }
    await Promise.all(closePromises);
    
    // Clear registries
    this.registry = {};
    this.instances = {};
  }
}

export default new CounterManager();