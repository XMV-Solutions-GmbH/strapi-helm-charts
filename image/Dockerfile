# syntax=docker/dockerfile:1
# Production-ready multi-arch Strapi v5 base image.
# Supports linux/amd64 and linux/arm64 (Graviton, Hetzner CAX, Ampere Altra,
# Apple Silicon developer machines).
#
# This image is the companion artefact to the Helm chart in this repo:
# the chart's default `image.repository` resolves to the package published
# from this Dockerfile.
#
# Layered design notes:
#   - vips-dev is required in the BUILD stage because sharp ships
#     prebuilt binaries only for x64; on arm64 it compiles from source
#     against libvips and needs the headers.
#   - The RUNTIME stage carries only the slim vips package (no headers).

# ── stage 1: install + build ────────────────────────────────────────────────
FROM node:22-alpine AS builder

RUN apk add --no-cache \
    build-base \
    vips-dev \
    python3 \
    make \
    g++

WORKDIR /app

COPY package*.json ./
# Use npm install (not npm ci) until package-lock.json is committed.
# Once `npm install` has been run locally and package-lock.json is committed,
# switch both npm install lines back to `npm ci` for reproducible builds.
RUN npm install

COPY . .

ENV NODE_ENV=production
RUN npm run build

# Strapi v5's `strapi build` compiles TypeScript and bundles the admin
# panel, but does NOT propagate non-TS assets — most importantly the
# per-content-type schema.json files under src/api/*/content-types/ —
# into dist/. Strapi's api loader (@strapi/core/dist/loaders/apis.js)
# walks strapi.dirs.dist.api, so in production any schema left behind
# in src/ is invisible. Route factories then register UIDs the
# content-type registry can't resolve, and start fails with
#
#   TypeError: Cannot read properties of undefined (reading 'kind')
#   at isSingleType (… content-types.js)
#
# This rsync mirrors every JSON file under src/ into dist/src/. Only
# matters once you (or a downstream layer) actually add content-types;
# this base image ships none, so the rsync is a no-op until then.
# Keeping it here means the downstream-layer recipe stays a one-line
# `COPY src/api ./src/api` instead of "and remember to also re-run a
# build-step nobody documents".
RUN apk add --no-cache rsync && \
    rsync -a --include='*/' --include='*.json' --exclude='*' src/ dist/src/

# ── stage 2: production runtime ─────────────────────────────────────────────
FROM node:22-alpine

# vips (runtime lib only — no headers needed in the final image)
RUN apk add --no-cache vips

# node:22-alpine ships the `node` user at uid/gid 1000 — reuse it.
WORKDIR /app

# Production deps (no devDependencies)
COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

# Admin panel + compiled TS from build stage
COPY --from=builder --chown=node:node /app/dist       ./dist
COPY --from=builder --chown=node:node /app/.strapi    ./.strapi
COPY                --chown=node:node public           ./public
# Strapi v5's `start` calls isUsingTypeScript(appDir) which (a) checks for
# tsconfig.json and (b) actually invokes tsc against the configured rootDir
# to verify the project compiles. So we need the TS sources here too —
# strapi start in production then loads the COMPILED output from dist/,
# but tsc must still find inputs matching tsconfig.json's include paths.
COPY                --chown=node:node tsconfig.json   ./tsconfig.json
COPY                --chown=node:node src              ./src
COPY                --chown=node:node config           ./config

RUN mkdir -p public/uploads && chown -R node:node public /app

USER node

EXPOSE 1337

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=1337

HEALTHCHECK --interval=30s --timeout=5s --start-period=90s --retries=3 \
    CMD wget -qO- http://localhost:1337/_health || exit 1

CMD ["node_modules/.bin/strapi", "start"]
