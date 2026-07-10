# Raw Ideas — Stream of Consciousness

_Unfiltered. To be formalized into product-design-document.md._

---

## 2026-07-08

**Core ambition:** Swiss army knife for daily job in the Pfizer GenAI context. Not a single-purpose tool — the full productivity layer.

**Platform:** macOS-native. Leverage everything the Mac offers:
- Notes (persistent scratchpad, session memory)
- Reminders (shared todo list between user and agent — visible outside Claude)
- Widgets (glanceable state without opening Claude)
- Potentially: Calendar, Shortcuts, Spotlight

**Reminders as the human-agent contract:**
- Reminders app becomes the live, visible todo list shared between user and Patchani
- Agent can read and write Reminders; user sees them on iPhone/Mac/widget
- On session start every morning: agent queries GitHub (issues, PRs assigned to user, project tasks) and populates structured Reminders sections — e.g. "PR Reviews", "Open Issues", "Today's Tasks"
- User completes items in Reminders; agent sees them as done next session

**Morning routine concept:**
- Claude opens → Patchani activates → checks GitHub for:
  - PRs assigned for review
  - Issues assigned to user
  - Project board tasks in progress or blocked
- Populates/updates Reminders list sections
- Surfaces blockers and time-sensitive items proactively
- No manual standup prep needed

**Goals:**
- Productivity — more work done with less effort
- Organization — single source of truth for what's on the plate
- Less overhead — agent handles triage, aggregation, status checks
- Quality — agent enforces discipline (templates, fact-checks, questions before acting)
- Effective and efficient use of agent skills — right tool for right task, no waste

**Future / portability:**
- Plugin should not be Claude-only
- Target compatibility: Cursor, Windsurf, open code editors (anything that supports MCP or plugin ecosystems)
- Design the persona, skills, and MCPs to be editor-agnostic where possible
- Claude-specific hooks (CLAUDE.md, session activation) kept in a separate layer so the core is portable
