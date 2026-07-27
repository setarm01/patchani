# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.3] - 2026-07-27

### Added
- TUI component preview system (`npm run preview-tui`)
  - Real Pi TUI components rendering (Container, SelectList, Text, Box, Spacer)
  - Interactive menu to preview Work Selector, Complexity Router, Activation Banner
  - Visual validation tool for TUI development
- TUI extensions: work-selector, complexity-router, workflow-graph

### Changed
- Updated persona discipline: zero artifacts in repo without approval
- Internal artifacts moved to `~/.patchani/` (session continuity)
- Improved testing documentation with TUI preview workflow
- Package type: "module" for ESM support

### Removed
- Noisy documentation artifacts (DELIVERABLES.md, INTEGRATION-*.md)
- Useless test-ui.js mockup (replaced with real component preview)

## [0.1.2] - 2026-07-26

### Fixed
- Remove chalk dependency (replaced with ANSI escape codes)
- Fix package to work correctly when installed via `pi install patchani`

### Changed
- Rewrite smoke tests to install package in isolation (test as users will)
- Add `prepublishOnly` hook to run full test suite before publish
- Improve .npmignore to exclude .pi/ directory

### Added
- Comprehensive testing documentation in `docs/testing.md`

### Removed
- Unused `scripts/postinstall.js`

## [0.1.1] - 2026-07-26

### Fixed
- Smoke tests now use Pi CLI with public MockGPT endpoint
- Node 22 requirement for smoke tests (Pi compatibility)
- Separated unit and smoke tests for parallel execution

### Changed
- Documentation cleanup: removed bloated docs (POST-MORTEM, INSTALL, DEVELOPMENT)
- Trimmed README to 34 lines
- Removed TUI welcome screen (caused Pi freeze)
- Simplified CI workflows (parallel test jobs)
- Removed unused GitHub Actions

### Security
- All workflow runs with exposed secrets deleted
- Configured proper npm granular access token

## [0.1.0] - 2026-07-25

### Added
- Initial release
- Patchani persona with TUI welcome screen
- Design doc workflow (F1) with enforcement layer
- Standup sync: GitHub → Apple Reminders (F2)
- Workflow methodology enforcement
- Integration with Pi Dynamic Workflows
- Automatic dependency installation
- NPM package distribution

### Features
- **Persona**: Activates automatically on Pi startup with interactive welcome
- **Design Doc Workflow**: Structured design document creation and management
- **Enforcement Layer**: Hard gates to ensure workflow ordering
- **Standup Sync**: Two-way sync between GitHub issues and Apple Reminders
- **Extensions**: 4 modular extensions that can be used independently

### Documentation
- Installation guide with troubleshooting
- Design document template
- Persona definition
- Post-mortem analysis of installation approach
