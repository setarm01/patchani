#!/bin/bash
# Test fixture for GitHub Actions
# Configures Pi for testing with LiteLLM
# Replicates local Pi configuration

set -e

echo "Setting up Pi test environment..."

# Require environment variables
if [ -z "$LITELLM_BASE_URL" ]; then
  echo "❌ LITELLM_BASE_URL environment variable required"
  exit 1
fi

if [ -z "$LITELLM_API_KEY" ]; then
  echo "❌ LITELLM_API_KEY environment variable required"
  exit 1
fi

echo "Installing Pi packages..."

# Create Pi config directory
mkdir -p ~/.pi/agent

# Install required packages (like local config)
echo "Installing pi-provider-litellm..."
pi install npm:pi-provider-litellm

echo "Installing pi-dynamic-workflows..."
pi install npm:@quintinshaw/pi-dynamic-workflows

echo "Configuring Pi with LiteLLM..."

# Configure for LiteLLM with mock model (matches local config structure)
cat > ~/.pi/agent/settings.json << EOF
{
  "defaultProvider": "litellm",
  "defaultModel": "mock-gpt-4o",
  "packages": [
    "npm:@quintinshaw/pi-dynamic-workflows",
    "npm:pi-provider-litellm"
  ],
  "extensions": [],
  "skills": []
}
EOF

# Configure LiteLLM credentials (matches local auth.json structure)
cat > ~/.pi/agent/auth.json << EOF
{
  "litellm": {
    "access": "$LITELLM_API_KEY",
    "refresh": "",
    "expires": 9007199254740991,
    "baseUrl": "$LITELLM_BASE_URL",
    "type": "oauth"
  }
}
EOF

echo "✅ Pi configured for testing"
echo "   Provider: litellm"
echo "   Base URL: $LITELLM_BASE_URL"
echo "   Model: mock-gpt-4o (free mock model)"
echo "   Packages: pi-provider-litellm, pi-dynamic-workflows"
echo ""
echo "Note: Mock model requires LiteLLM proxy auth but makes no AI API calls"
