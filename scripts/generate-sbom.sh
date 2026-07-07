#!/usr/bin/env bash
# AF-4.0 Sprint 3 — SBOM generation (cyclonedx-npm if available, else npm ls)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
OUT="${ROOT}/artifacts/sbom"
mkdir -p "$OUT"
if command -v cyclonedx-npm >/dev/null 2>&1; then
  cyclonedx-npm --output-file "$OUT/kadarn-platform-bom.json"
else
  npm ls --all --json > "$OUT/kadarn-platform-deps.json" 2>/dev/null || true
  echo "Wrote $OUT/kadarn-platform-deps.json (install @cyclonedx/cyclonedx-npm for full SBOM)"
fi
