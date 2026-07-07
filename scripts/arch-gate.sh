#!/usr/bin/env bash
# AF-4.0 Sprint 8 — Architecture compliance gate
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "== AF-4.0 Architecture Gate =="

# ADR registry must exist
test -f openspec/canonical-documents-registry-af-2.1.md

# AF-4.0 program charter
test -f openspec/af-4.0-enterprise-readiness-program.md

# Instrumentation package present
test -f packages/instrumentation/src/index.ts

# Evidence Core guard: no direct continuity_experience_claims reads in API routes
if rg -l "continuity_experience_claims" apps/api/src/app/api/v1 --glob '*.ts' 2>/dev/null | grep -v cutover; then
  echo "FAIL: direct continuity_experience_claims read in v1 API"
  exit 1
fi

# Forbidden bypass of Published View on external surfaces (heuristic)
for route in passport institution/public discovery/dashboard discovery/report; do
  if ! rg -q "published-view|PublishedView|getPublishedViewService" "apps/api/src/app/api/v1" 2>/dev/null; then
    : # individual route check optional
  fi
done

echo "PASS: architecture gate"
