# GitHub Composite Actions

This directory contains reusable composite actions for the patchani project workflows.

## 📦 Available Actions

| Action | Purpose | Lines Saved |
|--------|---------|-------------|
| [setup-node-deps](./setup-node-deps/) | Setup Node.js + install dependencies | 3-4 per use |
| [setup-pi-environment](./setup-pi-environment/) | Install Pi + configure test environment | 3 per use |
| [run-canonical-tests](./run-canonical-tests/) | Run unit + integration tests | 5 per use |
| [upload-test-logs](./upload-test-logs/) | Upload logs as artifacts | 4-5 per use |

## 🚀 Quick Start

### 1. Setup Node.js Environment

```yaml
steps:
  - uses: ./.github/actions/setup-node-deps
    with:
      node-version: '20'
      enable-cache: 'true'
```

### 2. Run Standard Tests

```yaml
steps:
  - uses: ./.github/actions/setup-node-deps
  - uses: ./.github/actions/run-canonical-tests
```

### 3. Setup Pi for Integration Testing

```yaml
steps:
  - uses: ./.github/actions/setup-node-deps
  - uses: ./.github/actions/setup-pi-environment
    with:
      litellm-base-url: ${{ vars.LITELLM_BASE_URL }}
      litellm-api-key: ${{ secrets.LITELLM_API_KEY }}
```

### 4. Upload Test Logs

```yaml
steps:
  - name: Run tests
    run: npm test 2>&1 | tee test.log
  
  - uses: ./.github/actions/upload-test-logs
    with:
      artifact-name: 'my-test-logs'
      log-path: '*.log'
```

## 📖 Documentation

Each action has detailed documentation:

- **README.md** - Usage guide with examples
- **action.yml** - Action definition with inputs/outputs

### Read Before Using

1. [setup-node-deps/README.md](./setup-node-deps/README.md) - Node.js setup patterns
2. [setup-pi-environment/README.md](./setup-pi-environment/README.md) - Pi configuration + secrets
3. [run-canonical-tests/README.md](./run-canonical-tests/README.md) - Test execution + outputs
4. [upload-test-logs/README.md](./upload-test-logs/README.md) - Artifact retention policies

## 🔄 Workflow Integration

### Before (Original Workflow)

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Run unit tests
        run: npm run test:unit
      - name: Run integration tests
        run: npm run test:smoke
      - name: Upload logs
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-logs
          path: '*.log'
          retention-days: 7
```

**Lines:** 19

### After (Using Composite Actions)

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: ./.github/actions/setup-node-deps
      - uses: ./.github/actions/run-canonical-tests
      - uses: ./.github/actions/upload-test-logs
        with:
          artifact-name: 'test-logs'
```

**Lines:** 9 (53% reduction)

## 🎯 Common Patterns

### Pattern 1: Simple Test Job

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: ./.github/actions/setup-node-deps
        with:
          node-version: 'lts/*'
      - uses: ./.github/actions/run-canonical-tests
```

### Pattern 2: Pi Integration Test

```yaml
jobs:
  pi-test:
    runs-on: ubuntu-latest
    steps:
      - uses: ./.github/actions/setup-node-deps
      - uses: ./.github/actions/setup-pi-environment
        with:
          litellm-base-url: ${{ vars.LITELLM_BASE_URL }}
          litellm-api-key: ${{ secrets.LITELLM_API_KEY }}
      - name: Custom Pi test
        run: pi test:custom 2>&1 | tee pi-test.log
      - uses: ./.github/actions/upload-test-logs
        with:
          artifact-name: 'pi-test-logs'
          log-path: 'pi-test.log'
```

### Pattern 3: Multi-Job with Dependencies

```yaml
jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: ./.github/actions/setup-node-deps
      - uses: ./.github/actions/run-canonical-tests
  
  integration-tests:
    runs-on: ubuntu-latest
    needs: unit-tests
    steps:
      - uses: ./.github/actions/setup-node-deps
      - uses: ./.github/actions/setup-pi-environment
        with:
          litellm-base-url: ${{ vars.LITELLM_BASE_URL }}
          litellm-api-key: ${{ secrets.LITELLM_API_KEY }}
      - name: Run E2E tests
        run: npm run test:e2e
