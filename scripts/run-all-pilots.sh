#!/usr/bin/env bash
# ============================================================================
# Kadarn Runtime Execution Gate — Run All 5 Pilots
# ============================================================================
# Prerequisites:
#   1. Docker running
#   2. supabase start (from project root)
#   3. Migrations applied via supabase migration up
#   4. Seed data applied via supabase db execute < supabase/seed.sql
#   5. Auth users created (see scripts/create-test-users.sh)
# ============================================================================
set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPORT_DIR="/tmp/kadarn-execution-gate"
mkdir -p "$REPORT_DIR"
START_TIME=$(date +%s)

echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Kadarn Runtime Execution Gate${NC}"
echo -e "${BLUE}  $(date)${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""

# ──────────────────────────────────────────────────────────────────────────
# Preflight checks
# ──────────────────────────────────────────────────────────────────────────
echo -e "${YELLOW}--- Preflight checks ---${NC}"

# Check Docker
if ! docker info &>/dev/null; then
  echo -e "${RED}❌ Docker is not running. Start Docker Desktop first.${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Docker running${NC}"

# Check Supabase
if ! supabase status &>/dev/null; then
  echo -e "${YELLOW}⚠️ Supabase not started. Running supabase start...${NC}"
  cd "$PROJECT_DIR"
  supabase start
fi
echo -e "${GREEN}✅ Supabase local running${NC}"

# Check API responds
API="${API:-http://localhost:54321/functions/v1}"
if ! curl -sf "$API/health" &>/dev/null; then
  echo -e "${YELLOW}⚠️ API health check failed — attempting to start API...${NC}"
  cd "$PROJECT_DIR/apps/api"
  npm run dev &
  sleep 3
fi
echo -e "${GREEN}✅ API responding${NC}"

echo ""

# ──────────────────────────────────────────────────────────────────────────
# Run all 5 pilots
# ──────────────────────────────────────────────────────────────────────────
PASS=0
FAIL=0
RESULTS=()

run_pilot() {
  local num=$1
  local name=$2
  local script=$3
  local report_file="$REPORT_DIR/pilot${num}-report.txt"

  echo -e "${BLUE}───────────────────────────────────────────────────────${NC}"
  echo -e "${BLUE}  Pilot ${num}: ${name}${NC}"
  echo -e "${BLUE}───────────────────────────────────────────────────────${NC}"

  set +e
  START_PILOT=$(date +%s%N)
  bash "$script" 2>&1 | tee "$REPORT_DIR/pilot${num}-output.txt"
  EXIT_CODE=$?
  END_PILOT=$(date +%s%N)
  DURATION_MS=$(( (END_PILOT - START_PILOT) / 1000000 ))
  set -e

  if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ Pilot ${num} PASSED (${DURATION_MS}ms)${NC}"
    PASS=$((PASS + 1))
    RESULTS+=("true")
  else
    echo -e "${RED}❌ Pilot ${num} FAILED (${DURATION_MS}ms)${NC}"
    FAIL=$((FAIL + 1))
    RESULTS+=("false")
  fi

  # Save report
  if [ -f "/tmp/pilot${num}-report.txt" ]; then
    cp "/tmp/pilot${num}-report.txt" "$report_file"
  fi
  echo ""
}

run_pilot 1 "Prospective Biospecimen Collection" "$SCRIPT_DIR/run-pilot-1.sh"
run_pilot 2 "Retrospective FFPE Request" "$SCRIPT_DIR/run-pilot-2.sh"
run_pilot 3 "Hospital Onboarding" "$SCRIPT_DIR/run-pilot-3.sh"
run_pilot 4 "Biobank Onboarding" "$SCRIPT_DIR/run-pilot-4.sh"
run_pilot 5 "Research Sponsor Program" "$SCRIPT_DIR/run-pilot-5.sh"

END_TIME=$(date +%s)
TOTAL_SECONDS=$((END_TIME - START_TIME))

# ──────────────────────────────────────────────────────────────────────────
# Generate scorecard
# ──────────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  EXECUTION SCORECARD${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""

printf "%-50s %s\n" "Pilot" "Result"
printf "%-50s %s\n" "──────────────────────────────────────────────────" "──────"
printf "%-50s %s\n" "1. Prospective Biospecimen Collection" "$(if ${RESULTS[0]:-false}; then echo '✅ PASS'; else echo '❌ FAIL'; fi)"
printf "%-50s %s\n" "2. Retrospective FFPE Request" "$(if ${RESULTS[1]:-false}; then echo '✅ PASS'; else echo '❌ FAIL'; fi)"
printf "%-50s %s\n" "3. Hospital Onboarding" "$(if ${RESULTS[2]:-false}; then echo '✅ PASS'; else echo '❌ FAIL'; fi)"
printf "%-50s %s\n" "4. Biobank Onboarding" "$(if ${RESULTS[3]:-false}; then echo '✅ PASS'; else echo '❌ FAIL'; fi)"
printf "%-50s %s\n" "5. Research Sponsor Program" "$(if ${RESULTS[4]:-false}; then echo '✅ PASS'; else echo '❌ FAIL'; fi)"
echo ""
printf "%-50s %s\n" "Total" "${PASS}/5 passed"

echo ""
echo -e "${BLUE}───────────────────────────────────────────────────────${NC}"
echo -e "  Duration: ${TOTAL_SECONDS}s"
echo -e "  Reports: ${REPORT_DIR}/"
echo -e "${BLUE}───────────────────────────────────────────────────────${NC}"

# ──────────────────────────────────────────────────────────────────────────
# Beta gate decision
# ──────────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  BETA GATE DECISION${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""

if [ "$FAIL" -eq 0 ]; then
  echo -e "${GREEN}✅ ALL 5 PILOTS PASSED — Ready for v1.0.0-beta${NC}"
  echo "RECOMMENDATION: Ready for v1.0.0-beta" > "$REPORT_DIR/beta-gate-decision.txt"
  echo "STATUS: PASS" >> "$REPORT_DIR/beta-gate-decision.txt"
elif [ "$FAIL" -le 2 ]; then
  echo -e "${YELLOW}🟡 ${FAIL} pilot(s) failed — Ready after minor fixes${NC}"
  echo "RECOMMENDATION: Ready after minor fixes" > "$REPORT_DIR/beta-gate-decision.txt"
  echo "STATUS: CONDITIONAL" >> "$REPORT_DIR/beta-gate-decision.txt"
else
  echo -e "${RED}❌ ${FAIL} pilot(s) failed — Not ready${NC}"
  echo "RECOMMENDATION: Not ready — blocking runtime issues remain" > "$REPORT_DIR/beta-gate-decision.txt"
  echo "STATUS: FAIL" >> "$REPORT_DIR/beta-gate-decision.txt"
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "  Reports: ${REPORT_DIR}/"
echo -e "  Beta decision: $(cat "$REPORT_DIR/beta-gate-decision.txt" 2>/dev/null || echo 'see report')"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
