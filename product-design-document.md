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

Patchani is an engineering assistant package for Pi Dev. It encapsulates a persistent persona tuned for platform engineering work, enforces structured workflows, and builds adaptive institutional memory through ordinary usage.

The goal is not a chatbot wrapper — it is a working partner that applies discipline before acting, produces outputs shaped to established templates, and grows more contextually aware of the user's systems over time.

### Implementation Strategy

Implemented as a Pi package (`@setarm01/patchani`) containing multiple extensions and skills. Uses Pi's native extension API for programmatic workflow enforcement, session lifecycle hooks, and custom tool registration. GitHub integration via custom tools for token efficiency. Apple Reminders via AppleScript tools.

---

## 2. Features

### F-1: Design Document Extension

**Status:** In progress

**What:** Programmatically enforced extension that guides structured design document creation through interrogation, research, validation, and incremental writing.

**Behaviour:**
- Structured intake: problem space, stakeholders, constraints, unknowns
- Targeted clarifying questions (no assumptions)
- Incremental section-by-section generation with approval gates
- Standard template enforcement (Introduction → Background → Use Cases → Data Model → Architecture → Open Points → Appendix)
- Fact-checking: Every claim verified against repo/docs/sources or marked as assumption
- Validation gates block progression until approved

**Research Strategy:**
- **Background workflows**: Research triggered early, runs parallel to user intake
- **Multi-source**: GitHub (issues/PRs/discussions/projects), codebase (grep/analysis), web (official docs/RFCs/security advisories)
- **Parallelized**: Multiple focused agents (small context each) with synthesis
- **Quality-first**: Official documentation, specifications, security sources (not random blog posts)
- **UI**: Compact progress indicator with expand/collapse

**Implementation:**
- **Extension:** `extensions/design-doc.ts`
- **Tools:** `design_doc_start`, `design_doc_validate`, `design_doc_research`, `design_doc_fact_check`, `design_doc_next_section`
- **State tracking:** Phase progression, section completion, validation gates
- **Dependencies:** Bundles `@quintinshaw/pi-dynamic-workflows` for research orchestration and `/deep-research` for web search

**Reference:** See Appendix A for detailed research workflow architecture. See `skills/design-doc/SKILL.md` for template structure.

---

### F-2: Daily Standup Summariser Extension

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

**Implementation:**
- **Extension:** `extensions/standup-sync.ts`
- **Session hook:** `session_start` event triggers automatic sync
- **Custom tools:**
  - `standup_sync` - Sync GitHub to Reminders (automatic + on-demand)
  - `standup_add_todo` - Add item to Patchani ToDo list
  - `standup_list` - Read all Reminder lists
- **GitHub integration:** Custom tools using `gh` CLI or GitHub REST API (more token-efficient than MCP)
- **Apple Reminders:** Custom tools using AppleScript via `osascript` commands
- **Commands:**
  - `/standup` - Manual sync
  - `/standup-todo <text>` - Quick add to Patchani ToDo

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

## 3. Package Dependencies

| Package | Version | Purpose |
|---------|---------|----------|
| `@quintinshaw/pi-dynamic-workflows` | ^3.4.1 | Parallel workflow orchestration for multi-source research; includes `/deep-research` for source-checked web search with citations |

**Installation:** Single command installs Patchani with all dependencies:
```bash
pi install npm:@setarm01/patchani
```

Bundled dependencies automatically installed. No manual configuration required.

---

## 4. External Integrations

| Integration | Implementation | Use | Auth | Status |
|---|---|---|---|---|
| **GitHub** | Custom tools via `gh` CLI or REST API | Assigned issues, Projects items, PR state; standup (F-2) | PAT via gh auth | In progress |
| **Apple Reminders** | Custom tools via AppleScript (`osascript`) | Read/write Reminders lists; standup (F-2) | None (local) | In progress |
| **Apple Notes** | Custom tools via AppleScript | Read/write Notes app | None (local) | Planned |
| **Filesystem** | Built-in tools | Local docs, memory files | None | Active |

**Implementation rationale:**
- Custom tools more token-efficient than MCP protocol overhead
- Direct control over data filtering and formatting
- No external MCP server dependency
- Simpler installation and authentication

---

## 5. Open Points

| # | Open Point | Impact | Resolution path |
|---|---|---|---|
| OP-1 | **Adaptive context storage format** — structured YAML, frontmatter Markdown, or a dedicated directory schema for the entity types in F-4. | Affects readability, queryability, and how Memory Sync (F-3) writes updates. | Prototype both; evaluate based on how well the agent can read and update them. |
| OP-2 | **Extension coordination** — Pi extensions cannot directly call functions from other extensions (e.g., design-doc cannot directly invoke pi-dynamic-workflows). | Design-doc fact-checking cannot programmatically trigger workflow orchestration. | **Resolved:** Keep extensions independent. Design-doc suggests workflow usage via prompt hints; LLM calls workflow tool naturally if installed. No tight coupling required. |
| OP-3 | **Session persistence across restarts** — Extension state (design doc phase, standup sync status) needs to survive Pi restarts. | Workflow interruption or Pi crash loses progress. | Use `pi.appendEntry()` to persist state in session file; restore from session entries on `session_start`. |

---

## Appendix A: Research Workflow Architecture

### Design-Doc Research Flow

**User Experience:**
```
User: "Write design doc for OAuth authentication"
  ↓
Design-doc: Asks intake questions (interactive)
  ↓
User: Provides problem space, constraints
  ↓
Design-doc: Triggers research workflow (background)
  ├─ UI: [⏳ Research running | 3/10 agents complete | expand ▼]
  └─ Meanwhile: Continues asking user questions (scope, stakeholders)
  ↓
Research completes → Background section generated
  ↓
Design-doc: Asks user to review section
```

