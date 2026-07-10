# MCP Registry

MCPs planned or active for the Patchani plugin. See product design doc for rationale.

| MCP | Package / Source | Use | Auth | Status |
|---|---|---|---|---|
| **Sequential Thinking** | `@modelcontextprotocol/server-sequential-thinking` | Structured multi-step reasoning; applied in design doc (F-1) and complex planning tasks | None | Planned |
| **GitHub** | `@modelcontextprotocol/server-github` | Assigned issues, GH Projects items, PR state; standup (F-2) + design doc code context (F-1) | PAT | Planned |
| **Linear** | `@linear/mcp-server` | Ticket and project state; linked to standup (F-2) | API key | Planned |
| **Apple Reminders** | `mcp-server-apple-events` (`FradSer/mcp-server-apple-events`) | Read/write Reminders app — shared task list visible on Mac, iPhone, and widget | None (local) | Planned |
| **Apple Notes** | Community MCP | Read/write Notes app as a lightweight scratchpad and session log | None (local) | Planned |
| **Filesystem** | Built-in | Local docs, memory files, skill files | None | Active |

## Notes

- Sequential Thinking should be invoked explicitly in multi-step reasoning tasks (design doc intake, open points analysis) — not applied by default to all interactions
- Apple Reminders and Notes MCPs are local and require no auth; they depend on macOS and will not work in headless or remote environments
- GitHub PAT must include `read:project` scope for Projects v2 items (F-2 Tasks list); also needs `repo` and `read:user`
- Linear MCP is optional; standup (F-2) degrades gracefully if Linear is not configured
