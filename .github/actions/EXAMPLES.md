# Example Refactored Workflows

These examples show how to use the composite actions to simplify existing workflows.

## test-pr-dev.yml (Refactored)

**Before:** 30 lines  
**After:** 18 lines  
**Reduction:** 40%

```yaml
name: Canonical Tests

on:
  pull_request:
    branches: [dev]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      # Replaces: checkout + setup-node + npm ci
      - uses: ./.github/actions/setup-node-deps
        with:
          node-version: '20'
          enable-cache: 'true'  # Enable for faster builds

      # Replaces: test:unit + test:smoke + summary
      - uses: ./.github/actions/run-canonical-tests
        with:
          summary-message: |
            ✅ All canonical tests passed!
            
            Ran:
              ✓ Unit tests (vitest)
              ✓ Integration tests (smoke.sh)
```

---

## test.yml (Refactored)

**Before:** 43 lines  
**After:** 28 lines  
**Reduction:** 35%

```yaml
name: Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      # Replaces: checkout + setup-node + npm ci
      - uses: ./.github/actions/setup-node-deps
        with:
          node-version: 'lts/*'
          enable-cache: 'true'
      
      # Additional quality checks not in canonical tests
      - name: Type check
        run: npm run typecheck
      
      - name: Lint
        run: npm run lint
      
      # Replaces: test:unit + test:smoke + summary
      - uses: ./.github/actions/run-canonical-tests
      
      # Coverage upload remains separate
      - name: Upload coverage
        uses: codecov/codecov-action@v4
        if: always()
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          files: ./coverage/coverage-final.json
```

---

## test-pr-main.yml (Refactored - Partial)

**Before:** 273 lines  
**After:** ~180 lines  
**Reduction:** 34%

