# Upload Test Logs

Composite action for uploading test logs as GitHub Actions artifacts with consistent retention policy.

## What it does

1. **Upload logs** - Captures log files matching specified pattern
2. **Always runs** - Executes even if previous steps fail (`if: always()`)
3. **Retention** - Keeps artifacts for specified number of days (default: 7)

## Usage

### Basic (upload all .log files in workspace)

```yaml
steps:
  - uses: ./.github/actions/upload-test-logs
    with:
      artifact-name: 'my-test-logs'
```

### With custom path pattern

```yaml
steps:
  - uses: ./.github/actions/upload-test-logs
    with:
      artifact-name: 'installation-logs'
      log-path: 'test-install/*.log'
```

### With custom retention

```yaml
steps:
  - uses: ./.github/actions/upload-test-logs
    with:
      artifact-name: 'critical-logs'
      log-path: '**/*.log'
      retention-days: '30'
```

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `artifact-name` | Artifact name (unique per run) | **Yes** | - |
| `log-path` | Path pattern for logs | No | `'*.log'` |
| `retention-days` | Retention period (1-90 days) | No | `'7'` |

## Examples

### Simple test job with logs

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: ./.github/actions/setup-node-deps
      
      - name: Run tests
        run: npm test 2>&1 | tee test.log
      
      - uses: ./.github/actions/upload-test-logs
        with:
          artifact-name: 'unit-test-logs'
```

### Multiple log locations

```yaml
jobs:
  integration-test:
    runs-on: ubuntu-latest
    steps:
      - uses: ./.github/actions/setup-pi-environment
        with:
          litellm-base-url: ${{ vars.LITELLM_BASE_URL }}
          litellm-api-key: ${{ secrets.LITELLM_API_KEY }}
      
      - name: Run Pi tests
        run: |
          pi test 2>&1 | tee pi-test.log
          cd test-dir && pi test 2>&1 | tee test-dir/nested.log
      
      - uses: ./.github/actions/upload-test-logs
        with:
          artifact-name: 'pi-integration-logs'
          log-path: '**/*.log'
          retention-days: '14'
```

### Multi-job workflow with unique artifacts

```yaml
jobs:
  installation-test:
    runs-on: ubuntu-latest
    steps:
      - name: Test installation
        run: ./install-test.sh 2>&1 | tee install.log
      
      - uses: ./.github/actions/upload-test-logs
        with:
          artifact-name: 'installation-test-logs'
          log-path: 'install.log'
  
  activation-test:
    runs-on: ubuntu-latest
    steps:
      - name: Test activation
        run: ./activation-test.sh 2>&1 | tee activation.log
      
      - uses: ./.github/actions/upload-test-logs
        with:
          artifact-name: 'activation-test-logs'
          log-path: 'activation.log'
```

## Benefits

- ✅ Ensures `if: always()` is never forgotten (runs even on failure)
- ✅ Standardizes retention policy across workflows
- ✅ Reduces 4-5 lines to 1 action call
- ✅ Prevents log loss from failed jobs
- ✅ Consistent artifact naming

## Path Patterns

The `log-path` input supports glob patterns:

| Pattern | Matches |
|---------|---------|
| `*.log` | All .log files in workspace root |
| `**/*.log` | All .log files recursively |
| `test-dir/*.log` | All .log files in test-dir/ |
| `{test,debug}.log` | Specific named log files |
| `logs/**` | All files in logs/ directory |

## Artifact Naming

**Important:** Artifact names must be unique per workflow run.

❌ **Bad** (will fail on multiple jobs):
```yaml
artifact-name: 'logs'  # Used in multiple jobs
```

✅ **Good** (unique per job):
```yaml
artifact-name: 'installation-test-logs'  # Job-specific
artifact-name: 'activation-test-logs'     # Job-specific
```

## Retention Policy

GitHub Actions artifact retention limits:

- **Minimum:** 1 day
- **Maximum:** 90 days
- **Default (this action):** 7 days
- **GitHub default:** 90 days (if not specified)

Choose retention based on need:

| Retention | Use Case |
|-----------|----------|
| 1-7 days | Quick debugging, non-critical logs |
| 14-30 days | Investigation period, compliance |
| 60-90 days | Long-term storage, audit trails |

## Downloading Artifacts

### Via GitHub UI
1. Go to workflow run page
2. Scroll to "Artifacts" section
3. Click artifact name to download

### Via GitHub CLI
```bash
# List artifacts for a run
gh run view <run-id>

# Download specific artifact
gh run download <run-id> -n installation-test-logs

# Download all artifacts
gh run download <run-id>
```

## Migration

### Before
```yaml
steps:
  - name: Upload installation logs
    if: always()
    uses: actions/upload-artifact@v4
    with:
      name: installation-test-logs
      path: test-install/*.log
      retention-days: 7
```

### After
```yaml
steps:
  - uses: ./.github/actions/upload-test-logs
    with:
      artifact-name: 'installation-test-logs'
      log-path: 'test-install/*.log'
```

## Notes

- **Always runs:** Uses `if: always()` to ensure execution even on failure
- **No overwrite:** Uploading to same artifact name in same run will fail
- **Empty paths:** If no files match pattern, artifact will be empty (not fail)
- **Storage cost:** Large artifacts count toward GitHub storage quota

## Troubleshooting

### "Artifact name already exists"
Ensure each job uses a unique artifact name:
```yaml
artifact-name: 'job-name-test-logs'  # Include job name
```

### "No files found with pattern"
Check that:
1. Log files are actually created
2. Path pattern is correct
3. Working directory is as expected

Add debug step:
```yaml
- name: Debug log paths
  shell: bash
  run: |
    echo "Files matching pattern:"
    find . -name "*.log" -type f
```

### Artifacts too large
Compress logs before upload:
```yaml
- name: Compress logs
  if: always()
  run: tar -czf logs.tar.gz *.log

- uses: ./.github/actions/upload-test-logs
  with:
    artifact-name: 'compressed-logs'
    log-path: 'logs.tar.gz'
```

## Best Practices

1. **Unique names:** Include job name in artifact name
2. **Narrow patterns:** Only upload relevant logs, not entire workspace
3. **Reasonable retention:** Don't use 90 days unless required
4. **Compress large logs:** Use tar/gzip for multi-MB logs
5. **Document location:** Add comment explaining where logs come from

```yaml
# Upload logs from installation tests (~/test-install/*.log)
- uses: ./.github/actions/upload-test-logs
  with:
    artifact-name: 'installation-test-logs'
    log-path: '~/test-install/*.log'
    retention-days: '7'
```
