# Patchani

**Engineering assistant for Pi Dev** - becomes Patchani persona automatically on startup.

## Installation

**One-line install:**

```bash
curl -fsSL https://raw.githubusercontent.com/setarm01/patchani/main/install.sh | bash
```

Or manually:

```bash
echo "@setarm01:registry=https://npm.pkg.github.com" >> ~/.npmrc
pi install npm:@setarm01/patchani
```

**On first Pi startup:** Patchani persona activates automatically with welcome screen.

## What You Get

**Patchani Persona:**
- Activates on session start
- Ask-before-acting discipline
- Fact-checking enforcement
- Direct communication (no prose padding)
- Structured workflows

**Design Documents (F1):**
- Activates automatically when discussion leads to implementation
- Or invoke: `/design-doc <topic>`
- Background research (GitHub + codebase + web) runs parallel
- Validates and fact-checks all claims
- Section-by-section with approval gates

**Standup Sync (F2):**
- Runs automatically on session start in git repos
- Or invoke: `/standup`
- Syncs GitHub → Apple Reminders
- 4 lists: Issues, Tasks, PRs, Patchani ToDo
- Quick add: `/standup-todo <text>`

## Requirements

- **macOS** (Apple Reminders)
- **GitHub CLI** (`gh`) authenticated
- **Git repository** (for standup sync)

## Tools

Pi can call these automatically:

**Design Doc:** `design_doc_start`, `design_doc_validate`, `design_doc_research`, `design_doc_fact_check`, `design_doc_next_section`

**Standup:** `standup_sync`, `standup_add_todo`

## Documentation

- **Design Spec:** `product-design-document.md`
- **Implementation:** `IMPLEMENTATION.md`
- **Persona:** `persona/patchani.md`

## License

MIT

## Author

Michelangelo Setaro