### Research Workflow Strategy

**Principle:** Parallelized, narrow-scoped agents (small context) with synthesis.

**Phase 1: Parallel Discovery** (10-15 agents, ~2K tokens each)
```javascript
parallel([
  () => agent('GitHub issues: label:auth OR "authentication"'),
  () => agent('GitHub PRs: touched auth/* files'),
  () => agent('GitHub discussions: JWT vs sessions'),
  () => agent('GitHub Projects: auth-related items'),
  () => agent('Codebase: grep JWT, OAuth, passport'),
  () => agent('Codebase: find auth middleware files'),
  () => agent('Codebase: analyze auth test expectations'),
  () => agent('Related repos: org search for auth'),
  () => agent('Documentation: README, ADRs, wikis'),
  () => workflow('deep-research', 'OAuth 2.1 specification site:ietf.org')
])
```

**Phase 2: Targeted Deep Dives** (3-5 agents, based on Phase 1)
```javascript
parallel([
  () => agent('Read issues: #123, #456'),
  () => agent('Analyze PR #789 implementation'),
  () => agent('Read decision thread from discussion')
])
```

**Phase 3: Synthesis** (1 aggregator agent, ~20K tokens)
```javascript
agent(`Synthesize Background section from:
- Issue summary: ${findings.issues}
- PR summary: ${findings.prs}
- Code summary: ${findings.code}
- Web research: ${findings.web}

Format: Current state, Known limitations, Team decisions`)
```

**Result:** ~50K total tokens vs. 150K+ in single serial agent.

### Web Search Quality Targets

**Prioritize:**
- Official documentation (OAuth.net, OWASP, W3C, MDN)
- RFC specifications (IETF)
- Security advisories (CVE, GitHub Security, OWASP)
- Authoritative sources (Google Security, AWS, Cloudflare blogs)
- Academic papers (arXiv, ACM Digital Library)

**Avoid:**
- Random Medium/dev.to articles
- Outdated Stack Overflow (pre-2020)
- Unmaintained personal blogs

**Implementation:** `/deep-research` with targeted queries:
```
"OAuth 2.1 specification" site:ietf.org
"JWT best practices" site:auth0.com OR site:owasp.org
"authentication security 2026" site:*.edu OR site:arxiv.org
```

### Nested Workflow Support

**Pattern:**
```javascript
// In design-doc workflow
const webFindings = await workflow('deep-research', {
  question: 'Authentication security best practices 2026'
});
```

**Constraints:**
- One level of nesting supported
- Nested workflow shares parent budget and concurrency
- Useful for specialized sub-tasks (web research, code review)

---

## Appendix B: Package Manifest

```json
{
  "name": "@setarm01/patchani",
  "version": "1.0.0",
  "keywords": ["pi-package"],
  "dependencies": {
    "@quintinshaw/pi-dynamic-workflows": "^3.4.1"
  },
  "bundledDependencies": ["@quintinshaw/pi-dynamic-workflows"],
  "pi": {
    "extensions": [
      "extensions/design-doc.ts",
      "extensions/standup-sync.ts",
      "node_modules/@quintinshaw/pi-dynamic-workflows/extensions"
    ],
    "skills": [
      "node_modules/@quintinshaw/pi-dynamic-workflows/skills"
    ]
  }
}
```

### Model Tier Strategy

**pi-dynamic-workflows supports per-agent model selection** via tiers or explicit models.

**Tier Approach (Recommended):**

| Tier | Use Case | Typical Model | Cost | Speed |
|------|----------|---------------|------|-------|
| `small` | Pattern matching, grep, simple lookups | Haiku | ~$0.25/$1.25 per M | 3-5x faster |
| `medium` | Code analysis, structured reading | Sonnet | ~$3/$15 per M | Baseline |
| `big` | Complex synthesis, deep reasoning | Opus | ~$15/$75 per M | Slower |

**Design-Doc Research Tier Assignment:**

```javascript
// Phase 1: Discovery (small/medium)
parallel([
  () => agent('Find GitHub issues: label:auth', { tier: 'small' }),
  () => agent('Find PRs touching auth/*', { tier: 'small' }),
  () => agent('Grep: JWT, OAuth, passport', { tier: 'small' }),
  () => agent('Analyze auth test expectations', { tier: 'medium' }),
  () => agent('Extract ADR decisions', { tier: 'medium' })
])

// Phase 2: Deep dive (medium/big)
parallel([
  () => agent('Analyze PR #123 implementation', { tier: 'medium' }),
  () => workflow('deep-research', 'OAuth 2.1 security', { tier: 'big' }),
  () => agent('Synthesize GitHub discussion threads', { tier: 'big' })
])

// Phase 3: Synthesis (big)
agent('Combine findings into Background section', { tier: 'big' })
```

**Cost Impact Example:**

- **All Sonnet (medium):** 10 agents × 7K avg tokens = ~$0.45
- **Tiered approach:** 5 small + 3 medium + 2 big = ~$0.29 (35% savings)
- **Speed benefit:** Small agents 3-5x faster for simple tasks

**Rationale:**
- **Small models excel** at pattern matching, grep, simple extraction
- **Medium models** handle structured code analysis efficiently
- **Big models** reserved for complex reasoning, synthesis, ambiguous decisions
- **Cost-effective:** Pay for capability only where needed
- **Faster:** Simple tasks don't wait for big model capacity

