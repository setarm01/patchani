# Installation Guide

## Quick Install

```bash
pi install git:github.com/setarm01/patchani
```

That's it! Pi will automatically:
1. Clone the repository
2. Install dependencies (including workflows)
3. Register extensions and skills

Or install a specific version:

```bash
pi install git:github.com/setarm01/patchani@v0.1.0
```

## Verify Installation

After installation, restart Pi:

```bash
exit  # if in pi session
pi
```

You should see the Patchani welcome screen on startup.

Check that extensions loaded:

```bash
/help
```

Look for patchani commands like `/design-doc`, `/standup-sync`.

## Troubleshooting

### Extensions Not Loading

If patchani extensions don't appear:

1. Check settings:
   ```bash
   cat ~/.pi/agent/settings.json | grep patchani
   ```

2. Verify the package is listed:
   ```bash
   pi list
   ```

3. Check the cloned repository exists:
   ```bash
   ls -la ~/.pi/agent/git/github.com/setarm01/patchani/
   ```

4. Verify dependencies were installed:
   ```bash
   ls -la ~/.pi/agent/git/github.com/setarm01/patchani/node_modules/@quintinshaw/
   ```

5. If dependencies are missing, reinstall them:
   ```bash
   cd ~/.pi/agent/git/github.com/setarm01/patchani/
   npm install
   ```

### Existing Extensions Disappeared

Patchani should NOT affect your existing extensions. They should remain in `~/.pi/agent/extensions/` and continue loading.

If extensions are missing, check:

```bash
ls -la ~/.pi/agent/extensions/
```

All your `.ts` files should still be there. Patchani installation should NOT affect existing extensions.

## Uninstall

```bash
pi remove git:github.com/setarm01/patchani
```

This removes patchani and its dependencies from the cloned package directory.
