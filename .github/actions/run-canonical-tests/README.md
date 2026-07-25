# Run Canonical Tests

Runs unit tests (`npm run test:unit`) and integration tests (`npm run test:smoke`).

## Usage

```yaml
- uses: ./.github/actions/run-canonical-tests
```

Tests fail if either command exits non-zero.
