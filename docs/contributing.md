# Contributing

Contributions are welcome! This project follows strict code quality standards and automated testing to maintain reliability.

## Development Setup

```bash
git clone https://github.com/nubisco/homebridge-tuya-local-platform.git
cd homebridge-tuya-local-platform
npm install
```

## Development Workflow

### Build & Watch

```bash
npm run build   # Compile TypeScript to dist/
npm run dev     # Watch mode (rebuilds on file changes)
```

### Code Quality

Before committing, ensure your code passes all checks:

```bash
npm run lint            # ESLint (must pass)
npm run format:check    # Prettier formatting check
npm run format          # Auto-format code
npm test                # Run all unit tests (must pass)
```

**Pre-commit checks:**

- Linting and formatting run automatically via `lint-staged` on commit
- All tests must pass before pushing to remote

### Testing

This project uses **Vitest** for unit testing. Tests are located in `tests/` and run against the TypeScript source directly.

```bash
npm test                # Run all tests
npm test -- --watch     # Run tests in watch mode
```

**Testing guidelines:**

- Add tests for new device types and accessory logic
- Mock HAP services/characteristics using the helpers in `tests/helpers.ts`
- Target 80%+ code coverage for new features
- Tests run in CI on Node 20 and 22

## Adding a New Device Type

1. **Create the accessory file:**
   - Create `src/accessories/{DeviceName}.accessory.ts` extending `BaseAccessory`
   - Implement `getCategory()` static method returning the HAP category
   - Implement `_registerPlatformAccessory()` to add HAP services
   - Implement `_registerCharacteristics()` to bind characteristics and handle DP updates

2. **Register the device type:**
   - Export as `default` from your accessory file
   - Add re-export in `src/accessories/index.ts`
   - Add lowercase type key → class mapping to `CLASS_DEF` in `src/index.ts`

3. **Update configuration schema:**
   - Add the type to the `oneOf` array in `config.schema.json`
   - Add device-specific config parameters with appropriate `condition` functions
   - Test in Homebridge Config UI X to ensure fields appear correctly

4. **Document the device:**
   - Add to the device table in `docs/introduction.md`
   - Add detailed configuration section in `docs/device-types.md` with:
     - Description and use case
     - Example JSON5 configuration
     - List of all DP overrides and optional parameters
     - Any special notes or warnings

5. **Add unit tests:**
   - Create a test file in `tests/{DeviceName}.test.ts`
   - Test service registration, characteristic binding, DP updates, and state changes
   - Use the mock helpers in `tests/helpers.ts`

6. **Verify the build:**
   ```bash
   npm run lint && npm test && npm run build
   ```

## Commit Message Format

This project uses **Conventional Commits** to trigger automatic releases and changelog generation. Commits **must** follow this format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**

- `feat:` — New feature (triggers minor version bump)
- `fix:` — Bug fix (triggers patch version bump)
- `docs:` — Documentation only
- `test:` — Adding or updating tests
- `refactor:` — Code refactoring (no functional changes)
- `chore:` — Maintenance tasks (dependencies, build config)
- `ci:` — CI/CD changes

**Examples:**

```bash
feat(accessories): add support for smart thermostat device type
fix(dehumidifier): correct rotation speed calculation
docs(device-types): add configuration examples for air purifiers
test(base-accessory): add tests for _getDividedState method
```

**Breaking changes:**
Add `BREAKING CHANGE:` in the footer or append `!` after the type:

```
feat(api)!: change DP mapping configuration format

BREAKING CHANGE: dpPower now requires string instead of number
```

## Code Style

- **TypeScript** with strict mode (`strictNullChecks` and `strictFunctionTypes` disabled)
- **Indentation**: 2 spaces (enforced by Prettier)
- **Line endings**: LF
- **Naming conventions**:
  - PascalCase for classes and types
  - camelCase for variables, functions, and methods
  - Prefix private members with `_`
- **File naming**:
  - Accessories: `{DeviceType}.accessory.ts`
  - Tests: `{DeviceType}.test.ts`

## Pull Request Process

1. Fork the repository and create a feature branch:

   ```bash
   git checkout -b feat/my-new-feature
   ```

2. Make your changes following the guidelines above

3. Ensure all checks pass:

   ```bash
   npm run lint && npm test && npm run build
   ```

4. Commit using conventional commit format

5. Push to your fork and open a pull request against `master`

6. Wait for CI checks to pass:
   - Linting (Node 22)
   - Build (Node 20, 22)
   - Tests (Node 20, 22)

7. Address any review feedback

## Documentation

Documentation is built with **VitePress** and deployed to GitHub Pages automatically on release.

### Local Docs Development

```bash
npm run docs:dev      # Start dev server (localhost:5173)
npm run docs:build    # Build static site to docs/.vitepress/dist/
npm run docs:preview  # Preview built docs
```

### Documentation Structure

```
docs/
  index.md               # Home page (hero + features)
  introduction.md        # Overview + device type table
  installation.md        # Installation instructions
  get-local-keys.md      # How to extract Tuya local keys
  configuration.md       # Basic configuration guide
  device-types.md        # Detailed device-specific config
  config-example.md      # Full config examples
  troubleshooting.md     # Common issues and solutions
  contributing.md        # This file
  credits.md             # Attribution
```

## Reporting Issues

When opening an issue, include:

- **Homebridge version**: `homebridge -V`
- **Node.js version**: `node -v`
- **Plugin version**: Check in Homebridge UI or `npm list @nubisco/homebridge-tuya-local-platform`
- **Device information**:
  - Device type (from your config)
  - Manufacturer and model
  - Tuya protocol version (3.1, 3.3, 3.4, or 3.5)
- **Relevant Homebridge log output** (enable debug mode if needed)
- **Device signature** (DPS state from logs) — redact device ID and key

## Release Process

Releases are **fully automated** via semantic-release:

1. Commits pushed to `master` trigger CI
2. semantic-release analyzes commit messages
3. If release-worthy commits exist:
   - Version is bumped automatically
   - `CHANGELOG.md` is generated
   - Git tag is created
   - GitHub release is published
   - Package is published to npm
   - Documentation is deployed to GitHub Pages

**You do not need to manually update version numbers or CHANGELOG.md.**

## Questions?

Open a [discussion](https://github.com/nubisco/homebridge-tuya-local-platform/discussions) for general questions or feature requests.
