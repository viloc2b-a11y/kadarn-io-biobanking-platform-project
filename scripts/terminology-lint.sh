#!/usr/bin/env bash
# terminology-lint.sh
# CI check: architecture terms used in docs/architecture/*.md must exist
# as entries in docs/architecture/lexicon.md.
#
# This check focuses on **bolded terms** extracted from prose, checking
# them against the lexicon term list. The script handles:
#   - Singular/plural normalization
#   - Skip-lists for lifecycle phases, property labels, and generic prose
#
# Usage: bash scripts/terminology-lint.sh
# Exit code: 0 = pass, 1 = one or more terms missing from lexicon

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LEXICON="$ROOT/docs/architecture/lexicon.md"

# Source documents to scan
SOURCES=(
  "$ROOT/docs/architecture/kadarn-manifesto.md"
  "$ROOT/docs/architecture/ecosystem-reference-architecture.md"
  "$ROOT/docs/architecture/krm-rao.md"
  "$ROOT/docs/architecture/krm-bno-profile.md"
)

if [ ! -f "$LEXICON" ]; then
  echo "❌ Lexicon not found at $LEXICON (run Sprints 12-16 first)"
  exit 1
fi

# Extract all lexicon term headings (including parentheticals as separate variants)
echo "📖 Extracting lexicon terms..."
LEXICON_RAW=$(grep -E '^### ' "$LEXICON" | sed 's/^### //')

# Build a matching dictionary: lowercase singular form -> original term
LEXICON_MAP=""
while IFS= read -r TERM; do
  TERM_CLEAN=$(echo "$TERM" | sed 's/ (.*)//' | xargs)
  TERM_LC=$(echo "$TERM_CLEAN" | tr '[:upper:]' '[:lower:]')
  LEXICON_MAP="${LEXICON_MAP}${TERM_LC}"$'\n'
  # Also add plural form
  TERM_PLURAL="${TERM_CLEAN}s"
  TERM_PLURAL_LC=$(echo "$TERM_PLURAL" | tr '[:upper:]' '[:lower:]')
  LEXICON_MAP="${LEXICON_MAP}${TERM_PLURAL_LC}"$'\n'
  # Handle -ies plurals (e.g. Entity -> Entities)
  if echo "$TERM_CLEAN" | grep -qi 'y$'; then
    TERM_IES=$(echo "$TERM_CLEAN" | sed 's/y$/ies/' | tr '[:upper:]' '[:lower:]')
    LEXICON_MAP="${LEXICON_MAP}${TERM_IES}"$'\n'
  fi
done <<< "$LEXICON_RAW"

LEXICON_MAP=$(echo "$LEXICON_MAP" | sort -u)

# Patterns to skip entirely (false positives from bolded text)
SKIP_PATTERNS='^(version:|status:|supersedes:|canonical url:|purpose:|definition:|source:|kadarn example:|boundary:|key distinction:|key property:|profile of:|framing|node types:|edge types:|characteristics:|responsibilities:|domain:|krm-rao mapping:|krm-rao:|properties:|subtypes:|query examples:|trust dimensions:|supported ontologies:|pain points:|existing systems:|role in ecosystem:|who:|the five fabrics:|principle:|ecosystem friction:|kadarn role:|integration principle:|not owned|owned by|retained by|access model:|collection method:|collection container:|preservation type:|storage temperature:|specimen type:|collection protocol:|consent model:|inclusion/exclusion criteria:|collection period:|governance model:|status:|data type:|data standard:|publication status:|contained specimens:|courier:|tracking number:|temperature range:|temperature monitor:|chain of custody:|customs documentation:|regulatory docs:|parent specimen:|volume/quantity:|container:|freeze-thaw count:|remaining volume:|aliquot type:|krm-bno compliance|specification gaps|implementation gaps|gap components|gap analysis|biospecimen lifecycle|phase details|existing module|existing modules|operational twin specialization|research asset specialization|gap summary|architectural invariants|engine roles|the four graphs|platform component categories|layer interaction patterns|event flow|policy decision flow|request flow|what exists|what is allowed|what happened|what is reliable|capability sequence|primary sequence|orchestration path|sequencing rationale|search for|federated query|post-hoc|embedding statement|establishing boundaries|resolve governance|framework capture|context assembly|ai-assisted|table header|ingests events|links provenance|maps identifiers|provides webhook/api endpoints|trust computation across|policy enforcement at|multi-organization flows|network-wide state|cross-system provenance|cross-organizational|cross-entity|within-organization|architecture documentation|ai layer|running order|gap note|feasibility.*interim|flow-to-event|domain events|gap status|zero discrepancies)'

