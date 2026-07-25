# Installation Guide

## Prerequisites

Patchani requires the Pi Dynamic Workflows package. Install it first:

```bash
pi install npm:@quintinshaw/pi-dynamic-workflows
```

Verify it's installed:

```bash
pi list
```

You should see `npm:@quintinshaw/pi-dynamic-workflows` in the packages list.

## Install Patchani

```bash
pi install git:github.com/setarm01/patchani
```

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

4. Verify workflows package is installed:
   ```bash
   pi list | grep workflows
   ```

### Missing Workflows Package

If you see a warning about missing prerequisites:

```bash
pi install npm:@quintinshaw/pi-dynamic-workflows
```

Then restart Pi.

### Existing Extensions Disappeared

Patchani should NOT affect your existing extensions. They should remain in `~/.pi/agent/extensions/` and continue loading.

If extensions are missing, check:

```bash
ls -la ~/.pi/agent/extensions/
```

All your `.ts` files should still be there. If they are but not loading, your `settings.json` might have been corrupted. You can restore by manually editing:

```json
{
  "packages": [
    "npm:@quintinshaw/pi-dynamic-workflows",
    "git:github.com/setarm01/patchani"
  ]
}
```

## Uninstall

```bash
pi remove git:github.com/setarm01/patchani
```

This removes patchani but keeps the workflows package (other packages might use it).

To remove workflows too:

```bash
pi remove npm:@quintinshaw/pi-dynamic-workflows
```
