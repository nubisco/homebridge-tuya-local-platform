# Maintainer Setup Checklist

This file documents recommended repository settings that must be configured in GitHub, not in code.

## Branch Protection (default branch: `master`)

- Protect `master`
- Require pull request before merge
- Require status checks to pass before merging
- Require conversation resolution before merge (recommended)
- Disable force pushes
- Disable branch deletion

## Security and Dependency Settings

- Enable Dependabot alerts
- Enable Dependabot security updates
- Enable private vulnerability reporting
- Keep CodeQL enabled (already configured in workflow)

## Community Settings

- Enable GitHub Discussions (optional, recommended for support questions)
- Set issue templates as the default issue intake flow
- Verify `SECURITY.md`, `CODE_OF_CONDUCT.md`, and `FUNDING.yml` are active

## npm Trusted Publishing

- Ensure npm Trusted Publisher is configured for this repository
- Keep GitHub Actions environment `production` configured for release workflow
- Keep `id-token: write` permission in release workflow
