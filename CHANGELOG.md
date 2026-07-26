# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
