#!/usr/bin/env bash
# ============================================================================
# Kadarn Runtime Execution Gate — Report Generator
# ============================================================================
# Generates the final scorecard from pilot execution outputs.
# ============================================================================
set -euo pipefail

REPORT_DIR="${REPORT_DIR:-/tmp/kadarn-execution-gate}"
START_TIME=$(date +%s)

echo "═══════════════════════════════════════════════════════════════════"
echo "  Kadarn Runtime Execution Gate — Final Report"
echo "  Generated: $(date)"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

# ──────────────────────────────────────────────────────────────────────────
# Scorecard table
# ──────────────────────────────────────────────────────────────────────────
echo "┌─────────────────────────────────────────────────────────────────────┐"
echo "│ PILOT EXECUTION SCORECARD                                          │"
echo "├─────────────────────────────────────────────────────────────────────┤"

for i in 1 2 3 4 5; do
  PILOT_NAME=""
  case $i in
    1) PILOT_NAME="Prospective Biospecimen Collection" ;;
    2) PILOT_NAME="Retrospective FFPE Request" ;;
    3) PILOT_NAME="Hospital Onboarding" ;;
    4) PILOT_NAME="Biobank Onboarding" ;;
    5) PILOT_NAME="Research Sponsor Program" ;;
  esac

  REPORT_FILE="$REPORT_DIR/pilot${i}-report.txt"
  STATUS="⚠️ NO DATA"
  if [ -f "$REPORT_FILE" ]; then
    if grep -q "PASS" "$REPORT_FILE" 2>/dev/null; then
      STATUS="✅ PASS"
    else
      STATUS="❌ FAIL"
    fi
  fi

  printf "│ %-2s %-40s %-10s │\n" "$i." "$PILOT_NAME" "$STATUS"
done

echo "├─────────────────────────────────────────────────────────────────────┤"
TOTAL_PASS=$(grep -l "PASS" "$REPORT_DIR"/pilot*-report.txt 2>/dev/null | wc -l || echo 0)
TOTAL_FAIL=$((5 - TOTAL_PASS))
printf "│ %-44s %-10s │\n" "TOTAL" "${TOTAL_PASS}/5 passed"
echo "└─────────────────────────────────────────────────────────────────────┘"
echo ""

# ──────────────────────────────────────────────────────────────────────────
# Detail per pilot
# ──────────────────────────────────────────────────────────────────────────
for i in 1 2 3 4 5; do
  REPORT_FILE="$REPORT_DIR/pilot${i}-report.txt"
  if [ -f "$REPORT_FILE" ]; then
    echo "─── Pilot ${i} ───────────────────────────────────────────"
    cat "$REPORT_FILE"
    echo ""
  fi
done

# ──────────────────────────────────────────────────────────────────────────
# Beta gate decision
# ──────────────────────────────────────────────────────────────────────────
echo "═══════════════════════════════════════════════════════════════════"
echo "  BETA GATE DECISION"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

if [ -f "$REPORT_DIR/beta-gate-decision.txt" ]; then
  cat "$REPORT_DIR/beta-gate-decision.txt"
else
  if [ "$TOTAL_FAIL" -eq 0 ]; then
    echo "RECOMMENDATION: Ready for v1.0.0-beta"
  elif [ "$TOTAL_FAIL" -le 2 ]; then
    echo "RECOMMENDATION: Ready after minor fixes"
  else
    echo "RECOMMENDATION: Not ready — blocking runtime issues remain"
  fi
fi

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "  Duration: $(( $(date +%s) - START_TIME ))s"
echo "═══════════════════════════════════════════════════════════════════"
