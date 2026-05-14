# Contributing to strapi-helm-charts

Thank you for your interest in contributing! This chart is developed with the
goal of becoming an official Strapi Helm chart. Contributions are welcome.

## Before you start

- Check [open issues](https://github.com/XMV-Solutions-GmbH/strapi-helm-charts/issues)
  and [open PRs](https://github.com/XMV-Solutions-GmbH/strapi-helm-charts/pulls)
  to avoid duplicate work.
- For significant changes (new chart features, breaking value changes), open an
  issue first to discuss the approach.
- For upstream Strapi changes, see the [official contribution guide](https://github.com/strapi/strapi/blob/develop/CONTRIBUTING.md).

## Development setup

You need:
- [Helm](https://helm.sh/docs/intro/install/) ≥ 3.10
- [ct (chart-testing)](https://github.com/helm/chart-testing)
- [kind](https://kind.sigs.k8s.io/) (for local cluster tests)
- Docker with `buildx` (for ARM64 image validation)

```bash
# Lint the chart
ct lint --charts charts/strapi

# Install and test against a local kind cluster
kind create cluster --name strapi-test
ct install --charts charts/strapi
```

## Commit message format

Follow the [Conventional Commits](https://www.conventionalcommits.org/) format
used across Strapi projects:

```
type: short description

Optional body.
```

Types: `feat`, `fix`, `docs`, `chore`, `ci`, `refactor`

Examples:
- `feat: add PodDisruptionBudget support`
- `fix: correct S3 endpoint env var name`
- `docs: add MinIO configuration example`

## Chart versioning

- Bump `version` in `Chart.yaml` on every change (follows [semver](https://semver.org/))
- Bump `appVersion` when the default Strapi version changes
- Document changes in the `artifacthub.io/changes` annotation

## Pull request checklist

- [ ] `ct lint --charts charts/strapi` passes
- [ ] `helm template charts/strapi` produces valid YAML
- [ ] `Chart.yaml` version bumped
- [ ] `artifacthub.io/changes` annotation updated
- [ ] `values.yaml` changes are documented inline
- [ ] Breaking changes are noted in the PR description

## Code of conduct

This project follows the [Strapi Code of Conduct](https://github.com/strapi/strapi/blob/develop/CODE_OF_CONDUCT.md).
