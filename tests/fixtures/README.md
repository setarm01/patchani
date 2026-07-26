# Test Fixtures

## setup-pi.sh

Configures Pi for GitHub Actions testing with LiteLLM.

**Replicates your local Pi configuration:**
- Installs `pi-provider-litellm` package
- Installs `pi-dynamic-workflows` package  
- Creates `settings.json` with both packages
- Creates `auth.json` with LiteLLM credentials
- Uses mock model for zero AI costs

**What it does:**
1. Installs required Pi packages (litellm provider + workflows)
2. Creates `~/.pi/agent/settings.json` matching local config
3. Creates `~/.pi/agent/auth.json` with your LiteLLM credentials
4. Configures mock model for testing

**Required Environment Variables:**

```bash
LITELLM_BASE_URL   # GitHub Actions Variable (not secret)
LITELLM_API_KEY    # GitHub Actions Secret
```

**Why mock-gpt-4o?**
- Free - makes no AI API calls
- Available in LiteLLM by default
- Perfect for CI/CD testing
- Tests installation, loading, and activation without AI costs
- **Still requires LiteLLM proxy authentication** (for governance)

**Installed Packages:**
- `npm:pi-provider-litellm` - Required for LiteLLM provider
- `npm:@quintinshaw/pi-dynamic-workflows` - Patchani dependency

**Without these packages, Pi cannot connect to LiteLLM!**

**Authentication Flow:**

1. Tests authenticate to your LiteLLM proxy
2. Mock model is selected (no upstream AI API calls)
3. Tests run without AI costs
4. LiteLLM governance/logging still applies

**For Real AI Tests:**

If you need to test actual AI interactions, change the model:

```bash
# In fixture:
"defaultModel": "anthropic.claude-sonnet-4-5-v1:0",
```

This will use your real AI credits but test actual responses.

**Note:** This is a test fixture. Your local Pi configuration is separate.
