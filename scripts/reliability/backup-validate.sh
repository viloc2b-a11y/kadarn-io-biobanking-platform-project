#!/usr/bin/env bash
# Validate Supabase backup artifact exists and is non-empty
set -euo pipefail
BACKUP="${1:-./artifacts/backups/latest.dump}"
if [[ ! -s "$BACKUP" ]]; then
  echo "FAIL: backup missing or empty at $BACKUP"
  echo "Generate with: supabase db dump -f $BACKUP"
  exit 1
fi
echo "PASS: backup valid ($(wc -c < "$BACKUP") bytes)"
