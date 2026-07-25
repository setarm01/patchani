# Post-Mortem: Patchani Installation Issue

## What Happened

When you tried to install patchani, it failed and appeared to remove an existing extension.

## Root Causes

### 1. **Bundled Dependencies Don't Work with Git Installation**

**Problem:**
```json
"bundledDependencies": ["@quintinshaw/pi-dynamic-workflows"]
```

- `bundledDependencies` only works for npm tarballs
- Git clones run `npm install` which fetches dependencies normally
- This created conflicts with the globally-installed workflows package

### 2. **Nested Extension References**

**Problem:**
```json
"pi": {
  "extensions": [
    "extensions/persona.ts",
    "node_modules/@quintinshaw/pi-dynamic-workflows/extensions"
  ]
}
```

- Referenced workflows extensions through `node_modules/`
- Created duplicate loading since workflows was already installed globally
- Could fail if `npm install` hadn't run yet in the package

### 3. **Settings Array Behavior**

**Not Actually the Problem:**
- Pi doesn't replace the entire settings when installing packages
- Your existing extensions in `~/.pi/agent/extensions/` should still load
- The `"extensions": []` in settings only affects *standalone* extension paths
- Package extensions load through the `packages` array

### 4. **Installation Failures Were Silent**

- No clear error message about missing prerequisites
- No validation that workflows was already installed
- Installation could partially succeed and leave broken state

## The Fix

### 1. **Move Workflows to Peer Dependency**

**Before:**
```json
"dependencies": {
  "@quintinshaw/pi-dynamic-workflows": "^3.4.1"
},
"bundledDependencies": ["@quintinshaw/pi-dynamic-workflows"]
```

**After:**
```json
"dependencies": {},
"peerDependencies": {
  "@quintinshaw/pi-dynamic-workflows": "^3.4.1"
}
```

**Result:**
- Users must install workflows separately first
- No duplicate installations
- No bundling conflicts

### 2. **Remove Nested Extension References**

**Before:**
```json
"pi": {
  "extensions": [
    "extensions/persona.ts",
    "node_modules/@quintinshaw/pi-dynamic-workflows/extensions"
  ]
}
```

**After:**
```json
"pi": {
  "extensions": [
    "extensions/persona.ts",
    "extensions/enforcement.ts",
    "extensions/design-doc.ts",
    "extensions/standup-sync.ts"
  ]
}
```

**Result:**
- Patchani only registers its own extensions
- Workflows extensions load independently from the workflows package
- No duplicate or conflicting registrations

### 3. **Add Prerequisite Check**

**New:**
- `scripts/check-prerequisites.js` - Validates workflows is installed
- `postinstall` hook runs automatically after `npm install`
- Clear error message if prerequisite is missing

### 4. **Documentation**

**New:**
- `INSTALL.md` - Detailed installation guide
- Prerequisites clearly listed first
- Troubleshooting section
- Explains the two-step installation

## Correct Installation Flow

### Step 1: Install Workflows (Prerequisite)
```bash
pi install npm:@quintinshaw/pi-dynamic-workflows
```

This installs workflows globally at:
- `~/.pi/agent/npm/node_modules/@quintinshaw/pi-dynamic-workflows/`
- Registers workflows extensions and skills
- Adds to `settings.json` packages array

### Step 2: Install Patchani
```bash
pi install git:github.com/setarm01/patchani
```

This:
- Clones repo to `~/.pi/agent/git/github.com/setarm01/patchani/`
- Runs `npm install` (no dependencies to install now)
- Runs postinstall check (verifies workflows is installed)
- Registers patchani's 4 extensions
- Adds to `settings.json` packages array

### Final State

**`~/.pi/agent/settings.json`:**
```json
{
  "packages": [
    "npm:@quintinshaw/pi-dynamic-workflows",
    "git:github.com/setarm01/patchani"
  ]
}
```

**Extensions loaded:**
- ✅ All your existing extensions from `~/.pi/agent/extensions/`
- ✅ Workflows extensions from workflows package
- ✅ Patchani extensions from patchani package
- ✅ NO conflicts, NO duplicates

## Why Your Existing Extensions "Disappeared"

They didn't actually disappear! Here's what likely happened:

1. Installation failed mid-way
2. Settings might have been corrupted
3. Extensions were still on disk at `~/.pi/agent/extensions/`
4. But Pi couldn't load them due to bad settings state

**Solution:**
- After installing patchani correctly, existing extensions will work
- They load automatically from the extensions directory
- No manual configuration needed

## Testing the Fix

```bash
# 1. Install workflows
pi install npm:@quintinshaw/pi-dynamic-workflows

# 2. Install patchani
pi install git:github.com/setarm01/patchani

# 3. Restart pi
exit
pi

# 4. Verify all extensions loaded
/help  # Should show patchani commands AND your existing extensions
```

## Lessons Learned

### For Pi Package Authors:

1. **Don't bundle other pi packages** - Use `peerDependencies`
2. **Don't reference node_modules in pi manifest** - Let packages load independently
3. **Add prerequisite validation** - postinstall checks
4. **Document installation order** - Clear prerequisites section
5. **Test with clean Pi installation** - Catch conflicts early

### For Pi Core (Potential Improvements):

1. **Validate peer dependencies on install** - Warn before installation
2. **Better error messages** - Show which prerequisites are missing
3. **Settings backup/restore** - Auto-backup before package operations
4. **Dry-run mode** - Test installation without committing changes
