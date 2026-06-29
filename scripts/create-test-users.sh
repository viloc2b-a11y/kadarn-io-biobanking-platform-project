#!/usr/bin/env bash
# ============================================================================
# Kadarn Runtime Execution Gate — Create Test Users
# ============================================================================
# Creates auth.users via Supabase Auth API for all 5 pilot personas.
# Run AFTER supabase start.
# ============================================================================
set -euo pipefail

API="${SUPABASE_AUTH_URL:-http://localhost:54321/auth/v1}"
ANON_KEY="${ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0}"
SERVICE_KEY="${SERVICE_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7Yz0CsJjDbF1oY}"
PASS="${PASS:-test-password-123}"

USERS=(
  "sarah.chen@pharmacorp.com|Dr. Sarah Chen|org_admin"
  "a.thompson@pharmacorp.com|Dr. Alex Thompson|org_member"
  "j.wilson@biobank.org|Prof. James Wilson|org_admin"
  "m.rodriguez@cityhospital.nhs.uk|Dr. Maria Rodriguez|org_admin"
  "k.mueller@apl.de|Dr. Klaus Mueller|org_admin"
  "e.vandenberg@gcc.nl|Elena Van den Berg|org_admin"
  "admin@newhospital.nhs.uk|Hospital Admin|org_admin"
  "pathologist@newhospital.nhs.uk|Staff Pathologist|org_member"
  "admin@newbiobank.org|Biobank Admin|org_admin"
  "curator@regionalbiorepo.org|Biorepo Curator|org_member"
  "sponsor@newco.com|NovaBio Admin|org_admin"
  "cra@novabio.com|NovaBio CRA|org_member"
)

echo "Creating test users..."
for USER in "${USERS[@]}"; do
  EMAIL=$(echo "$USER" | cut -d'|' -f1)
  NAME=$(echo "$USER" | cut -d'|' -f2)
  ROLE=$(echo "$USER" | cut -d'|' -f3)

  # Check if user exists
  EXISTING=$(curl -sf -X GET "${API}/admin/users?email=${EMAIL}" \
    -H "apikey: ${SERVICE_KEY}" \
    -H "Authorization: Bearer ${SERVICE_KEY}" 2>/dev/null || echo "")

  if echo "$EXISTING" | jq -e '.users | length > 0' &>/dev/null; then
    echo "⚠️  ${EMAIL} already exists, skipping"
    continue
  fi

  # Create user via Supabase Auth admin API
  RESP=$(curl -sf -X POST "${API}/admin/users" \
    -H "apikey: ${SERVICE_KEY}" \
    -H "Authorization: Bearer ${SERVICE_KEY}" \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"${EMAIL}\",
      \"password\": \"${PASS}\",
      \"email_confirm\": true,
      \"user_metadata\": {
        \"full_name\": \"${NAME}\",
        \"role\": \"${ROLE}\"
      }
    }" 2>&1) || {
    echo "❌ Failed to create ${EMAIL}: $(echo "$RESP" | head -c 100)"
    continue
  }

  echo "✅ ${EMAIL} created (${ROLE})"
done

echo ""
echo "All test users created. Password for all: ${PASS}"