# Also skip common lifecycle phase names that are not lexicon terms
LIFECYCLE_SKIP='^(discovery$|feasibility$|access request$|governance review$|consent verification$|irb/ethics review$|mta/dua$|reservation$|collection$|processing$|aliquoting$|qc$|storage$|shipment preparation$|temperature monitoring$|chain of custody$|receipt$|acceptance$|data linkage$|settlement$|collaborative analysis|publication$)$'

# Generic skip
GENERIC_SKIP='^(across|within|not|orchestration$|orchestration platform|orchestration problem|orchestration layer|orchestrates|domain-agnostic|research asset orchestration|biospecimen network orchestration|research assets$|computing$|discovering$|evaluating$|settling$|tracking$|network orchestration layer|policy enforcement|trust computation|specimen lifecycle|integration$)$'

TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT

HAD_ERROR=0

for SRC in "${SOURCES[@]}"; do
  if [ ! -f "$SRC" ]; then
    echo "⚠️  Skipping (not found): $SRC"
    continue
  fi

  BASENAME=$(basename "$SRC")
  echo "🔍 Scanning $BASENAME..."

  # Extract **bolded terms**
  grep -oE '\*\*[A-Za-z][A-Za-z 0-9/-]+\*\*' "$SRC" \
    | sed 's/^\*\*//; s/\*\*$//' \
    | sort -u > "$TMPDIR/$BASENAME.bold.txt" || true

  # Filter: remove skips, lifecycle phases, and generic terms
  grep -viE "$SKIP_PATTERNS" "$TMPDIR/$BASENAME.bold.txt" \
    | grep -viE "$LIFECYCLE_SKIP" \
    | grep -viE "$GENERIC_SKIP" \
    | grep -vE '^[0-9.%/-]+$' \
    | grep -vE '^(P0|P1|P2|v[0-9]+\.[0-9]+.*)$' \
    | sort -u > "$TMPDIR/$BASENAME.filtered.txt" || true

  # Check each term against lexicon
  while IFS= read -r TERM; do
    [ -z "$TERM" ] && continue
    TERM_LC=$(echo "$TERM" | tr '[:upper:]' '[:lower:]')
    # Remove trailing 's' to check singular
    TERM_SINGULAR=$(echo "$TERM_LC" | sed 's/s$//')
    if echo "$LEXICON_MAP" | grep -Fxq "$TERM_LC" 2>/dev/null; then
      :  # Found exact match
    elif echo "$LEXICON_MAP" | grep -Fxq "$TERM_SINGULAR" 2>/dev/null; then
      :  # Found singular form
    else
      echo "  ⚠️  '$TERM' (from $BASENAME) — not found in lexicon"
      HAD_ERROR=1
    fi
  done < "$TMPDIR/$BASENAME.filtered.txt"
done

echo ""
if [ "$HAD_ERROR" -eq 0 ]; then
  echo "✅ All bolded architecture terms in source docs exist in the lexicon."
else
  echo "❌ One or more terms are missing from the lexicon."
  echo "   Either add the term to docs/architecture/lexicon.md or verify it's a false positive."
fi

exit $HAD_ERROR
