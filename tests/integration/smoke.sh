#!/usr/bin/env bash
#
# Smoke test: Verify extensions load in Pi
#

set -e

echo "🧪 Smoke Test: Extension Loading"
echo "================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$PROJECT_ROOT"

echo ""
echo "📦 Loading extensions..."

# Test each extension loads without errors
for ext in persona.ts design-doc.ts enforcement.ts standup-sync.ts; do
  echo -n "  ✓ $ext ... "
  if pi -e "extensions/$ext" --help >/dev/null 2>&1; then
    echo -e "${GREEN}PASS${NC}"
  else
    echo -e "${RED}FAIL${NC}"
    exit 1
  fi
done

echo ""
echo "🔍 Testing all extensions together..."
echo -n "  ✓ all extensions ... "
if pi -e extensions/persona.ts \
       -e extensions/enforcement.ts \
       -e extensions/design-doc.ts \
       -e extensions/standup-sync.ts \
       --help >/dev/null 2>&1; then
  echo -e "${GREEN}PASS${NC}"
else
  echo -e "${RED}FAIL${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}✅ All smoke tests passed!${NC}"
