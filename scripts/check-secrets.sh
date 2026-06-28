#!/usr/bin/env bash
# ==========================================================================
# Kadarn Secret Scanner
# Checks for accidentally committed Supabase secrets.
# Fails if real-looking secrets appear outside allowed files.
# ==========================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

EXIT_CODE=0

# Allowed files that may contain placeholder secrets
ALLOWED_PATTERNS=".env.example|docs/ops/SUPABASE-SECRETS-SETUP.md|test-config.example.txt"

# Patterns to scan for
PATTERNS=(
  'SUPABASE_SERVICE_ROLE_KEY='
  'SUPABASE_ANON_KEY='
  'DATABASE_URL=postgres'
  'JWT_SECRET='
  'postgresql://'
)

echo "=== Kadarn Secret Scanner ==="
echo ""

# Check that .env files are not tracked by git
TRACKED_ENV=$(git ls-files 2>/dev/null | grep -E '\.env$|\.env\.(local|prod|staging|dev)' || true)
if [ -n "$TRACKED_ENV" ]; then
  echo -e "${RED}FAIL: .env files are tracked by git!${NC}"
  echo "$TRACKED_ENV"
  EXIT_CODE=1
else
  echo -e "${GREEN}OK: No .env files tracked by git${NC}"
fi

# Scan for secrets in tracked files
for pattern in "${PATTERNS[@]}"; do
  RESULTS=$(git grep -n "$pattern" -- ':!.env.example' ':!docs/ops/SUPABASE-SECRETS-SETUP.md' ':!tests/test-config.example.txt' 2>/dev/null || true)
  if [ -n "$RESULTS" ]; then
    echo -e "${RED}FAIL: Found potential secret: $pattern${NC}"
    echo "$RESULTS" | while IFS= read -r line; do
      # Mask the value part
      masked=$(echo "$line" | sed -E 's/([A-Z_]+=).*$/\1REDACTED/')
      echo "  $masked"
    done
    EXIT_CODE=1
  fi
done

# Check for JWT tokens that look like Supabase JWTs
JWT_RESULTS=$(git grep -n 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' -- ':!.env.example' ':!docs/ops/SUPABASE-SECRETS-SETUP.md' ':!tests/setup/seed-users.ts' ':!tests/api/core.test.ts' ':!tests/test-config.example.txt' 2>/dev/null || true)
if [ -n "$JWT_RESULTS" ]; then
  echo -e "${YELLOW}WARN: Found Supabase demo JWT tokens (these are public demo keys)${NC}"
  echo "$JWT_RESULTS" | while IFS= read -r line; do
    echo "  $line" | sed 's/eyJ.*$/eyJ...REDACTED/'
  done
fi

echo ""
if [ "$EXIT_CODE" -eq 0 ]; then
  echo -e "${GREEN}All checks passed. No secrets leaked.${NC}"
else
  echo -e "${RED}Some checks failed. Review the issues above.${NC}"
fi

exit $EXIT_CODE
