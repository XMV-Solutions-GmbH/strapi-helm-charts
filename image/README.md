<!-- SPDX-License-Identifier: MIT OR Apache-2.0 -->
# Strapi v5 base image

This directory builds the multi-arch base image that the [Helm chart](../charts/strapi/) in this repo defaults to.

## Published at

```
ghcr.io/xmv-solutions-gmbh/strapi:<tag>
```

| Tag | Meaning |
|---|---|
| `latest` | rolling tag pointing at the most recent `main` build |
| `main` | same as `latest` |
| `sha-<short>` | pinned to a specific commit |
| `<X.Y.Z>` / `<X.Y>` | published when a semver-style git tag is pushed (see [Releases](../CHANGELOG.md)) |

## What's inside

| Layer | What |
|---|---|
| Base | `node:22-alpine` |
| Runtime libs | `vips` (sharp dependency for image processing) |
| Strapi | v5 latest (`@strapi/strapi: ^5.0.0`) + `pg`, `react`, `styled-components` |
| User | non-root `node` (uid/gid 1000) |
| WORKDIR | `/app` |
| Port | `1337` |
| Health | `HEALTHCHECK` hitting `/_health` |

No content types, no XMV-specific code — this is the `create-strapi-app` boilerplate with production-tuned packaging plus a handful of operability hooks that are generic enough to be useful for any self-hosted Strapi:

- **Env-driven SSO** via `strapi-plugin-sso`. Off by default; flip `STRAPI_SSO_ENABLED=true` plus the matching `AZUREAD_*` / `GOOGLE_*` / `COGNITO_*` / `OIDC_*` env vars to activate.
- **Bootstrap-superadmin hook** in `src/index.ts`. When `STRAPI_BOOTSTRAP_SUPERADMIN_EMAIL` is set and the user doesn't yet exist, the hook idempotently creates that admin account on first start — so the operator can log in via SSO without a password-reset round-trip.
- **`PROXY_ENABLED=true`** wires `server.proxy.koa = true` so the same image works behind a reverse proxy (ingress-nginx, Cloudflare, …) that terminates TLS. Without this Strapi sees the inbound HTTP as "insecure" and refuses to set Secure cookies on SSO callbacks.
- **`URL`** environment variable populates `server.url` so the admin panel emits absolute links (password-reset, SSO redirect) that match the host the operator actually visits.

Note that Strapi v5 **disables the Content-Type Builder in production** (the `develop` server is required to edit schemas). For self-hosted deployments the canonical pattern is to author schemas in a `develop` instance, commit them, and build them into an image — see [Override](#override) below.

## Build locally

```bash
docker buildx build --platform linux/amd64,linux/arm64 -t my-strapi:test ./image
```

## Why a custom base image?

- Strapi's own `strapi/strapi` Docker Hub image is v3-only ([archived 2022](https://github.com/strapi/strapi-docker/commit/1565057aacd8bf9a19c69b37c03e68dd841196c)).
- Strapi v5 has multi-arch issues with `better-sqlite3` (kept in `devDependencies`) and TypeScript config resolution that this Dockerfile works around — see upstream tickets [strapi/strapi#26344](https://github.com/strapi/strapi/issues/26344), [#26345](https://github.com/strapi/strapi/issues/26345), [#26346](https://github.com/strapi/strapi/issues/26346).

## Override

If you need to add custom content types or plugins, build your own image with this one as the base and point the chart at yours via `image.repository`. A minimal downstream `Dockerfile` looks like:

```dockerfile
FROM ghcr.io/xmv-solutions-gmbh/strapi:<tag>

# Add your content-type schemas (authored on a develop instance,
# committed, then baked in here). The rsync step from the base image's
# build stage takes care of mirroring schema.json into dist/.
COPY src/api ./src/api
```

Build, push to your own registry, and `helm upgrade --set image.repository=…`. See the chart README's "Custom image / WORKDIR" section for the chart-side flags.

A concrete example of this pattern is XMV's own application layer at <https://github.com/XMV-Solutions-GmbH/xmv-strapi> — fully unrelated to this generic chart, just useful to read if you want a working blueprint with multi-arch CI, sealed secrets, GitOps overlays, and a content-seed script.
