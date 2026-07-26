#!/usr/bin/env bash
#
# Smoke test: Verify extension files and structure
#

set -e

echo "🧪 Smoke Test: Extension Files"
echo "================================"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$PROJECT_ROOT"

echo ""
echo "📦 Checking extension files..."

# Test 1: Check persona extension exists
echo -n "  ✓ persona.ts ... "
if [ -f "extensions/persona.ts" ]; then
  echo -e "${GREEN}EXISTS${NC}"
else
  echo -e "${RED}MISSING${NC}"
  exit 1
fi

# Test 2: Check design-doc extension exists
echo -n "  ✓ design-doc.ts ... "
if [ -f "extensions/design-doc.ts" ]; then
  echo -e "${GREEN}EXISTS${NC}"
else
  echo -e "${RED}MISSING${NC}"
  exit 1
fi

# Test 3: Check enforcement extension exists
echo -n "  ✓ enforcement.ts ... "
if [ -f "extensions/enforcement.ts" ]; then
  echo -e "${GREEN}EXISTS${NC}"
else
  echo -e "${RED}MISSING${NC}"
  exit 1
fi

# Test 4: Check standup-sync extension exists
echo -n "  ✓ standup-sync.ts ... "
if [ -f "extensions/standup-sync.ts" ]; then
  echo -e "${GREEN}EXISTS${NC}"
else
  echo -e "${RED}MISSING${NC}"
  exit 1
fi

echo ""
echo "📂 Checking persona file..."

# Test 5: Verify persona file exists
echo -n "  ✓ persona/patchani.md ... "
if [ -f "$PROJECT_ROOT/persona/patchani.md" ]; then
  echo -e "${GREEN}EXISTS${NC}"
else
  echo -e "${RED}MISSING${NC}"
  exit 1
fi

echo ""
echo "🔍 Checking TypeScript syntax..."

# Test 6: Verify extensions have valid TypeScript syntax
echo -n "  ✓ TypeScript check ... "
if npx tsc --noEmit --skipLibCheck 2>/dev/null; then
  echo -e "${GREEN}PASS${NC}"
else
  echo -e "${RED}FAIL${NC}"
  exit 1
fi

echo ""
echo "📋 Verifying package.json configuration..."

# Test 7: Check that pi.extensions is configured
echo -n "  ✓ pi.extensions ... "
if grep -q '"extensions"' package.json; then
  echo -e "${GREEN}CONFIGURED${NC}"
else
  echo -e "${RED}MISSING${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}✅ All smoke tests passed!${NC}"
