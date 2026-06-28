# Strapi Helm Chart

Deploy [Strapi](https://strapi.io) — the open-source headless CMS — on Kubernetes.
Designed for production use with external PostgreSQL, S3-compatible media storage,
Ingress + TLS, and multi-arch images (linux/amd64 + linux/arm64).

## Prerequisites

- Kubernetes 1.25+
- Helm 3.10+
- External PostgreSQL (CNPG or any compatible endpoint)
- S3-compatible object storage for media uploads (AWS S3, MinIO, Hetzner Object
  Storage, …) — or a PVC if you prefer local storage

## Installation

```bash
helm repo add strapi-xmv https://xmv-solutions-gmbh.github.io/strapi-helm-charts
helm repo update

helm install my-strapi strapi-xmv/strapi \
  --set database.host=postgres-rw.default.svc.cluster.local \
  --set database.name=strapi \
  --set database.username=strapi \
  --set database.existingSecret=strapi-db-secret \
  --set strapi.existingSecret=strapi-app-secret \
  --set ingress.hosts[0].host=cms.example.com \
  --set ingress.tls[0].hosts[0]=cms.example.com \
  --set ingress.tls[0].secretName=strapi-tls
```

## Container image

There is no official multi-arch Strapi v5 image on Docker Hub (the archived
`strapi/strapi-docker` was v3-only). This chart defaults to a community-built
multi-arch image maintained alongside the chart at
`ghcr.io/xmv-solutions-gmbh/strapi:latest`.

To use **your own Strapi build**:

```yaml
image:
  repository: my-registry/my-strapi
  tag: "5.1.0"
```

## Secrets

Create the application secret before installing:

```bash
kubectl create secret generic strapi-app-secret \
  --from-literal=APP_KEYS="$(openssl rand -base64 32),$(openssl rand -base64 32)" \
  --from-literal=API_TOKEN_SALT="$(openssl rand -base64 32)" \
  --from-literal=ADMIN_JWT_SECRET="$(openssl rand -base64 32)" \
  --from-literal=JWT_SECRET="$(openssl rand -base64 32)" \
  --from-literal=TRANSFER_TOKEN_SALT="$(openssl rand -base64 32)"
```

Database password secret (key: `DATABASE_PASSWORD`):

```bash
kubectl create secret generic strapi-db-secret \
  --from-literal=DATABASE_PASSWORD=my-password
```

## Key configuration values

| Parameter | Description | Default |
|---|---|---|
| `image.repository` | Container image | `ghcr.io/xmv-solutions-gmbh/strapi` |
| `image.tag` | Image tag | `latest` |
| `strapi.existingSecret` | Secret with APP_KEYS, JWT_SECRET, … | `""` |
| `strapi.nodeEnv` | `NODE_ENV` | `production` |
| `database.host` | PostgreSQL hostname | `""` |
| `database.name` | Database name | `strapi` |
| `database.username` | Database user | `strapi` |
| `database.existingSecret` | Secret with DATABASE_PASSWORD | `""` |
| `uploads.provider` | Upload provider (`aws-s3` or `local`) | `aws-s3` |
| `uploads.s3.bucket` | S3 bucket name | `strapi-media` |
| `uploads.s3.endpoint` | S3 endpoint (empty = AWS) | `""` |
| `uploads.s3.existingSecret` | Secret with S3_ACCESS_KEY_ID + S3_SECRET_ACCESS_KEY | `""` |
| `persistence.enabled` | Enable PVC for local uploads | `false` |
| `persistence.mountPath` | Upload directory inside container | `/app/public/uploads` |
| `ingress.enabled` | Enable Ingress | `true` |
| `ingress.hosts[0].host` | Hostname | `cms.example.com` |
| `resources.requests.memory` | Memory request | `512Mi` |

Full list of values: see [values.yaml](values.yaml).

## Source code

https://github.com/XMV-Solutions-GmbH/strapi-helm-charts
