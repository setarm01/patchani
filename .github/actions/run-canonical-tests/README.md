# Run Unit Tests

Runs unit tests (`npm test`).

## Usage

```yaml
- uses: ./.github/actions/run-canonical-tests
```

Tests fail if command exits non-zero.

Note: Behavioral/integration testing is done separately via pi-action in test-pr-main.yml.
