# Patchani — Product Design Document

_Author: Michelangelo Setaro & Patchani_
_Created: 2026-07-08_
_Status: Draft_

---

## Table of Contents

1. [Vision](#1-vision)
2. [Features](#2-features)
3. [MCP Integrations](#3-mcp-integrations)
4. [Open Points](#4-open-points)

---

## 1. Vision

Patchani is an engineering assistant plugin designed to run across Claude Code, Open Code, and Pi Dev. It encapsulates a persistent persona tuned for platform engineering work, enforces structured workflows, and builds adaptive institutional memory through ordinary usage.

The goal is not a chatbot wrapper — it is a working partner that applies discipline before acting, produces outputs shaped to established templates, and grows more contextually aware of the user's systems over time.

---

## 2. Features

### F-1: Design Document Skill

**Status:** Done — skill file at `skills/design-doc.md`

**What:** A guided skill that drives the user through producing a well-structured design document. The skill does not jump to writing — it first interrogates the problem, surfaces assumptions, and raises open questions. Output conforms to the established design document template.

**Behaviour:**
- Opens with a structured intake: problem space, stakeholders, constraints, known unknowns
- Asks targeted clarifying questions before producing any section; does not assume
- Raises doubts explicitly when the user's framing is underspecified or contradictory
- Produces the document incrementally, section by section, seeking approval before proceeding
- Enforces the standard template (Introduction → Background → Use Cases → Data Model Mapping → System Architecture → Open Points → Appendix)
- Every design claim, argument, or architectural assertion must be fact-checked and supported by a verifiable reference — repo code, official documentation, explicit user confirmation, or a cited source. Unverified claims are marked as assumptions and surface as open points, never as facts
- Flags when a section needs external input that is not yet available (open points, not assumptions)

**Reference:** See `skills/design-doc.md` for the full discipline, template structure, and section-by-section guidance.

---

### F-2: Daily Standup Summariser

**Status:** In progress

**What:** On session start, Patchani syncs GitHub activity into Apple Reminders, providing a persistent shared task list visible on Mac, iPhone, and widget. The list is the live contract between user and agent — Patchani reads and writes it; the user reads and completes items.

**Sources (macOS only, GitHub as primary and only source for now):**
- GitHub assigned issues
- GitHub Projects items assigned to the user
- Pull requests opened by the user

**Reminder structure — four fixed lists:**

| List | Owner | What Patchani does |
|---|---|---|
| **Issues** | Patchani | Syncs assigned GitHub issues; adds title, brief summary, and link in body; infers priority from labels if present, falls back to reading body; marks complete when issue is closed on GitHub |
| **Tasks** | Patchani | Syncs GitHub Projects items assigned to the user; same lifecycle as Issues |
| **PRs** | Patchani | Syncs open PRs by the user; reflects review state and CI state; marks complete when PR is merged or closed |
| **Patchani ToDo** | Shared | Patchani reads and writes; populated proactively at session end with WIP items and next steps; user and Patchani both add items during sessions; used for cross-session continuity |

**Sync behaviour:**
- Trigger: session start (automatic) and on-demand
- Lifecycle follows GitHub: item closed/merged → Reminder marked complete
- Priority: inferred from GitHub labels when present (`priority:*`, `P0`–`P3`, `urgent`, etc.); falls back to body analysis when labels are absent
- Reminder body: title + one-line summary distilled from issue/PR body + direct GitHub link
- macOS constraint: hard requirement; no degradation path for other platforms

---

### F-3: Memory Sync

**Status:** Planned

**What:** At session end (or on demand), Patchani reviews the session and updates persistent memory: new project context, feedback corrections, open tasks. Prevents context loss between sessions.

---

### F-4: Persistent Adaptive Context

**Status:** Planned

**What:** A structured, cumulative knowledge base that Patchani builds over time through ordinary usage. As Patchani works with the user across sessions, it learns about repositories, systems, conventions, and team norms, and organises that knowledge into a queryable context layer.

**Behaviour:**
- Agnostic to any specific technology or organisation — the structure is generic, the content adapts to whatever the user works on
- Populated incrementally: each session contributes facts, not summaries (e.g. "repo X uses service Y for auth", "team convention: all migrations are reversible")
- Organised by entity type: repositories, systems, teams, conventions, decisions, recurring tasks
- Read at session start to inform persona context without requiring the user to re-explain known systems
- Updated by Memory Sync (F-3) at session end; individual facts can be corrected or invalidated explicitly

**Structure (entity types):**

| Entity | Examples |
|---|---|
| Repository | Name, language, primary purpose, key dependencies, where docs live |
| System | Name, role in the stack, interfaces, known constraints |
| Convention | Naming patterns, review requirements, deployment procedures |
| Decision | Architecture or process choices made, with rationale |
| Recurring task | Things done regularly — standup, releases, on-call handoff |

**Open questions:**
- Storage format: structured YAML files per entity vs. freeform Markdown with frontmatter — TBD
- Conflict resolution when a new session contradicts a prior fact — TBD

---

### F-5: Agent Fan-out for Implementation

**Status:** Planned

**What:** When executing a confirmed implementation plan, Patchani orchestrates the work as a directed graph of agents rather than executing linearly. Independent units run in parallel; dependent units wait for their prerequisites. Patchani tracks progress across the graph, collects results, and feeds outputs from completed units into dependent ones.

**Behaviour:**
- Triggered when entering the Implement phase of the workflow discipline
- Patchani decomposes the confirmed plan into a dependency graph
- Independent units are fanned out as parallel agents
- Dependent units are queued and dispatched as their dependencies resolve
- Patchani acts as orchestrator: it does not implement directly, it coordinates, collects, and synthesises
- If a unit fails, Patchani surfaces the failure and holds dependent units rather than proceeding blindly

**Reference:** See product design doc for workflow discipline context. Implementation skill TBD in `skills/implement.md`.

---

## 3. MCP Integrations

| MCP | Package / Source | Use | Auth | Status |
|---|---|---|---|---|
| **Sequential Thinking** | `@modelcontextprotocol/server-sequential-thinking` | Structured multi-step reasoning for complex design and planning tasks | None | Planned |
| **GitHub** | `@modelcontextprotocol/server-github` | Assigned issues, GH Projects items, PR state; standup (F-2) + design doc context (F-1) | PAT | Planned |
| **Linear** | `@linear/mcp-server` | Ticket and project state; linked to standup (F-2) | API key | Planned |
| **Apple Reminders** | Community MCP | Read/write shared task list; surfaced on Mac, iPhone, and widget | None (local) | Planned |
| **Apple Notes** | Community MCP | Read/write Notes app as a lightweight persistent scratchpad | None (local) | Planned |
| **Filesystem** | Built-in | Local docs, memory files, skill files | None | Active |

---

## 4. Open Points

| # | Open Point | Impact | Resolution path |
|---|---|---|---|
| OP-1 | **Portability layer implementation** — `AGENTS.md` is the canonical instruction file read by Pi Dev, Open Code, Cursor, Windsurf, and VS Code Agent Mode. Claude Code reads `CLAUDE.md`. Whether `CLAUDE.md` is a thin include shim or maintained separately is undecided. | Determines whether changes to persona/workflow discipline need to be made in one place or two. | Implement `AGENTS.md` as canonical; make `CLAUDE.md` a minimal shim that sources it or duplicates only Claude-specific settings. |
| OP-2 | **Persona persistence across context compaction** — on long sessions, Claude compacts context and persona instructions may be dropped. | Patchani may lose character mid-session. | Investigate injecting persona reminder into memory files that survive compaction. |
| OP-3 | **Adaptive context storage format** — structured YAML, frontmatter Markdown, or a dedicated directory schema for the entity types in F-4. | Affects readability, queryability, and how Memory Sync (F-3) writes updates. | Prototype both; evaluate based on how well the agent can read and update them. |
| OP-4 | **macOS MCP community package stability** — Reminders and Notes MCPs are community-maintained and may vary in reliability or API coverage. | Core macOS-native features depend on third-party packages without official support. | Evaluate candidate packages; prefer ones with active maintenance and read/write capability. |
