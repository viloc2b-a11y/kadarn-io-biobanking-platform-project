#!/usr/bin/env bash
# cross-doc-consistency.sh
# CI check: every Operational Twin, Engine, or Fabric mentioned in KRM-BNO
# must exist in KRM-RAO's base model.
#
# Usage: bash scripts/cross-doc-consistency.sh
# Exit code: 0 = pass, 1 = inconsistency found

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
KRM_RAO="$ROOT/docs/architecture/krm-rao.md"
KRM_BNO="$ROOT/docs/architecture/krm-bno-profile.md"

HAD_ERROR=0

if [ ! -f "$KRM_RAO" ] || [ ! -f "$KRM_BNO" ]; then
  echo "❌ KRM-RAO or KRM-BNO not found"
  exit 1
fi

echo "📖 Checking Operational Twins..."

# Extract Twin mentions from KRM-BNO
# Match capitalized word + 'Twin' but exclude negations and headings
KRM_BNO_TWINS=$(grep -oE '[A-Z][a-z]+ Twin' "$KRM_BNO" | grep -vE '^(No |The |This )' | sort -u)

# Check each against KRM-RAO
while IFS= read -r TWIN; do
  if [ -z "$TWIN" ]; then continue; fi
  if grep -q "$TWIN" "$KRM_RAO" 2>/dev/null; then
    echo "  ✅ $TWIN — exists in KRM-RAO"
  else
    echo "  ❌ $TWIN — NOT found in KRM-RAO"
    HAD_ERROR=1
  fi
done <<< "$KRM_BNO_TWINS"

echo ""
echo "📖 Checking Engines..."

# Extract Engine mentions from KRM-BNO
KRM_BNO_ENGINES=$(grep -oE 'Knowledge|Policy|Workflow|Trust|Matching|Fulfillment|Financial|Intelligence|Integration' "$KRM_BNO" | sort -u)

while IFS= read -r ENGINE; do
  if [ -z "$ENGINE" ]; then continue; fi
  ENGINE_PATTERN="${ENGINE} Engine"
  if grep -q "$ENGINE_PATTERN" "$KRM_RAO" 2>/dev/null; then
    echo "  ✅ ${ENGINE} Engine — exists in KRM-RAO"
  else
    echo "  ❌ ${ENGINE} Engine — NOT found in KRM-RAO"
    HAD_ERROR=1
  fi
done <<< "$KRM_BNO_ENGINES"

echo ""
echo "📖 Checking Fabrics..."

# Extract Fabric mentions from KRM-BNO
KRM_BNO_FABRICS=$(grep -oE 'Identity|Data|Trust|Governance|Integration' "$KRM_BNO" | sort -u)

while IFS= read -r FABRIC; do
  if [ -z "$FABRIC" ]; then continue; fi
  FABRIC_PATTERN="${FABRIC} Fabric"
  if grep -q "$FABRIC_PATTERN" "$KRM_RAO" 2>/dev/null; then
    echo "  ✅ ${FABRIC} Fabric — exists in KRM-RAO"
  else
    echo "  ❌ ${FABRIC} Fabric — NOT found in KRM-RAO"
    HAD_ERROR=1
  fi
done <<< "$KRM_BNO_FABRICS"

echo ""

if [ "$HAD_ERROR" -eq 0 ]; then
  echo "✅ All KRM-BNO Twins, Engines, and Fabrics exist in KRM-RAO."
else
  echo "❌ Inconsistencies found. KRM-BNO references components not present in KRM-RAO."
  echo "   Either add the missing component to KRM-RAO or remove the reference from KRM-BNO."
fi

exit $HAD_ERROR
