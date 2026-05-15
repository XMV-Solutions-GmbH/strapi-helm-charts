<!-- SPDX-License-Identifier: MIT OR Apache-2.0 -->
# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 0.x     | :white_check_mark: (latest minor only, pre-1.0) |

## Reporting a Vulnerability

If you discover a security vulnerability in this chart, please do **not** open a public issue.

### How to report

1. **Email**: Send details to **<oss@xmv.de>**
2. **Subject**: `[SECURITY] strapi-helm-charts: <brief description>`
3. **Include**:
   - Description of the vulnerability
   - Steps to reproduce (a minimal `helm template …` invocation is ideal)
   - Potential impact (Kubernetes API exposure, secret leakage, privilege escalation, …)
   - Suggested fix, if you have one

### Out of scope

Vulnerabilities in Strapi itself should be reported through [Strapi's security
process](https://github.com/strapi/strapi/security/policy). This chart only
deploys upstream Strapi; we forward downstream reports but cannot patch the
application.

### What to expect

- **Acknowledgment**: within 48 hours
- **Initial assessment**: within 7 days
- **Resolution timeline**: depends on severity, typically 30–90 days

### Disclosure policy

- We follow [responsible disclosure](https://en.wikipedia.org/wiki/Responsible_disclosure).
- We coordinate disclosure timing with the reporter.
- Credit is given in the security advisory unless the reporter prefers anonymity.

## Dependencies

We regularly review and update dependencies via Dependabot. Security updates are prioritised.
