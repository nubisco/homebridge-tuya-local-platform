# Contributing

Thanks for contributing to `@nubisco/homebridge-tuya-local-platform`.

For full contributor documentation, see `docs/contributing.md`.

## Local Setup

```bash
git clone https://github.com/nubisco/homebridge-tuya-local-platform.git
cd homebridge-tuya-local-platform
npm install
```

## Development Commands

```bash
npm run lint
npm run format:check
npm test
npm run build
npm run docs:build
```

Notes:

- Minimum supported Node.js version is `20`
- Homebridge compatibility is `>=1.6.0`

Compatibility policy:

- `peerDependencies` declare the minimum supported Homebridge version for users (`>=1.6.0`)
- `devDependencies` track the latest stable Homebridge 1.x for local development and CI
- Keep both in sync with real compatibility: widen support only when verified by tests and manual validation

## Branch and PR Expectations

- Create focused branches (one concern per PR)
- Keep pull requests small and reviewable
- Use Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `chore:`, `ci:`)
- Run lint, test, and build before opening a PR

## Coding Style

- TypeScript project with strict linting and formatting
- 2-space indentation, LF line endings
- Keep runtime behavior changes intentional and documented

## Issue Routing

- Use **Bug report** for regressions and reproducible defects
- Use **Device support request** for unsupported models or category mappings
- Include redacted logs and config snippets in all technical reports

## Keep Changes Focused

- Avoid unrelated refactors in the same PR
- Update docs when behavior, configuration, or supported devices change
- Add or update tests for non-trivial logic changes

## Quality gate

Before committing or pushing, run:

```sh
npm run quality:check
```

The local Git hooks are expected to enforce the same gate automatically. Commits must not proceed unless tests, linting, formatting, and type checks all pass.
