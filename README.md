# strapi-helm-charts

> [!NOTE]
> This is a community-maintained Helm chart for Strapi, developed with the
> goal of contributing it to the official [strapi](https://github.com/strapi)
> GitHub organisation. Track the upstream discussion at
> https://github.com/strapi/strapi/discussions/25881

Helm charts for deploying [Strapi](https://strapi.io) — the leading
open-source headless CMS — on Kubernetes.

## Charts

| Chart | Description | Version |
|---|---|---|
| [strapi](charts/strapi) | Strapi headless CMS | ![version](https://img.shields.io/github/v/release/XMV-Solutions-GmbH/strapi-helm-charts) |

## Add the Helm repository

```bash
helm repo add strapi-community https://xmv-solutions-gmbh.github.io/strapi-helm-charts
helm repo update
```

## Install

```bash
helm install my-strapi strapi-community/strapi \
  --namespace strapi \
  --create-namespace \
  --values my-values.yaml
```

## Prerequisites

- Kubernetes 1.26+
- Helm 3.10+
- An external PostgreSQL instance (e.g. [CloudNativePG](https://cloudnative-pg.io/))
- S3-compatible storage for media uploads (optional but recommended for production)

## Features

- Supports **linux/amd64** and **linux/arm64** (Graviton, Hetzner CAX, Apple Silicon)
- External PostgreSQL (no bundled database)
- S3-compatible media storage (MinIO, AWS S3, Hetzner Object Storage)
- Ingress with TLS via cert-manager
- Secret references compatible with Sealed Secrets and External Secrets Operator
- HPA-ready

## Configuration

See [charts/strapi/values.yaml](charts/strapi/values.yaml) for the full
list of configurable parameters with inline documentation.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
