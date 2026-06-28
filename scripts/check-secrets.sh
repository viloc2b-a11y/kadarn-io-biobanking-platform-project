#!/usr/bin/env bash
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'
EXIT_CODE=0

EXCLUDE=":!.env.example :!apps/*/.env.example :!docs/ops/SUPABASE-SECRETS-SETUP.md :!docs/ops/SUPABASE-INFRASTRUCTURE-VALIDATION.md :!docs/pilots/FIRST-BIOBANK-PILOT-RUNBOOK.md :!docs/pilots/ALPHA-SEED-DATA.md :!scripts/seed-pilot-users.ts :!tests/test-config.example.txt :!scripts/check-secrets.sh"

echo "=== Kadarn Secret Scanner ==="
echo ""

# Check .env files not tracked
TRACKED=$(git ls-files 2>/dev/null | grep -E '\.env$|\.env\.(local|prod|staging|dev)' || true)
if [ -n "$TRACKED" ]; then
  echo -e "${RED}FAIL: .env files tracked by git${NC}"
  echo "$TRACKED"
  EXIT_CODE=1
else
  echo -e "${GREEN}OK: No .env files tracked by git${NC}"
fi

# Scan for secret patterns
for pattern in 'SUPABASE_SERVICE_ROLE_KEY=' 'DATABASE_URL=postgres' 'JWT_SECRET=' 'postgresql://'; do
  RESULTS=$(git grep -n "$pattern" -- $EXCLUDE 2>/dev/null || true)
  if [ -n "$RESULTS" ]; then
    echo -e "${RED}FAIL: Found '$pattern' in tracked files${NC}"
    echo "$RESULTS" | sed 's/=.*/=REDACTED/'
    EXIT_CODE=1
  fi
done

# Scan for anon key patterns (only flag if not placeholder)
for pattern in 'SUPABASE_ANON_KEY='; do
  RESULTS=$(git grep -n "$pattern" -- $EXCLUDE 2>/dev/null || true)
  if [ -n "$RESULTS" ]; then
    # Check if any result has a real-looking key (not "replace-with" or "your-")
    while IFS= read -r line; do
      if echo "$line" | grep -qv "replace-with\|your-\|REDACTED"; then
        echo -e "${RED}FAIL: Found real-looking SUPABASE_ANON_KEY${NC}"
        echo "$line" | sed 's/=.*/=REDACTED/'
        EXIT_CODE=1
      fi
    done <<< "$RESULTS"
  fi
done

# Check for Supabase JWTs in unexpected files
JWT_EXCLUDE=":!.env.example :!apps/*/.env.example :!docs/ops/SUPABASE-SECRETS-SETUP.md :!tests/setup/seed-users.ts :!tests/api/core.test.ts :!tests/security/threat.test.ts :!tests/test-config.example.txt :!scripts/check-secrets.sh :!scripts/create-test-users.sh :!scripts/run-pilot-*.sh"
JWT_RESULTS=$(git grep -n 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' -- $JWT_EXCLUDE 2>/dev/null || true)
if [ -n "$JWT_RESULTS" ]; then
  echo -e "${YELLOW}WARN: Found Supabase JWT tokens in unexpected files${NC}"
  echo "$JWT_RESULTS" | sed 's/eyJ.*$/eyJ...REDACTED/'
fi

echo ""
if [ "$EXIT_CODE" -eq 0 ]; then
  echo -e "${GREEN}All checks passed. No secrets leaked.${NC}"
else
  echo -e "${RED}Some checks failed. Review issues above.${NC}"
fi
exit $EXIT_CODE