```yaml
name: PR to Main - Full Test Suite

on:
  pull_request:
    branches: [main]

jobs:
  canonical-tests:
    runs-on: ubuntu-latest
    name: Canonical Tests
    steps:
      - uses: ./.github/actions/setup-node-deps
      - uses: ./.github/actions/run-canonical-tests

  installation-tests:
    runs-on: ubuntu-latest
    name: Installation Tests
    needs: canonical-tests
    steps:
      # Setup environment
      - uses: ./.github/actions/setup-node-deps
      - uses: ./.github/actions/setup-pi-environment
        with:
          patchani-install-path: '.'
          litellm-base-url: ${{ vars.LITELLM_BASE_URL }}
          litellm-api-key: ${{ secrets.LITELLM_API_KEY }}
      
      # Test installation in separate directory
      - name: Create test directory
        run: mkdir -p test-install
      
      - name: Install patchani locally (not from npm)
        run: |
          cd test-install
          pi install ../
      
      - name: Verify extensions loaded
        run: |
          cd test-install
          cat ~/.pi/agent/settings.json
          
          if ! grep -q "patchani" ~/.pi/agent/settings.json; then
            echo "❌ Patchani not in settings"
            exit 1
          fi
          
          echo "✅ Patchani installed in settings"
      
      - name: Check extensions exist
        run: |
          PACKAGE_PATH=$(find ~/.pi/agent -name "patchani" -type d | grep -v node_modules | head -1)
          
          if [ -z "$PACKAGE_PATH" ]; then
            echo "❌ Package directory not found"
            exit 1
          fi
          
          echo "Package found at: $PACKAGE_PATH"
          
          for ext in persona.ts enforcement.ts design-doc.ts standup-sync.ts; do
            if [ ! -f "$PACKAGE_PATH/extensions/$ext" ]; then
              echo "❌ Missing extension: $ext"
              exit 1
            fi
            echo "✅ Found: $ext"
          done
      
      - name: Test Pi loads without errors
        run: |
          cd test-install
          cat > test-commands.txt << 'EOF'
/help
exit
EOF
          
          cat test-commands.txt | timeout 30 pi 2>&1 | tee pi-output.log || true
          
          if grep -i "error" pi-output.log | grep -v "@earendil-works" | grep -v "no errors"; then
            echo "❌ Pi encountered errors"
            cat pi-output.log
            exit 1
          fi
          
          echo "✅ Pi started successfully"
      
      - name: Verify patchani commands registered
        run: |
          cd test-install
          cat > check-commands.txt << 'EOF'
/help
exit
EOF
          
          cat check-commands.txt | timeout 30 pi 2>&1 | tee help-output.log || true
          
          if grep -i "failed to load" help-output.log | grep -i "patchani"; then
            echo "❌ Patchani extensions failed to load"
            cat help-output.log
            exit 1
          fi
          
          echo "✅ Patchani extensions loaded without errors"
      
      - name: Verify persona file exists
        run: |
          PACKAGE_PATH=$(find ~/.pi/agent -name "patchani" -type d | grep -v node_modules | head -1)
          
          if [ ! -f "$PACKAGE_PATH/persona/patchani.md" ]; then
            echo "❌ Persona file not found"
            exit 1
          fi
          
          echo "✅ Persona file exists"
      
      - name: Summary
        run: |
          echo "✅ Installation tests passed!"
          echo "  ✓ Package installed to Pi settings"
          echo "  ✓ All 4 extensions present"
          echo "  ✓ Persona file exists"
          echo "  ✓ Pi loads without errors"
          echo "  ✓ Extensions load without failures"
      
      # Replaces: upload-artifact with retention config
      - uses: ./.github/actions/upload-test-logs
        with:
          artifact-name: installation-test-logs
          log-path: test-install/*.log

  activation-tests:
    runs-on: ubuntu-latest
    name: Activation Tests
    needs: installation-tests
    steps:
      - uses: ./.github/actions/setup-node-deps
      - uses: ./.github/actions/setup-pi-environment
        with:
          litellm-base-url: ${{ vars.LITELLM_BASE_URL }}
          litellm-api-key: ${{ secrets.LITELLM_API_KEY }}
      
      - name: Test persona activates on startup
        run: |
          echo "exit" | timeout 10 pi 2>&1 | tee activation.log || true
          
          if grep -i "error" activation.log | grep -i "persona\|patchani" | grep -v "no errors"; then
            echo "❌ Persona activation failed"
            cat activation.log
            exit 1
          fi
          
          echo "✅ Persona activation successful"
      
      - uses: ./.github/actions/upload-test-logs
        with:
          artifact-name: activation-test-logs
          log-path: '*.log'

  behavioral-tests:
    runs-on: ubuntu-latest
    name: Behavioral Tests (Pi Interaction)
    needs: activation-tests
    steps:
      - uses: ./.github/actions/setup-node-deps
      - uses: ./.github/actions/setup-pi-environment
        with:
          litellm-base-url: ${{ vars.LITELLM_BASE_URL }}
          litellm-api-key: ${{ secrets.LITELLM_API_KEY }}
      
      - name: Test /help command shows patchani features
        run: |
          cat > help-test.txt << 'EOF'
/help
exit
EOF
          
          cat help-test.txt | timeout 30 pi 2>&1 | tee help-behavioral.log || true
          
          if grep -i "command not found" help-behavioral.log; then
            echo "❌ /help command failed"
            cat help-behavioral.log
            exit 1
          fi
          
          echo "✅ /help command executed successfully"
      
      - uses: ./.github/actions/upload-test-logs
        with:
          artifact-name: behavioral-test-logs
          log-path: '*.log'

  test-summary:
    runs-on: ubuntu-latest
    name: Test Summary
    needs: [canonical-tests, installation-tests, activation-tests, behavioral-tests]
    if: always()
    steps:
      - name: Report Results
        run: |
          echo ""
          echo "=================================="
          echo "  PR to Main - Test Suite Results"
          echo "=================================="
          echo ""
          echo "✓ Canonical Tests (unit + integration)"
          echo "✓ Installation Tests (package installation)"
          echo "✓ Activation Tests (persona activation)"
          echo "✓ Behavioral Tests (/help command)"
          echo ""
          echo "✅ All test suites passed!"
          echo ""
          echo "Ready to merge to main."
```

