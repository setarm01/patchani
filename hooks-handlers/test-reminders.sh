#!/usr/bin/env bash
# Test suite for reminders.sh — run directly to validate all operations
# Usage: bash hooks-handlers/test-reminders.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
R="$SCRIPT_DIR/reminders.sh"
LIST="Patchani Test $$"   # unique name to avoid collisions
PASS=0; FAIL=0

pass() { echo "  PASS: $1"; PASS=$((PASS+1)); }
fail() { echo "  FAIL: $1 — got: $2"; FAIL=$((FAIL+1)); }

assert_contains() {
  local label="$1" expected="$2" actual="$3"
  if echo "$actual" | grep -qF "$expected"; then pass "$label"
  else fail "$label" "$actual"; fi
}

assert_eq() {
  local label="$1" expected="$2" actual="$3"
  if [ "$actual" = "$expected" ]; then pass "$label"
  else fail "$label — expected '$expected'" "$actual"; fi
}

cleanup() {
  osascript -e "tell application \"Reminders\" to if (exists list \"$LIST\") then delete list \"$LIST\"" 2>/dev/null || true
}
trap cleanup EXIT

echo "--- ensure_list ---"
out=$("$R" ensure_list "$LIST")
assert_eq "creates list" "ok" "$out"
out=$("$R" ensure_list "$LIST")
assert_eq "idempotent" "ok" "$out"

echo "--- get_lists ---"
out=$("$R" get_lists)
assert_contains "new list appears" "$LIST" "$out"

echo "--- create_reminder ---"
out=$("$R" create_reminder "$LIST" "Test issue" "Fix the thing
→ https://github.com/test/repo/issues/42" 5)
assert_eq "creates reminder" "created" "$out"

echo "--- get_reminders ---"
out=$("$R" get_reminders "$LIST")
assert_contains "title present" "Test issue" "$out"
assert_contains "url present" "https://github.com/test/repo/issues/42" "$out"
assert_contains "priority present" "|||5|||" "$out"
assert_contains "not completed" "|||false|||" "$out"

echo "--- update_reminder ---"
out=$("$R" update_reminder "$LIST" "https://github.com/test/repo/issues/42" "Updated title" "Updated body
→ https://github.com/test/repo/issues/42" 1)
assert_eq "updates reminder" "updated" "$out"
out=$("$R" get_reminders "$LIST")
assert_contains "title updated" "Updated title" "$out"
assert_contains "priority updated" "|||1|||" "$out"

echo "--- complete_reminder ---"
out=$("$R" complete_reminder "$LIST" "https://github.com/test/repo/issues/42")
assert_eq "completes reminder" "completed" "$out"
out=$("$R" get_reminders "$LIST")
assert_contains "marked completed" "|||true|||" "$out"

echo "--- not found ---"
out=$("$R" complete_reminder "$LIST" "https://github.com/test/repo/issues/999")
assert_eq "handles missing url" "not found" "$out"

echo ""
echo "Results: $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ]
