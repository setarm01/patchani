# Development Workflow

## Branch Strategy

- **`main`** - Production releases only. Auto-publishes to npm on push.
- **`dev`** - Active development. All work happens here.

## Making Changes

### 1. Work on dev branch

```bash
git checkout dev
# Make your changes
git add .
git commit -m "Your changes"
git push origin dev
```

### 2. Test your changes

**PR to dev:**
- Runs canonical tests only (unit + integration)
- Fast feedback on code quality

**PR to main:**
- Runs full test suite:
  1. Canonical tests (unit + integration)
  2. Installation tests (package installation)
  3. Activation tests (persona activation)
  4. Behavioral tests (/help command)
- All tests use free mock model (no API key needed)
- Ready for production release

### 3. Release to npm

When ready to publish:

```bash
# 1. Bump version in package.json
npm version patch  # 0.1.0 -> 0.1.1
# or
npm version minor  # 0.1.0 -> 0.2.0
# or
npm version major  # 0.1.0 -> 1.0.0

# 2. Update CHANGELOG.md with changes

# 3. Commit version bump
git add package.json CHANGELOG.md
git commit -m "Bump version to X.Y.Z"

# 4. Merge to main
git checkout main
git merge dev
git push origin main

# 5. Auto-publish workflow triggers:
#    - Runs tests
#    - Publishes to npm
#    - Creates git tag vX.Y.Z
#    - Creates GitHub release
```

## Version Management

**Semantic Versioning:**
- `MAJOR.MINOR.PATCH`
- **MAJOR**: Breaking changes
- **MINOR**: New features, backwards compatible
- **PATCH**: Bug fixes, backwards compatible

**Version Commands:**
```bash
npm version patch  # Bug fixes (0.1.0 -> 0.1.1)
npm version minor  # New features (0.1.0 -> 0.2.0)
npm version major  # Breaking changes (0.1.0 -> 1.0.0)
```

## Workflow Safety

✅ **Safe:**
- Commit to `dev` anytime
- Push to `dev` anytime
- PRs from `dev` to `main`

⚠️ **Careful:**
- Pushing to `main` triggers npm publish
- Version in package.json must be bumped
- If version exists, publish is skipped

🛑 **Don't:**
- Push untested code to `main`
- Push without bumping version
- Skip CHANGELOG updates

## GitHub Configuration

See [.github/SECRETS.md](.github/SECRETS.md) for complete setup instructions.

**Repository Variables** (Actions → Variables tab):
- `LITELLM_BASE_URL` - Your LiteLLM proxy URL

**Repository Secrets** (Actions → Secrets tab):
- `NPM_TOKEN` - For publishing
- `LITELLM_API_KEY` - For tests (your LiteLLM access token)

## Troubleshooting

**"Version already exists" error:**
- Bump version in package.json
- Previous publish might have succeeded

**Tests failing:**
- Check test-install workflow logs
- Test locally with `npm test`

**Extensions not loading:**
- Verify `pi` manifest in package.json
- Check file paths are correct
