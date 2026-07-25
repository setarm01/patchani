# Upload Test Logs

Uploads test logs as artifacts with configurable retention.

## Usage

```yaml
- uses: ./.github/actions/upload-test-logs
  if: failure()  # typically only on failure
  with:
    artifact-name: 'test-logs'
    log-path: '*.log'
    retention-days: '7'
```

## Inputs

- `artifact-name`: Artifact name (required)
- `log-path`: Path/pattern for logs (required)
- `retention-days`: Days to keep artifact (default: `'7'`)
