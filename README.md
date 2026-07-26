# Patchani

Engineering assistant for Pi Dev.

## Install

```bash
pi install npm:patchani
```

## What It Does

**Persona:** Ask-before-acting discipline, fact-checking, direct communication.

**Design Docs:** Invoke `/design-doc <topic>` - researches GitHub/codebase/web in parallel, validates claims, section-by-section approval.

**Standup Sync:** Auto-runs on session start - syncs GitHub (issues/PRs/projects) → Apple Reminders.

## Commands

- `/design-doc <topic>` - Start design document
- `/standup` - Manual sync
- `/standup-todo <text>` - Quick add to Patchani ToDo

## Requirements

- macOS (Apple Reminders)
- GitHub CLI (`gh`) authenticated
- Git repository (for standup)

## Docs

- `persona/patchani.md` - Persona definition
- `CHANGELOG.md` - Version history
