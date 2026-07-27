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

**TUI Components:** Interactive work selector, complexity router, activation banner.

## Commands

- `/design-doc <topic>` - Start design document
- `/standup` - Manual sync
- `/standup-todo <text>` - Quick add to Patchani ToDo

## Development

### Testing

```bash
npm test              # Unit tests
npm run test:all      # Full test suite
```

See `docs/testing.md` for details.

## Requirements

- macOS (Apple Reminders)
- GitHub CLI (`gh`) authenticated
- Git repository (for standup)

## Docs

- [Product Design Document](docs/product-design-document.md) 
- [Testing guide](docs/testing.md) 
- [Persona definition](persona/patchani.md)
- [Version history](CHANGELOG.md)
