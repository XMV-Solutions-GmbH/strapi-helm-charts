#!/usr/bin/env bash
# Trigger an immediate ArtifactHub re-index for this Helm repository.
#
# Usage: ./scripts/artifacthub-refresh.sh [repo-name]
#   repo-name  ArtifactHub repository slug (default: $ARTIFACTHUB_REPO_NAME from .env.artifacthub)
#
# Credentials are loaded from .env.artifacthub in the repo root (git-ignored).
# The ArtifactHub public API has no explicit refresh endpoint; performing a
# no-op PUT on the repository settings is the documented workaround — it marks
# the repo dirty and triggers the next indexer cycle within seconds.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$REPO_ROOT/.env.artifacthub"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "error: $ENV_FILE not found — copy .env.artifacthub.example or create it" >&2
  exit 1
fi

# shellcheck source=/dev/null
source "$ENV_FILE"

REPO_NAME="${1:-${ARTIFACTHUB_REPO_NAME:?'set ARTIFACTHUB_REPO_NAME in .env.artifacthub'}}"
KEY_ID="${ARTIFACTHUB_API_KEY_ID:?'set ARTIFACTHUB_API_KEY_ID in .env.artifacthub'}"
KEY_SECRET="${ARTIFACTHUB_API_KEY_SECRET:?'set ARTIFACTHUB_API_KEY_SECRET in .env.artifacthub'}"

BASE="https://artifacthub.io/api/v1"

echo "→ Fetching current settings for repository '${REPO_NAME}' …"
REPO_JSON=$(curl -fsSL \
  -H "X-API-KEY-ID: ${KEY_ID}" \
  -H "X-API-KEY-SECRET: ${KEY_SECRET}" \
  "${BASE}/repositories/${REPO_NAME}")

echo "→ Sending no-op PUT to trigger re-index …"
HTTP_STATUS=$(curl -fsSL -o /dev/null -w "%{http_code}" \
  -X PUT \
  -H "Content-Type: application/json" \
  -H "X-API-KEY-ID: ${KEY_ID}" \
  -H "X-API-KEY-SECRET: ${KEY_SECRET}" \
  -d "$REPO_JSON" \
  "${BASE}/repositories/${REPO_NAME}")

if [[ "$HTTP_STATUS" == "200" || "$HTTP_STATUS" == "204" ]]; then
  echo "✓ Re-index triggered (HTTP ${HTTP_STATUS}). ArtifactHub will pick up changes within ~1 min."
else
  echo "unexpected HTTP status: $HTTP_STATUS" >&2
  exit 1
fi
