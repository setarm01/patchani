#!/usr/bin/env bash
#
# Smoke test: Verify extension files exist
#

set -e

echo "🧪 Smoke Test: File Verification"
echo "=================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$PROJECT_ROOT"

echo ""
echo "📂 Checking extension files..."

# Verify extension files exist
for ext in persona.ts design-doc.ts enforcement.ts standup-sync.ts; do
  if [ -f "extensions/$ext" ]; then
    echo -e "  ✓ extensions/$ext ${GREEN}EXISTS${NC}"
  else
    echo -e "  ✗ extensions/$ext ${RED}MISSING${NC}"
    exit 1
  fi
done

echo ""
echo "📂 Checking persona file..."

if [ -f "$PROJECT_ROOT/persona/patchani.md" ]; then
  echo -e "  ✓ persona/patchani.md ${GREEN}EXISTS${NC}"
else
  echo -e "  ✗ persona/patchani.md ${RED}MISSING${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}✅ All files verified!${NC}"
echo ""
echo "Note: Extension loading is tested via behavioral testing in test-pr-main.yml"
