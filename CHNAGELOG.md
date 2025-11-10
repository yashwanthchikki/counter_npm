# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2024-11-10

### Added
- **Sync/Async Modes**: Users can now choose between `sync` (blocking but guaranteed safe) and `async` (non-blocking, high-performance) modes
- **Async Write Buffering**: Async mode batches writes for significantly better performance (~10x faster)
- **Improved Error Handling**: Better error messages and recovery for file system operations
- **Comprehensive Examples**: Added `examples/` directory with basic usage, mode comparison, and performance benchmarks
- **Unit Tests**: Complete test suite with 20+ tests covering core functionality, edge cases, and concurrency
- **Better Documentation**: Extensive README with mode comparison table and use case guidance

### Changed
- **BREAKING**: `CounterManager.setup()` is now async and must be awaited
- **BREAKING**: All counter operations that interact with storage now properly handle async
- Counter initialization now properly waits for database to be ready
- Log replay is now async for better error handling

### Fixed
- Critical bug where `init()` wasn't being called in CounterManager, causing silent failures
- Race condition in async mode where rapid increments could lose data
- Missing async/await in flush operations
- Improper cleanup of async timers on close

### Performance
- Async mode: ~100,000 operations/second (10x faster than sync mode)
- Sync mode: ~10,000 operations/second (still 5-20x faster than direct SQLite)
- Reduced disk I/O through intelligent write batching

## [1.0.2] - 2024-11-09

### Initial Release
- Basic three-state counter (memory + log + SQLite)
- Synchronous file operations
- Basic crash recovery
- Simple API

---

## Migration Guide: 1.x → 2.0

### Before (1.x):
```javascript
const counter = counter.setup('myCounter');
counter();
```

### After (2.0):
```javascript
const counter = await counter.setup('myCounter', 0, 1, 10, 'async');
counter();
await counter.closeAll(); // Important!
```

### Key Changes:
1. `setup()` must be awaited
2. Choose mode: `'sync'` (safe) or `'async'` (fast)
3. Always call `closeAll()` on shutdown (especially in async mode)
4. Import paths unchanged