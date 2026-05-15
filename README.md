<!-- SPDX-License-Identifier: MIT OR Apache-2.0 -->
# strapi-helm-charts

[![lint-test](https://github.com/XMV-Solutions-GmbH/strapi-helm-charts/actions/workflows/lint-test.yaml/badge.svg?branch=main)](https://github.com/XMV-Solutions-GmbH/strapi-helm-charts/actions/workflows/lint-test.yaml)
[![Release](https://img.shields.io/github/v/release/XMV-Solutions-GmbH/strapi-helm-charts?include_prereleases&label=chart&color=0E7EE0)](https://github.com/XMV-Solutions-GmbH/strapi-helm-charts/releases)
[![Helm](https://img.shields.io/badge/helm-v3.10%2B-blue?logo=helm)](https://helm.sh)
[![Strapi](https://img.shields.io/badge/strapi-v5-4945ff?logo=strapi)](https://strapi.io)
[![ArtifactHub](https://img.shields.io/endpoint?url=https://artifacthub.io/badge/repository/strapi-xmv)](https://artifacthub.io/packages/search?repo=strapi-xmv)
[![Licence](https://img.shields.io/badge/licence-MIT%20OR%20Apache--2.0-blue.svg)](#licence)
[![Contributions welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg)](https://github.com/XMV-Solutions-GmbH/strapi-helm-charts/issues)

> Helm chart for self-hosted **[Strapi v5](https://strapi.io)** on Kubernetes
> — focused on **production deployments with an external database and S3-compatible
> object storage**. Verified on `linux/amd64` and `linux/arm64`.

> [!NOTE]
> Developed with the goal of contributing this chart to the official
> [Strapi](https://github.com/strapi) GitHub organisation. Track the
> upstream discussion at
> <https://github.com/strapi/strapi/discussions/25881>.

## Table of contents

- [Why this chart](#why-this-chart)
- [Quickstart](#quickstart)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
  - [From the Helm repo](#from-the-helm-repo)
  - [From source](#from-source)
- [Database setup](#database-setup)
- [Media storage](#media-storage)
- [Strapi secrets](#strapi-secrets)
- [Ingress + TLS](#ingress--tls)
- [Custom image / WORKDIR](#custom-image--workdir)
- [Configuration reference](#configuration-reference)
- [Testing](#testing)
- [Comparison with other community charts](#comparison-with-other-community-charts)
- [Contributing](#contributing)
- [Security](#security)
- [Licence](#licence)
- [Maintainers](#maintainers)

## Why this chart

| What you want | What this chart does |
|---|---|
| **External DB only** (CNPG, Cloud SQL, RDS, Hetzner-managed Postgres) | No bundled database subchart. You point `database.host` at your own Postgres endpoint. |
| **S3-compatible media** (MinIO, AWS S3, Hetzner Object Storage) | First-class via Strapi's `@strapi/provider-upload-aws-s3` — set keys via `existingSecret` references. |
| **ARM64 / multi-arch nodes** (Hetzner CAX, Graviton, Apple Silicon dev) | Verified `linux/amd64` + `linux/arm64`. No architecture-specific values needed. |
| **Sealed Secrets / External Secrets Operator** | Every credential field has an `existingSecret` mode — no plain-text values required in `values.yaml`. |
| **Ingress with TLS** | Standard `Ingress` resource with cert-manager annotations support. |
| **HPA** | Optional via `autoscaling.enabled=true`. |

What this chart **deliberately does not do**:

- **Bundle a database.** Operationally a Strapi instance and its Postgres have very different lifecycles. Run [CloudNativePG](https://cloudnative-pg.io/) (or your cloud provider's managed Postgres) and point this chart at it.
- **Bundle a backup job.** Backups are a property of the data plane, not the workload — your DB operator already has barman / pg_basebackup / WAL archiving. Your S3 provider gives you object-level retention.

If you want one chart that bundles Strapi + Postgres + S3 backup CronJob into a single install, the [HelmForge Strapi chart](https://github.com/helmforgedev/charts/tree/main/charts/strapi) is a better fit. See [comparison below](#comparison-with-other-community-charts).

## Quickstart

```bash
helm repo add strapi-community https://xmv-solutions-gmbh.github.io/strapi-helm-charts
helm repo update

helm install my-strapi strapi-community/strapi \
  --namespace strapi --create-namespace \
  --set image.repository=strapi/strapi \
  --set database.host=my-postgres.example.com \
  --set database.existingSecret=strapi-db-password \
  --set strapi.existingSecret=strapi-keys \
  --set ingress.enabled=true \
  --set ingress.hosts[0].host=cms.example.com
```

## Prerequisites

| | |
|---|---|
| Kubernetes | 1.26+ (CRDs used: `Ingress` networking.k8s.io/v1, `PersistentVolumeClaim`) |
| Helm | 3.10+ |
| Database | PostgreSQL 14+ reachable from the cluster (CNPG / Cloud SQL / RDS / Hetzner managed) |
| Storage (optional) | An S3-compatible bucket OR a `PersistentVolumeClaim` storage class |
| Strapi image | A multi-arch image of Strapi v5. The chart defaults to `strapi/strapi` from Docker Hub; see [Custom image](#custom-image--workdir) for caveats. |

## Installation

### From the Helm repo

```bash
helm repo add strapi-community https://xmv-solutions-gmbh.github.io/strapi-helm-charts
helm repo update
helm install my-strapi strapi-community/strapi -n strapi --create-namespace -f my-values.yaml
```

### From source

```bash
git clone https://github.com/XMV-Solutions-GmbH/strapi-helm-charts.git
cd strapi-helm-charts
helm install my-strapi charts/strapi -n strapi --create-namespace -f my-values.yaml
```

## Database setup

The chart writes the standard Strapi `DATABASE_*` environment variables. You provide:

- `database.host`, `database.port`, `database.name`, `database.username` — plain values, non-secret.
- `database.password` **or** `database.existingSecret` (key `DATABASE_PASSWORD`) — the password.

For [CloudNativePG](https://cloudnative-pg.io/) clusters whose generated secret uses the key `password` (not `DATABASE_PASSWORD`), create a tiny remap-secret once:

```bash
DBPASS=$(kubectl get secret <cnpg-cluster>-app -o jsonpath='{.data.password}' | base64 -d)
kubectl create secret generic strapi-db-password \
  --from-literal=DATABASE_PASSWORD="$DBPASS"
```

Then in values:

```yaml
database:
  host: <cnpg-cluster>-rw
  existingSecret: strapi-db-password
```

## Media storage

Two modes — pick one:

### S3 / MinIO / Hetzner Object Storage (recommended for production)

```yaml
uploads:
  provider: aws-s3
  s3:
    region: nbg1
    bucket: my-strapi-media
    endpoint: https://nbg1.your-objectstorage.com   # leave empty for AWS
    existingSecret: my-s3-credentials               # keys: S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY
```

### Local PVC (small / single-replica)

```yaml
uploads:
  provider: local
persistence:
  enabled: true
  storageClass: my-class
  size: 20Gi
  # mountPath: /opt/app/public/uploads   # only override for custom images, see below
```

## Strapi secrets

Five Strapi-specific keys (`APP_KEYS`, `API_TOKEN_SALT`, `ADMIN_JWT_SECRET`, `JWT_SECRET`, `TRANSFER_TOKEN_SALT`) — provide via `existingSecret` rather than plain text:

```yaml
strapi:
  existingSecret: strapi-keys
```

Generate the secret:

```bash
kubectl create secret generic strapi-keys \
  --from-literal=APP_KEYS=$(openssl rand -base64 32) \
  --from-literal=API_TOKEN_SALT=$(openssl rand -base64 32) \
  --from-literal=ADMIN_JWT_SECRET=$(openssl rand -base64 32) \
  --from-literal=JWT_SECRET=$(openssl rand -base64 32) \
  --from-literal=TRANSFER_TOKEN_SALT=$(openssl rand -base64 32)
```

For GitOps deployments, the same secret can be a `SealedSecret` or an `ExternalSecret`.

## Ingress + TLS

```yaml
ingress:
  enabled: true
  className: nginx
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
  hosts:
    - host: cms.example.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: strapi-tls
      hosts:
        - cms.example.com
```

## Custom image / WORKDIR

The chart defaults to `strapi/strapi` from Docker Hub and assumes the WORKDIR convention used by the upstream [strapi-community/strapi-tool-dockerize](https://github.com/strapi-community/strapi-tool-dockerize) `Dockerfile-prod` template: **`/opt/app`**.

If you build your own Strapi image with a different WORKDIR (for example `/app`), override the uploads mount path accordingly when `uploads.provider: local`:

```yaml
image:
  repository: ghcr.io/my-org/strapi
  tag: v5.10.0
persistence:
  enabled: true
  mountPath: /app/public/uploads   # override for custom WORKDIR
```

S3-mode deployments don't need this — the chart doesn't mount any local volume in that path.

## Configuration reference

The complete list of values with inline documentation lives in
[`charts/strapi/values.yaml`](charts/strapi/values.yaml). Highlights:

| Value | Default | Purpose |
|---|---|---|
| `image.repository` | `strapi/strapi` | Container image. |
| `image.tag` | `Chart.appVersion` | Image tag; pin to a specific Strapi version. |
| `replicaCount` | `1` | Strapi runs single-replica by default; scale up only with shared media + sticky sessions. |
| `database.host` | `""` | Postgres host. Mandatory (no default — fail-fast). |
| `database.existingSecret` | `""` | Secret carrying `DATABASE_PASSWORD`. Preferred over `database.password`. |
| `uploads.provider` | `aws-s3` | `aws-s3` or `local`. |
| `persistence.enabled` | `false` | Required when `uploads.provider=local`. |
| `persistence.mountPath` | `/opt/app/public/uploads` | Override for custom-WORKDIR images. |
| `ingress.enabled` | `true` | Standard `Ingress` with cert-manager-friendly annotations. |
| `autoscaling.enabled` | `false` | Optional HPA. |
| `strapi.existingSecret` | `""` | Strongly recommended over plain `strapi.appKeys` etc. |

## Testing

The chart ships with a [`helm-unittest`](https://github.com/helm-unittest/helm-unittest) suite covering every template:

```bash
helm plugin install https://github.com/helm-unittest/helm-unittest --version 0.7.2
helm unittest charts/strapi
```

CI also runs `helm lint`, `ct lint`, and a real `helm install` smoke-test on a kind cluster on every PR — see [`.github/workflows/lint-test.yaml`](.github/workflows/lint-test.yaml).

## Comparison with other community charts

|  | this chart | [HelmForge](https://github.com/helmforgedev/charts/tree/main/charts/strapi) |
|---|---|---|
| Database | External only | SQLite / PostgreSQL / MySQL subcharts (bundled option) |
| Backups | Delegated to the DB operator + your S3 provider's lifecycle policy | Built-in `CronJob` that dumps DB + tars uploads + uploads to S3 |
| Scope | Production CMS, externalised data plane | Self-contained "give me Strapi + a DB" |
| Multi-arch | ✅ verified on `linux/amd64` + `linux/arm64` | Generic |
| Licence | MIT OR Apache-2.0 | Apache-2.0 |

Pick whichever fits your operational model — both are valid choices.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Bug reports, feature ideas, and PRs welcome.

## Security

Vulnerabilities: please follow [SECURITY.md](SECURITY.md) — private email to `oss@xmv.de`, do **not** open a public issue.

## Licence

Dual-licensed under either of:

- Apache License, Version 2.0 ([LICENSE-APACHE](LICENSE-APACHE) or <http://www.apache.org/licenses/LICENSE-2.0>)
- MIT licence ([LICENSE-MIT](LICENSE-MIT) or <http://opensource.org/licenses/MIT>)

at your option.

Unless you explicitly state otherwise, any contribution intentionally submitted for inclusion in this project by you, as defined in the Apache-2.0 license, shall be dual licensed as above, without any additional terms or conditions.

This chart deploys [Strapi](https://strapi.io), which is itself licensed under the MIT license (Community Edition; the `ee/` directory is licensed separately — see [strapi/strapi LICENSE](https://github.com/strapi/strapi/blob/develop/LICENSE)). The chart code in this repository is not a derivative work of Strapi — it is Kubernetes orchestration metadata that points at Strapi's container image.

## Maintainers

- **XMV Solutions GmbH** — <oss@xmv.de> — <https://xmv.de/en/oss/>

Contributions and external maintainers very welcome — see [CONTRIBUTING.md](CONTRIBUTING.md).
