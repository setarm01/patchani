#!/usr/bin/env bash
#
# Smoke Test: Test package installation as users experience it
# 
# User flow:
#   1. pi install patchani
#   2. pi
#   3. Extensions auto-load from package.json
#

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo -e "${CYAN}🧪 Smoke Test: Package Installation${NC}"
echo "====================================="
echo ""

cd "$PROJECT_ROOT"

# Cleanup
cleanup() {
  if [ -d "$TEMP_DIR" ]; then
    rm -rf "$TEMP_DIR"
  fi
  if [ -f "$PROJECT_ROOT"/*.tgz ]; then
    rm -f "$PROJECT_ROOT"/*.tgz
  fi
}
trap cleanup EXIT

# Create temp directory
TEMP_DIR=$(mktemp -d)
echo -e "${CYAN}📁 Test directory: $TEMP_DIR${NC}"

# Phase 1: Build package
echo ""
echo -e "${CYAN}📦 Phase 1: Building package${NC}"
echo "----------------------------"

PACKAGE_FILE=$(npm pack 2>&1 | tail -1)
if [ ! -f "$PACKAGE_FILE" ]; then
  echo -e "${RED}❌ Failed to create package${NC}"
  exit 1
fi
echo -e "${GREEN}✓${NC} Created: $PACKAGE_FILE"

# Phase 2: Install package
echo ""
echo -e "${CYAN}📥 Phase 2: Installing package${NC}"
echo "--------------------------------"

mv "$PACKAGE_FILE" "$TEMP_DIR/"
cd "$TEMP_DIR"

# Install with --global-style (no hoisting)
if npm install --global-style "./$PACKAGE_FILE" >/dev/null 2>&1; then
  echo -e "${GREEN}✓${NC} Package installed"
else
  echo -e "${RED}❌ Installation failed${NC}"
  npm install --global-style "./$PACKAGE_FILE" 2>&1 | tail -20
  exit 1
fi

# Phase 3: Verify structure
echo ""
echo -e "${CYAN}📂 Phase 3: Package structure${NC}"
echo "------------------------------"

PACKAGE_DIR="node_modules/patchani"

check_file() {
  local file="$1"
  if [ -f "$PACKAGE_DIR/$file" ]; then
    echo -e "${GREEN}✓${NC} $file"
    return 0
  else
    echo -e "${RED}✗${NC} $file (missing)"
    return 1
  fi
}

check_file "package.json" || exit 1
check_file "extensions/persona.ts" || exit 1
check_file "extensions/design-doc.ts" || exit 1
check_file "extensions/enforcement.ts" || exit 1
check_file "extensions/standup-sync.ts" || exit 1
check_file "persona/patchani.md" || exit 1

# Phase 4: Verify Pi configuration
echo ""
echo -e "${CYAN}🔧 Phase 4: Pi configuration${NC}"
echo "-----------------------------"

# Check package.json has pi.extensions
if grep -q '"pi":' "$PACKAGE_DIR/package.json"; then
  echo -e "${GREEN}✓${NC} Pi configuration present"
else
  echo -e "${RED}✗${NC} No pi configuration in package.json"
  exit 1
fi

# Phase 5: Test with pi install simulation
echo ""
echo -e "${CYAN}🚀 Phase 5: Extension loading${NC}"
echo "-------------------------------"

# Pi auto-loads extensions from package.json when installed
# Test each extension loads without errors
test_extension() {
  local name="$1"
  local path="$2"
  
  echo -n "  $name ... "
  
  # Test Pi can load the extension
  if pi -e "$path" --version 2>&1 | grep -q "^0\\."; then
    echo -e "${GREEN}✓${NC}"
    return 0
  else
    echo -e "${RED}✗${NC}"
    echo ""
    echo -e "${YELLOW}    Error:${NC}"
    pi -e "$path" --version 2>&1 | sed 's/^/      /'
    return 1
  fi
}

test_extension "persona" "$PACKAGE_DIR/extensions/persona.ts" || exit 1
test_extension "design-doc" "$PACKAGE_DIR/extensions/design-doc.ts" || exit 1
test_extension "enforcement" "$PACKAGE_DIR/extensions/enforcement.ts" || exit 1
test_extension "standup-sync" "$PACKAGE_DIR/extensions/standup-sync.ts" || exit 1

# Phase 6: Test all together
echo ""
echo -e "${CYAN}🔗 Phase 6: All extensions${NC}"
echo "---------------------------"

echo -n "  Loading all ... "
if pi -e "$PACKAGE_DIR/extensions/persona.ts" \
       -e "$PACKAGE_DIR/extensions/design-doc.ts" \
       -e "$PACKAGE_DIR/extensions/enforcement.ts" \
       -e "$PACKAGE_DIR/extensions/standup-sync.ts" \
       --version 2>&1 | grep -q "^0\\."; then
  echo -e "${GREEN}✓${NC}"
else
  echo -e "${RED}✗${NC}"
  pi -e "$PACKAGE_DIR/extensions/persona.ts" \
     -e "$PACKAGE_DIR/extensions/design-doc.ts" \
     -e "$PACKAGE_DIR/extensions/enforcement.ts" \
     -e "$PACKAGE_DIR/extensions/standup-sync.ts" \
     --version 2>&1 | sed 's/^/    /'
  exit 1
fi

# Success
echo ""
echo "====================================="
echo -e "${GREEN}✅ All smoke tests passed${NC}"
echo ""
echo "Package ready for:"
echo "  • npm publish"
echo "  • pi install patchani"
echo ""
