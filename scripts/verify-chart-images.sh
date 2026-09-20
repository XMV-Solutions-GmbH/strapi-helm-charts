#!/usr/bin/env bash
# SPDX-License-Identifier: MIT OR Apache-2.0
#
# verify-chart-images.sh — assert that every container image this chart can
# point a cluster at actually exists, and that the ArtifactHub annotation
# agrees with the chart's own default.
#
# Why this exists: chart 0.1.0 shipped `image.repository: strapi/strapi` with
# an empty tag, so it resolved to `strapi/strapi:5.0.0`. That image has never
# existed — the whole `strapi/strapi` repository returns "object not found" on
# Docker Hub. Anyone installing the chart got ImagePullBackOff, and ArtifactHub
# failed every security scan on it. Nothing in CI noticed, because no step ever
# asked whether the referenced image was real.
#
# Two checks, because the outage needed both to go wrong:
#   1. Every image referenced by the chart resolves in its registry.
#   2. The `artifacthub.io/images` annotation lists the default image from
#      values.yaml. Without the annotation ArtifactHub *guesses* the image from
#      chart metadata; when the default later changed, the guess kept pointing
#      at the dead one.
#
# Usage: scripts/verify-chart-images.sh [chart-dir]   (default: charts/strapi)

set -euo pipefail

CHART_DIR="${1:-charts/strapi}"
CHART_YAML="$CHART_DIR/Chart.yaml"
VALUES_YAML="$CHART_DIR/values.yaml"

fail() { printf '  \033[31m✖\033[0m %s\n' "$*"; FAILED=1; }
ok()   { printf '  \033[32m✔\033[0m %s\n' "$*"; }
FAILED=0

for f in "$CHART_YAML" "$VALUES_YAML"; do
  [ -f "$f" ] || { echo "not found: $f" >&2; exit 2; }
done

# --- resolve the chart's own default image -----------------------------------
# An empty tag falls back to Chart.appVersion, which is exactly how 0.1.0
# produced `strapi/strapi:5.0.0` out of an apparently harmless `tag: ""`.
REPO="$(yq -r '.image.repository // ""' "$VALUES_YAML")"
TAG="$(yq -r '.image.tag // ""' "$VALUES_YAML")"
APP_VERSION="$(yq -r '.appVersion // ""' "$CHART_YAML")"
[ -n "$TAG" ] || TAG="$APP_VERSION"

[ -n "$REPO" ] || { echo "values.yaml has no image.repository" >&2; exit 2; }
DEFAULT_IMAGE="${REPO}:${TAG}"

echo "Chart default image: $DEFAULT_IMAGE"

# --- images declared to ArtifactHub ------------------------------------------
ANNOTATION="$(yq -r '.annotations."artifacthub.io/images" // ""' "$CHART_YAML")"
ANNOTATED=()
if [ -n "$ANNOTATION" ] && [ "$ANNOTATION" != "null" ]; then
  # The annotation is a YAML document embedded in a string, so it needs a
  # second yq pass to read the image list out of it.
  mapfile -t ANNOTATED < <(printf '%s\n' "$ANNOTATION" | yq -r '.[].image')
fi

echo "Declared in artifacthub.io/images: ${#ANNOTATED[@]}"

if [ "${#ANNOTATED[@]}" -eq 0 ]; then
  fail "Chart.yaml has no artifacthub.io/images annotation — ArtifactHub will guess the image from chart metadata instead of being told. That guess is what broke 0.1.0."
else
  ok "artifacthub.io/images annotation present"
  printf '%s\n' "${ANNOTATED[@]}" | grep -qxF "$DEFAULT_IMAGE" \
    && ok "annotation lists the values.yaml default ($DEFAULT_IMAGE)" \
    || fail "annotation does not list the values.yaml default ($DEFAULT_IMAGE) — the two have drifted apart"
fi

# --- does each image actually exist? -----------------------------------------
check_image() {
  local image="$1"
  if docker manifest inspect "$image" >/dev/null 2>&1; then
    ok "exists: $image"
  else
    fail "DOES NOT EXIST: $image — a cluster installing this chart would get ImagePullBackOff"
  fi
}

for image in "$DEFAULT_IMAGE" "${ANNOTATED[@]:-}"; do
  [ -n "$image" ] || continue
  check_image "$image"
done

echo
if [ "$FAILED" -ne 0 ]; then
  echo "Image verification FAILED — see above." >&2
  exit 1
fi
echo "All chart images verified."
