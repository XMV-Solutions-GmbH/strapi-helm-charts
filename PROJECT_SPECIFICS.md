<!--
SPDX-License-Identifier: MIT OR Apache-2.0
SPDX-FileCopyrightText: 2026 XMV Solutions GmbH
-->

# PROJECT_SPECIFICS.md — `strapi-helm-charts`

> **Operator-to-verify note.** This file was pre-filled best-effort from
> `README.md` during the Canon adoption. Every field marked
> **`[verify]`** below was derived from the README, not from first-hand
> operator knowledge — confirm or correct each one, then delete the marker.
> Replace any remaining `<PLACEHOLDER>` and delete this note once done.

Project-specific content for `strapi-helm-charts`. Read after `AGENTS.md` per its reading order. Everything in here is specific to this repo; the generic agent rules live in `AGENTS.md` + `ENGINEERING_PRINCIPLES.md` + `PROJECT_MANAGEMENT_PRINCIPLES.md`.

## What this project is

`strapi-helm-charts` — a Helm chart for self-hosted [Strapi v5](https://strapi.io) on Kubernetes, focused on production deployments with an external database and S3-compatible object storage. Verified on `linux/amd64` and `linux/arm64`. **`[verify]`**

The chart deliberately does **not** bundle a database or a backup job — it expects an external Postgres (CloudNativePG / Cloud SQL / RDS / Hetzner-managed) and delegates backups to the data plane. **`[verify]`**

The stated long-term goal is to contribute this chart to the official [Strapi](https://github.com/strapi) GitHub organisation (upstream discussion: <https://github.com/strapi/strapi/discussions/25881>). **`[verify]`**

This repo has no `docs/app-concept.md` yet. If/when one is added, it becomes the canonical vision-and-scope source and should be linked here. **`[verify]`**

## Project-specific docs

| Doc | Purpose |
|---|---|
| [`README.md`](README.md) | Quickstart, configuration reference, comparison with other community charts |
| [`charts/strapi/values.yaml`](charts/strapi/values.yaml) | Complete list of chart values with inline documentation |
| [`charts/strapi/README.md`](charts/strapi/README.md) | Per-chart README |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Contribution guidelines |
| [`SECURITY.md`](SECURITY.md) | How to report security issues (private email to `oss@xmv.de`) |
| [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) | Code of conduct |
| [`CHANGELOG.md`](CHANGELOG.md) | Keep-a-changelog history |

Recommended-but-absent docs (create when first needed, then link here): `docs/app-concept.md`, `docs/testconcept.md`, `docs/proposals/`. **`[verify]`**

## Tracker

**GitHub Issues + the repo-bound GitHub Project** at <https://github.com/XMV-Solutions-GmbH/strapi-helm-charts/issues>. See `ENGINEERING_PRINCIPLES.md` § 2. No `docs/todo.md` or other markdown TODO files. **`[verify]`**

Recommended labels: `type:feat` / `type:fix` / `type:chore` / `type:docs` / `type:test`; `area:<component>`; `priority:p0` / `p1` / `p2`. Add `agent:<tool-name>` (e.g. `agent:claude`, `agent:codex`) when an AI agent is the executor.

Issue body convention: `## Context`, `## Acceptance criteria` (checkbox list), `## Out of scope`, `## Links`. Milestones map to releases.

This is a public-facing open-source repo (dual MIT OR Apache-2.0). Issue templates already exist under `.github/ISSUE_TEMPLATE/`. **`[verify]`**

## Tech stack

<!-- Derived from README.md + repo layout. -->

- **Helm** 3.10+ — chart packaging and templating. **`[verify]`**
- **Strapi v5** — the application the chart deploys. **`[verify]`**
- **Kubernetes** 1.26+ — target platform (`Ingress` networking.k8s.io/v1, `PersistentVolumeClaim`). **`[verify]`**
- **PostgreSQL** 14+ — external database (not bundled). **`[verify]`**
- **S3-compatible object storage** — MinIO / AWS S3 / Hetzner Object Storage, via `@strapi/provider-upload-aws-s3`. **`[verify]`**
- **Testing:** [`helm-unittest`](https://github.com/helm-unittest/helm-unittest) (chart unit tests under `charts/strapi/tests/`), `helm lint`, [`chart-testing`](https://github.com/helm/chart-testing) (`ct lint`), and a `helm install` smoke-test on a kind cluster in CI. **`[verify]`**
- **CI/CD:** GitHub Actions — `.github/workflows/lint-test.yaml`, `release.yaml`, `build-image.yaml`. ArtifactHub publishing + GitHub Pages Helm repo (`gh-pages` branch). **`[verify]`**
- **Container image:** an `image/` directory ships a custom multi-arch Strapi image build. **`[verify]`**

## Project-specific overrides of the engineering baseline

<!-- Document deviations from ENGINEERING_PRINCIPLES.md here, with the
     paragraph reference and a one-line justification. -->

- **Licence (§ 1 / licence headers).** This repo is dual-licensed **MIT OR Apache-2.0** (public OSS), not `LicenseRef-XMV-Proprietary`. New source files in this repo carry `SPDX-License-Identifier: MIT OR Apache-2.0`. The Canon agent docs (`AGENTS.md`, `ENGINEERING_PRINCIPLES.md`, `PROJECT_MANAGEMENT_PRINCIPLES.md`) retain their `LicenseRef-XMV-Proprietary` header because they are XMV IP carried in verbatim, not part of the published chart. **`[verify]`**
- TBD (add further deviations as they arise).

## Environments + URLs

<!-- Sandbox / harness / staging / production hostnames, dashboards,
     shared inboxes, mailbox addresses, cluster references. -->

- **Helm repo (published):** <https://xmv-solutions-gmbh.github.io/strapi-helm-charts> (served from the `gh-pages` branch). **`[verify]`**
- **ArtifactHub:** repo `strapi-xmv` — <https://artifacthub.io/packages/search?repo=strapi-xmv>. **`[verify]`**
- **Security / OSS contact:** `oss@xmv.de` — <https://xmv.de/en/oss/>. **`[verify]`**
- TBD (CI runners, kind smoke-test specifics, etc.).

## Glossary

<!-- Domain terms specific to this project. -->

- **CNPG** — [CloudNativePG](https://cloudnative-pg.io/), the recommended external Postgres operator.
- **`existingSecret`** — chart pattern where a credential is supplied by reference to a pre-existing Kubernetes `Secret` (Sealed Secrets / External Secrets friendly) rather than plain text in `values.yaml`.
- **WORKDIR** — the Strapi container working directory (`/opt/app` by upstream convention); affects the local-uploads `persistence.mountPath`.
- TBD (add further terms as they arise).
