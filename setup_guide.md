# Setup Guide - Three State Counter

Quick guide to set up your package for development and publishing.

## 📁 Step 1: Organize Your Files

```bash
# Create directory structure
mkdir -p src examples test

# Move files to correct locations
mv core.js src/
mv index.js src/

# The artifacts I created should go here:
# - examples/basic.js
# - examples/modes.js
# - examples/performance.js
# - test/counter.test.js
```

## 📋 Step 2: Create All Required Files

Your final structure should look like:

```
three-state-counter/
├── src/
│   ├── core.js              ✅ Your implementation
│   └── index.js             ✅ CounterManager
├── examples/
│   ├── basic.js             ✅ From artifacts
│   ├── modes.js             ✅ From artifacts
│   └── performance.js       ✅ From artifacts
├── test/
│   └── counter.test.js      ✅ From artifacts
├── .gitignore               ✅ From artifacts
├── package.json             ✅ Updated version
├── README.md                ✅ From artifacts
├── LICENSE                  ✅ From artifacts
├── CHANGELOG.md             ✅ From artifacts
└── PUBLISH_CHECKLIST.md     ✅ From artifacts
```

## 🧪 Step 3: Test Everything

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run examples
npm run example:basic
npm run example:modes
npm run example:performance
```

### Expected Output:

**Tests:**
```
🧪 Running Three-State Counter Tests
✅ Core: Basic increment
✅ Core: Decrement
✅ Manager: Setup counter
...
🎉 All tests passed!
```

**Examples:**
```
=== Basic Counter Usage ===
Page views: 3
```

## 🔧 Step 4: Update package.json

Make sure these fields are correct:

```json
{
  "name": "three-state-counter",
  "version": "2.0.0",
  "repository": {
    "type": "git",
    "url": "https://github.com/YOUR_USERNAME/three-state-counter.git"
  }
}
```

Replace `YOUR_USERNAME` with your actual GitHub username!

## 📦 Step 5: Initialize Git

```bash
# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "feat: v2.0.0 - Add sync/async modes"

# Create GitHub repo (via GitHub website)
# Then push:
git remote add origin https://github.com/YOUR_USERNAME/three-state-counter.git
git branch -M main
git push -u origin main

# Tag the release
git tag v2.0.0
git push origin v2.0.0
```

## 🚀 Step 6: Publish to NPM

```bash
# Make sure you're logged in
npm login

# Check what will be published
npm publish --dry-run

# Publish!
npm publish
```

## ✅ Step 7: Verify

```bash
# Check npm
npm info three-state-counter

# Test install in new directory
cd ..
mkdir test-package
cd test-package
npm init -y
npm install three-state-counter

# Test it works
node -e "import('three-state-counter').then(c => console.log('✅ Works!'))"
```

## 🐛 Common Issues & Fixes

### Issue: "Cannot find module './src/index.js'"
**Fix:** Check your `package.json` has `"main": "src/index.js"`

### Issue: "Must use import to load ES Module"
**Fix:** Make sure `"type": "module"` is in package.json

### Issue: Tests fail with "Cannot find module"
**Fix:** Use correct import paths:
```javascript
import ThreeStateCounter from "../src/core.js";
import counter from "../src/index.js";
```

### Issue: Examples create .db files everywhere
**Fix:** That's expected! They're cleaned up by `.gitignore`

### Issue: "Package name already taken"
**Fix:** Add a scope: `@yourusername/three-state-counter`

## 📝 Before Publishing Checklist

- [ ] All tests pass (`npm test`)
- [ ] All examples run (`npm run example:*`)
- [ ] README is accurate
- [ ] Version number is correct
- [ ] GitHub repo is created and pushed
- [ ] No .db or .log files committed
- [ ] LICENSE file exists
- [ ] You're logged into npm (`npm whoami`)

## 🎯 Quick Commands Reference

```bash
# Development
npm test                      # Run tests
npm run example:basic         # Run basic example

# Publishing
npm version 2.0.0            # Set version
npm publish --dry-run        # Preview publish
npm publish                  # Publish for real

# Git
git add .                    # Stage files
git commit -m "message"      # Commit
git push                     # Push to GitHub
git tag v2.0.0              # Tag version
```

## 🎉 After Publishing

1. **Update README with npm badge:**
   ```markdown
   [![npm](https://img.shields.io/npm/v/three-state-counter.svg)](https://www.npmjs.com/package/three-state-counter)
   ```

2. **Share it:**
   - Reddit: r/node, r/javascript
   - Twitter/X with #nodejs hashtag
   - Dev.to article explaining the architecture

3. **Monitor:**
   - Watch for issues on GitHub
   - Check npm downloads
   - Respond to questions

---

**Need help?** Create an issue on GitHub or reach out!

Good luck! 🚀