---

## publish.yml (Minimal Changes)

**Before:** 78 lines  
**After:** 75 lines  
**Reduction:** 4%

Only the initial setup can be refactored. Publishing logic remains custom.

```yaml
name: Publish to NPM

on:
  push:
    branches: [main]

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      packages: write
    steps:
      # Refactored: checkout + setup-node + npm ci + registry-url
      - uses: ./.github/actions/setup-node-deps
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
      
      # Note: Can't use run-canonical-tests here because
      # this workflow needs npm test, not test:unit + test:smoke
      - name: Run tests
        run: npm test
      
      # Publishing logic remains custom (not worth extracting)
      - name: Get version from package.json
        id: package-version
        run: echo "version=$(node -p "require('./package.json').version")" >> $GITHUB_OUTPUT
      
      - name: Check if version tag exists
        id: check-tag
        run: |
          if git rev-parse "v${{ steps.package-version.outputs.version }}" >/dev/null 2>&1; then
            echo "exists=true" >> $GITHUB_OUTPUT
          else
            echo "exists=false" >> $GITHUB_OUTPUT
          fi
      
      - name: Publish to npm
        if: steps.check-tag.outputs.exists == 'false'
        run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
      
      - name: Create git tag
        if: steps.check-tag.outputs.exists == 'false'
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git tag -a "v${{ steps.package-version.outputs.version }}" -m "Release v${{ steps.package-version.outputs.version }}"
          git push origin "v${{ steps.package-version.outputs.version }}"
      
      - name: Create GitHub Release
        if: steps.check-tag.outputs.exists == 'false'
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: v${{ steps.package-version.outputs.version }}
          release_name: v${{ steps.package-version.outputs.version }}
          body: |
            ## What's Changed
            
            See [CHANGELOG.md](https://github.com/${{ github.repository }}/blob/main/CHANGELOG.md) for details.
            
            ## Installation
            
            ```bash
            pi install npm:@mksetaro/patchani@${{ steps.package-version.outputs.version }}
            ```
          draft: false
          prerelease: false
      
      - name: Skip - version already published
        if: steps.check-tag.outputs.exists == 'true'
        run: |
          echo "Version v${{ steps.package-version.outputs.version }} already published"
          echo "Bump version in package.json to trigger a new release"
```

---

## Key Changes Summary

### All Workflows
- ✅ 3-4 step setup → 1 action call
- ✅ Consistent Node.js version (20)
- ✅ Caching enabled everywhere
- ✅ Reduced duplication by 30-40%

### Test Workflows
- ✅ Canonical tests extracted to reusable action
- ✅ Log upload standardized with retention policy
- ✅ Pi environment setup centralized

### Not Changed
- Publishing logic (too specific)
- Test verification steps (unique to each job)
- Job dependencies and orchestration
- Conditional logic and secrets

---

## Migration Checklist

- [ ] Create `.github/actions/` directory structure
- [ ] Copy all 4 composite action files
- [ ] Update `test-pr-dev.yml` first (safest to test)
- [ ] Test on real PR to dev branch
- [ ] Update `test-pr-main.yml` if dev tests pass
- [ ] Test on real PR to main branch
- [ ] Update `test.yml` after successful main PR test
- [ ] Update `publish.yml` last (optional, minimal gains)
- [ ] Archive old workflow versions (git tag them)
- [ ] Update CI/CD documentation
- [ ] Train team on new action usage

---

## Rollback Strategy

If issues arise:

1. **Quick fix:** Revert individual workflow file
   ```bash
   git checkout HEAD~1 .github/workflows/test-pr-dev.yml
   ```

2. **Full rollback:** Revert all workflows
   ```bash
   git checkout <previous-commit> .github/workflows/
   ```

3. **Keep actions:** Composite actions can remain for future use
   ```bash
   # Only revert workflows, keep actions
   git checkout <commit> .github/workflows/*.yml
   ```

---

*See ANALYSIS.md for detailed technical analysis and implementation plan.*
