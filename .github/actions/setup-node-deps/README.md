# Setup Node.js and Dependencies

Installs Node.js and runs `npm ci` with caching.

## Usage

```yaml
- uses: ./.github/actions/setup-node-deps
  with:
    node-version: '20'  # optional, default: '20'
```

## Inputs

- `node-version`: Node.js version (default: `'20'`)
- `enable-cache`: Enable npm caching (default: `'true'`)
- `registry-url`: NPM registry URL (optional, for publishing)
- `working-directory`: Working directory (default: `'.'`)
