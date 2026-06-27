#!/usr/bin/env bash
# ─── load-secrets.sh ──────────────────────────────────────────────────────
# Source this script to load environment variables from .env files.
#
# Usage:
#   source scripts/load-secrets.sh          # loads .env (dev default)
#   source scripts/load-secrets.sh staging  # loads .env.staging
#
# Load order (last wins):
#   1. .env.<env>  (if ENV arg or KADARN_ENV is set)
#   2. .env        (always, if present)
#   3. .env.local  (local overrides, never committed)
# ──────────────────────────────────────────────────────────────────────────

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Determine environment
ENV="${1:-${KADARN_ENV:-development}}"

# Collect files in load order
FILES=()

# 1) Environment-specific (e.g. .env.staging)
ENV_FILE="$PROJECT_DIR/.env.$ENV"
if [[ -f "$ENV_FILE" ]]; then
  FILES+=("$ENV_FILE")
fi

# 2) Main .env
MAIN_FILE="$PROJECT_DIR/.env"
if [[ -f "$MAIN_FILE" ]]; then
  FILES+=("$MAIN_FILE")
fi

# 3) Local overrides (never committed)
LOCAL_FILE="$PROJECT_DIR/.env.local"
if [[ -f "$LOCAL_FILE" ]]; then
  FILES+=("$LOCAL_FILE")
fi

# Source all found files
for f in "${FILES[@]}"; do
  echo "[load-secrets] loading $f"
  set -a
  source "$f"
  set +a
done

# Warn if nothing was loaded
if [[ ${#FILES[@]} -eq 0 ]]; then
  echo "[load-secrets] WARNING: no .env files found."
  echo "[load-secrets] Run 'scripts/setup-secrets.sh' to create one."
fi

# Validate required vars
REQUIRED=(
  DATABASE_URL
  JWT_SECRET
)

MISSING=()
for var in "${REQUIRED[@]}"; do
  if [[ -z "${!var:-}" ]]; then
    MISSING+=("$var")
  fi
done

if [[ ${#MISSING[@]} -gt 0 ]]; then
  echo "[load-secrets] WARNING: missing required variables: ${MISSING[*]}"
fi
