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

No content types, no XMV-specific code — this is the `create-strapi-app` boilerplate with production-tuned packaging. Content types and data are added at runtime via the admin UI and live in the configured Postgres database.

## Build locally

```bash
docker buildx build --platform linux/amd64,linux/arm64 -t my-strapi:test ./image
```

## Why a custom base image?

- Strapi's own `strapi/strapi` Docker Hub image is v3-only ([archived 2022](https://github.com/strapi/strapi-docker/commit/1565057aacd8bf9a19c69b37c03e68dd841196c)).
- Strapi v5 has multi-arch issues with `better-sqlite3` (kept in `devDependencies`) and TypeScript config resolution that this Dockerfile works around — see upstream tickets [strapi/strapi#26344](https://github.com/strapi/strapi/issues/26344), [#26345](https://github.com/strapi/strapi/issues/26345), [#26346](https://github.com/strapi/strapi/issues/26346).

## Override

If you need to add custom content types or plugins, build your own image with this one as the base, and point the chart at yours via `image.repository`. See the chart README "Custom image / WORKDIR" section.
