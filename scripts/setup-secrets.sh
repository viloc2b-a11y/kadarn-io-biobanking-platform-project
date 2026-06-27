#!/usr/bin/env bash
# ─── setup-secrets.sh ──────────────────────────────────────────────────────
# Creates a .env file with the template below if it doesn't exist.
# Safe to rerun — won't overwrite an existing .env.
#
# Usage:
#   scripts/setup-secrets.sh            # create .env  (development)
#   scripts/setup-secrets.sh staging    # create .env.staging
# ──────────────────────────────────────────────────────────────────────────

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

ENV="${1:-development}"
TARGET="$PROJECT_DIR/.env"

if [[ "$ENV" != "development" ]]; then
  TARGET="$PROJECT_DIR/.env.$ENV"
fi

if [[ -f "$TARGET" ]]; then
  echo "[setup-secrets] $TARGET already exists — not overwriting."
  echo "[setup-secrets] Edit $TARGET directly to set your secrets."
  exit 0
fi

cat > "$TARGET" << 'ENVEOF'
# ─── Kadarn Platform — Environment Variables ──────────────────────────────
# This file is generated from scripts/setup-secrets.sh.
# NEVER commit this file to version control.
# ──────────────────────────────────────────────────────────────────────────

# ── Runtime ───────────────────────────────────────────────────────────────
KADARN_ENV=development
PORT=3000

# ── Database ──────────────────────────────────────────────────────────────
DATABASE_URL=postgresql://user:password@localhost:5432/kadarn
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# ── Auth / JWT ────────────────────────────────────────────────────────────
JWT_SECRET=change-me-to-a-random-64-char-string
JWT_ISSUER=kadarn-platform
JWT_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# ── Encryption ────────────────────────────────────────────────────────────
ENCRYPTION_KEY=change-me-to-a-32-byte-hex-key

# ── Logging ───────────────────────────────────────────────────────────────
LOG_LEVEL=debug
ENVEOF

chmod 600 "$TARGET"

echo "[setup-secrets] Created $TARGET"
echo "[setup-secrets] IMPORTANT: edit $TARGET and replace placeholder values."
echo "[setup-secrets] NEVER commit $TARGET."
