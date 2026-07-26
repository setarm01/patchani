# Testing Guide

## Quick Reference

```bash
npm test              # Unit tests only (fast)
npm run test:all      # Full suite before commit/publish
npm run test:watch    # TDD mode
```

---

## Testing Layers

### 1. Unit Tests

**What:** Test extension logic with mocks

**Run:** `npm test` or `npm run test:unit`

**Files:** `tests/unit/*.test.ts`

**Tests:**
- Extension registration
- Hook behavior
- Command handlers
- Error cases

### 2. Type Check

**What:** Verify TypeScript compilation

**Run:** `npm run typecheck`

**Command:** `tsc --noEmit`

### 3. Smoke Tests

**What:** Test the installed package as users will experience it

**Run:** `npm run test:smoke`

**File:** `tests/integration/smoke.sh`

**Process:**
1. `npm pack` - Create distribution tarball
2. Install in isolated directory
3. Verify package structure
4. Check dependencies
5. Test with `pi install patchani` flow
6. Run `pi` (extensions auto-load via package.json)

**Why install in isolation?**
- Catches missing dependencies
- Validates .npmignore
- Tests real user experience
- No hoisting from dev environment

---

## Before Publishing

```bash
npm run test:all
```

Runs automatically via `prepublishOnly` hook:
- ✓ TypeScript compiles
- ✓ Unit tests pass
- ✓ Package installs correctly
- ✓ Extensions load in Pi

---

## Adding New Extensions

1. Create extension in `extensions/`
2. Add unit test in `tests/unit/`
3. Add to `package.json` "pi.extensions"
4. Run `npm run test:all`
5. Check `npm ls --depth=0` for issues

---

## Common Issues

### Cannot find module 'X'
→ Add to `dependencies` or `peerDependencies`

### npm ls shows "extraneous"
→ Add to package.json or remove it

### Smoke test fails, unit tests pass
→ Check .npmignore - missing files?
→ Run `npm pack --dry-run` to see contents

---

## Testing Philosophy

**Unit tests** validate logic with mocks
**Smoke tests** validate the shipped package

Together they catch:
- Logic bugs (unit)
- Type errors (typecheck)
- Missing dependencies (smoke)
- Package issues (smoke)
