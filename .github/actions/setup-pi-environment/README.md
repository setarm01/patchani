# Setup Pi Environment Action

A composite GitHub Action that installs and configures the Pi coding agent globally using the pi-action SDK approach.

## Overview

This action provides a simplified, production-ready setup for Pi in GitHub Actions workflows. It follows the pi-action SDK methodology for clean, reliable installation.

## Features

- 🚀 **Simple Installation**: One-step Pi global installation
- 📦 **Version Control**: Specify exact Pi version or use latest
- ⚙️ **Auto-Configuration**: Minimal setup required
- ✅ **Verification**: Built-in installation validation
- 🔧 **Flexible**: Configurable Node.js version

## Usage

### Basic Usage

```yaml
- name: Setup Pi
  uses: ./.github/actions/setup-pi-environment
  with:
    anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
```

### Advanced Usage

```yaml
- name: Setup Pi with specific versions
  uses: ./.github/actions/setup-pi-environment
  with:
    node-version: '20'
    pi-version: 'latest'
    anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
```

### Complete Workflow Example

```yaml
name: Run Pi Analysis

on: [push, pull_request]

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Pi Environment
        uses: ./.github/actions/setup-pi-environment
        with:
          anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
      
      - name: Run Pi command
        run: pi analyze src/
```

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `node-version` | Node.js version to use | No | `20` |
| `pi-version` | Pi version to install (`latest` or specific version) | No | `latest` |
| `anthropic-api-key` | Anthropic API key for Pi authentication | No | `''` |

## Outputs

| Output | Description |
|--------|-------------|
| `pi-version` | The installed Pi version |
| `pi-path` | Path to the Pi executable |

## Environment Variables

The action respects the following environment variables:

- `ANTHROPIC_API_KEY`: Required for Pi to function (can be set via input or workflow env)

## Examples

### Using Outputs

```yaml
- name: Setup Pi
  id: setup-pi
  uses: ./.github/actions/setup-pi-environment
  with:
    anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}

- name: Display Pi info
  run: |
    echo "Pi version: ${{ steps.setup-pi.outputs.pi-version }}"
    echo "Pi path: ${{ steps.setup-pi.outputs.pi-path }}"
```

### Matrix Testing

```yaml
jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest]
        node-version: [18, 20, 22]
    steps:
      - uses: actions/checkout@v4
      - uses: ./.github/actions/setup-pi-environment
        with:
          node-version: ${{ matrix.node-version }}
```

## Design Philosophy

This action follows the **pi-action SDK approach**:

1. ✨ **Simplicity**: Minimal configuration, maximum functionality
2. 🎯 **Focus**: One responsibility - setup Pi correctly
3. 🔒 **Reliability**: Verified installation with error handling
4. 📦 **Composability**: Works well with other actions
5. 🚀 **Performance**: Fast, cached installation

## Architecture

```
┌─────────────────────────────────────┐
│   Setup Pi Environment Action       │
├─────────────────────────────────────┤
│                                     │
│  1. Setup Node.js (with cache)      │
│  2. Install Pi globally (npm)       │
│  3. Configure Pi environment        │
│  4. Verify installation             │
│  5. Output version & path           │
│                                     │
└─────────────────────────────────────┘
```

## Requirements

- GitHub Actions runner with shell support
- Internet access for npm package installation
- Valid Anthropic API key (for Pi functionality)

## Troubleshooting

### Pi command not found

If Pi is not found after installation:

```yaml
- name: Debug Pi installation
  run: |
    which pi || echo "Pi not in PATH"
    npm list -g @earendil-works/pi-coding-agent
```

### Version mismatch

To verify installed version:

```yaml
- name: Check Pi version
  run: pi --version
```

### API key issues

Ensure your API key is properly configured:

```yaml
env:
  ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

## Comparison: SDK vs Manual Setup

| Aspect | SDK Approach (This Action) | Manual Setup |
|--------|---------------------------|--------------|
| **Complexity** | Low - 3 simple steps | High - many manual steps |
| **Reliability** | High - verified install | Variable |
| **Maintenance** | Low - npm handles updates | High - manual tracking |
| **Speed** | Fast - optimized | Slower - many operations |
| **Errors** | Graceful handling | Requires custom logic |

## Performance

- **Cold run**: ~30-45 seconds (includes Node.js setup + Pi install)
- **Cached run**: ~15-20 seconds (Node.js cached)
- **Resource usage**: Minimal (standard npm global install)

## Security

- Uses official npm registry for Pi installation
- API keys handled through GitHub Secrets
- No sensitive data stored in logs
- Follows GitHub Actions security best practices

## Contributing

When updating this action:

1. Test on multiple OS platforms (ubuntu, macos)
2. Verify with different Node.js versions
3. Test with and without API key
4. Update README if inputs/outputs change
5. Keep it simple - resist feature creep

## License

Part of the Patchani project. See main repository LICENSE for details.

## Support

For issues related to:
- **This action**: Open issue in Patchani repository
- **Pi itself**: See Pi coding agent documentation
- **GitHub Actions**: See GitHub Actions documentation

## Related Actions

- `setup-patchani`: Full Patchani environment setup
- `run-pi-workflow`: Execute Pi workflows
- `cache-pi-state`: Cache Pi configuration

---

**Note**: This action uses the pi-action SDK approach for simplicity and reliability. For advanced Pi configuration needs, consider creating a custom workflow or extending this action.
