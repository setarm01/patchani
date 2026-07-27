# Testing Guide

## Quick Reference

```bash
npm test              # Unit tests only (fast)
npm run test:all      # Full suite before commit/publish
npm run test:watch    # TDD mode
npm run preview-tui   # Interactive TUI preview
npm run test-tui      # Automated TUI tests
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

### 2. TUI Preview & Testing

**Interactive Preview:** `npm run preview-tui`

**What:** Standalone TUI component viewer for visual validation

**Features:**
- Live preview of all TUI components
- Navigate between screens (←/→ arrow keys)
- See actual rendering with theme colors
- Test interactions without launching Pi

**Previews:**
- Work Selector (issue/PR picker)
- Complexity Router (design doc gate)
- Design Decision Prompt
- Activation Banner

### 3. Type Check

**What:** Verify TypeScript compilation

**Run:** `npm run typecheck`

**Command:** `tsc --noEmit`

### 4. Smoke Tests

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

## TUI Development Workflow

1. **Edit component** in `extensions/*.ts`
2. **Preview live** with `npm run preview-tui`
4. **Test in Pi** by launching new session

**Why standalone preview?**
- Fast feedback loop (no Pi restart)
- Visual validation of all states
- Easy to test edge cases
- No need for mock data setup

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

### TUI preview shows wrong colors
→ Check theme object in preview script
→ Verify ANSI codes match Pi theme

---

## Testing Philosophy

**Unit tests** validate logic with mocks  
**TUI preview** validates visual design interactively  
**Smoke tests** validate the shipped package

Together they catch:
- Logic bugs (unit)
- Type errors (typecheck)
- Missing dependencies (smoke)
- Package issues (smoke)
