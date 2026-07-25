# Run Canonical Tests

Composite action that executes the standard test suite: unit tests + integration tests.

## What it does

1. **Run unit tests** - Executes `npm run test:unit` (Vitest)
2. **Run integration tests** - Executes `npm run test:smoke` (smoke.sh)
3. **Display summary** - Shows custom success message with test types

## Usage

### Basic (default summary message)

```yaml
steps:
  - uses: ./.github/actions/run-canonical-tests
```

### With custom summary

```yaml
steps:
  - uses: ./.github/actions/run-canonical-tests
    with:
      summary-message: |
        ✅ All canonical tests passed!
        
        Ran:
          ✓ Unit tests (vitest)
          ✓ Integration tests (smoke.sh)
```

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `summary-message` | Custom message after tests | No | `'✅ Canonical tests passed!'` |

## Outputs

| Output | Description | Type |
|--------|-------------|------|
| `unit-result` | Unit test exit code | String (number) |
| `integration-result` | Integration test exit code | String (number) |

## Examples

### Simple test workflow

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: ./.github/actions/setup-node-deps
      - uses: ./.github/actions/run-canonical-tests
```

### With custom summary for dev PRs

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: ./.github/actions/setup-node-deps
        with:
          node-version: '20'
      
      - uses: ./.github/actions/run-canonical-tests
        with:
          summary-message: |
            ✅ Dev branch tests passed!
            Ready to merge to main for full test suite.
```

### Using test result outputs

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: ./.github/actions/setup-node-deps
      
      - id: tests
        uses: ./.github/actions/run-canonical-tests
      
      - name: Check test results
        run: |
          echo "Unit tests: ${{ steps.tests.outputs.unit-result }}"
          echo "Integration tests: ${{ steps.tests.outputs.integration-result }}"
      
      - name: Conditional step
        if: steps.tests.outputs.unit-result == '0'
        run: echo "Unit tests passed!"
```

### Multi-job workflow with shared tests

```yaml
jobs:
  canonical-tests:
    runs-on: ubuntu-latest
    name: Canonical Tests
    steps:
      - uses: ./.github/actions/setup-node-deps
      - uses: ./.github/actions/run-canonical-tests
        with:
          summary-message: '✅ Canonical tests passed!'
  
  additional-tests:
    runs-on: ubuntu-latest
    name: Additional Tests
    needs: canonical-tests
    steps:
      - uses: ./.github/actions/setup-node-deps
      - name: Run E2E tests
        run: npm run test:e2e
```

## Benefits

- ✅ Eliminates duplication across test workflows
- ✅ Standardizes test execution order (unit → integration)
- ✅ Provides test result outputs for conditional logic
- ✅ Consistent summary formatting
- ✅ Single source of truth for test commands

## Prerequisites

This action requires:

1. **Dependencies installed** - Run `setup-node-deps` action first
2. **Test scripts defined** in `package.json`:
   ```json
   {
     "scripts": {
       "test:unit": "vitest",
       "test:smoke": "bash scripts/smoke.sh"
     }
   }
   ```

## Migration

### Before
```yaml
steps:
  - name: Run unit tests
    run: npm run test:unit
  
  - name: Run integration tests
    run: npm run test:smoke
  
  - name: Summary
    run: |
      echo "✅ All canonical tests passed!"
      echo "  ✓ Unit tests"
      echo "  ✓ Integration tests"
```

### After
```yaml
steps:
  - uses: ./.github/actions/run-canonical-tests
    with:
      summary-message: '✅ All canonical tests passed!'
```

## Test Coverage

This action runs **canonical tests only**. For additional coverage:

- **Type checking:** Add separate `npm run typecheck` step
- **Linting:** Add separate `npm run lint` step
- **Coverage upload:** Add Codecov action after this one
- **E2E tests:** Add in separate job after canonical tests pass

### Example: Full test suite

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: ./.github/actions/setup-node-deps
        with:
          node-version: 'lts/*'
          enable-cache: 'true'
      
      - name: Type check
        run: npm run typecheck
      
      - name: Lint
        run: npm run lint
      
      - uses: ./.github/actions/run-canonical-tests
      
      - name: Upload coverage
        uses: codecov/codecov-action@v4
        if: always()
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          files: ./coverage/coverage-final.json
```

## Notes

- Tests run sequentially (unit tests first, then integration)
- Action fails fast: if unit tests fail, integration tests don't run
- Summary always displays even if tests pass/fail
- Exit codes are captured as outputs for post-processing

## Troubleshooting

### "npm run test:unit: command not found"
Ensure `test:unit` script exists in package.json:
```bash
npm run test:unit --if-present
```

### Tests pass but action fails
Check for non-zero exit codes in test scripts. The action captures exit codes but doesn't suppress failures.

### Summary not displaying
The summary step runs with `shell: bash` - ensure no script errors prevent execution.
