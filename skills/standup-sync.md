# Skill: Standup Sync

## Trigger

- Automatically on session start (via SessionStart hook)
- Explicitly when the user says "sync reminders", "run standup sync", or similar

## What This Skill Does

Pulls open work from GitHub and syncs it into Apple Reminders. Provides a persistent, structured task list shared between user and Patchani — visible on Mac, iPhone, and widget.

Reminders are managed via `${CLAUDE_PLUGIN_ROOT}/hooks-handlers/reminders.sh`. All Reminders operations go through that script via the Bash tool.

---

## Phase 0 — First-Run Initialisation

Before any sync, verify the four managed lists exist. Create any that are missing.

Required lists: `Issues`, `Tasks`, `PRs`, `Patchani ToDo`

```bash
bash "${CLAUDE_PLUGIN_ROOT}/hooks-handlers/reminders.sh" get_lists
bash "${CLAUDE_PLUGIN_ROOT}/hooks-handlers/reminders.sh" ensure_list "Issues"
bash "${CLAUDE_PLUGIN_ROOT}/hooks-handlers/reminders.sh" ensure_list "Tasks"
bash "${CLAUDE_PLUGIN_ROOT}/hooks-handlers/reminders.sh" ensure_list "PRs"
bash "${CLAUDE_PLUGIN_ROOT}/hooks-handlers/reminders.sh" ensure_list "Patchani ToDo"
```

---

## Phase 1 — Fetch GitHub Data

Run all three fetches independently — a failure in one does not block the others.

**Issues**: `list_issues` — filter `assignee=@me`, `state=open` — fields: `title`, `body`, `url`, `labels`

**PRs**: `list_pull_requests` — filter `author=@me`, `state=open` — fields: `title`, `body`, `url`, `labels`, `state`

**Projects items**: `projects_list` to enumerate user projects → `list_project_items` per project filtered to `@me` — fields: `title`, `url`, `status`

---

## Phase 2 — Sync Each List

For each list, apply the sync logic against the corresponding GitHub data.

### Sync logic (per item)

1. Fetch existing reminders:
   ```bash
   bash "${CLAUDE_PLUGIN_ROOT}/hooks-handlers/reminders.sh" get_reminders "<list>"
   ```
   Output is newline-delimited rows: `<title>|||<body>|||<priority>|||<completed>|||<id>`

2. For each GitHub item, search existing rows for a URL match in the body field:
   - **No match** → create new reminder (see below)
   - **Match, item closed/merged** → mark complete if not already:
     ```bash
     bash "${CLAUDE_PLUGIN_ROOT}/hooks-handlers/reminders.sh" complete_reminder "<list>" "<url>"
     ```
   - **Match, item open, title or priority changed** → update:
     ```bash
     bash "${CLAUDE_PLUGIN_ROOT}/hooks-handlers/reminders.sh" update_reminder "<list>" "<url>" "<title>" "<body>" <priority>
     ```

3. Never delete reminders — completion is the only terminal state.

### Create reminder

```bash
bash "${CLAUDE_PLUGIN_ROOT}/hooks-handlers/reminders.sh" create_reminder "<list>" "<title>" "<summary>\n→ <url>" <priority>
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
- Any lists created (first run only)
- Any items completed since last sync
- Any fetch warnings
