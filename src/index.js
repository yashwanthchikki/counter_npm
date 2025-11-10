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
   */
  setup(name, initial = 0, jump = 1, flushEvery = 10) {
    if (this.registry[name]) return this.registry[name];

    const counterInstance = new ThreeStateCounter({
      dbPath: "counter.db",
      logPath: `${name}.log`,
      flushEvery,
    });

    counterInstance.value = initial;

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

    fn.flush = () => counterInstance.flush();
    fn.reset = (val = 0) => {
      counterInstance.value = val;
      counterInstance.flush();
    };

    this.registry[name] = fn;
    this[name] = fn;

    return fn;
  }

  list() {
    return Object.keys(this.registry);
  }

  flushAll() {
    for (const fn of Object.values(this.registry)) fn.flush();
  }

  closeAll() {
    for (const fn of Object.values(this.registry)) fn.flush();
  }
}

export default new CounterManager();
