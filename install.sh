#!/usr/bin/env bash
# Install Patchani as a Claude Code plugin via the skills-dir mechanism.
# Idempotent — safe to re-run.
set -euo pipefail

PLUGIN_DIR="$(cd "$(dirname "$0")" && pwd)"
SKILLS_DIR="$HOME/.claude/skills"
LINK="$SKILLS_DIR/patchani"

mkdir -p "$SKILLS_DIR"

if [ -L "$LINK" ] && [ "$(readlink "$LINK")" = "$PLUGIN_DIR" ]; then
  echo "Already installed: $LINK -> $PLUGIN_DIR"
else
  ln -sfn "$PLUGIN_DIR" "$LINK"
  echo "Installed: $LINK -> $PLUGIN_DIR"
fi

bash "$PLUGIN_DIR/bin/install.sh"

echo "Done. Restart Claude Code to activate Patchani."
