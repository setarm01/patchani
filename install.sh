#!/usr/bin/env bash
#
# Patchani installer for Pi Dev
# Usage: curl -fsSL https://raw.githubusercontent.com/setarm01/patchani/main/install.sh | bash
#

set -e

echo "🔧 Installing Patchani for Pi Dev..."
echo ""

# Check if pi is installed
if ! command -v pi &> /dev/null; then
    echo "❌ Error: pi command not found"
    echo "   Install Pi Dev first: npm install -g @earendil-works/pi-coding-agent"
    exit 1
fi

# Check if gh is installed (required for standup sync)
if ! command -v gh &> /dev/null; then
    echo "⚠️  Warning: GitHub CLI (gh) not found"
    echo "   Standup sync requires gh CLI. Install: brew install gh"
    echo ""
fi

# Configure npm for GitHub Packages
echo "📦 Configuring npm for GitHub Packages..."
if [ ! -f ~/.npmrc ] || ! grep -q "@setarm01:registry" ~/.npmrc; then
    echo "@setarm01:registry=https://npm.pkg.github.com" >> ~/.npmrc
    echo "   Added @setarm01 scope to ~/.npmrc"
fi

# Install via pi
echo ""
echo "📥 Installing @setarm01/patchani..."
pi install npm:@setarm01/patchani

echo ""
echo "✅ Patchani installed successfully!"
echo ""
echo "Next steps:"
echo "  1. Restart Pi or run: pi"
echo "  2. You'll see the welcome screen"
echo "  3. Patchani persona activates automatically"
echo ""
echo "Features:"
echo "  • Design documents: /design-doc <topic>"
echo "  • Standup sync: /standup (auto-runs on startup in git repos)"
echo "  • Quick todo: /standup-todo <text>"
echo ""
