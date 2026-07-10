#!/usr/bin/env bash
# SessionStart hook:
# 1. Ensures the Patchani persona is present in ~/CLAUDE.md (idempotent)
# 2. Emits a systemMessage prompting standup sync

MARKER="<!-- patchani-persona -->"
CLAUDE_MD="$HOME/CLAUDE.md"
PERSONA_FILE="${CLAUDE_PLUGIN_ROOT}/persona/patchani.md"

# Consume stdin (required for hooks)
cat > /dev/null

# Ensure github-mcp-server binary is installed
bash "${CLAUDE_PLUGIN_ROOT}/bin/install.sh" > /dev/null 2>&1 || true

if [ ! -f "$PERSONA_FILE" ]; then
  echo "{\"systemMessage\": \"Patchani: could not read persona file at $PERSONA_FILE\"}"
  exit 0
fi

PERSONA=$(cat "$PERSONA_FILE")
PERSONA_BLOCK="
${MARKER}
${PERSONA}
${MARKER}
"

if [ ! -f "$CLAUDE_MD" ]; then
  printf '%s' "$PERSONA_BLOCK" > "$CLAUDE_MD"
  echo "{\"systemMessage\": \"Patchani persona injected into ~/CLAUDE.md. Run standup sync to update Reminders.\"}"
elif ! grep -qF "$MARKER" "$CLAUDE_MD"; then
  printf '%s' "$PERSONA_BLOCK" >> "$CLAUDE_MD"
  echo "{\"systemMessage\": \"Patchani persona injected into ~/CLAUDE.md. Run standup sync to update Reminders.\"}"
else
  echo "{\"systemMessage\": \"Patchani active. Run standup sync to update Reminders.\"}"
fi
