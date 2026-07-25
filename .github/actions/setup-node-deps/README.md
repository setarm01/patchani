# Setup Node.js and Dependencies

Composite action that standardizes Node.js environment setup across workflows.

## What it does

1. **Setup Node.js** - Installs specified Node version with optional npm caching
2. **Install dependencies** - Runs `npm ci --prefer-offline` for clean, reproducible installs

> **Note:** This action does **not** checkout code. Use `actions/checkout@v4` before this action.

## Usage

### Basic (defaults to Node 20 with caching)

```yaml
steps:
  - uses: actions/checkout@v4
  
  - uses: ./.github/actions/setup-node-deps
```

### With specific Node version

```yaml
steps:
  - uses: actions/checkout@v4
  
  - uses: ./.github/actions/setup-node-deps
    with:
      node-version: 'lts/*'
```

### Disable caching (for debugging)

```yaml
steps:
  - uses: actions/checkout@v4
  
  - uses: ./.github/actions/setup-node-deps
    with:
      node-version: '20'
      enable-cache: 'false'
```

### For publishing workflows

```yaml
steps:
  - uses: actions/checkout@v4
  
  - uses: ./.github/actions/setup-node-deps
    with:
      node-version: '20'
      registry-url: 'https://registry.npmjs.org'
```

### With custom working directory (monorepos)

```yaml
steps:
  - uses: actions/checkout@v4
  
  - uses: ./.github/actions/setup-node-deps
    with:
      node-version: '20'
      working-directory: './packages/frontend'
```

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `node-version` | Node.js version to use | No | `'20'` |
| `enable-cache` | Enable npm caching | No | `'true'` |
| `registry-url` | NPM registry URL | No | `''` (none) |
| `working-directory` | Working directory for npm ci | No | `'.'` |

## Examples

### Test workflow
```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: ./.github/actions/setup-node-deps
        with:
          node-version: 'lts/*'
          enable-cache: 'true'
      
      - name: Run tests
        run: npm test
```

### Publish workflow
```yaml
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - uses: ./.github/actions/setup-node-deps
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
      
      - name: Publish
        run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### Matrix testing
```yaml
jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
        node-version: ['18', '20', '21']
    steps:
      - uses: actions/checkout@v4
      
      - uses: ./.github/actions/setup-node-deps
        with:
          node-version: ${{ matrix.node-version }}
      
      - name: Run tests
        run: npm test
```

## Benefits

- ✅ Reduces 2-3 steps to 1 action call
- ✅ Enforces `npm ci` best practice (clean, reproducible installs)
- ✅ Centralizes Node version management
- ✅ Consistent caching behavior across workflows
- ✅ Uses `--prefer-offline` flag for faster installs with cache
- ✅ Single source of truth for updates

## Migration

### Before
```yaml
steps:
  - uses: actions/checkout@v4
  
  - name: Setup Node.js
    uses: actions/setup-node@v4
    with:
      node-version: '20'
      cache: 'npm'
  
  - name: Install dependencies
    run: npm ci
```

### After
```yaml
steps:
  - uses: actions/checkout@v4
  
  - uses: ./.github/actions/setup-node-deps
    with:
      node-version: '20'
```

## Best Practices

### ✅ DO
- Use this action after checking out code
- Keep default caching enabled for faster CI
- Use `lts/*` for maximum compatibility
- Use specific versions (e.g., `'20'`) for production/publish workflows

### ❌ DON'T
- Don't run `npm install` after this (dependencies already installed)
- Don't disable caching unless debugging cache issues
- Don't use with `actions/cache` separately (handled internally)

## Notes

- Always uses `npm ci` (not `npm install`) for reproducible builds
- Adds `--prefer-offline` flag to use cache when available
- Caching is enabled by default for faster CI runs
- Registry URL only needed for publishing workflows
- Checkout must be done separately (not included in this action)

## Troubleshooting

### Cache issues
If you suspect cache corruption:

```yaml
- uses: ./.github/actions/setup-node-deps
  with:
    enable-cache: 'false'
```

### Monorepo setup
For workspaces/monorepos:

```yaml
- uses: ./.github/actions/setup-node-deps
  with:
    working-directory: './packages/my-package'
```

### Registry authentication
For private registries:

```yaml
- uses: ./.github/actions/setup-node-deps
  with:
    registry-url: 'https://npm.pkg.github.com'

- run: npm publish
  env:
    NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```
