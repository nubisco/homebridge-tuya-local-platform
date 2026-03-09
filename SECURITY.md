# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 1.x     | Yes       |
| < 1.0   | No        |

## Reporting a Vulnerability

Please report suspected vulnerabilities privately.

- Preferred: GitHub private vulnerability reporting (Security tab)
- Alternative: email jose@nubisco.io with the subject `Security: homebridge-tuya-local-platform`

Please do not open public GitHub issues for security reports before disclosure is coordinated.

## What to Include

Please provide as much detail as possible:

- Affected plugin version
- A clear description of the issue and impact
- Steps to reproduce or proof-of-concept details
- Relevant logs, stack traces, or configuration snippets (redacted)
- Any suggested mitigation if known

## Scope

In scope:

- Remote code execution, command injection, path traversal
- Authentication or authorization bypass in plugin-related flows
- Sensitive data exposure (keys, credentials, tokens)
- Dependency vulnerabilities with practical impact on this project

Out of scope:

- Vulnerabilities in unsupported versions
- Issues requiring unrealistic local attacker assumptions with no practical impact
- General hardening suggestions without a concrete vulnerability

## Response Expectations

This is a community-maintained open source project.

- We aim to acknowledge valid reports within 7 business days
- Triage and remediation timelines depend on severity and maintainer availability
- We may ask for additional details to validate and reproduce reports
- Credit can be provided in release notes unless you prefer to remain anonymous
