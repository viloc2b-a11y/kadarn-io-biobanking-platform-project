#!/usr/bin/env bash
# Staging restore drill — DO NOT run against production
set -euo pipefail
DUMP="${1:-./artifacts/backups/latest.dump}"
echo "Restore drill: would apply $DUMP to local Supabase"
echo "Command: supabase db reset && psql ... < $DUMP"
echo "Document result in openspec/af-4.0-reliability-runbook.md"
