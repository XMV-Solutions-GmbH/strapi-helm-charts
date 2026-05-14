# strapi-helm-charts

Helm chart for self-hosted [Strapi](https://strapi.io) CMS on Kubernetes.

**Status**: Work in progress — being validated on a real ARM64 Kubernetes
cluster (Hetzner CAX) before proposing as an official chart to the Strapi
project.

**Intended upstream**: `strapi/helm-charts` (a new repo in the Strapi GitHub
org). Track the discussion at https://github.com/strapi/strapi/discussions/25881

---

## Features

- Works on **linux/amd64** and **linux/arm64** (once the multi-arch base image
  PR is merged — see https://github.com/XMV-Solutions-GmbH/strapi-docker)
- External PostgreSQL support (tested with CloudNativePG)
- S3-compatible media uploads (MinIO, Hetzner Object Storage, AWS S3)
- Ingress with TLS via cert-manager
- Secret management via `existingSecret` references (compatible with
  Sealed Secrets and External Secrets Operator)
- HPA-ready

## Quick start (development)

```bash
helm install strapi ./charts/strapi \
  --set strapi.existingSecret=strapi-secrets \
  --set database.host=strapi-rw.strapi.svc.cluster.local \
  --set database.existingSecret=strapi-db-secret \
  --set ingress.hosts[0].host=cms.example.com \
  --set uploads.s3.bucket=strapi-media \
  --set uploads.s3.endpoint=https://nbg1.your-objectstorage.com \
  --set uploads.s3.existingSecret=strapi-s3-secret
```

## Values reference

See [charts/strapi/values.yaml](charts/strapi/values.yaml) — all values are
documented inline.

## Validation environment

| Property | Value |
|---|---|
| Kubernetes | Talos Linux on Hetzner CAX (ARM64, Ampere Altra) |
| Strapi version | 5.x |
| PostgreSQL | CloudNativePG (CNPG) |
| Media storage | Hetzner Object Storage (S3-compatible) |
| TLS | cert-manager + Let's Encrypt |
| Ingress | ingress-nginx |

## Contributing

This chart is being prepared for upstream contribution to the Strapi project.
Contributions welcome — please open issues or PRs in this repo. Once the
upstream `strapi/helm-charts` repo exists, this repo will redirect there.
