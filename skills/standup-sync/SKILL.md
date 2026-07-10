---
name: standup-sync
description: Pull open GitHub issues, PRs, and project items assigned to me; sync them into Apple Reminders; surface any pending Patchani ToDo items.
---

# Skill: Standup Sync

## Trigger

- Run by `/patchani` on session activation
- Explicitly when the user says "sync reminders", "run standup sync", or similar

## What This Skill Does

Pulls open work from GitHub and syncs it into Apple Reminders. Provides a persistent, structured task list shared between user and Patchani — visible on Mac, iPhone, and widget.

Reminders are managed via `$HOME/.claude/skills/patchani/hooks-handlers/reminders.sh`. All Reminders operations go through that script via the Bash tool.

---

## Phase 0 — First-Run Initialisation

Before any sync, verify the four managed lists exist. Create any that are missing.

Required lists: `Issues`, `Tasks`, `PRs`, `Patchani ToDo`

```bash
bash "$HOME/.claude/skills/patchani/hooks-handlers/reminders.sh" get_lists
bash "$HOME/.claude/skills/patchani/hooks-handlers/reminders.sh" ensure_list "Issues"
bash "$HOME/.claude/skills/patchani/hooks-handlers/reminders.sh" ensure_list "Tasks"
bash "$HOME/.claude/skills/patchani/hooks-handlers/reminders.sh" ensure_list "PRs"
bash "$HOME/.claude/skills/patchani/hooks-handlers/reminders.sh" ensure_list "Patchani ToDo"
```

---

## Phase 1 — Fetch GitHub Data

Use whatever GitHub access is available — in priority order:

1. **Builtin GitHub MCP** (`github@claude-plugins-official`) — if enabled and tools are available, use them directly
2. **Any other GitHub MCP server** — if a GitHub MCP is registered under a different name, use it
3. **`gh` CLI fallback** — if no MCP tools are available, use the commands below

Do not hardcode tool namespaces. Reason about which tools are available and use them.

Run all three fetches independently — a failure in one does not block the others.

**Issues**: open issues assigned to me — fields: `title`, `body`, `url`, `labels`

**PRs**: open PRs authored by me — fields: `title`, `body`, `url`, `labels`, `state`, `draft`

**Project items**: items assigned to me across user and org projects — fields: `title`, `url`, `status`

### `gh` CLI fallback commands

```bash
# GitHub username
gh api user --jq '.login'

# Issues assigned to me (open)
gh issue list --assignee @me --state open --json title,body,url,labels --limit 100

# PRs authored by me (open)
gh pr list --author @me --state open --json title,body,url,labels,isDraft --limit 100

# Project items: list user projects then items per project
gh project list --owner @me --format json --limit 20
gh project item-list <number> --owner <login> --format json --limit 100
```

---

## Phase 2 — Sync Each List

For each list, apply the sync logic against the corresponding GitHub data.

### Sync logic (per item)

1. Fetch existing reminders:
   ```bash
   bash "$HOME/.claude/skills/patchani/hooks-handlers/reminders.sh" get_reminders "<list>"
   ```
   Output is newline-delimited rows: `<title>|||<body>|||<priority>|||<completed>|||<id>`

2. For each GitHub item, search existing rows for a URL match in the body field:
   - **No match** → create new reminder (see below)
   - **Match, item closed/merged** → mark complete if not already:
     ```bash
     bash "$HOME/.claude/skills/patchani/hooks-handlers/reminders.sh" complete_reminder "<list>" "<url>"
     ```
   - **Match, item open, title or priority changed** → update:
     ```bash
     bash "$HOME/.claude/skills/patchani/hooks-handlers/reminders.sh" update_reminder "<list>" "<url>" "<title>" "<body>" <priority>
     ```

3. Never delete reminders — completion is the only terminal state.

### Create reminder

```bash
bash "$HOME/.claude/skills/patchani/hooks-handlers/reminders.sh" create_reminder "<list>" "<title>" "<summary>\n→ <url>" <priority>
```

Body format: one-sentence summary of the item (omit if body is empty), then `→ <GitHub URL>` on a new line. The URL line is the deduplication key — do not modify it on updates.

### Priority mapping

| GitHub label | Priority |
|---|---|
| `P0`, `critical`, `urgent` | 1 |
| `P1`, `priority:high` | 1 |
| `P2`, `priority:medium` | 5 |
| `P3`, `priority:low`, none | 9 |
| No label | Infer from body: urgency/deadline/blocking → 1; otherwise → 9 |

---

## Phase 3 — Patchani ToDo Read

After sync, read the `Patchani ToDo` list and briefly surface any incomplete items as session context. Do not enumerate verbatim — one-line acknowledgement is enough.

---

## Output

Report concisely after sync:
- N issues / N PRs / N project items synced
- Which access method was used (MCP or gh CLI)
- Any lists created (first run only)
- Any items completed since last sync
- Any fetch warnings

For **PRs**, list each item with its link:
```
PRs (2):
- Features/ai consumption reports [draft] — https://github.com/.../pull/10661
- lago migration design document [draft] — https://github.com/.../pull/10523
```

For **Issues**, a count summary is sufficient unless there are fewer than 5 — then list them too.
