#!/usr/bin/env bash
#
# Smoke test: Load extensions and verify no crashes
#

set -e

echo "🧪 Smoke Test: Extension Loading"
echo "================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$PROJECT_ROOT"

# Check if pi is available
if ! command -v pi &>/dev/null; then
  echo -e "${YELLOW}⚠️  Pi not installed - skipping extension loading tests${NC}"
  echo -e "${YELLOW}   (Extension loading will be tested via pi-action in CI)${NC}"
  echo ""
  echo "📂 Checking files exist..."
  
  # Just verify files exist
  for ext in persona.ts design-doc.ts enforcement.ts standup-sync.ts; do
    if [ -f "extensions/$ext" ]; then
      echo -e "  ✓ extensions/$ext ${GREEN}EXISTS${NC}"
    else
      echo -e "  ✗ extensions/$ext ${RED}MISSING${NC}"
      exit 1
    fi
  done
  
  if [ -f "$PROJECT_ROOT/persona/patchani.md" ]; then
    echo -e "  ✓ persona/patchani.md ${GREEN}EXISTS${NC}"
  else
    echo -e "  ✗ persona/patchani.md ${RED}MISSING${NC}"
    exit 1
  fi
  
  echo ""
  echo -e "${GREEN}✅ File checks passed!${NC}"
  exit 0
fi

echo ""
echo "📦 Loading extensions..."

# Test 1: Load persona extension
echo -n "  ✓ persona.ts ... "
if pi -e extensions/persona.ts --help &>/dev/null; then
  echo -e "${GREEN}PASS${NC}"
else
  echo -e "${RED}FAIL${NC}"
  exit 1
fi

# Test 2: Load design-doc extension
echo -n "  ✓ design-doc.ts ... "
if pi -e extensions/design-doc.ts --help &>/dev/null; then
  echo -e "${GREEN}PASS${NC}"
else
  echo -e "${RED}FAIL${NC}"
  exit 1
fi

# Test 3: Load enforcement extension
echo -n "  ✓ enforcement.ts ... "
if pi -e extensions/enforcement.ts --help &>/dev/null; then
  echo -e "${GREEN}PASS${NC}"
else
  echo -e "${RED}FAIL${NC}"
  exit 1
fi

# Test 4: Load standup-sync extension
echo -n "  ✓ standup-sync.ts ... "
if pi -e extensions/standup-sync.ts --help &>/dev/null; then
  echo -e "${GREEN}PASS${NC}"
else
  echo -e "${RED}FAIL${NC}"
  exit 1
fi

# Test 5: Load all extensions together
echo -n "  ✓ all extensions ... "
if pi -e extensions/persona.ts \
      -e extensions/enforcement.ts \
      -e extensions/design-doc.ts \
      -e extensions/standup-sync.ts \
      --help &>/dev/null; then
  echo -e "${GREEN}PASS${NC}"
else
  echo -e "${RED}FAIL${NC}"
  exit 1
fi

echo ""
echo "🔍 Checking command registration..."

# Test 5: Verify extensions load without error
if pi -e extensions/persona.ts \
      -e extensions/design-doc.ts \
      -e extensions/standup-sync.ts \
      --version &>/dev/null; then
  echo -e "  ✓ All extensions load ${GREEN}OK${NC}"
else
  echo -e "  ✗ Extension loading ${RED}FAILED${NC}"
  exit 1
fi

echo ""
echo "📂 Checking persona file..."

# Test 6: Verify persona file exists
if [ -f "$PROJECT_ROOT/persona/patchani.md" ]; then
  echo -e "  ✓ persona/patchani.md ${GREEN}EXISTS${NC}"
else
  echo -e "  ✗ persona/patchani.md ${RED}MISSING${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}✅ All smoke tests passed!${NC}"