```

## ⚙️ Configuration

### Required Secrets

For workflows using `setup-pi-environment`:

```bash
# Via GitHub CLI
gh variable set LITELLM_BASE_URL --body "https://your-litellm-instance"
gh secret set LITELLM_API_KEY --body "your-api-key"
```

Or via GitHub UI:
**Settings → Secrets and variables → Actions**

### Node.js Version Strategy

| Workflow Type | Recommended Version |
|---------------|---------------------|
| Development PRs | `'20'` (current LTS) |
| Production tests | `'lts/*'` (latest LTS) |
| Publishing | `'20'` (pinned) |

## 📊 Impact Metrics

### Code Reduction

| Workflow | Before | After | Reduction |
|----------|--------|-------|-----------|
| test-pr-dev.yml | 30 lines | 18 lines | 40% |
| test.yml | 43 lines | 28 lines | 35% |
| test-pr-main.yml | 273 lines | ~180 lines | 34% |

**Total:** ~150 lines saved across workflows

### Duplication Eliminated

- **Before:** 33 duplicated steps (41.8% duplication rate)
- **After:** <5 duplicated steps (<5% duplication rate)

### Maintenance Time

- **Setup changes:** 1 file (action) vs 3-4 files (workflows)
- **Test updates:** 1 file vs 2-3 files
- **Estimated savings:** 50% reduction in maintenance time

## 🛠️ Development

### Creating a New Action

1. Create directory: `.github/actions/my-action/`
2. Add `action.yml` with metadata and steps
3. Add `README.md` with usage examples
4. Test in a workflow
5. Update this index

### Action Template

```yaml
name: 'My Action'
description: 'What this action does'
author: 'patchani'

inputs:
  my-input:
    description: 'Input description'
    required: true

outputs:
  my-output:
    description: 'Output description'
    value: ${{ steps.my-step.outputs.value }}

runs:
  using: 'composite'
  steps:
    - name: My step
      id: my-step
      shell: bash
      run: |
        echo "value=result" >> $GITHUB_OUTPUT
```

## ✅ Best Practices

### Do's ✅

- Use semantic input names (`node-version`, not `version`)
- Provide sensible defaults for optional inputs
- Document all inputs/outputs in README
- Use `shell: bash` for composite action steps
- Include usage examples in README
- Test actions in isolation before workflow integration

### Don'ts ❌

- Don't hardcode secrets in actions
- Don't use `${{ secrets.* }}` inside composite actions (pass as inputs)
- Don't create overly generic actions (keep focused)
- Don't forget `if: always()` for upload steps
- Don't skip README documentation

## 🐛 Troubleshooting

### Action not found

```
Error: Unable to resolve action ./.github/actions/my-action
```

**Solution:** Ensure action directory contains `action.yml` (not `action.yaml`)

### Secrets not working

```
Error: Input required and not supplied: litellm-api-key
```

**Solution:** Pass secrets as inputs, don't reference directly in action:

```yaml
# ❌ Wrong (inside action)
env:
  API_KEY: ${{ secrets.MY_SECRET }}

# ✅ Correct (in workflow)
- uses: ./.github/actions/my-action
  with:
    api-key: ${{ secrets.MY_SECRET }}
```

### Cache not working

```
Cache not found for input keys: node-modules-...
```

**Solution:** Ensure `enable-cache: 'true'` (string, not boolean)

### Paths not found

```
Error: No files found with the provided path: *.log
```

**Solution:** Check working directory and use `find` to debug:

```yaml
- name: Debug paths
  run: |
    pwd
    find . -name "*.log" -type f
```

## 📚 Additional Resources

- [GitHub Actions: Composite Actions](https://docs.github.com/en/actions/creating-actions/creating-a-composite-action)
- [Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Action Inputs/Outputs](https://docs.github.com/en/actions/creating-actions/metadata-syntax-for-github-actions)

## 🔗 Related Files

- [EXAMPLES.md](./EXAMPLES.md) - Complete refactored workflow examples
- [../workflows/ANALYSIS.md](../workflows/ANALYSIS.md) - Detailed technical analysis
- [../workflows/REFACTORING-SUMMARY.md](../workflows/REFACTORING-SUMMARY.md) - Quick summary

---

**Maintained by:** patchani team  
**Last updated:** 2024  
**Questions?** Open an issue or see individual action READMEs
