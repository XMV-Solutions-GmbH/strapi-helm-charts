<!-- SPDX-License-Identifier: MIT OR Apache-2.0 -->
# Changelog

All notable changes to this chart are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the chart's `version` follows [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- `persistence.mountPath` value lets operators override the uploads-volume
  mount path when their image's `WORKDIR` differs from the upstream
  `strapi-tool-dockerize` convention (`/opt/app/public/uploads`).
- `helm-unittest` test suite covering deployment, ingress, PVC, and service
  rendering. CI runs lint, unit tests, and a kind-cluster smoke test on every
  PR (`.github/workflows/lint-test.yaml`).
- Dual MIT OR Apache-2.0 licensing (was MIT-only) — clarifies patent-grant
  status for enterprise adopters while staying compatible with Strapi CE.
- `SECURITY.md` with private disclosure channel.
- `CODE_OF_CONDUCT.md` (Contributor Covenant 2.1).
- `repo.ini` mirrored from `oss-project-template` for shared OSS tooling.

### Changed

- `LICENSE` copyright corrected from "Strapi Solutions SAS" to "XMV Solutions GmbH"
  (the chart code is authored by XMV, not Strapi — the chart deploys Strapi
  but does not contain Strapi source).
- `artifacthub.io/license` annotation updated to `Apache-2.0 OR MIT`.

## [0.1.0] - 2026-05-14

### Added

- Initial Helm chart skeleton for Strapi v5.
- Deployment, service, ingress, PVC, serviceaccount templates.
- External PostgreSQL configuration (CNPG / Cloud SQL / RDS compatible).
- S3-compatible media storage configuration (AWS S3, MinIO, Hetzner).
- Optional local PVC for uploads when S3 is not used.
- Multi-arch verified: `linux/amd64` + `linux/arm64` (Hetzner CAX / Ampere Altra).
